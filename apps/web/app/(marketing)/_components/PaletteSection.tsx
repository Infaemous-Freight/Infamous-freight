import { THEME_TOKENS } from "../theme/brand";
import { InfoCard } from "./InfoCard";

const CAPABILITIES = [
  {
    title: "Shipper intake",
    body: "Capture inbound requests, normalize lane details, and auto-score opportunities in one pass.",
  },
  {
    title: "Carrier matching",
    body: "Prioritize carriers by lane performance, margin guardrails, and service-level history.",
  },
  {
    title: "Exception intelligence",
    body: "Route disruptions trigger AI playbooks, owner handoff, and customer-safe communication.",
  },
];

export function PaletteSection() {
  return (
    <section className="py-12">
      <div className={THEME_TOKENS.container}>
        <h2 className={THEME_TOKENS.sectionHeading}>Core operations palette</h2>
        <p className={THEME_TOKENS.sectionSubheading}>
          Every workflow block is composed for dispatchers first, then hardened for real production traffic.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {CAPABILITIES.map((capability) => (
            <InfoCard key={capability.title} title={capability.title} body={capability.body} />
          ))}
        </div>
      </div>
    </section>
  );
}
