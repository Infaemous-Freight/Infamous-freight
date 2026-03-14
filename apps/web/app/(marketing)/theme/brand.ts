export const BRAND = {
  name: "INFÆMOUS FREIGHT",
  product: "Dispatcher",
  tagline: "Freight orchestration for teams that move faster than the market.",
  mission:
    "Unify quoting, dispatch, live visibility, and exception handling into one production-ready operating surface.",
  cta: {
    primary: {
      href: "/register",
      label: "Start free trial",
    },
    secondary: {
      href: "/login",
      label: "Sign in",
    },
  },
} as const;

export const THEME_TOKENS = {
  container: "mx-auto w-full max-w-6xl px-6",
  card:
    "rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur-sm",
  cardTitle: "text-lg font-semibold text-slate-900",
  cardBody: "mt-2 text-sm text-slate-600",
  sectionHeading: "text-2xl font-semibold text-slate-900",
  sectionSubheading: "mt-2 text-sm text-slate-600",
  statValue: "text-3xl font-semibold text-slate-900",
  statLabel: "mt-1 text-xs uppercase tracking-[0.18em] text-slate-500",
} as const;
