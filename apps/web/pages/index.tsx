/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Page: Home / Dashboard
 */

import { ApiResponse } from "@infamous-freight/shared";
// Example: Lazy load heavy components (when you add them)
// const DashboardChart = dynamic(() => import('../components/DashboardChart'), {
//   loading: () => <p>Loading chart...</p>,
//   ssr: false,
// });

export default function Home() {
  const response: ApiResponse<string> = { success: true, data: "Welcome!" };
  return (
    <main style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1>Infamous Freight Enterprises</h1>
      <p>Status: {response.success ? "OK" : "Error"}</p>
      <p>Data: {response.data}</p>

      {/* Future: Add lazy-loaded components here */}
      {/* <DashboardChart /> */}
    </main>
  );
}
