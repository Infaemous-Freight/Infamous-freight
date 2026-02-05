/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Page: Insurance Requirements
 */

const requirements = [
  {
    coverage: "GENERAL_LIABILITY",
    minLimit: "$1M / $2M",
    warningDays: 14,
    graceDays: 7,
    requiredFor: "BOOK_LOAD",
  },
  {
    coverage: "CYBER",
    minLimit: "$1M",
    warningDays: 14,
    graceDays: 7,
    requiredFor: "DISPATCH",
  },
  {
    coverage: "CONTINGENT_CARGO",
    minLimit: "$250K",
    warningDays: 14,
    graceDays: 7,
    requiredFor: "BID",
  },
];

export default function InsuranceRequirements() {
  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <header style={{ marginBottom: 24 }}>
        <h1>Coverage Requirements</h1>
        <p>Define minimum limits and enforcement windows by coverage type.</p>
      </header>

      <section style={{ marginBottom: 24 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th
                style={{ textAlign: "left", borderBottom: "1px solid #e2e8f0", paddingBottom: 8 }}
              >
                Coverage
              </th>
              <th
                style={{ textAlign: "left", borderBottom: "1px solid #e2e8f0", paddingBottom: 8 }}
              >
                Min Limit
              </th>
              <th
                style={{ textAlign: "left", borderBottom: "1px solid #e2e8f0", paddingBottom: 8 }}
              >
                Warning Days
              </th>
              <th
                style={{ textAlign: "left", borderBottom: "1px solid #e2e8f0", paddingBottom: 8 }}
              >
                Grace Days
              </th>
              <th
                style={{ textAlign: "left", borderBottom: "1px solid #e2e8f0", paddingBottom: 8 }}
              >
                Required For
              </th>
            </tr>
          </thead>
          <tbody>
            {requirements.map((item) => (
              <tr key={item.coverage}>
                <td style={{ padding: "8px 0" }}>{item.coverage}</td>
                <td style={{ padding: "8px 0" }}>{item.minLimit}</td>
                <td style={{ padding: "8px 0" }}>{item.warningDays}</td>
                <td style={{ padding: "8px 0" }}>{item.graceDays}</td>
                <td style={{ padding: "8px 0" }}>{item.requiredFor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Update Requirements</h2>
        <p>Use the Insurance API to update requirements and enforcement rules.</p>
      </section>
    </main>
  );
}
