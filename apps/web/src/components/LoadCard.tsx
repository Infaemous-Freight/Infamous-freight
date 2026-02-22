import Link from "next/link";
import type { Load } from "@/types/db";

export default function LoadCard({ load }: { load: Load }): React.ReactElement {
  return (
    <Link href={`/loads/${load.id}`} className="card marketplace-card">
      <div className="marketplace-card-header">
        <div className="marketplace-card-title">{load.title ?? "Untitled Load"}</div>
        <div className="marketplace-chip">{load.status}</div>
      </div>
      <div className="marketplace-card-subtitle">
        {load.origin_city ?? "Origin"} -&gt; {load.destination_city ?? "Destination"}
      </div>
      <div className="marketplace-card-meta">
        Rate:{" "}
        <span className="marketplace-amount">${((load.rate_cents ?? 0) / 100).toFixed(2)}</span>
      </div>
    </Link>
  );
}
