"use client";

const events = ["load_created", "bid_placed", "checkout_started", "subscription_renewed"];

export function Analytics() {
  return (
    <section style={{ border: "1px solid #2a2a2a", borderRadius: 12, padding: 16 }}>
      <h3 style={{ marginTop: 0 }}>Analytics</h3>
      <p>Track core funnel events in GA4/Mixpanel with consistent event naming.</p>
      <ul style={{ marginBottom: 0 }}>
        {events.map((eventName) => (
          <li key={eventName}>{eventName}</li>
        ))}
      </ul>
    </section>
  );
}
