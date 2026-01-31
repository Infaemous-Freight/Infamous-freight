import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import DocumentUpload from "@/components/DocumentUpload";

const STATUSES = [
  "assigned",
  "enroute_pickup",
  "at_pickup",
  "loaded",
  "in_transit",
  "at_delivery",
  "delivered",
  "cancelled",
] as const;

export default async function AssignmentDetail({ params }: { params: { id: string } }) {
  const supabase = supabaseServer();

  const { data: a, error } = await supabase
    .from("assignments")
    .select(
      "id, status, load_id, carrier_id, vehicle_id, created_at, loads(id, title, origin_city, destination_city, rate_cents, shipper_id)",
    )
    .eq("id", params.id)
    .single();
  if (error) throw error;

  const { data: thread } = await supabase
    .from("threads")
    .select("id")
    .eq("assignment_id", a.id)
    .maybeSingle();

  const rate = a.loads?.rate_cents ? `$${(a.loads.rate_cents / 100).toFixed(2)}` : "$0.00";

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{a.loads?.title ?? "Assignment"}</h1>
          <p className="text-sm text-gray-600">
            {a.loads?.origin_city ?? "Origin"} → {a.loads?.destination_city ?? "Destination"}
          </p>
          <p className="mt-1 text-sm">
            Rate: <span className="font-medium">{rate}</span>
          </p>
        </div>
        {thread?.id && (
          <Link className="rounded-md bg-black px-4 py-2 text-white" href={`/threads/${thread.id}`}>
            Open Thread
          </Link>
        )}
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="font-semibold">Status</div>
          <div className="rounded-full border px-2 py-1 text-xs">{a.status}</div>
        </div>

        <form
          className="flex flex-wrap gap-2"
          action="/api/actions/update-assignment-status"
          method="post"
        >
          <input type="hidden" name="assignment_id" value={a.id} />
          {STATUSES.map((s) => (
            <button
              key={s}
              name="status"
              value={s}
              className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
            >
              {s}
            </button>
          ))}
        </form>

        <div className="text-xs text-gray-600">
          Status updates are enforced by RLS (carrier/shipper/admin only).
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <DocumentUpload docType="insurance" assignmentId={a.id} loadId={a.load_id} />
        <DocumentUpload docType="pod" assignmentId={a.id} loadId={a.load_id} />
      </div>

      <div className="flex gap-3">
        <Link className="rounded-md border px-4 py-2" href="/assignments">
          Back
        </Link>
        <Link className="rounded-md border px-4 py-2" href={`/loads/${a.load_id}`}>
          View Load
        </Link>
      </div>
    </div>
  );
}
