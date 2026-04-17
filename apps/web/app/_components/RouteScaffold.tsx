import Link from "next/link";

export type RouteScaffoldAction = {
  href: string;
  label: string;
};

type RouteScaffoldProps = {
  eyebrow?: string;
  title: string;
  description: string;
  primaryAction?: RouteScaffoldAction;
  secondaryAction?: RouteScaffoldAction;
  highlights?: string[];
};

export function RouteScaffold({
  eyebrow = "Infamous Freight",
  title,
  description,
  primaryAction,
  secondaryAction,
  highlights,
}: RouteScaffoldProps) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-amber-50/40 px-6 py-16 sm:py-24">
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm backdrop-blur-sm sm:p-12">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{eyebrow}</p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">{title}</h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">{description}</p>

        {highlights && highlights.length > 0 ? (
          <ul className="mt-8 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
            {highlights.map((item) => (
              <li key={item} className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                {item}
              </li>
            ))}
          </ul>
        ) : null}

        {(primaryAction || secondaryAction) ? (
          <div className="mt-10 flex flex-wrap gap-3">
            {primaryAction ? (
              <Link
                href={primaryAction.href}
                className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                {primaryAction.label}
              </Link>
            ) : null}
            {secondaryAction ? (
              <Link
                href={secondaryAction.href}
                className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {secondaryAction.label}
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </main>
  );
}
