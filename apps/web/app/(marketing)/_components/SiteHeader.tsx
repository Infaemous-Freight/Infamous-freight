import Link from "next/link";

import { BRAND, THEME_TOKENS } from "../theme/brand";

export function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white/80 py-4 backdrop-blur-md">
      <div className={`${THEME_TOKENS.container} flex items-center justify-between`}>
        <p className="text-sm font-semibold tracking-wide text-slate-900">
          {BRAND.name} <span className="text-slate-500">{BRAND.product}</span>
        </p>
        <nav className="flex items-center gap-3 text-sm">
          <Link className="rounded-lg border border-slate-300 px-3 py-2 text-slate-700" href={BRAND.cta.secondary.href}>
            {BRAND.cta.secondary.label}
          </Link>
          <Link className="rounded-lg bg-slate-900 px-3 py-2 text-white" href={BRAND.cta.primary.href}>
            {BRAND.cta.primary.label}
          </Link>
        </nav>
      </div>
    </header>
  );
}
