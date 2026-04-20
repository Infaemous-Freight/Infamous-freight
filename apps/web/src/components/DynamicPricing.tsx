"use client";

import { useMemo, useState } from "react";

export function DynamicPricing() {
  const [miles, setMiles] = useState(500);
  const [fuelSurcharge, setFuelSurcharge] = useState(0.18);

  const quote = useMemo(() => {
    const basePerMile = 2.35;
    return Number((miles * (basePerMile + fuelSurcharge)).toFixed(2));
  }, [fuelSurcharge, miles]);

  return (
    <section style={{ border: "1px solid #2a2a2a", borderRadius: 12, padding: 16 }}>
      <h3 style={{ marginTop: 0 }}>Dynamic Pricing</h3>
      <label>
        Miles
        <input type="number" value={miles} min={1} onChange={(event) => setMiles(Number(event.target.value) || 1)} />
      </label>
      <label style={{ marginLeft: 12 }}>
        Fuel surcharge
        <input
          type="number"
          value={fuelSurcharge}
          step={0.01}
          min={0}
          onChange={(event) => setFuelSurcharge(Number(event.target.value) || 0)}
        />
      </label>
      <p style={{ marginBottom: 0 }}>Recommended quote: <strong>${quote.toLocaleString()}</strong></p>
    </section>
  );
}
