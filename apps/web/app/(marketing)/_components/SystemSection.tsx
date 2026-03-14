import { THEME_TOKENS } from "../theme/brand";
import { InfoCard } from "./InfoCard";

export function SystemSection() {
  return (
    <section className="py-12 pb-16">
      <div className={THEME_TOKENS.container}>
        <h2 className={THEME_TOKENS.sectionHeading}>System guarantees</h2>
        <p className={THEME_TOKENS.sectionSubheading}>
          Infrastructure and workflow conventions designed for dependable operations under load.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <InfoCard
            title="Auditability"
            body="Action logs and decisions are traceable for compliance, customer communication, and post-mortems."
          />
          <InfoCard
            title="Role-safe access"
            body="Scoped permissions keep brokers, dispatchers, and admins inside clearly bounded workflows."
          />
          <InfoCard
            title="Resilient defaults"
            body="Fallback states preserve velocity during upstream outages, delayed status events, or API failures."
          />
        </div>
      </div>
    </section>
  );
}
