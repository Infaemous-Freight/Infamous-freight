/**
 * Sentry Debug & Testing Page
 * Test various Sentry functionality
 * Only available in development and staging
 */

import React, { useState } from "react";
import { useRouter } from "next/router";
import * as Sentry from "@sentry/nextjs";
import { addBreadcrumb, setUser } from "../lib/sentry";

export default function SentryDebug() {
  const router = useRouter();
  const [errorType, setErrorType] = useState<string | null>(null);

  const isDisallowed =
    process.env.NEXT_PUBLIC_ENV === "production" && process.env.NEXT_PUBLIC_SENTRY_DSN;

  if (isDisallowed) {
    return (
      <div style={{ padding: "20px", color: "red" }}>
        <h1>Access Denied</h1>
        <p>This page is not available in production.</p>
      </div>
    );
  }

  const triggerError = (type: string) => {
    addBreadcrumb("User triggered test error", "test", "info");

    switch (type) {
      case "javascript_error":
        throw new Error("🚨 Test JavaScript Error from Sentry Debug Page");

      case "unhandled_rejection":
        Promise.reject(new Error("🚨 Test Unhandled Promise Rejection"));
        break;

      case "reference_error":
        // @ts-ignore
        nonExistentFunction();
        break;

      case "type_error":
        const obj = {};
        // @ts-ignore
        obj.foo.bar();
        break;

      case "range_error":
        throw new RangeError("🚨 Test Range Error");

      case "custom_error":
        try {
          throw new Error("Custom error with context");
        } catch (err) {
          Sentry.captureException(err as Error, {
            extra: {
              userAction: "clicked debug button",
              debugTest: true,
            },
          });
        }
        break;

      case "slow_api": {
        // Performance tracking using startSpan
        alert("Starting slow operation tracking...");
        Sentry.startSpan(
          {
            name: "Slow API Call",
            op: "http.request",
          },
          () => {
            // Simulate slow operation
            setTimeout(() => {
              alert("Slow API call recorded in Sentry Performance");
            }, 3000);
          },
        );
        break;
      }

      case "set_user":
        setUser({ id: "test-user-123", email: "test@example.com" });
        alert("User context set for test-user-123");
        break;

      case "breadcrumb":
        for (let i = 1; i <= 5; i++) {
          addBreadcrumb(`Test breadcrumb #${i}`, "test", "info");
        }
        alert("5 test breadcrumbs added");
        break;

      case "message":
        Sentry.captureMessage("Test info message", "info");
        Sentry.captureMessage("Test warning message", "warning");
        Sentry.captureMessage("Test error message", "error");
        alert("Test messages sent");
        break;
    }

    setErrorType(type);
  };

  return (
    <div
      style={{
        padding: "40px",
        maxWidth: "800px",
        margin: "0 auto",
        fontFamily: "sans-serif",
      }}
    >
      <h1>🧪 Sentry Debug & Testing Page</h1>

      <div
        style={{
          backgroundColor: "#f0f0f0",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "20px",
        }}
      >
        <h2>Settings</h2>
        <p>
          <strong>Environment:</strong> {process.env.NEXT_PUBLIC_ENV || "unknown"}
        </p>
        <p>
          <strong>Sentry Enabled:</strong> {process.env.NEXT_PUBLIC_SENTRY_DSN ? "✅ Yes" : "❌ No"}
        </p>
        <p>
          <strong>DSN:</strong> {process.env.NEXT_PUBLIC_SENTRY_DSN || "Not configured"}
        </p>
        <p>
          <strong>Release:</strong> {process.env.NEXT_PUBLIC_SENTRY_RELEASE || "unknown"}
        </p>
      </div>

      <div>
        <h2>Error Triggering Tests</h2>
        <p>Click any button to trigger an error and send it to Sentry:</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <button
            onClick={() => triggerError("javascript_error")}
            style={{
              padding: "10px 20px",
              backgroundColor: "#ff4444",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Throw JavaScript Error
          </button>

          <button
            onClick={() => triggerError("unhandled_rejection")}
            style={{
              padding: "10px 20px",
              backgroundColor: "#ff6644",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Unhandled Promise Rejection
          </button>

          <button
            onClick={() => triggerError("reference_error")}
            style={{
              padding: "10px 20px",
              backgroundColor: "#ff8844",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Reference Error
          </button>

          <button
            onClick={() => triggerError("type_error")}
            style={{
              padding: "10px 20px",
              backgroundColor: "#ffaa44",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Type Error
          </button>

          <button
            onClick={() => triggerError("range_error")}
            style={{
              padding: "10px 20px",
              backgroundColor: "#ffcc44",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Range Error
          </button>

          <button
            onClick={() => triggerError("custom_error")}
            style={{
              padding: "10px 20px",
              backgroundColor: "#ffee44",
              color: "black",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Custom Error with Context
          </button>
        </div>
      </div>

      <div style={{ marginTop: "30px" }}>
        <h2>Functionality Tests</h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <button
            onClick={() => triggerError("slow_api")}
            style={{
              padding: "10px 20px",
              backgroundColor: "#4488ff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Simulate Slow API (3s)
          </button>

          <button
            onClick={() => triggerError("breadcrumb")}
            style={{
              padding: "10px 20px",
              backgroundColor: "#44aa88",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Add Test Breadcrumbs
          </button>

          <button
            onClick={() => triggerError("message")}
            style={{
              padding: "10px 20px",
              backgroundColor: "#44ccff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Send Test Messages
          </button>

          <button
            onClick={() => triggerError("set_user")}
            style={{
              padding: "10px 20px",
              backgroundColor: "#88ccff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Set User Context
          </button>
        </div>
      </div>

      <div style={{ marginTop: "30px" }}>
        <h2>Last Test Triggered</h2>
        <p>
          {errorType ? (
            <>
              <strong>{errorType}</strong> - Check Sentry dashboard for the event
            </>
          ) : (
            "No test has been triggered yet"
          )}
        </p>
      </div>

      <div style={{ marginTop: "30px", color: "#666" }}>
        <h3>ℹ️ Notes</h3>
        <ul>
          <li>This page is disabled in production</li>
          <li>Events appear in Sentry within a few seconds</li>
          <li>Check the browser console for additional logs</li>
          <li>Performance events might take longer to appear</li>
          <li>Session Replay is captured when errors occur</li>
        </ul>
      </div>

      <div style={{ marginTop: "30px" }}>
        <button
          onClick={() => router.push("/")}
          style={{
            padding: "10px 20px",
            backgroundColor: "#333",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}
