import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { getMyProfile } from "@/lib/db";

export default async function AssignmentsPage() {
  const supabase = supabaseServer();
  const me = await getMyProfile();

  const base = supabase
    .from("assignments")
    .select(
      "id, status, load_id, carrier_id, created_at, loads!inner(id, shipper_id, title, origin_city, destination_city, rate_cents, status)",
    );

  const query =
    me.role === "carrier" || me.role === "owner_operator"
      ? base.eq("carrier_id", me.id)
      : base.eq("loads.shipper_id", me.id);

  const { data, error } = await query.order("created_at", { ascending: false }).limit(50);
  if (error) throw error;

  const rows = (data ?? []).map((a: any) => ({
    id: a.id,
    status: a.status,
    loadId: a.load_id,
    title: a.loads?.title ?? "Untitled Load",
    from: a.loads?.origin_city ?? "Origin",
    to: a.loads?.destination_city ?? "Destination",
    rate: a.loads?.rate_cents ? `$${(a.loads.rate_cents / 100).toFixed(2)}` : "$0.00",
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Assignments</h1>
          <p className="text-sm text-gray-600">Your active bookings & delivery workflow</p>
        </div>
        <Link className="rounded-md border px-4 py-2" href="/loads">
          Browse Loads
        </Link>
      </div>

      <div className="grid gap-3">
        {rows.map((r) => (
          <Link
            key={r.id}
            href={`/assignments/${r.id}`}
            className="rounded-lg border p-4 hover:bg-gray-50"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="font-semibold">{r.title}</div>
              <div className="rounded-full border px-2 py-1 text-xs">{r.status}</div>
            </div>
            <div className="mt-1 text-sm text-gray-600">
              {r.from} → {r.to}
            </div>
            <div className="mt-2 text-sm">
              Rate: <span className="font-medium">{r.rate}</span>
            </div>
          </Link>
        ))}
        {rows.length === 0 && <div className="text-sm text-gray-600">No assignments yet.</div>}
      </div>
    </div>
  );
}
