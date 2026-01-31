import { notFound } from "next/navigation";

import AssignmentStatusRealtime from "@/components/AssignmentStatusRealtime";
import { supabaseServer } from "@/lib/supabase/server";

type AssignmentRecord = {
  id: string;
  load_id: string;
  carrier_id: string;
  status: string;
};

export default async function AssignmentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = supabaseServer();

  const { data: assignment, error } = await supabase
    .from("assignments")
    .select("id, load_id, carrier_id, status")
    .eq("id", params.id)
    .single();

  if (error || !assignment) {
    notFound();
  }

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Assignment {assignment.id}</h1>
      </header>

      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">Status</span>
        <AssignmentStatusRealtime
          assignmentId={assignment.id}
          initialStatus={assignment.status}
        />
      </div>

      <dl className="grid gap-2 text-sm">
        <div>
          <dt className="text-xs uppercase text-gray-400">Load</dt>
          <dd>{assignment.load_id}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-gray-400">Carrier</dt>
          <dd>{assignment.carrier_id}</dd>
        </div>
      </dl>
    </section>
  );
}
