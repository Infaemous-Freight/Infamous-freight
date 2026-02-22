"use client";

import { useState } from "react";

export default function ThreadSummaryButton({ threadId }: { threadId: string }): React.ReactElement {
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (busy) {
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/actions/summarize-thread", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thread_id: threadId }),
      });

      if (!response.ok) {
         
        console.error("Failed to summarize thread", {
          status: response.status,
          statusText: response.statusText,
        });
        window.alert("Failed to summarize thread. Please try again.");
        return;
      }

      window.location.reload();
    } catch (error) {
       
      console.error("Error while summarizing thread", error);
      window.alert("An error occurred while summarizing the thread. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button className="btn btn-secondary" onClick={handleClick} type="button" disabled={busy}>
      {busy ? "Summarizing..." : "AI Summary"}
    </button>
  );
}
