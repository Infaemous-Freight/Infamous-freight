import { BRAND, THEME_TOKENS } from "../theme/brand";
import { Metric } from "./Metric";

const HERO_METRICS = [
  { label: "Weekly loads automated", value: "24k+" },
  { label: "Average response time", value: "< 2 min" },
  { label: "Tender acceptance uplift", value: "+18%" },
];

export function HeroSection() {
  return (
    <section className="py-16">
      <div className={THEME_TOKENS.container}>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Production-ready freight platform</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold text-slate-900 md:text-5xl">
          {BRAND.name} {BRAND.product}
        </h1>
        <p className="mt-4 max-w-2xl text-base text-slate-600">{BRAND.tagline}</p>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">{BRAND.mission}</p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {HERO_METRICS.map((metric) => (
            <Metric key={metric.label} label={metric.label} value={metric.value} />
          ))}
        </div>
      </div>
    </section>
  );
}
