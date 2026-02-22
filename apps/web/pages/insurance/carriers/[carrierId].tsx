/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Page: Carrier Insurance Detail
 */

import { useRouter } from "next/router";

const sampleCertificates = [
  {
    id: "cert_01",
    coverageType: "CARGO",
    status: "VERIFIED",
    expires: "2025-03-30",
  },
  {
    id: "cert_02",
    coverageType: "GENERAL_LIABILITY",
    status: "PENDING",
    expires: "2025-04-15",
  },
];

export default function CarrierInsuranceDetail(): React.ReactElement {
  const router = useRouter();
  const { carrierId } = router.query;

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <header style={{ marginBottom: 24 }}>
        <h1>Carrier Insurance Detail</h1>
        <p>Carrier ID: {carrierId}</p>
      </header>

      <section style={{ marginBottom: 24 }}>
        <h2>Compliance Status</h2>
        <div style={{ padding: 16, borderRadius: 12, background: "#f8fafc" }}>
          <strong>WARNING</strong>
          <p>General liability certificate is pending verification.</p>
        </div>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h2>Certificates</h2>
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
                Status
              </th>
              <th
                style={{ textAlign: "left", borderBottom: "1px solid #e2e8f0", paddingBottom: 8 }}
              >
                Expires
              </th>
            </tr>
          </thead>
          <tbody>
            {sampleCertificates.map((cert) => (
              <tr key={cert.id}>
                <td style={{ padding: "8px 0" }}>{cert.coverageType}</td>
                <td style={{ padding: "8px 0" }}>{cert.status}</td>
                <td style={{ padding: "8px 0" }}>{cert.expires}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Actions</h2>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            style={{ padding: 10, borderRadius: 8 }}
            disabled
            aria-disabled="true"
            title="Upload functionality not yet implemented"
          >
            Upload Certificate
          </button>
          <button
            style={{ padding: 10, borderRadius: 8 }}
            disabled
            aria-disabled="true"
            title="Verification functionality not yet implemented"
          >
            Verify
          </button>
          <button
            style={{ padding: 10, borderRadius: 8 }}
            disabled
            aria-disabled="true"
            title="Rejection functionality not yet implemented"
          >
            Reject
          </button>
        </div>
      </section>
    </main>
  );
}
