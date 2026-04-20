"use client";

const leaderboard = [
  { name: "Maya", xp: 2580 },
  { name: "Jordan", xp: 2390 },
  { name: "Chris", xp: 2105 },
];

export function DriverGamification() {
  return (
    <section style={{ border: "1px solid #2a2a2a", borderRadius: 12, padding: 16 }}>
      <h3 style={{ marginTop: 0 }}>Driver Gamification</h3>
      <p>XP, achievement milestones, and friendly leaderboard rankings.</p>
      <ol style={{ marginBottom: 0 }}>
        {leaderboard.map((driver) => (
          <li key={driver.name}>
            {driver.name}: {driver.xp.toLocaleString()} XP
          </li>
        ))}
      </ol>
    </section>
  );
}
