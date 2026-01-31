import { NextResponse } from "next/server";
import { requireUser } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { supabase, user } = await requireUser();
    const { bid_id } = await req.json();
    if (!bid_id) throw new Error("bid_id required");

    const { data: bid, error: bidErr } = await supabase
      .from("bids")
      .select("id, load_id, carrier_id, status")
      .eq("id", bid_id)
      .single();
    if (bidErr) throw bidErr;
    if (bid.status !== "pending") throw new Error("Bid not pending");

    const { data: load, error: loadErr } = await supabase
      .from("loads")
      .select("id, shipper_id, status")
      .eq("id", bid.load_id)
      .single();
    if (loadErr) throw loadErr;
    if (load.shipper_id !== user.id) throw new Error("Only load owner can accept bids");

    if (load.status !== "open") {
      throw new Error(`Load status must be open (current: ${load.status})`);
    }

    const { error: uBid } = await supabase
      .from("bids")
      .update({ status: "accepted" })
      .eq("id", bid.id)
      .eq("status", "pending");
    if (uBid) throw uBid;

    const { error: rejectErr } = await supabase
      .from("bids")
      .update({ status: "rejected" })
      .eq("load_id", bid.load_id)
      .neq("id", bid.id)
      .eq("status", "pending");
    if (rejectErr) throw rejectErr;

    const { data: assignment, error: insA } = await supabase
      .from("assignments")
      .insert({
        load_id: bid.load_id,
        carrier_id: bid.carrier_id,
        status: "assigned",
      })
      .select("id")
      .single();
    if (insA) throw insA;

    const { error: uLoad } = await supabase
      .from("loads")
      .update({ status: "booked" })
      .eq("id", bid.load_id);
    if (uLoad) throw uLoad;

    const { data: thread, error: tErr } = await supabase
      .from("threads")
      .insert({
        load_id: bid.load_id,
        assignment_id: assignment.id,
        created_by: user.id,
      })
      .select("id")
      .single();
    if (tErr) throw tErr;

    const { error: pErr } = await supabase.from("thread_participants").insert([
      { thread_id: thread.id, user_id: user.id },
      { thread_id: thread.id, user_id: bid.carrier_id },
    ]);
    if (pErr) throw pErr;

    await supabase.from("messages").insert({
      thread_id: thread.id,
      sender_id: user.id,
      kind: "system",
      content: "✅ Bid accepted. Use this thread to coordinate pickup, ETA, and delivery details.",
    });

    return NextResponse.json({
      ok: true,
      assignment_id: assignment.id,
      thread_id: thread.id,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? String(e) },
      { status: 400 },
    );
  }
}
