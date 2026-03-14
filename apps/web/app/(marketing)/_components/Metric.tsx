import { THEME_TOKENS } from "../theme/brand";

type MetricProps = {
  label: string;
  value: string;
};

export function Metric({ label, value }: MetricProps) {
  return (
    <article className={THEME_TOKENS.card}>
      <p className={THEME_TOKENS.statValue}>{value}</p>
      <p className={THEME_TOKENS.statLabel}>{label}</p>
    </article>
  );
}
