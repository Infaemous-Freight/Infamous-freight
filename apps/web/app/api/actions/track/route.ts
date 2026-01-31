import { NextResponse } from "next/server";
import { requireUser } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { supabase } = await requireUser();
    const { assignment_id, lat, lng, speed_mph, heading } = await req.json();

    if (!assignment_id) throw new Error("assignment_id required");
    if (typeof lat !== "number" || typeof lng !== "number") {
      throw new Error("lat/lng must be numbers");
    }

    const { error } = await supabase.from("tracking_points").insert({
      assignment_id,
      lat,
      lng,
      speed_mph: typeof speed_mph === "number" ? speed_mph : null,
      heading: typeof heading === "number" ? heading : null,
    });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? String(e) },
      { status: 400 },
    );
  }
}
