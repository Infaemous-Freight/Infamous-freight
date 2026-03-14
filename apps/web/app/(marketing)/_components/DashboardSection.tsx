import { THEME_TOKENS } from "../theme/brand";
import { InfoCard } from "./InfoCard";

export function DashboardSection() {
  return (
    <section className="py-12">
      <div className={THEME_TOKENS.container}>
        <h2 className={THEME_TOKENS.sectionHeading}>Dispatcher dashboard</h2>
        <p className={THEME_TOKENS.sectionSubheading}>
          A single control surface for live metrics, critical alerts, and high-confidence next actions.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <InfoCard
            title="Live board health"
            body="Track lane fill rates, spot-market volatility, and SLA risk with minute-level freshness."
          />
          <InfoCard
            title="Decision queue"
            body="Prioritized cards highlight where human intervention has the highest margin impact."
          />
        </div>
      </div>
    </section>
  );
}
