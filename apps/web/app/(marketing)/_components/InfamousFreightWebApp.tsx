import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  Clock3,
  Mail,
  MapPinned,
  Package,
  Phone,
  Route,
  ShieldCheck,
  Smartphone,
  Truck,
  Warehouse,
} from "lucide-react";

import SiteHeaderNav from "./SiteHeaderNav";
import TrackingLookup from "./TrackingLookup";
import CoverageTabs from "./CoverageTabs";
import QuoteForm from "./QuoteForm";

type Service = {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
};

const services: Service[] = [
  {
    title: "Full Truckload",
    icon: Truck,
    description:
      "Dedicated FTL coverage for high-volume moves, time-sensitive lanes, and repeat freight schedules.",
  },
  {
    title: "LTL Consolidation",
    icon: Package,
    description:
      "Cost-controlled LTL options with lane planning, shipment visibility, and dock-to-dock coordination.",
  },
  {
    title: "Expedited Freight",
    icon: Clock3,
    description:
      "Rapid-response freight coverage for hot shots, recovery loads, and operational exceptions.",
  },
  {
    title: "Warehousing + Cross-Dock",
    icon: Warehouse,
    description:
      "Short-term storage, staging, transloading, and cross-dock support to keep freight moving.",
  },
];

const metrics = [
  { label: "On-time delivery", value: "98.4%" },
  { label: "Average load updates", value: "15 min" },
  { label: "Active carrier network", value: "3,200+" },
  { label: "Weekly shipments managed", value: "1,850" },
];

const advantages = [
  "Live shipment tracking and customer visibility",
  "Lane-based pricing for repeat operational efficiency",
  "24/7 dispatch support for issue escalation",
  "Centralized quote intake for faster response times",
  "Scalable setup for brokers, shippers, and 3PL teams",
  "Operational dashboards designed for execution, not fluff",
];

const platformLinks = [
  { label: "Operations Dashboard", href: "/dashboard" },
  { label: "Loadboard", href: "/loadboard" },
  { label: "Shipment Tracking", href: "/shipments" },
  { label: "Billing & Payments", href: "/settings/billing" },
];

const testimonials = [
  {
    quote:
      "Infamous Freight tightened our delivery windows and cleaned up our load communication. We stopped chasing updates.",
    author: "Operations Manager",
    company: "Regional Retail Distributor",
  },
  {
    quote:
      "Their team works like an extension of dispatch. Fast responses, clear accountability, no drama.",
    author: "Transportation Lead",
    company: "Industrial Supply Group",
  },
];

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-3xl space-y-3">
      <span className="inline-flex rounded-full border border-slate-200 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-700">
        {eyebrow}
      </span>
      <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{title}</h2>
      <p className="text-base text-slate-600 sm:text-lg">{description}</p>
    </div>
  );
}

export default function InfamousFreightWebApp() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SiteHeaderNav />

      <main>
        <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-24">
          <div className="flex flex-col justify-center">
            <span className="mb-5 w-fit rounded-full bg-slate-100 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-700">
              Freight Operations Built for Execution
            </span>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Freight visibility, faster quoting, and tighter delivery control.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Infamous Freight helps shippers and logistics teams move freight with fewer blind spots.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#quote"
                className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 text-white"
              >
                Get a Freight Quote
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
              <Link href="/dashboard" className="rounded-2xl border border-slate-300 px-6 py-3">
                View Customer Portal
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {metrics.map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <div className="text-3xl font-semibold tracking-tight">{item.value}</div>
                  <div className="mt-2 text-sm text-slate-600">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center">
            <div className="w-full rounded-[28px] border border-slate-200 p-6 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-600">Operations Snapshot</div>
                  <div className="mt-1 text-2xl font-semibold">Today’s Load Board</div>
                </div>
                <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">Live</span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { icon: Route, label: "Active Loads", value: "124" },
                  { icon: ShieldCheck, label: "On-Time Risk", value: "6" },
                  { icon: BarChart3, label: "Avg Margin / Load", value: "$184" },
                  { icon: MapPinned, label: "Priority Exceptions", value: "11" },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-slate-200 p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm text-slate-600">
                      <item.icon className="h-4 w-4" /> {item.label}
                    </div>
                    <div className="text-3xl font-semibold">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <SectionHeader
            eyebrow="Services"
            title="Core freight services that reduce friction"
            description="Built around operational needs: speed, visibility, exception handling, and repeatable execution."
          />
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {services.map((service) => (
              <div
                key={service.title}
                className="h-full rounded-2xl border border-slate-200 p-6 shadow-sm transition-transform duration-200 hover:-translate-y-1"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                  <service.icon className="h-6 w-6" />
                </div>
                <div className="text-xl font-semibold">{service.title}</div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{service.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="platform" className="border-y border-slate-200 bg-slate-50">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div className="space-y-4">
              <SectionHeader
                eyebrow="Platform Access"
                title="Website and mobile workflows ready for dispatch teams."
                description="Use the web platform for control tower operations and the mobile app for in-cab execution."
              />
              <div className="grid gap-3 sm:grid-cols-2">
                {platformLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 inline-flex rounded-full border border-slate-200 bg-slate-50 p-2">
                <Smartphone className="h-5 w-5 text-slate-700" />
              </div>
              <h3 className="text-xl font-semibold tracking-tight text-slate-900">Infamous Freight Mobile App</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Drivers and field operators can manage loads, update milestones, and sync proof-of-delivery events.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                <li>• Mobile-first shipment status updates</li>
                <li>• Offline-safe event queue for low-signal zones</li>
                <li>• Fast handoff to dispatch through unified load IDs</li>
              </ul>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/shipments"
                  className="inline-flex items-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-100"
                >
                  Shipment Workflow
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                >
                  Request Production Setup
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="tracking" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Tracking"
            title="Shipment lookup that customers will actually use"
            description="Simple load visibility reduces inbound calls and update-chasing."
          />
          <TrackingLookup />
        </section>

        <section id="coverage" className="border-y border-slate-200 bg-slate-50/60">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Coverage"
              title="Lane examples and service reach"
              description="Position lane depth clearly to qualify better freight and reduce low-fit requests."
            />
            <CoverageTabs />
          </div>
        </section>

        <section id="quote" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Get Quote"
            title="Capture better freight requests"
            description="Form is ready to connect into CRM, TMS, or email workflows."
          />
          <div className="mt-8 grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="space-y-4 text-sm text-slate-600">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4" /> (800) 555-0199
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4" /> quotes@infamousfreight.com
              </div>
            </div>
            <QuoteForm />
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8 [content-visibility:auto] [contain-intrinsic-size:0_700px]">
          <SectionHeader
            eyebrow="Proof"
            title="Messaging that builds trust with buyers"
            description="Freight buyers care about consistency, communication, and problem-solving under pressure."
          />
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {testimonials.map((item) => (
              <div key={item.quote} className="rounded-3xl border border-slate-200 p-8 shadow-sm">
                <p className="text-lg leading-8">“{item.quote}”</p>
                <div className="mt-6">
                  <div className="font-medium">{item.author}</div>
                  <div className="text-sm text-slate-600">{item.company}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {advantages.map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                <p className="text-sm leading-6 text-slate-600">{item}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 rounded-3xl border border-slate-200 p-6">
            <div className="flex items-start gap-3">
              <Building2 className="mt-1 h-5 w-5" />
              <p className="text-sm leading-6 text-slate-600">
                Built for mid-market shippers, regional distributors, retail replenishment teams, and 3PL operators.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
