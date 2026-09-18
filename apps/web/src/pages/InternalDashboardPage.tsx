import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle, Clock3, DollarSign, RefreshCw, Server, Truck, Users, Zap } from 'lucide-react';
import api from '@/api-client/client';

type Invoice = { amount?: number; status?: string };
type Load = { status?: string; rate?: number; ratePerMile?: number };
type Driver = { id?: string; status?: string };

const money = (value: number) => value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const InternalDashboardPage: React.FC = () => {
  const [loads, setLoads] = useState<Load[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(false);
    const results = await Promise.allSettled([api.getLoads(), api.getDrivers(), api.getInvoices()]);
    const [loadResult, driverResult, invoiceResult] = results;
    if (loadResult.status === 'fulfilled') {
      setLoads(Array.isArray(loadResult.value?.data) ? loadResult.value.data : []);
    } else setError(true);
    if (driverResult.status === 'fulfilled') {
      setDrivers(Array.isArray(driverResult.value?.data) ? driverResult.value.data : []);
    } else setError(true);
    if (invoiceResult.status === 'fulfilled') {
      setInvoices(Array.isArray(invoiceResult.value?.data) ? invoiceResult.value.data : []);
    } else setError(true);
    setRefreshedAt(new Date());
    setLoading(false);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const activeLoads = useMemo(() => loads.filter((l) => ['assigned', 'dispatched', 'in_transit', 'in-transit', 'pickup'].includes(String(l.status).toLowerCase())).length, [loads]);
  const exceptionLoads = useMemo(() => loads.filter((l) => ['exception', 'delayed', 'cancelled', 'canceled'].includes(String(l.status).toLowerCase())).length, [loads]);
  const paid = useMemo(() => invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + Number(i.amount || 0), 0), [invoices]);
  const outstanding = useMemo(() => invoices.filter((i) => ['sent', 'overdue'].includes(String(i.status))).reduce((s, i) => s + Number(i.amount || 0), 0), [invoices]);
  const driversWithIds = drivers.filter((d) => d.id).length;

  const stats = [
    { label: 'Active loads', value: activeLoads, icon: <Truck size={18} /> },
    { label: 'Exceptions', value: exceptionLoads, icon: <AlertTriangle size={18} /> },
    { label: 'Drivers', value: driversWithIds, icon: <Users size={18} /> },
    { label: 'Paid invoices', value: money(paid), icon: <CheckCircle size={18} /> },
    { label: 'Outstanding', value: money(outstanding), icon: <DollarSign size={18} /> },
  ];

  const systems = [
    { name: 'Web deployment', state: 'STALE', detail: 'Current main is not yet proven live on canonical Netlify.', tone: 'warning' },
    { name: 'API', state: 'ACTIVE', detail: 'Fly API is the active backend runtime.', tone: 'good' },
    { name: 'Stripe', state: 'TEST ONLY', detail: 'No connected live Infamous Freight Stripe account.', tone: 'warning' },
    { name: 'Dispatch', state: 'GATED', detail: 'Assignment and realtime controls require production verification.', tone: 'warning' },
    { name: 'HOS / ELD', state: 'NON-AUTHORITATIVE', detail: 'Driver records cannot replace an authoritative ELD source.', tone: 'warning' },
    { name: 'Genesis', state: 'BOUNDED', detail: 'AI may explain, collect, recommend and prepare; binding actions require authorization.', tone: 'good' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-infamous-orange"><Activity size={14} /> Internal Command Center</div>
          <h1 className="mt-2 text-2xl font-bold">Infamous Freight Internal Dashboard</h1>
          <p className="mt-1 text-sm text-[#B88989]/70">Private operational view of freight, money, system health, and launch controls.</p>
        </div>
        <button type="button" onClick={() => void refresh()} disabled={loading} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </header>

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label} className="card">
            <div className="flex items-center gap-2 text-infamous-orange">{stat.icon}<span className="text-xs text-[#B88989]/70">{stat.label}</span></div>
            <p className="mt-3 text-2xl font-bold">{loading ? '—' : stat.value}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="card">
          <div className="mb-4 flex items-center justify-between">
            <div><h2 className="font-semibold">Operations pulse</h2><p className="text-xs text-[#B88989]/60">Tenant-scoped live API records. No demo data is injected.</p></div>
            <Zap size={18} className="text-infamous-orange" />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-infamous-border p-4"><p className="text-xs text-[#B88989]/60">Total loads</p><p className="mt-1 text-xl font-bold">{loads.length}</p></div>
            <div className="rounded-xl border border-infamous-border p-4"><p className="text-xs text-[#B88989]/60">Active</p><p className="mt-1 text-xl font-bold">{activeLoads}</p></div>
            <div className="rounded-xl border border-infamous-border p-4"><p className="text-xs text-[#B88989]/60">Exceptions</p><p className="mt-1 text-xl font-bold">{exceptionLoads}</p></div>
          </div>
          {error && <div className="mt-4 flex items-center gap-2 rounded-xl border border-infamous-red/30 bg-infamous-red/10 p-3 text-sm text-[#F5E8E8]"><AlertTriangle size={16} /> One or more live API sources could not be loaded. Values are never replaced with sample data.</div>}
        </section>

        <section className="card">
          <div className="mb-4 flex items-center gap-2"><Server size={18} className="text-infamous-orange" /><h2 className="font-semibold">System readiness</h2></div>
          <div className="space-y-3">
            {systems.map((system) => (
              <div key={system.name} className="flex items-start justify-between gap-3 rounded-xl border border-infamous-border p-3">
                <div><p className="text-sm font-medium">{system.name}</p><p className="mt-0.5 text-xs text-[#B88989]/60">{system.detail}</p></div>
                <span className={system.tone === 'good' ? 'badge-green' : 'badge-yellow'}>{system.state}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="card">
        <div className="mb-4 flex items-center gap-2"><Clock3 size={18} className="text-infamous-orange" /><h2 className="font-semibold">Control gates</h2></div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            ['Production deploy', 'Blocked until current main is deployed and verified.'],
            ['Live Stripe', 'Blocked until a live account is connected and webhook/reconciliation evidence exists.'],
            ['Carrier compliance', 'Blocked until authority, insurance, documents, and contracts are verified.'],
            ['Genesis execution', 'Blocked for binding freight/financial actions without authorized execution and audit.'],
          ].map(([title, detail]) => (
            <div key={title} className="rounded-xl border border-infamous-border bg-infamous-panel/40 p-4"><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-xs leading-5 text-[#B88989]/70">{detail}</p></div>
          ))}
        </div>
      </section>

      <footer className="flex flex-wrap items-center gap-3 text-xs text-[#B88989]/50">
        <span>Internal-only surface</span><span>•</span><span>{refreshedAt ? `Refreshed ${refreshedAt.toLocaleTimeString()}` : 'Not refreshed yet'}</span><span>•</span><span>Source: tenant API + verified launch controls</span>
      </footer>
    </div>
  );
};

export default InternalDashboardPage;
