/*
 * Copyright © 2025 Infæmous Freight. All Rights Reserved.
 * Proprietary and Confidential - See COPYRIGHT file for details.
 * Page: Home (Marketing)
 */

import Link from "next/link";
import { useEffect } from "react";
import InfinityOperator from "../components/avatars/InfinityOperator";
import CrimsonOracle from "../components/avatars/CrimsonOracle";
import ChaosSpark from "../components/avatars/ChaosSpark";
import NeuralBackground from "../components/effects/NeuralBackground";
import ParticleField from "../components/effects/ParticleField";
import { trackEvent } from "../src/lib/analytics";

const commandMetrics = [
  { label: "Dominance Index", value: "94.2%" },
  { label: "Ops Latency", value: "0.28s" },
  { label: "AI Route Control", value: "98.1%" },
];

const oracleSignals = [
  { label: "Revenue trajectory", value: "↑ 31% QoQ", risk: "low" },
  { label: "Capacity volatility", value: "2.3%", risk: "controlled" },
  { label: "Margin shield", value: "Stable", risk: "secure" },
];

const activationGrid = [
  {
    title: "Autonomous Dispatch",
    description: "Genesis AI schedules, balances, and enforces route authority.",
  },
  {
    title: "Unified Command Ledger",
    description: "Every decision recorded with audit-grade traceability.",
  },
  {
    title: "Revenue Lock Protocol",
    description: "Monetize loads with insurance, billing, and compliance baked in.",
  },
];

export default function Home() {
  useEffect(() => {
    trackEvent("home_view");
  }, []);

  return (
    <div className="page">
      <section className="hero god-hero">
        <div className="god-hero-bg">
          <NeuralBackground />
          <ParticleField />
        </div>
        <div className="container god-hero-inner">
          <div className="god-hero-copy">
            <div className="system-label">AI GOD MODE</div>
            <h1 className="hero-title">
              <span className="line-reveal" style={{ animationDelay: "0.05s" }}>
                AI-POWERED FREIGHT
              </span>
              <span className="line-reveal" style={{ animationDelay: "0.2s" }}>
                AUTONOMOUS. DOMINANT.
              </span>
              <span className="line-reveal" style={{ animationDelay: "0.35s" }}>
                PROFIT-LOCKED.
              </span>
            </h1>
            <p className="hero-copy">
              Infæmous Freight Enterprise delivers an operator-first command
              center for revenue-grade logistics control.
            </p>
            <div className="hero-actions">
              <Link
                href="/signup"
                className="btn btn-primary"
                onClick={() => trackEvent("home_start_free")}
              >
                Activate Network
              </Link>
              <Link href="/login" className="btn btn-secondary">
                Request Command Demo
              </Link>
              <Link href="/product" className="btn btn-tertiary">
                View Protocol
              </Link>
            </div>
            <div className="hero-status">
              <span className="status-chip">System synchronized.</span>
              <span className="status-chip">Revenue stream unlocked.</span>
              <span className="status-chip">Command authority granted.</span>
            </div>
          </div>
          <div className="hero-card">
            <InfinityOperator status="Execution complete." />
          </div>
        </div>
      </section>

      <section className="section command-center">
        <div className="container">
          <div className="command-header">
            <div>
              <p className="section-subtitle">Command Center</p>
              <h2 className="section-title">Dominance Dashboard</h2>
              <p className="section-subtitle">
                Space to think. Space to win. Space to control.
              </p>
            </div>
            <CrimsonOracle />
          </div>
          <div className="dashboard-grid">
            {commandMetrics.map((metric) => (
              <div key={metric.label} className="command-panel">
                <div className="panel-kicker">Primary Signal</div>
                <div className="metric-label">{metric.label}</div>
                <div className="metric-value">{metric.value}</div>
              </div>
            ))}
          </div>
          <div className="dashboard-grid" style={{ marginTop: "24px" }}>
            {oracleSignals.map((signal) => (
              <div key={signal.label} className="oracle-panel">
                <div className="panel-kicker">Predictive Output</div>
                <div className="metric-label">{signal.label}</div>
                <div className="metric-value">{signal.value}</div>
                <span className="status-chip">Risk: {signal.risk}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">System Protocols</h2>
          <p className="section-subtitle">
            Control logic tuned for intelligence, authority, and revenue.
          </p>
          <div className="grid grid-3" style={{ marginTop: "24px" }}>
            {activationGrid.map((feature) => (
              <div key={feature.title} className="card">
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container callout">
          <h2 className="section-title">Activation Sequence</h2>
          <p className="section-subtitle">
            Onboard in minutes. Command in hours. Scale without friction.
          </p>
          <div className="dashboard-grid" style={{ marginTop: "24px" }}>
            <div className="spark-panel">
              <ChaosSpark status="You just broke the ceiling." />
            </div>
            <div className="spark-panel">
              <div className="panel-kicker">Protocol</div>
              <p className="hero-copy">
                Long-press command mode, haptic confirmations, and red energy
                swipe actions deliver the mobile god interface.
              </p>
              <div className="hero-actions">
                <Link href="/signup" className="btn btn-primary">
                  Initiate Launch
                </Link>
                <Link href="/pricing" className="btn btn-secondary">
                  Pricing Protocols
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
