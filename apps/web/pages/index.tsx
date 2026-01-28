/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Page: Home / Dashboard
 */

export default function Home() {
  return (
    <>
      <main className="gt-page">
        <section className="gt-hero">
          <div className="gt-hero__content">
            <p className="gt-eyebrow">Infæmous Freight · Get Trucking</p>
            <h1>
              The DoorDash-for-Truckers model built for the little guys.
              <span>Tap. Haul. Paid.</span>
            </h1>
            <p className="gt-lede">
              Infæmous Freight turns any truck into a revenue engine. Go online,
              grab a load, deliver, and get paid fast—no dispatcher, no broker
              chaos, no gatekeeping.
            </p>
            <div className="gt-cta">
              <button className="gt-button gt-button--primary" type="button">
                Get Trucking Beta
              </button>
              <button className="gt-button gt-button--ghost" type="button">
                See Driver Flow
              </button>
            </div>
            <div className="gt-hero__tags">
              <span>Owner-operators</span>
              <span>Hotshot & box truck</span>
              <span>Sprinter vans</span>
              <span>2–10 truck fleets</span>
              <span>New CDL holders</span>
            </div>
          </div>
          <div className="gt-hero__panel">
            <div className="gt-card gt-card--dark">
              <p className="gt-card__label">Get Trucking</p>
              <h2>Open app → Find load → Haul → Get paid.</h2>
              <div className="gt-card__metric">
                <span>Load match</span>
                <strong>$1,200 · 300 miles</strong>
              </div>
              <div className="gt-card__metric">
                <span>Instant payout</span>
                <strong>Same-day deposits</strong>
              </div>
              <p className="gt-card__note">
                Transparent pricing. No blind bidding. Built-in compliance.
              </p>
            </div>
            <div className="gt-card gt-card--light">
              <p className="gt-card__label">Why it wins</p>
              <ul>
                <li>Control and speed for independent drivers.</li>
                <li>Clear pricing with no hidden fees.</li>
                <li>Respect the driver’s time and paperwork.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="gt-section">
          <div className="gt-section__header">
            <h2>Driver-first experience. No dispatcher needed.</h2>
            <p>
              A clean, mobile-first portal that gets drivers moving in minutes.
            </p>
          </div>
          <div className="gt-grid">
            <div className="gt-card">
              <h3>Profile in minutes</h3>
              <p>
                Add truck type, location, availability, and upload CDL, DOT, and
                insurance. Go online with one tap.
              </p>
            </div>
            <div className="gt-card">
              <h3>Smart load matching</h3>
              <p>
                Loads matched by truck type, distance, time window, and rating.
                Pricing shown up front—always.
              </p>
            </div>
            <div className="gt-card">
              <h3>Fast, flexible pay</h3>
              <p>
                Same-day payouts, weekly payouts, fuel card integration, and
                optional advances for cash flow.
              </p>
            </div>
            <div className="gt-card">
              <h3>Compliance on autopilot</h3>
              <p>
                Track docs, expiry reminders, DOT status, insurance
                verification, and tax summaries—quietly handled.
              </p>
            </div>
          </div>
        </section>

        <section className="gt-section gt-section--accent">
          <div className="gt-section__header">
            <h2>Get Trucking Beta (MVP)</h2>
            <p>Ship fast. Learn faster. Scale city by city.</p>
          </div>
          <div className="gt-timeline">
            <div>
              <h4>Phase GT-1</h4>
              <p>
                Driver signup, live load list (manual OK), accept load, mark
                delivered, get paid.
              </p>
            </div>
            <div>
              <h4>Onboard 10–50 drivers</h4>
              <p>
                Real feedback from owner-operators, hotshot drivers, and small
                fleets.
              </p>
            </div>
            <div>
              <h4>Iterate and expand</h4>
              <p>
                Add instant pay, insurance add-ons, and city-by-city growth.
              </p>
            </div>
          </div>
        </section>

        <section className="gt-section">
          <div className="gt-section__header">
            <h2>Built on the backbone already in place</h2>
            <p>
              Infæmous Freight Enterprise infrastructure is live—web app, API,
              CI/CD, Stripe monetization, and versioned roadmap. This is a
              layering, not a restart.
            </p>
          </div>
          <div className="gt-pillars">
            <div>
              <span>✅</span>
              <p>Next.js web app + API on Fly.io</p>
            </div>
            <div>
              <span>✅</span>
              <p>Stripe payouts and monetization flows</p>
            </div>
            <div>
              <span>✅</span>
              <p>Compliance discipline and roadmap discipline</p>
            </div>
          </div>
        </section>

        <section className="gt-section gt-section--final">
          <div className="gt-section__header">
            <h2>Your truck. Your rules. Freight made simple.</h2>
            <p>
              Infæmous Freight is the infrastructure. Get Trucking is the
              movement. Let the little guys win.
            </p>
          </div>
          <div className="gt-cta">
            <button className="gt-button gt-button--primary" type="button">
              Launch Driver Beta
            </button>
            <button className="gt-button gt-button--ghost" type="button">
              Talk to the team
            </button>
          </div>
        </section>
      </main>

      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap");

        :root {
          color-scheme: light;
          --gt-ink: #12110f;
          --gt-muted: #5c5247;
          --gt-cream: #f4efe7;
          --gt-burnt: #b03812;
          --gt-ember: #f1642a;
          --gt-sand: #e6dbcf;
          --gt-charcoal: #1a1917;
          --gt-shadow: 0 24px 60px rgba(18, 17, 15, 0.18);
        }

        body {
          font-family: "Space Grotesk", "Trebuchet MS", sans-serif;
          color: var(--gt-ink);
          background: radial-gradient(
              circle at top right,
              rgba(241, 100, 42, 0.18),
              transparent 55%
            ),
            radial-gradient(
              circle at 10% 20%,
              rgba(176, 56, 18, 0.12),
              transparent 45%
            ),
            var(--gt-cream);
        }

        a {
          color: inherit;
          text-decoration: none;
        }
      `}</style>

      <style jsx>{`
        .gt-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 16px 80px;
          display: flex;
          flex-direction: column;
          gap: 72px;
        }

        .gt-hero {
          display: grid;
          gap: 36px;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          align-items: center;
        }

        .gt-hero__content h1 {
          font-size: clamp(2.3rem, 3vw, 3.4rem);
          line-height: 1.05;
          margin: 12px 0 16px;
        }

        .gt-hero__content h1 span {
          display: block;
          font-size: clamp(2rem, 2.5vw, 3rem);
          color: var(--gt-burnt);
          margin-top: 12px;
        }

        .gt-eyebrow {
          font-family: "IBM Plex Mono", "Courier New", monospace;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          font-size: 0.75rem;
          color: var(--gt-muted);
          margin: 0;
        }

        .gt-lede {
          font-size: 1.1rem;
          color: var(--gt-muted);
          margin: 0 0 24px;
        }

        .gt-cta {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 24px;
        }

        .gt-button {
          border-radius: 999px;
          padding: 12px 22px;
          font-size: 0.95rem;
          border: 1px solid transparent;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .gt-button:active {
          transform: translateY(1px);
        }

        .gt-button--primary {
          background: linear-gradient(120deg, var(--gt-burnt), var(--gt-ember));
          color: #fff;
          box-shadow: var(--gt-shadow);
        }

        .gt-button--ghost {
          background: transparent;
          border-color: rgba(18, 17, 15, 0.3);
          color: var(--gt-ink);
        }

        .gt-hero__tags {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .gt-hero__tags span {
          font-family: "IBM Plex Mono", "Courier New", monospace;
          font-size: 0.75rem;
          background: var(--gt-sand);
          padding: 6px 12px;
          border-radius: 999px;
        }

        .gt-hero__panel {
          display: grid;
          gap: 18px;
        }

        .gt-card {
          background: #fff;
          padding: 24px;
          border-radius: 24px;
          box-shadow: var(--gt-shadow);
          border: 1px solid rgba(18, 17, 15, 0.08);
        }

        .gt-card h2,
        .gt-card h3 {
          margin-top: 0;
        }

        .gt-card--dark {
          background: linear-gradient(135deg, #1a1715, #2b241f);
          color: #fff;
        }

        .gt-card--light {
          background: #fff7ef;
        }

        .gt-card__label {
          font-family: "IBM Plex Mono", "Courier New", monospace;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          font-size: 0.7rem;
          opacity: 0.8;
          margin-bottom: 16px;
        }

        .gt-card__metric {
          display: flex;
          justify-content: space-between;
          border-top: 1px solid rgba(255, 255, 255, 0.12);
          padding-top: 12px;
          margin-top: 12px;
        }

        .gt-card__note {
          margin-top: 16px;
          font-size: 0.9rem;
          opacity: 0.8;
        }

        .gt-section {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .gt-section__header h2 {
          margin: 0 0 12px;
          font-size: clamp(1.8rem, 2.5vw, 2.5rem);
        }

        .gt-section__header p {
          margin: 0;
          color: var(--gt-muted);
        }

        .gt-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 18px;
        }

        .gt-section--accent {
          background: linear-gradient(
            135deg,
            rgba(176, 56, 18, 0.08),
            rgba(241, 100, 42, 0.1)
          );
          padding: 36px;
          border-radius: 28px;
          border: 1px solid rgba(176, 56, 18, 0.2);
        }

        .gt-timeline {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 24px;
        }

        .gt-timeline h4 {
          margin: 0 0 10px;
          font-size: 1.1rem;
        }

        .gt-pillars {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
        }

        .gt-pillars div {
          background: #fff;
          padding: 18px 20px;
          border-radius: 18px;
          border: 1px solid rgba(18, 17, 15, 0.1);
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 600;
        }

        .gt-section--final {
          text-align: center;
          padding: 48px 24px;
          border-radius: 32px;
          background: linear-gradient(120deg, #1a1715, #4a2d1a);
          color: #fff;
        }

        .gt-section--final .gt-cta {
          justify-content: center;
          margin-top: 24px;
        }

        @media (max-width: 720px) {
          .gt-cta {
            flex-direction: column;
            align-items: stretch;
          }

          .gt-button {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </>
  );
}
