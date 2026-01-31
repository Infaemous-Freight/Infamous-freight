import { NextResponse } from "next/server";

import { requireUser } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { supabase } = await requireUser();
    const { bid_id: bidId } = await req.json();

    if (!bidId) {
      throw new Error("bid_id required");
    }

    const { data, error } = await supabase.rpc("accept_bid_atomic", {
      p_bid_id: bidId,
    });

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message ?? String(error) },
      { status: 400 }
    );
  }
}
