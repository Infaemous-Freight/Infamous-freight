import { NextResponse } from "next/server";

import { requireUser } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { supabase } = await requireUser();
    const form = await req.formData();

    const assignmentId = String(form.get("assignment_id") || "");
    const status = String(form.get("status") || "");

    if (!assignmentId) {
      throw new Error("assignment_id required");
    }

    if (!status) {
      throw new Error("status required");
    }

    const { data, error } = await supabase.rpc("set_assignment_status", {
      p_assignment_id: assignmentId,
      p_status: status,
    });

    if (error) {
      throw error;
    }

    const url = new URL(req.url);
    url.pathname = `/assignments/${assignmentId}`;
    url.search = "";
    return NextResponse.redirect(url);
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message ?? String(error) },
      { status: 400 }
    );
  }
}
