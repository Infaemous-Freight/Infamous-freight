import { NextPageContext } from "next";
import Error from "next/error";
import * as Sentry from "@sentry/nextjs";

interface ErrorPageProps {
  statusCode?: number;
  hasGetInitialPropsRun?: boolean;
  err?: Error;
  eventId?: string;
}

function CustomErrorPage({ statusCode, err, eventId }: ErrorPageProps) {
  if (!statusCode && err) {
    Sentry.captureException(err);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
        padding: "20px",
      }}
    >
      <div style={{ maxWidth: "500px", textAlign: "center" }}>
        <h1 style={{ fontSize: "48px", marginBottom: "20px", color: "#333" }}>
          {statusCode === 404 ? "404" : "Oops!"}
        </h1>

        <h2 style={{ fontSize: "24px", marginBottom: "10px", color: "#666" }}>
          {statusCode === 404 ? "Page Not Found" : "Something Went Wrong"}
        </h2>

        <p style={{ color: "#666", fontSize: "16px", lineHeight: "1.6", marginBottom: "30px" }}>
          {statusCode === 404
            ? "The page you're looking for doesn't exist or has been moved."
            : "We've been notified and will look into it. Please try again later."}
        </p>

        {process.env.NODE_ENV === "development" && err && (
          <details
            style={{
              marginTop: "20px",
              padding: "15px",
              backgroundColor: "#f5f5f5",
              borderRadius: "4px",
              textAlign: "left",
              fontSize: "12px",
              overflowX: "auto",
            }}
          >
            <summary style={{ cursor: "pointer", fontWeight: "bold" }}>
              Error Details (Development Only)
            </summary>
            <pre style={{ marginTop: "10px", whiteSpace: "pre-wrap" }}>{String(err)}</pre>
          </details>
        )}

        {eventId && process.env.NODE_ENV !== "production" && (
          <p style={{ marginTop: "20px", fontSize: "12px", color: "#999" }}>Error ID: {eventId}</p>
        )}

        <div style={{ marginTop: "30px" }}>
          <a
            href="/"
            style={{
              display: "inline-block",
              padding: "12px 24px",
              backgroundColor: "#0070f3",
              color: "white",
              textDecoration: "none",
              borderRadius: "4px",
              fontSize: "16px",
            }}
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}

CustomErrorPage.getInitialProps = async (context: NextPageContext): Promise<ErrorPageProps> => {
  const { res, err } = context;
  const statusCode = res?.statusCode || 500;

  if (statusCode === 404) {
    return { statusCode, hasGetInitialPropsRun: true };
  }

  if (err) {
    Sentry.captureException(err);
    await Sentry.flush(2000);

    return {
      statusCode,
      hasGetInitialPropsRun: true,
      eventId: Sentry.lastEventId() || undefined,
      err,
    } as unknown as ErrorPageProps;
  }

  return { statusCode, hasGetInitialPropsRun: true } as unknown as ErrorPageProps;
};

export default CustomErrorPage;
