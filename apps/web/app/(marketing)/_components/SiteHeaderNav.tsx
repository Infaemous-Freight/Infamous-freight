"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Truck } from "lucide-react";

export default function SiteHeaderNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-lg font-semibold tracking-tight">Infamous Freight</div>
            <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Move Faster. Know More.</div>
          </div>
        </div>

        <nav className="hidden items-center gap-8 md:flex">
          <a href="#services" className="text-sm text-slate-600 transition hover:text-slate-900">
            Services
          </a>
          <a href="#tracking" className="text-sm text-slate-600 transition hover:text-slate-900">
            Tracking
          </a>
          <a href="#coverage" className="text-sm text-slate-600 transition hover:text-slate-900">
            Coverage
          </a>
          <a href="#quote" className="text-sm text-slate-600 transition hover:text-slate-900">
            Get Quote
          </a>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/dashboard"
            className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-100"
          >
            Customer Portal
          </Link>
          <Link
            href="/register"
            className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Book Shipment
          </Link>
        </div>

        <button
          className="inline-flex rounded-xl border border-slate-300 p-2 md:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {menuOpen ? (
        <div id="mobile-navigation" className="border-t border-slate-200 md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:px-8">
            <a href="#services" className="text-sm text-slate-600">
              Services
            </a>
            <a href="#tracking" className="text-sm text-slate-600">
              Tracking
            </a>
            <a href="#coverage" className="text-sm text-slate-600">
              Coverage
            </a>
            <a href="#quote" className="text-sm text-slate-600">
              Get Quote
            </a>
            <Link href="/dashboard" className="text-sm text-slate-600">
              Portal
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
