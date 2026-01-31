"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type BidRow = {
  id: string;
  load_id: string;
  carrier_id: string;
  amount_cents: number;
  status: string;
  message: string | null;
  created_at: string;
};

export default function BidList({
  bids,
  canAccept,
}: {
  bids: BidRow[];
  canAccept: boolean;
}) {
  const router = useRouter();
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async (bidId: string) => {
    setSubmittingId(bidId);
    setError(null);

    try {
      const response = await fetch("/api/actions/accept-bid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bid_id: bidId }),
      });

      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to accept bid");
      }

      if (data.thread_id) {
        router.push(`/threads/${data.thread_id}`);
      }
    } catch (err: any) {
      setError(err?.message ?? "Failed to accept bid");
    } finally {
      setSubmittingId(null);
    }
  };

  if (!bids.length) {
    return <p>No bids yet.</p>;
  }

  return (
    <div className="space-y-3">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <ul className="space-y-2">
        {bids.map((bid) => (
          <li
            key={bid.id}
            className="rounded-md border border-gray-200 p-3 text-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-semibold">
                  ${(bid.amount_cents / 100).toFixed(2)}
                </div>
                <div className="text-xs text-gray-500">{bid.status}</div>
              </div>
              {canAccept && bid.status === "pending" ?
                <button
                  type="button"
                  className="rounded-md border border-gray-300 px-3 py-1 text-xs"
                  onClick={() => handleAccept(bid.id)}
                  disabled={submittingId === bid.id}
                >
                  {submittingId === bid.id ? "Accepting..." : "Accept"}
                </button>
              : null}
            </div>
            {bid.message ? (
              <p className="mt-2 text-xs text-gray-600">{bid.message}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
