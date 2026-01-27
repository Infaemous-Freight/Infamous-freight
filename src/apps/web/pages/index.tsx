import { useEffect } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics";
import { AvatarGrid } from "../components/AvatarGrid";

const sectionStyle = {
  marginTop: "3rem",
  padding: "1.5rem",
  borderRadius: "1.5rem",
  background: "rgba(15, 23, 42, 0.45)",
  border: "1px solid rgba(148, 163, 184, 0.2)",
} as const;

const listStyle = {
  margin: "0.75rem 0 0",
  paddingLeft: "1.2rem",
  lineHeight: 1.7,
} as const;

export default function Home() {
  const appName =
    process.env.NEXT_PUBLIC_APP_NAME ||
    "Infæmous Freight — AI Freight Intelligence Platform";

  useEffect(() => {
    // Track homepage visit
    track("homepage_visited", {
      app: appName,
      timestamp: new Date().toISOString(),
    });
  }, [appName]);

  const handleDashboardClick = () => {
    track("dashboard_link_clicked", {
      source: "homepage",
    });
  };

  const handleBillingClick = () => {
    track("billing_link_clicked", {
      source: "homepage",
    });
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "3rem",
        maxWidth: "980px",
        margin: "0 auto",
        color: "#e2e8f0",
      }}
    >
      <header>
        <p
          style={{
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            opacity: 0.7,
          }}
        >
          {process.env.NEXT_PUBLIC_ENV || "Development"}
        </p>
        <h1 style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>{appName}</h1>
        <p style={{ maxWidth: "620px", lineHeight: 1.7 }}>
          Dispatch. Finance. AI. Compliance. All in one system. Infæmous Freight
          orchestrates AI-powered dispatch, invoice audit automation, and
          real-time financial intelligence so carriers, brokers, and fleets can
          scale faster with autonomous ops readiness.
        </p>
        <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem" }}>
          <Link
            href="/dashboard"
            onClick={handleDashboardClick}
            style={{
              padding: "0.8rem 1.8rem",
              borderRadius: "999px",
              background: "linear-gradient(135deg,#ffcc33,#ff3366)",
              color: "#050509",
              fontWeight: 600,
            }}
          >
            Launch Dashboard
          </Link>
          <Link
            href="/billing"
            onClick={handleBillingClick}
            style={{
              padding: "0.8rem 1.8rem",
              borderRadius: "999px",
              border: "1px solid rgba(255,255,255,0.3)",
              color: "#f9fafb",
            }}
          >
            View Pricing
          </Link>
        </div>
      </header>

      <section style={sectionStyle}>
        <h2 style={{ margin: 0 }}>Market Positioning</h2>
        <p style={{ marginTop: "0.75rem", lineHeight: 1.7 }}>
          You are not "another TMS." Infæmous Freight is the AI-first Freight
          Intelligence Platform — a multimodal SaaS + AI + fintech hybrid built
          for fully autonomous operations.
        </p>
        <ul style={listStyle}>
          <li>AI-powered dispatch, audit, and lane optimization.</li>
          <li>Real-time financial engine with cash-flow visibility.</li>
          <li>Genesis synthetic intelligence avatars for every role.</li>
          <li>Compliance automation with enterprise-grade controls.</li>
        </ul>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ margin: 0 }}>Acquisition Engine</h2>
        <div style={{ display: "grid", gap: "1.5rem", marginTop: "1rem" }}>
          <div>
            <h3 style={{ margin: 0 }}>B2B: Carriers, Brokers, Fleets</h3>
            <ul style={listStyle}>
              <li>Cold email → demo → close sequences.</li>
              <li>LinkedIn outbound and founder-led content.</li>
              <li>Partnerships with factoring + insurance providers.</li>
              <li>Freight communities, forums, and trade groups.</li>
            </ul>
          </div>
          <div>
            <h3 style={{ margin: 0 }}>B2C: Drivers & Owner-Operators</h3>
            <ul style={listStyle}>
              <li>App Store & Play Store acquisition loops.</li>
              <li>TikTok / YouTube Shorts showing AI catching fraud.</li>
              <li>Influencer trucking partnerships + referral bonuses.</li>
              <li>In-app profit calculators and AI dispatch tips.</li>
            </ul>
          </div>
        </div>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ margin: 0 }}>Funnel Architecture</h2>
        <ol style={listStyle}>
          <li>Traffic → landing page with crisp value prop.</li>
          <li>Free tool or demo (AI audit, profitability calculator).</li>
          <li>Trial account with a guided AI wow moment.</li>
          <li>Paid plan → expansion into more seats + AI usage.</li>
        </ol>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ margin: 0 }}>Viral Loops & Referral Engine</h2>
        <ul style={listStyle}>
          <li>Invite a dispatcher → earn 500 AI credits.</li>
          <li>Invite a carrier → $50 off next invoice.</li>
          <li>Share AI audit reports + branded invoices to spread the brand.</li>
        </ul>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ margin: 0 }}>Enterprise-Ready Sales System</h2>
        <ul style={listStyle}>
          <li>SMBs: self-serve + inside sales.</li>
          <li>Mid-market: demo + sales rep.</li>
          <li>Enterprise: pilots, SLA, custom AI + integrations.</li>
        </ul>
      </section>

      <section style={sectionStyle}>
        <h2 style={{ margin: 0 }}>Data Network Effects</h2>
        <p style={{ marginTop: "0.75rem", lineHeight: 1.7 }}>
          Every shipment compounds intelligence: lane pricing, carrier
          reliability, fraud signals, and delivery performance. This data moat
          powers better AI, better pricing, and the Bloomberg Terminal of Freight
          AI.
        </p>
      </section>

      <AvatarGrid />
    </main>
  );
}
