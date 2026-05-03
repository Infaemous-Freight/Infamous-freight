import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, LifeBuoy, PackageCheck, Truck } from 'lucide-react';
import { demoQuotes, demoShipments } from '@/data/mvpFreightData';

const CustomerPortalPage: React.FC = () => {
  return (
    <main className="min-h-screen bg-[#090909] px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <Link to="/home" className="mb-8 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white">
          <ArrowLeft size={16} /> Back to Infamous Freight
        </Link>

        <header className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-infamous-orange">Customer workspace</p>
            <h1 className="mt-2 text-3xl font-bold">Shipment visibility and service requests</h1>
            <p className="mt-2 max-w-2xl text-gray-400">A customer-facing view for active freight, quote status, invoices, and support follow-up.</p>
          </div>
          <Link to="/request-quote" className="inline-flex items-center justify-center rounded-xl bg-infamous-orange px-5 py-3 font-semibold text-white">
            New quote request
          </Link>
        </header>

        <section className="mb-6 grid gap-4 md:grid-cols-4">
          {[
            ['Active shipments', demoShipments.length, <Truck size={20} />],
            ['Open quotes', demoQuotes.length, <FileText size={20} />],
            ['Completed this month', 12, <PackageCheck size={20} />],
            ['Support tickets', 2, <LifeBuoy size={20} />],
          ].map(([label, value, icon]) => (
            <div key={String(label)} className="rounded-2xl border border-infamous-border bg-infamous-card p-5">
              <div className="mb-3 text-infamous-orange">{icon}</div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="mt-1 text-sm text-gray-500">{label}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-infamous-border bg-infamous-card p-6">
            <h2 className="mb-4 text-xl font-bold">Active shipments</h2>
            <div className="space-y-3">
              {demoShipments.map((shipment) => (
                <Link key={shipment.trackingNumber} to="/track-shipment" className="block rounded-2xl border border-infamous-border bg-[#111] p-4 transition hover:border-infamous-orange/50">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <p className="font-mono text-xs text-gray-500">{shipment.trackingNumber}</p>
                      <h3 className="mt-1 font-semibold">{shipment.route}</h3>
                      <p className="mt-1 text-sm text-gray-500">{shipment.carrier} · ETA {shipment.eta}</p>
                    </div>
                    <span className="w-fit rounded-full bg-infamous-orange/10 px-3 py-1 text-xs font-semibold text-infamous-orange">{shipment.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-infamous-border bg-infamous-card p-6">
            <h2 className="mb-4 text-xl font-bold">Quote requests</h2>
            <div className="space-y-3">
              {demoQuotes.map((quote) => (
                <div key={quote.id} className="rounded-2xl border border-infamous-border bg-[#111] p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-mono text-xs text-gray-500">{quote.id}</p>
                    <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-xs text-blue-300">{quote.status}</span>
                  </div>
                  <h3 className="font-semibold">{quote.lane}</h3>
                  <p className="mt-1 text-sm text-gray-500">{quote.equipment} · {quote.weight}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default CustomerPortalPage;
