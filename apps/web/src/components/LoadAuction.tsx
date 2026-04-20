"use client";

import { useState } from "react";

type Bid = {
  carrier: string;
  amount: number;
};

const starterBids: Bid[] = [
  { carrier: "Iron Horse Logistics", amount: 3150 },
  { carrier: "Blue Sky Freight", amount: 3280 },
];

export function LoadAuction() {
  const [bids, setBids] = useState<Bid[]>(starterBids);

  return (
    <section style={{ border: "1px solid #2a2a2a", borderRadius: 12, padding: 16 }}>
      <h3 style={{ marginTop: 0 }}>Load Auction</h3>
      <button
        type="button"
        onClick={() =>
          setBids((current) => [...current, { carrier: `Carrier ${current.length + 1}`, amount: 3000 + current.length * 85 }])
        }
      >
        Add simulated bid
      </button>
      <ul style={{ marginBottom: 0 }}>
        {bids.map((bid, index) => (
          <li key={`${bid.carrier}-${index}`}>
            {bid.carrier}: ${bid.amount.toLocaleString()}
          </li>
        ))}
      </ul>
    </section>
  );
}
