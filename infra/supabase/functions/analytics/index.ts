// Infamous Freight Enterprises - Analytics API
// Supabase Edge Function for dashboard analytics

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
    const { timeRange = "7d", metrics = [] } = await req.json();

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

    // Get user's organization
    const { data: userData } = await supabaseClient
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!userData || !userData.organization_id) {
      return new Response(JSON.stringify({ error: "User not in organization" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const organizationId = userData.organization_id;

    // Calculate date range
    const now = new Date();
    let startDate = new Date();

    switch (timeRange) {
      case "24h":
        startDate.setHours(now.getHours() - 24);
        break;
      case "7d":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(now.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    const analytics = {
      timeRange,
      generatedAt: now.toISOString(),
      organizationId,
      metrics: {},
    };

    // Fetch shipment metrics
    const { data: shipments, error: shipmentsError } = await supabaseClient
      .from("shipments")
      .select("status, created_at, quoted_price, final_price")
      .eq("organization_id", organizationId)
      .gte("created_at", startDate.toISOString());

    if (!shipmentsError && shipments) {
      analytics.metrics.shipments = {
        total: shipments.length,
        pending: shipments.filter((s) => s.status === "pending").length,
        in_transit: shipments.filter((s) => s.status === "in_transit").length,
        delivered: shipments.filter((s) => s.status === "delivered").length,
        cancelled: shipments.filter((s) => s.status === "cancelled").length,
        totalRevenue: shipments
          .filter((s) => s.final_price)
          .reduce((sum, s) => sum + parseFloat(s.final_price), 0),
      };
    }

    // Fetch driver metrics
    const { data: drivers, error: driversError } = await supabaseClient
      .from("drivers")
      .select("status, rating")
      .eq("organization_id", organizationId);

    if (!driversError && drivers) {
      analytics.metrics.drivers = {
        total: drivers.length,
        available: drivers.filter((d) => d.status === "available").length,
        busy: drivers.filter((d) => d.status === "busy").length,
        offline: drivers.filter((d) => d.status === "offline").length,
        averageRating:
          drivers.reduce((sum, d) => sum + parseFloat(d.rating || "0"), 0) / drivers.length,
      };
    }

    // Fetch customer metrics
    const { data: customers, error: customersError } = await supabaseClient
      .from("customers")
      .select("id, created_at")
      .eq("organization_id", organizationId);

    if (!customersError && customers) {
      analytics.metrics.customers = {
        total: customers.length,
        new: customers.filter((c) => new Date(c.created_at) >= startDate).length,
      };
    }

    // Fetch invoice metrics
    const { data: invoices, error: invoicesError } = await supabaseClient
      .from("invoices")
      .select("status, total_amount, issue_date")
      .eq("organization_id", organizationId)
      .gte("issue_date", startDate.toISOString().split("T")[0]);

    if (!invoicesError && invoices) {
      analytics.metrics.invoices = {
        total: invoices.length,
        paid: invoices.filter((i) => i.status === "paid").length,
        overdue: invoices.filter((i) => i.status === "overdue").length,
        totalAmount: invoices.reduce((sum, i) => sum + parseFloat(i.total_amount), 0),
        paidAmount: invoices
          .filter((i) => i.status === "paid")
          .reduce((sum, i) => sum + parseFloat(i.total_amount), 0),
      };
    }

    return new Response(JSON.stringify(analytics), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
