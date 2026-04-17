"use client";

import React, { type FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  Clock3,
  Mail,
  MapPinned,
  Menu,
  Navigation,
  Package,
  Phone,
  Route,
  Search,
  ShieldCheck,
  Smartphone,
  Truck,
  Warehouse,
} from "lucide-react";

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

const laneCards = [
  { lane: "Dallas → Chicago", eta: "1.5 days", mode: "FTL" },
  { lane: "Atlanta → Miami", eta: "1 day", mode: "LTL / FTL" },
  { lane: "Los Angeles → Phoenix", eta: "Same day", mode: "Expedited" },
  { lane: "Houston → Memphis", eta: "1 day", mode: "Drayage / FTL" },
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [trackingId, setTrackingId] = useState("IF-482193");
  const [activeTab, setActiveTab] = useState<"regional" | "national" | "specialized">("regional");
  const [quoteForm, setQuoteForm] = useState({
    company: "",
    contact: "",
    email: "",
    origin: "",
    destination: "",
    details: "",
  });

  const trackingStatus = useMemo(() => {
    const normalized = trackingId.trim().toUpperCase();
    if (!normalized) return null;

    return {
      id: normalized,
      stage: "In Transit",
      currentLocation: "Springfield, MO",
      nextCheckpoint: "St. Louis, MO",
      eta: "Tomorrow by 10:30 AM",
    };
  }, [trackingId]);

  const handleQuoteSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const body = [
      `Company: ${quoteForm.company || "N/A"}`,
      `Contact: ${quoteForm.contact || "N/A"}`,
      `Email: ${quoteForm.email || "N/A"}`,
      `Origin: ${quoteForm.origin || "N/A"}`,
      `Destination: ${quoteForm.destination || "N/A"}`,
      "",
      "Freight details:",
      quoteForm.details || "N/A",
    ].join("\n");

    const query = new URLSearchParams({
      subject: `Freight quote request from ${quoteForm.company || "Website lead"}`,
      body,
    });

    window.location.href = `mailto:quotes@infamousfreight.com?${query.toString()}`;
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
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

          <div className="if-fade-up flex items-center">
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
              <div key={service.title} className="if-hover-lift">
                <div className="h-full rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
                    <service.icon className="h-6 w-6" />
                  </div>
                  <div className="text-xl font-semibold">{service.title}</div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{service.description}</p>
                </div>
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
          <div className="mt-8 rounded-3xl border border-slate-200 p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row">
              <label className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                  aria-label="Track shipment by PRO, BOL, or shipment ID"
                  className="h-12 w-full rounded-2xl border border-slate-300 pl-10"
                  placeholder="Enter PRO, BOL, or shipment ID"
                />
              </label>
            </div>

            {trackingStatus ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-5">
                  <div className="text-sm text-slate-600">Shipment ID</div>
                  <div className="mt-1 text-xl font-semibold">{trackingStatus.id}</div>
                  <span className="mt-4 inline-flex rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                    {trackingStatus.stage}
                  </span>
                </div>
                <div className="rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Navigation className="h-4 w-4" /> Current Position
                  </div>
                  <div className="mt-2 text-xl font-semibold">{trackingStatus.currentLocation}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 p-5">
                  <div className="text-sm text-slate-600">Next Checkpoint</div>
                  <div className="mt-2 text-xl font-semibold">{trackingStatus.nextCheckpoint}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 p-5">
                  <div className="text-sm text-slate-600">Estimated Delivery</div>
                  <div className="mt-2 text-xl font-semibold">{trackingStatus.eta}</div>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section id="coverage" className="border-y border-slate-200 bg-slate-50/60">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Coverage"
              title="Lane examples and service reach"
              description="Position lane depth clearly to qualify better freight and reduce low-fit requests."
            />
            <div className="mt-8 flex gap-3">
              {(["regional", "national", "specialized"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-2xl px-4 py-2 text-sm capitalize ${
                    activeTab === tab ? "bg-slate-900 text-white" : "border border-slate-300 text-slate-700"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6">
              {activeTab === "regional" ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {laneCards.map((lane) => (
                    <div key={lane.lane} className="rounded-2xl border border-slate-200 p-5">
                      <div className="text-sm text-slate-600">{lane.mode}</div>
                      <div className="mt-2 text-lg font-semibold">{lane.lane}</div>
                      <div className="mt-3 text-sm text-slate-600">Typical transit: {lane.eta}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm leading-6 text-slate-600">
                  {activeTab === "national"
                    ? "National FTL, relay support, and brokered overflow capacity across major freight corridors with centralized dispatch communication."
                    : "Expedited freight, cross-dock transitions, surge response, and capacity recovery support for high-priority loads."}
                </p>
              )}
            </div>
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
            <div className="rounded-3xl border border-slate-200 p-6 shadow-sm sm:p-8">
              <form onSubmit={handleQuoteSubmit}>
                <div className="grid gap-4 md:grid-cols-2">
                {[
                  ["company", "Company name"],
                  ["contact", "Contact name"],
                  ["email", "Email"],
                  ["origin", "Origin city / state"],
                ].map(([field, placeholder]) => {
                  const type = field === "email" ? "email" : "text";
                  const autoComplete =
                    field === "company"
                      ? "organization"
                      : field === "contact"
                        ? "name"
                        : field === "email"
                          ? "email"
                          : field === "origin"
                            ? "address-level2"
                            : "off";

                  return (
                    <input
                      key={field}
                      name={field}
                      type={type}
                      required
                      autoComplete={autoComplete}
                      aria-label={placeholder}
                      placeholder={placeholder}
                      className="h-12 rounded-2xl border border-slate-300 px-4"
                      value={quoteForm[field as keyof typeof quoteForm]}
                      onChange={(e) => setQuoteForm((prev) => ({ ...prev, [field]: e.target.value }))}
                    />
                  );
                })}
                <input
                  name="destination"
                  type="text"
                  required
                  autoComplete="address-level2"
                  aria-label="Destination city / state"
                  placeholder="Destination city / state"
                  className="h-12 rounded-2xl border border-slate-300 px-4 md:col-span-2"
                  value={quoteForm.destination}
                  onChange={(e) => setQuoteForm((prev) => ({ ...prev, destination: e.target.value }))}
                />
                <textarea
                  name="details"
                  required
                  aria-label="Freight details, weight, equipment type, pickup date, or any special handling notes"
                  placeholder="Freight details, weight, equipment type, pickup date, or any special handling notes"
                  className="min-h-[140px] rounded-2xl border border-slate-300 p-4 md:col-span-2"
                  value={quoteForm.details}
                  onChange={(e) => setQuoteForm((prev) => ({ ...prev, details: e.target.value }))}
                />
                </div>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-600">Typical quote response target: under 15 minutes for core lanes.</p>
                  <button type="submit" className="rounded-2xl bg-slate-900 px-6 py-3 text-white">
                    Request Quote
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
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
