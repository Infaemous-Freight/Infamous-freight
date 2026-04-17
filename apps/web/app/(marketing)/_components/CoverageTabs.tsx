"use client";

import { useState } from "react";

const laneCards = [
  { lane: "Dallas → Chicago", eta: "1.5 days", mode: "FTL" },
  { lane: "Atlanta → Miami", eta: "1 day", mode: "LTL / FTL" },
  { lane: "Los Angeles → Phoenix", eta: "Same day", mode: "Expedited" },
  { lane: "Houston → Memphis", eta: "1 day", mode: "Drayage / FTL" },
];

type Tab = "regional" | "national" | "specialized";

export default function CoverageTabs() {
  const [activeTab, setActiveTab] = useState<Tab>("regional");

  return (
    <>
      <div className="mt-8 flex gap-3">
        {(["regional", "national", "specialized"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-2xl px-4 py-2 text-sm capitalize ${
              activeTab === tab ? "bg-slate-900 text-white" : "border border-slate-300 text-slate-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="mt-6 min-h-[260px] rounded-3xl border border-slate-200 bg-white p-6">
        {activeTab === "regional" ? (
          <div className="grid gap-4 md:grid-cols-2">
            {laneCards.map((lane) => (
              <div key={lane.lane} className="rounded-2xl border border-slate-200 p-5">
                <div className="text-sm text-slate-600">{lane.mode}</div>
                <div className="mt-2 text-lg font-semibold">{lane.lane}</div>
                <div className="mt-3 text-sm text-slate-600">Typical transit: {lane.eta}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm leading-6 text-slate-600">
            {activeTab === "national"
              ? "National FTL, relay support, and brokered overflow capacity across major freight corridors with centralized dispatch communication."
              : "Expedited freight, cross-dock transitions, surge response, and capacity recovery support for high-priority loads."}
          </p>
        )}
      </div>
    </>
  );
}
