import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  Clock3,
  FileText,
  Route as RouteIcon,
  ShieldCheck,
  Truck,
  Users,
} from 'lucide-react';

const services = [
  {
    title: 'Freight dispatch operations',
    description: 'Centralize quote requests, load status, driver updates, exceptions, and POD follow-up in one operating view.',
    icon: <Truck size={22} />,
  },
  {
    title: 'Customer shipment visibility',
    description: 'Give shippers a clean portal for active loads, delivered shipments, invoices, and support requests.',
    icon: <RouteIcon size={22} />,
  },
  {
    title: 'Carrier execution workflow',
    description: 'Help carriers see available loads, assigned work, document needs, and payment status without phone-tag.',
    icon: <Users size={22} />,
  },
];

const processSteps = [
  'Request a quote with complete freight details',
  'Dispatch reviews rate, equipment, and carrier fit',
  'Shipment is tracked from pickup through delivery',
  'POD, invoice, and support follow-up stay organized',
];

const LandingPage: React.FC = () => {
  return (
    <main className="min-h-screen bg-[#090909] text-white">
      <section className="border-b border-infamous-border bg-gradient-to-b from-[#17110d] to-[#090909]">
        <div className="mx-auto flex min-h-[76vh] max-w-7xl flex-col px-6 py-10 lg:flex-row lg:items-center lg:gap-12">
          <div className="max-w-3xl flex-1">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-infamous-orange/30 bg-infamous-orange/10 px-4 py-2 text-sm text-infamous-orange">
              <Clock3 size={16} /> Freight control built for execution
            </div>
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Move freight with fewer calls, cleaner visibility, and tighter dispatch control.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-300">
              Infamous Freight gives shippers, carriers, and dispatch teams a practical operating layer for quotes, loads, tracking, documents, and customer follow-up.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/request-quote" className="inline-flex items-center justify-center gap-2 rounded-xl bg-infamous-orange px-5 py-3 font-semibold text-white transition hover:opacity-90">
                Request a Quote <ArrowRight size={18} />
              </Link>
              <Link to="/track-shipment" className="inline-flex items-center justify-center gap-2 rounded-xl border border-infamous-border bg-infamous-card px-5 py-3 font-semibold text-white transition hover:border-infamous-orange/50">
                Track Shipment
              </Link>
            </div>
            <div className="mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
              {['Quotes', 'Tracking', 'Carriers', 'Invoices'].map((label) => (
                <div key={label} className="rounded-xl border border-infamous-border bg-infamous-card/70 p-3 text-sm text-gray-300">
                  <CheckCircle2 className="mb-2 text-green-400" size={16} />
                  {label}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 flex-1 lg:mt-0">
            <div className="rounded-3xl border border-infamous-border bg-infamous-card p-5 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Operations snapshot</p>
                  <h2 className="text-xl font-bold">Today&apos;s freight board</h2>
                </div>
                <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-400">Live</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Open quotes', '18'],
                  ['Active loads', '42'],
                  ['On-time rate', '96%'],
                  ['PODs due', '5'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-infamous-border bg-[#111] p-4">
                    <p className="text-sm text-gray-500">{label}</p>
                    <p className="mt-2 text-2xl font-bold">{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-3">
                {[
                  ['IF-20491', 'Chicago, IL → Dallas, TX', 'In transit'],
                  ['IF-20492', 'Atlanta, GA → Charlotte, NC', 'At pickup'],
                  ['IF-20493', 'Houston, TX → Phoenix, AZ', 'Exception review'],
                ].map(([ref, route, status]) => (
                  <div key={ref} className="flex items-center justify-between rounded-2xl border border-infamous-border bg-[#111] p-4">
                    <div>
                      <p className="font-mono text-xs text-gray-500">{ref}</p>
                      <p className="text-sm font-semibold">{route}</p>
                    </div>
                    <span className="rounded-full bg-infamous-orange/10 px-3 py-1 text-xs text-infamous-orange">{status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-infamous-orange">MVP workflow</p>
            <h2 className="mt-2 text-3xl font-bold">Built around the work that makes or breaks freight operations.</h2>
          </div>
          <Link to="/freight-assistant" className="inline-flex items-center gap-2 text-infamous-orange hover:underline">
            Try freight assistant <Bot size={17} />
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {services.map((service) => (
            <div key={service.title} className="rounded-2xl border border-infamous-border bg-infamous-card p-6">
              <div className="mb-4 inline-flex rounded-xl bg-infamous-orange/10 p-3 text-infamous-orange">{service.icon}</div>
              <h3 className="text-xl font-bold">{service.title}</h3>
              <p className="mt-3 text-sm leading-6 text-gray-400">{service.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-infamous-border bg-[#0f0f0f]">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-16 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-infamous-orange">Execution path</p>
            <h2 className="mt-2 text-3xl font-bold">From request to paid invoice.</h2>
            <p className="mt-4 text-gray-400">
              The MVP starts with customer quote intake and tracking, then connects the same data to dispatch, carrier execution, and accounting follow-up.
            </p>
          </div>
          <div className="space-y-3">
            {processSteps.map((step, index) => (
              <div key={step} className="flex gap-4 rounded-2xl border border-infamous-border bg-infamous-card p-4">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-infamous-orange text-sm font-bold">{index + 1}</span>
                <p className="pt-1 text-sm text-gray-300">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-6 py-16 md:grid-cols-3">
        {[
          { label: 'Customer Portal', href: '/customer-portal', icon: <FileText size={20} /> },
          { label: 'Carrier Portal', href: '/carrier-portal', icon: <ShieldCheck size={20} /> },
          { label: 'Operations Dashboard', href: '/ops', icon: <BarChart3 size={20} /> },
        ].map((item) => (
          <Link key={item.href} to={item.href} className="group flex items-center justify-between rounded-2xl border border-infamous-border bg-infamous-card p-5 transition hover:border-infamous-orange/50">
            <span className="flex items-center gap-3 font-semibold text-white">
              <span className="text-infamous-orange">{item.icon}</span>
              {item.label}
            </span>
            <ArrowRight size={18} className="text-gray-500 transition group-hover:text-infamous-orange" />
          </Link>
        ))}
      </section>
    </main>
  );
};

export default LandingPage;
