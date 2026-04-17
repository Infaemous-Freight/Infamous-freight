"use client";

import { useMemo, useState } from "react";
import { Navigation, Search } from "lucide-react";

export default function TrackingLookup() {
  const [trackingId, setTrackingId] = useState("IF-482193");

  const trackingStatus = useMemo(() => {
    const normalized = trackingId.trim().toUpperCase();
    if (!normalized) return null;

    return {
      id: normalized,
      stage: "In Transit",
      currentLocation: "Springfield, MO",
      nextCheckpoint: "St. Louis, MO",
      eta: "Tomorrow by 10:30 AM",
    };
  }, [trackingId]);

  return (
    <div className="mt-8 rounded-3xl border border-slate-200 p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            aria-label="Track shipment by PRO, BOL, or shipment ID"
            className="h-12 w-full rounded-2xl border border-slate-300 pl-10"
            placeholder="Enter PRO, BOL, or shipment ID"
          />
        </label>
      </div>

      {trackingStatus ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 p-5">
            <div className="text-sm text-slate-600">Shipment ID</div>
            <div className="mt-1 text-xl font-semibold">{trackingStatus.id}</div>
            <span className="mt-4 inline-flex rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
              {trackingStatus.stage}
            </span>
          </div>
          <div className="rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Navigation className="h-4 w-4" /> Current Position
            </div>
            <div className="mt-2 text-xl font-semibold">{trackingStatus.currentLocation}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 p-5">
            <div className="text-sm text-slate-600">Next Checkpoint</div>
            <div className="mt-2 text-xl font-semibold">{trackingStatus.nextCheckpoint}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 p-5">
            <div className="text-sm text-slate-600">Estimated Delivery</div>
            <div className="mt-2 text-xl font-semibold">{trackingStatus.eta}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
