import { THEME_TOKENS } from "../theme/brand";
import { InfoCard } from "./InfoCard";

export function LoadboardSection() {
  return (
    <section className="py-12">
      <div className={THEME_TOKENS.container}>
        <h2 className={THEME_TOKENS.sectionHeading}>Loadboard intelligence</h2>
        <p className={THEME_TOKENS.sectionSubheading}>
          Surface winning opportunities fast with lane-level context, historical price memory, and timing recommendations.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <InfoCard
            title="Lane confidence scoring"
            body="Each posting is ranked by margin potential, equipment fit, and probability of fast tender acceptance."
          />
          <InfoCard
            title="Automated outreach"
            body="Generate shipper-safe and carrier-safe communications with templated compliance controls."
          />
        </div>
      </div>
    </section>
  );
}
