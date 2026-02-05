/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Professional Homepage - Modern Design
 */

import Link from "next/link";
import { useEffect } from "react";
import { trackEvent } from "../src/lib/analytics";
import SEOHead from "../components/SEOHead";
import { trackPageLoad } from "../lib/performance";

export default function Home() {
  useEffect(() => {
    trackEvent("home_view");
    trackPageLoad("home");
  }, []);

  return (
    <>
      <SEOHead
        title="Infamous Freight Enterprises - AI-Powered Logistics & Fleet Management"
        description="Transform your logistics operations with AI-powered fleet management, real-time tracking, autonomous dispatch, and enterprise-grade revenue optimization. Trusted by industry leaders."
        keywords={[
          "AI logistics platform",
          "fleet management software",
          "freight tracking system",
          "autonomous dispatch",
          "enterprise logistics",
          "supply chain optimization",
          "route optimization AI",
          "logistics automation",
        ]}
      />

      {/* Hero Section */}
      <section className="section section-hero">
        <div className="hero-background"></div>
        <div className="container">
          <div className="hero-content">
            <div className="badge badge-crimson badge-glow">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="6" fill="currentColor" />
              </svg>
              AI-POWERED FREIGHT
            </div>

            <h1 className="hero-title">
              Autonomous Logistics
              <br />
              <span className="gradient-text">Dominant Control</span>
            </h1>

            <p className="lead hero-description">
              Enterprise-ready command center for revenue-grade logistics control. AI-powered
              dispatch, real-time tracking, and profit optimization. Battle-tested. Operator-first.
            </p>

            <div className="hero-actions">
              <Link
                href="/signup"
                className="btn btn-primary btn-lg"
                onClick={() => trackEvent("hero_cta_signup")}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M10 3v14m-7-7h14"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                Start Free Trial
              </Link>
              <Link
                href="/product"
                className="btn btn-secondary btn-lg"
                onClick={() => trackEvent("hero_cta_demo")}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M6 4l10 6-10 6V4z" fill="currentColor" />
                </svg>
                Watch Demo
              </Link>
            </div>

            <div className="hero-stats">
              <div className="stat">
                <div className="stat-value">98.1%</div>
                <div className="stat-label">Uptime SLA</div>
              </div>
              <div className="stat">
                <div className="stat-value">0.28s</div>
                <div className="stat-label">Avg Latency</div>
              </div>
              <div className="stat">
                <div className="stat-value">31%</div>
                <div className="stat-label">Revenue Increase</div>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="dashboard-preview card card-elevated">
              <div className="dashboard-header">
                <div className="flex items-center justify-between">
                  <span className="badge badge-success">LIVE</span>
                  <span className="caption mono">SYSTEM SYNCHRONIZED</span>
                </div>
              </div>
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-icon crimson-glow">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" fill="currentColor" />
                    </svg>
                  </div>
                  <div className="metric-value">94.2%</div>
                  <div className="metric-label">Dominance Index</div>
                </div>
                <div className="metric-card">
                  <div className="metric-icon gold-glow">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                  <div className="metric-value">$2.4M</div>
                  <div className="metric-label">Monthly Revenue</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <span className="badge badge-gold">CAPABILITIES</span>
            <h2>Command Center Features</h2>
            <p className="lead">Enterprise-grade tools designed for operational excellence</p>
          </div>

          <div className="grid grid-3">
            <div className="card card-interactive">
              <div className="feature-icon crimson-glow">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path
                    d="M16 4l12 6v12l-12 6-12-6V10l12-6z"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                  />
                  <circle cx="16" cy="16" r="4" fill="currentColor" />
                </svg>
              </div>
              <h3>Autonomous Dispatch</h3>
              <p>
                Genesis AI schedules, balances, and enforces route authority with machine learning
                optimization.
              </p>
              <Link href="/features/dispatch" className="feature-link">
                Learn more
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M6 4l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </Link>
            </div>

            <div className="card card-interactive">
              <div className="feature-icon gold-glow">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path
                    d="M4 12h24M4 20h24M8 4v24M24 4v24"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <h3>Unified Command Ledger</h3>
              <p>
                Every decision recorded with audit-grade traceability and immutable logging system.
              </p>
              <Link href="/features/ledger" className="feature-link">
                Learn more
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M6 4l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </Link>
            </div>

            <div className="card card-interactive">
              <div className="feature-icon crimson-glow">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path
                    d="M16 4v24M16 4a8 8 0 018 8M16 4a8 8 0 00-8 8M16 28a8 8 0 008-8M16 28a8 8 0 01-8-8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <h3>Revenue Lock Protocol</h3>
              <p>
                Monetize loads with insurance, billing, and compliance automatically integrated.
              </p>
              <Link href="/features/revenue" className="feature-link">
                Learn more
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M6 4l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="section">
        <div className="container">
          <div className="proof-section">
            <div className="proof-content">
              <span className="badge badge-info">TRUSTED WORLDWIDE</span>
              <h2>Built for Scale, Designed for Control</h2>
              <p className="lead">
                Join thousands of logistics operators who have transformed their operations with our
                AI-powered platform.
              </p>

              <div className="proof-metrics">
                <div className="proof-metric">
                  <div className="proof-value">5,000+</div>
                  <div className="proof-label">Active Operators</div>
                </div>
                <div className="proof-metric">
                  <div className="proof-value">2.5M</div>
                  <div className="proof-label">Shipments/Month</div>
                </div>
                <div className="proof-metric">
                  <div className="proof-value">150+</div>
                  <div className="proof-label">Countries</div>
                </div>
              </div>
            </div>

            <div className="testimonial-card card">
              <div className="testimonial-content">
                <div className="stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 2l2.5 5.1L18 8.3l-4 3.9 1 5.8-5-2.6-5 2.6 1-5.8-4-3.9 5.5-1.2L10 2z" />
                    </svg>
                  ))}
                </div>
                <p>
                  "Infamous Freight transformed our logistics operation. The AI dispatch system
                  increased our efficiency by 40% and revenue by 31%. Best investment we've made."
                </p>
                <div className="testimonial-author">
                  <div className="author-avatar">JD</div>
                  <div>
                    <div className="author-name">John Davidson</div>
                    <div className="author-title">COO, TransGlobal Logistics</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section cta-section">
        <div className="container">
          <div className="cta-card card card-elevated">
            <div className="cta-content">
              <div className="badge badge-crimson badge-glow">LIMITED TIME OFFER</div>
              <h2>Ready to Dominate Your Market?</h2>
              <p className="lead">
                Start your 14-day free trial. No credit card required. Cancel anytime.
              </p>
              <div className="cta-actions">
                <Link
                  href="/signup"
                  className="btn btn-primary btn-lg"
                  onClick={() => trackEvent("cta_bottom_signup")}
                >
                  Start Free Trial
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M7 3l7 7-7 7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </Link>
                <Link href="/pricing" className="btn btn-outline btn-lg">
                  View Pricing
                </Link>
              </div>
              <div className="cta-features">
                <div className="cta-feature">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M5 10l3 3 7-7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span>No credit card required</span>
                </div>
                <div className="cta-feature">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M5 10l3 3 7-7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span>14-day free trial</span>
                </div>
                <div className="cta-feature">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M5 10l3 3 7-7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        /* Hero Styles */
        .hero-background {
          position: absolute;
          inset: 0;
          overflow: hidden;
          z-index: -1;
        }

        .hero-content {
          max-width: 800px;
          text-align: center;
          margin: 0 auto var(--space-16);
          animation: slideUp 0.8s var(--ease-out);
        }

        .hero-title {
          margin: var(--space-6) 0;
          font-size: var(--text-7xl);
          line-height: var(--leading-none);
        }

        .gradient-text {
          background: linear-gradient(135deg, var(--crimson-400) 0%, var(--gold-400) 100%);
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-description {
          max-width: 600px;
          margin: 0 auto var(--space-8);
        }

        .hero-actions {
          display: flex;
          gap: var(--space-4);
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: var(--space-12);
        }

        .hero-stats {
          display: flex;
          gap: var(--space-8);
          justify-content: center;
          flex-wrap: wrap;
        }

        .stat {
          text-align: center;
        }

        .stat-value {
          font-family: var(--font-display);
          font-size: var(--text-3xl);
          font-weight: var(--font-bold);
          color: var(--crimson-400);
          margin-bottom: var(--space-2);
        }

        .stat-label {
          font-size: var(--text-sm);
          color: var(--void-400);
          text-transform: uppercase;
          letter-spacing: var(--tracking-wider);
        }

        .hero-visual {
          max-width: 900px;
          margin: 0 auto;
          animation: slideUp 0.8s var(--ease-out) 0.2s both;
        }

        .dashboard-preview {
          padding: var(--space-8);
        }

        .dashboard-header {
          margin-bottom: var(--space-6);
          padding-bottom: var(--space-4);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-6);
        }

        .metric-card {
          text-align: center;
          padding: var(--space-6);
          background: rgba(255, 255, 255, 0.02);
          border-radius: var(--radius-xl);
          transition: all var(--duration-base) var(--ease-out);
        }

        .metric-card:hover {
          background: rgba(255, 255, 255, 0.05);
          transform: translateY(-4px);
        }

        .metric-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 64px;
          height: 64px;
          margin: 0 auto var(--space-4);
          border-radius: var(--radius-full);
          color: var(--crimson-400);
        }

        .crimson-glow {
          background: rgba(225, 6, 0, 0.1);
          box-shadow: var(--glow-crimson-sm);
        }

        .gold-glow {
          background: rgba(212, 175, 55, 0.1);
          box-shadow: var(--glow-gold-sm);
          color: var(--gold-400);
        }

        .metric-value {
          font-family: var(--font-display);
          font-size: var(--text-2xl);
          font-weight: var(--font-bold);
          color: var(--void-50);
          margin-bottom: var(--space-2);
        }

        .metric-label {
          font-size: var(--text-sm);
          color: var(--void-400);
          text-transform: uppercase;
          letter-spacing: var(--tracking-wide);
        }

        /* Section Styles */
        .section-header {
          text-align: center;
          max-width: 700px;
          margin: 0 auto var(--space-16);
        }

        .section-header h2 {
          margin: var(--space-4) 0;
        }

        /* Feature Cards */
        .feature-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 64px;
          height: 64px;
          margin-bottom: var(--space-4);
          border-radius: var(--radius-xl);
        }

        .feature-link {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          margin-top: var(--space-4);
          font-weight: var(--font-semibold);
          color: var(--crimson-400);
          transition: gap var(--duration-base) var(--ease-out);
        }

        .feature-link:hover {
          gap: var(--space-3);
        }

        /* Proof Section */
        .proof-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-12);
          align-items: center;
        }

        .proof-metrics {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-6);
          margin-top: var(--space-8);
        }

        .proof-metric {
          text-align: center;
        }

        .proof-value {
          font-family: var(--font-display);
          font-size: var(--text-4xl);
          font-weight: var(--font-bold);
          color: var(--gold-400);
          margin-bottom: var(--space-2);
        }

        .proof-label {
          font-size: var(--text-sm);
          color: var(--void-400);
        }

        .testimonial-card {
          padding: var(--space-8);
        }

        .stars {
          display: flex;
          gap: var(--space-1);
          color: var(--gold-400);
          margin-bottom: var(--space-4);
        }

        .testimonial-content p {
          font-size: var(--text-lg);
          line-height: var(--leading-relaxed);
          margin-bottom: var(--space-6);
        }

        .testimonial-author {
          display: flex;
          align-items: center;
          gap: var(--space-4);
        }

        .author-avatar {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--crimson-600);
          color: var(--void-50);
          border-radius: var(--radius-full);
          font-weight: var(--font-bold);
          font-family: var(--font-display);
        }

        .author-name {
          font-weight: var(--font-semibold);
          color: var(--void-50);
        }

        .author-title {
          font-size: var(--text-sm);
          color: var(--void-400);
        }

        /* CTA Section */
        .cta-section {
          background: linear-gradient(
            135deg,
            rgba(225, 6, 0, 0.03) 0%,
            rgba(212, 175, 55, 0.03) 100%
          );
        }

        .cta-card {
          text-align: center;
          padding: var(--space-16) var(--space-8);
          max-width: 900px;
          margin: 0 auto;
        }

        .cta-content h2 {
          margin: var(--space-4) 0;
        }

        .cta-content .lead {
          margin-bottom: var(--space-8);
        }

        .cta-actions {
          display: flex;
          gap: var(--space-4);
          justify-content: center;
          flex-wrap: wrap;
          margin-bottom: var(--space-8);
        }

        .cta-features {
          display: flex;
          gap: var(--space-6);
          justify-content: center;
          flex-wrap: wrap;
        }

        .cta-feature {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          color: var(--void-300);
        }

        .cta-feature svg {
          color: var(--success-400);
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .proof-section {
            grid-template-columns: 1fr;
          }

          .proof-metrics {
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          }
        }

        @media (max-width: 640px) {
          .hero-title {
            font-size: var(--text-5xl);
          }

          .hero-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .hero-stats {
            flex-direction: column;
            gap: var(--space-6);
          }

          .proof-metrics {
            grid-template-columns: 1fr;
          }

          .cta-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .cta-features {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </>
  );
}

/**
 * Incremental Static Regeneration (ISR)
 *
 * This page is pre-rendered at build time and regenerated every hour.
 */
export async function getStaticProps() {
  return {
    props: {},
    revalidate: 3600, // Regenerate page every hour
  };
}
