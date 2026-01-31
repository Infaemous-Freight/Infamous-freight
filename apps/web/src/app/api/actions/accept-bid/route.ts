import { NextResponse } from "next/server";
import { requireUser } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { supabase, user } = await requireUser();
    const body = await req.json();
    const bidId = body?.bid_id as string;
    if (!bidId) {
      throw new Error("bid_id required");
    }

    const { data: bid, error: bidError } = await supabase
      .from("bids")
      .select("id, load_id, carrier_id, status")
      .eq("id", bidId)
      .single();
    if (bidError) {
      throw bidError;
    }

    if (bid.status !== "pending") {
      throw new Error("Bid not pending");
    }

    const { data: load, error: loadError } = await supabase
      .from("loads")
      .select("id, shipper_id, status")
      .eq("id", bid.load_id)
      .single();
    if (loadError) {
      throw loadError;
    }

    if (load.shipper_id !== user.id) {
      throw new Error("Only the load owner can accept bids");
    }

    const { error: acceptError } = await supabase
      .from("bids")
      .update({ status: "accepted" })
      .eq("id", bid.id);
    if (acceptError) {
      throw acceptError;
    }

    const { error: rejectError } = await supabase
      .from("bids")
      .update({ status: "rejected" })
      .eq("load_id", bid.load_id)
      .neq("id", bid.id);
    if (rejectError) {
      throw rejectError;
    }

    const { error: assignmentError } = await supabase
      .from("assignments")
      .insert({
        load_id: bid.load_id,
        carrier_id: bid.carrier_id,
        status: "assigned",
      });
    if (assignmentError) {
      throw assignmentError;
    }

    const { error: loadUpdateError } = await supabase
      .from("loads")
      .update({ status: "booked" })
      .eq("id", bid.load_id);
    if (loadUpdateError) {
      throw loadUpdateError;
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message ?? String(error) },
      { status: 400 },
    );
  }
}
