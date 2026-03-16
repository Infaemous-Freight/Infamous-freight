// Infæmous Freight Enterprises - Shipment Tracking API
// Supabase Edge Function for real-time shipment location updates

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { shipmentId, location, eventType, description } = await req.json();

    // Validate required fields
    if (!shipmentId || !location) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      },
    );

    // Get the authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update shipment location (if authorized)
    const { data: shipment, error: shipmentError } = await supabaseClient
      .from("shipments")
      .select("*")
      .eq("id", shipmentId)
      .single();

    if (shipmentError || !shipment) {
      return new Response(JSON.stringify({ error: "Shipment not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create shipment event
    const { data: event, error: eventError } = await supabaseClient
      .from("shipment_events")
      .insert({
        shipment_id: shipmentId,
        event_type: eventType || "location_update",
        description: description || "Location updated",
        location: location,
        user_id: user.id,
        metadata: {
          ip_address: req.headers.get("x-forwarded-for"),
          user_agent: req.headers.get("user-agent"),
        },
      })
      .select()
      .single();

    if (eventError) {
      return new Response(JSON.stringify({ error: eventError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update shipment status if applicable
    if (eventType === "in_transit" || eventType === "delivered") {
      await supabaseClient.from("shipments").update({ status: eventType }).eq("id", shipmentId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        event: event,
        message: "Shipment tracking updated successfully",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
