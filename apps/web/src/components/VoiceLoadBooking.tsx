"use client";

import { useMemo, useState } from "react";

export function VoiceLoadBooking() {
  const [spokenText, setSpokenText] = useState("");

  const parsedSummary = useMemo(() => {
    if (!spokenText.trim()) {
      return "Say something like: Pickup Dallas, deliver Atlanta, 42,000 lbs.";
    }

    return `Captured request: ${spokenText}`;
  }, [spokenText]);

  return (
    <section style={{ border: "1px solid #2a2a2a", borderRadius: 12, padding: 16 }}>
      <h3 style={{ marginTop: 0 }}>Voice Load Booking</h3>
      <p style={{ opacity: 0.85 }}>Speech recognition can be wired here using your preferred browser API/provider.</p>
      <input
        value={spokenText}
        onChange={(event) => setSpokenText(event.target.value)}
        placeholder="Simulate voice transcript"
        style={{ width: "100%", padding: 10 }}
      />
      <p style={{ marginBottom: 0 }}>{parsedSummary}</p>
    </section>
  );
}
