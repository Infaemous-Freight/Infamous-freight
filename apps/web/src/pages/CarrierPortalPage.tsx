import { Link } from 'react-router-dom';
import { ArrowLeft, ClipboardCheck, DollarSign, FileCheck2, Truck } from 'lucide-react';
import { demoCarrierLoads } from '@/data/mvpFreightData';

const CarrierPortalPage: React.FC = () => {
  return (
    <main className="min-h-screen bg-[#090909] px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <Link to="/home" className="mb-8 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white">
          <ArrowLeft size={16} /> Back to Infamous Freight
        </Link>

        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-infamous-orange">Carrier workspace</p>
          <h1 className="mt-2 text-3xl font-bold">Available loads, assigned work, documents, and pay status</h1>
          <p className="mt-2 max-w-2xl text-gray-400">A carrier-facing MVP workflow that reduces dispatcher follow-up and keeps execution details in one place.</p>
        </header>

        <section className="mb-6 grid gap-4 md:grid-cols-4">
          {[
            ['Available loads', demoCarrierLoads.length, <Truck size={20} />],
            ['Assigned loads', 4, <ClipboardCheck size={20} />],
            ['Documents needed', 2, <FileCheck2 size={20} />],
            ['Payments pending', '$8,450', <DollarSign size={20} />],
          ].map(([label, value, icon]) => (
            <div key={String(label)} className="rounded-2xl border border-infamous-border bg-infamous-card p-5">
              <div className="mb-3 text-infamous-orange">{icon}</div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="mt-1 text-sm text-gray-500">{label}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-infamous-border bg-infamous-card p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold">Available loads</h2>
            <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-400">Capacity open</span>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {demoCarrierLoads.map((load) => (
              <article key={load.id} className="rounded-2xl border border-infamous-border bg-[#111] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <p className="font-mono text-xs text-gray-500">{load.id}</p>
                  <span className="rounded-full bg-infamous-orange/10 px-3 py-1 text-xs text-infamous-orange">{load.equipment}</span>
                </div>
                <h3 className="text-lg font-bold">{load.lane}</h3>
                <div className="mt-4 space-y-2 text-sm text-gray-400">
                  <p>Pickup: {load.pickup}</p>
                  <p>Delivery: {load.delivery}</p>
                  <p>Miles: {load.miles}</p>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-infamous-border pt-4">
                  <p className="text-xl font-bold text-white">{load.pay}</p>
                  <button type="button" className="rounded-xl bg-infamous-orange px-4 py-2 text-sm font-semibold text-white">Request load</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
};

export default CarrierPortalPage;
