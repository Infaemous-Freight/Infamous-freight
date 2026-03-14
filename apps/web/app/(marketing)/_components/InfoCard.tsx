import { THEME_TOKENS } from "../theme/brand";

type InfoCardProps = {
  title: string;
  body: string;
};

export function InfoCard({ title, body }: InfoCardProps) {
  return (
    <article className={THEME_TOKENS.card}>
      <h3 className={THEME_TOKENS.cardTitle}>{title}</h3>
      <p className={THEME_TOKENS.cardBody}>{body}</p>
    </article>
  );
}
