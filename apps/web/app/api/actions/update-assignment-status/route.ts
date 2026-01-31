import { NextResponse } from "next/server";
import { requireUser } from "@/lib/db";

const ALLOWED = new Set([
  "assigned",
  "enroute_pickup",
  "at_pickup",
  "loaded",
  "in_transit",
  "at_delivery",
  "delivered",
  "cancelled",
]);

export async function POST(req: Request) {
  try {
    const { supabase } = await requireUser();
    const form = await req.formData();

    const assignmentId = String(form.get("assignment_id") || "");
    const status = String(form.get("status") || "");
    if (!assignmentId) throw new Error("assignment_id required");
    if (!ALLOWED.has(status)) throw new Error("invalid status");

    const { error } = await supabase
      .from("assignments")
      .update({ status })
      .eq("id", assignmentId);

    if (error) throw error;

    const url = new URL(req.url);
    url.pathname = `/assignments/${assignmentId}`;
    url.search = "";
    return NextResponse.redirect(url);
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? String(e) },
      { status: 400 },
    );
  }
}
