import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  Filter,
  Gauge,
  MapPin,
  PackageCheck,
  Plus,
  RadioTower,
  RefreshCw,
  Route,
  Search,
  ShieldCheck,
  Truck,
  UserRoundCheck,
  Users,
} from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import api from '@/api-client/client';

type LoadStatus = 'In transit' | 'At pickup' | 'Delayed' | 'Tendered' | 'Delivered';
type DriverState = 'Driving' | 'Available' | 'Loading' | 'Break' | 'Issue';
type PanelState = 'ready' | 'loading' | 'error';

interface LoadItem {
  id: string;
  customer: string;
  lane: string;
  equipment: string;
  status: LoadStatus;
  eta: string;
  rate: string;
  margin: string;
}

interface LoadRecord {
  id: string;
  brokerName: string;
  originCity: string;
  originState: string;
  destCity: string;
  destState: string;
  rate: number;
  equipmentType: string;
  status: string;
  pickupDate: string;
  deliveryDate?: string;
}

interface DriverStatus {
  id: string;
  name: string;
  unit: string;
  state: DriverState;
  location: string;
  nextStop: string;
  hoursLeft: string;
}

interface DriverRecord {
  id: string;
  name: string;
  phone?: string;
  equipmentType?: string;
  status: string;
  currentLat?: number;
  currentLng?: number;
  hoursRemaining?: number;
}

interface ShipmentRecord {
  id: string;
  trackingNumber?: string;
  status: string;
  originCity: string;
  originState: string;
  destCity: string;
  destState: string;
  deliveryDate?: string;
  updatedAt?: string;
}

interface TrackingEvent {
  load: string;
  label: string;
  detail: string;
}

const complianceItems = [
  { label: 'Carrier authority verified', done: true },
  { label: 'Insurance documents current', done: true },
  { label: 'Driver HOS review queued', done: false },
  { label: 'Rate confirmations signed', done: true },
  { label: 'POD exceptions cleared', done: false },
];

const statusClass: Record<LoadStatus | DriverState, string> = {
  'In transit': 'border-infamous-red/30 bg-infamous-red/10 text-infamous-red-light',
  'At pickup': 'border-infamous-orange/30 bg-infamous-orange/10 text-infamous-orange',
  Delayed: 'border-[#FF0033]/30 bg-[#FF0033]/10 text-[#ff6b86]',
  Tendered: 'border-[#B88989]/25 bg-[#B88989]/10 text-[#F5E8E8]/80',
  Delivered: 'border-[#36D399]/30 bg-[#36D399]/10 text-[#36D399]',
  Driving: 'border-infamous-red/30 bg-infamous-red/10 text-infamous-red-light',
  Available: 'border-[#36D399]/30 bg-[#36D399]/10 text-[#36D399]',
  Loading: 'border-infamous-orange/30 bg-infamous-orange/10 text-infamous-orange',
  Break: 'border-[#B88989]/25 bg-[#B88989]/10 text-[#B88989]',
  Issue: 'border-[#FF0033]/30 bg-[#FF0033]/10 text-[#ff6b86]',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function formatDateTime(value?: string): string {
  if (!value) return 'Pending';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Pending';
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function formatRelative(value?: string): string {
  if (!value) return 'recently';
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return 'recently';
  const minutes = Math.max(0, Math.floor((Date.now() - time) / 60000));
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  return `${Math.floor(hours / 24)} days ago`;
}

function mapLoadStatus(status: string): LoadStatus {
  const normalized = status.toLowerCase();
  if (normalized.includes('deliver')) return 'Delivered';
  if (normalized.includes('pickup')) return 'At pickup';
  if (normalized.includes('delay') || normalized.includes('exception')) return 'Delayed';
  if (normalized.includes('tender') || normalized.includes('scheduled')) return 'Tendered';
  return 'In transit';
}

function mapDriverState(status: string): DriverState {
  const normalized = status.toLowerCase();
  if (normalized.includes('available')) return 'Available';
  if (normalized.includes('driving')) return 'Driving';
  if (normalized.includes('duty') || normalized.includes('loading')) return 'Loading';
  if (normalized.includes('break') || normalized.includes('off')) return 'Break';
  return 'Issue';
}

function mapLoad(record: LoadRecord): LoadItem {
  return {
    id: record.id,
    customer: record.brokerName || 'Unassigned customer',
    lane: `${record.originCity}, ${record.originState} -> ${record.destCity}, ${record.destState}`,
    equipment: record.equipmentType || 'Equipment pending',
    status: mapLoadStatus(record.status),
    eta: formatDateTime(record.deliveryDate || record.pickupDate),
    rate: formatCurrency(record.rate || 0),
    margin: 'Pending',
  };
}

function mapDriver(record: DriverRecord): DriverStatus {
  const location =
    record.currentLat != null && record.currentLng != null
      ? `${record.currentLat.toFixed(4)}, ${record.currentLng.toFixed(4)}`
      : 'Location pending';
  return {
    id: record.id,
    name: record.name,
    unit: record.equipmentType || record.phone || 'Unassigned',
    state: mapDriverState(record.status),
    location,
    nextStop: 'Assigned through dispatch',
    hoursLeft: `${record.hoursRemaining ?? 0}h`,
  };
}

function mapTrackingEvent(record: ShipmentRecord): TrackingEvent {
  const lane = `${record.originCity}, ${record.originState} -> ${record.destCity}, ${record.destState}`;
  return {
    load: record.trackingNumber || record.id,
    label: mapLoadStatus(record.status),
    detail: `${lane}. Updated ${formatRelative(record.updatedAt)}. ETA ${formatDateTime(record.deliveryDate)}.`,
  };
}

const DashboardPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [panelState, setPanelState] = useState<PanelState>('loading');
  const [activeLoads, setActiveLoads] = useState<LoadItem[]>([]);
  const [driverStatuses, setDriverStatuses] = useState<DriverStatus[]>([]);
  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([]);

  const refreshDashboard = useCallback(async () => {
    setPanelState('loading');
    try {
      const [loadsResponse, driversResponse, shipmentsResponse] = await Promise.all([
        api.getLoads(),
        api.getDrivers(),
        api.getShipments(),
      ]);
      const loadRecords: LoadRecord[] = Array.isArray(loadsResponse?.data) ? loadsResponse.data : [];
      const driverRecords: DriverRecord[] = Array.isArray(driversResponse?.data) ? driversResponse.data : [];
      const shipmentRecords: ShipmentRecord[] = Array.isArray(shipmentsResponse?.data) ? shipmentsResponse.data : [];

      setActiveLoads(loadRecords.map(mapLoad));
      setDriverStatuses(driverRecords.map(mapDriver));
      setTrackingEvents(shipmentRecords.slice(0, 4).map(mapTrackingEvent));
      setPanelState('ready');
    } catch {
      setPanelState('error');
    }
  }, []);

  useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  const filteredLoads = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return activeLoads;
    return activeLoads.filter((load) =>
      [load.id, load.customer, load.lane, load.equipment, load.status].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
    );
  }, [activeLoads, query]);

  const visibleLoads = filteredLoads;
  const activeLoadCount = activeLoads.filter((load) => load.status !== 'Delivered').length;
  const delayedLoadCount = activeLoads.filter((load) => load.status === 'Delayed').length;
  const availableDriverCount = driverStatuses.filter((driver) => driver.state === 'Available').length;
  const activeDriverCount = driverStatuses.filter((driver) => driver.state !== 'Break').length;
  const deliveredLoadCount = activeLoads.filter((load) => load.status === 'Delivered').length;
  const onTimeRate = deliveredLoadCount > 0 && activeLoads.length > 0 ? `${Math.round((deliveredLoadCount / activeLoads.length) * 100)}%` : 'Pending';
  const revenueTotal = activeLoads.reduce((sum, load) => sum + Number(load.rate.replace(/[^0-9.-]+/g, '')), 0);
  const kpis = [
    { label: 'Active loads', value: String(activeLoadCount), trend: `${activeLoads.length} total loads`, icon: Truck, tone: 'text-infamous-red-light' },
    { label: 'Revenue MTD', value: formatCurrency(revenueTotal), trend: 'From load rates', icon: Banknote, tone: 'text-[#36D399]' },
    { label: 'On-time deliveries', value: onTimeRate, trend: `${deliveredLoadCount} completed`, icon: CheckCircle2, tone: 'text-[#36D399]' },
    { label: 'Delayed shipments', value: String(delayedLoadCount), trend: `${delayedLoadCount} need action`, icon: AlertTriangle, tone: 'text-infamous-orange' },
    { label: 'Active drivers', value: String(activeDriverCount), trend: `${availableDriverCount} available now`, icon: UserRoundCheck, tone: 'text-infamous-red-light' },
  ];

  return (
    <div className="min-h-full space-y-5 text-[#F5E8E8]">
      <section className="relative overflow-hidden rounded-[8px] border border-infamous-border bg-[#160608] p-5 shadow-[0_18px_80px_rgba(0,0,0,0.28)] md:p-6">
        <div className="absolute inset-0 command-grid opacity-70" aria-hidden="true" />
        <div className="relative grid gap-5 lg:grid-cols-[1.35fr_0.65fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-infamous-red-light">INFÆMOUS FREIGHT operations</p>
            <h1 className="mt-3 max-w-4xl text-3xl font-black tracking-tight text-[#fff7f7] md:text-5xl">
              Dispatch command center for freight that cannot drift.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#D8B8B8] md:text-base">
              Coordinate brokers, carriers, drivers, shippers, invoices, compliance checks, and live shipment exceptions from one enterprise-ready view.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button className="gap-2">
                <Plus size={16} /> Create load
              </Button>
              <Button variant="outline" className="gap-2">
                <RadioTower size={16} /> Track shipment
              </Button>
              <Button variant="ghost" className="gap-2 text-[#D8B8B8]">
                Open billing <ArrowRight size={16} />
              </Button>
            </div>
          </div>
          <div className="rounded-[8px] border border-infamous-red/20 bg-infamous-dark/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B88989]">Network pulse</span>
              <span className="rounded-full border border-[#36D399]/30 bg-[#36D399]/10 px-2.5 py-1 text-xs font-semibold text-[#36D399]">
                Live-ready
              </span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {[
                ['Tender response', '11m'],
                ['Avg check call', '23m'],
                ['Open exceptions', '7'],
                ['Carrier score', '91.4'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[8px] border border-infamous-border bg-infamous-panel/70 p-3">
                  <p className="text-xl font-black">{value}</p>
                  <p className="mt-1 text-xs text-[#B88989]">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label="Key performance indicators">
        {kpis.map((kpi) => (
          <article key={kpi.label} className="rounded-[8px] border border-infamous-border bg-infamous-card/90 p-4">
            <div className="flex items-center justify-between gap-3">
              <span className={`rounded-[8px] border border-current/20 bg-current/10 p-2 ${kpi.tone}`}>
                <kpi.icon size={18} />
              </span>
              <span className="text-xs text-[#B88989]">{kpi.trend}</span>
            </div>
            <p className="mt-4 text-2xl font-black">{kpi.value}</p>
            <p className="mt-1 text-sm text-[#D8B8B8]">{kpi.label}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-[8px] border border-infamous-border bg-infamous-card/90">
          <div className="flex flex-col gap-3 border-b border-infamous-border p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-bold">
                <Gauge size={17} className="text-infamous-red-light" /> Active loads overview
              </p>
              <p className="mt-1 text-xs text-[#B88989]">Designed for live load, shipment, and tender API feeds.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#B88989]" size={15} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="h-10 w-full rounded-[8px] border border-infamous-border bg-infamous-panel pl-9 pr-3 text-sm outline-none transition focus:border-infamous-red sm:w-64"
                  placeholder="Search loads"
                  aria-label="Search active loads"
                />
              </label>
              <Button variant="outline" className="gap-2">
                <Filter size={15} /> Filters
              </Button>
            </div>
          </div>

          {panelState === 'loading' && (
            <div className="grid gap-3 p-4" aria-live="polite" aria-busy="true">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="h-20 animate-pulse rounded-[8px] bg-[#F5E8E8]/8" />
              ))}
            </div>
          )}

          {panelState === 'error' && (
            <div className="p-4">
              <div className="rounded-[8px] border border-[#FF0033]/30 bg-[#FF0033]/10 p-4">
                <p className="flex items-center gap-2 font-bold text-[#ff6b86]">
                  <AlertTriangle size={18} /> Load data could not be refreshed
                </p>
                <p className="mt-2 text-sm text-[#D8B8B8]">Keep dispatching from the last known view and retry when the API recovers.</p>
                <Button variant="danger" className="mt-4 gap-2" onClick={refreshDashboard}>
                  <RefreshCw size={15} /> Retry
                </Button>
              </div>
            </div>
          )}

          {panelState === 'ready' && visibleLoads.length === 0 && (
            <EmptyState
              icon={<PackageCheck size={42} />}
              title="No active loads match this view"
              description="Create a load or adjust filters to populate dispatch work from the tenant loads endpoint."
              action={<Button className="gap-2"><Plus size={15} /> Create first load</Button>}
            />
          )}

          {panelState === 'ready' && visibleLoads.length > 0 && (
            <div className="divide-y divide-infamous-border/80">
              {visibleLoads.map((load) => (
                <article key={load.id} className="grid gap-3 p-4 transition hover:bg-infamous-panel/45 lg:grid-cols-[1fr_0.8fr_0.55fr_0.42fr] lg:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-black text-[#fff7f7]">{load.id}</p>
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${statusClass[load.status]}`}>{load.status}</span>
                    </div>
                    <p className="mt-1 text-sm text-[#D8B8B8]">{load.customer}</p>
                    <p className="mt-2 flex items-center gap-2 text-sm text-[#B88989]"><MapPin size={14} /> {load.lane}</p>
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold">{load.equipment}</p>
                    <p className="mt-1 text-[#B88989]">ETA {load.eta}</p>
                  </div>
                  <div>
                    <p className="font-black">{load.rate}</p>
                    <p className="text-xs text-[#36D399]">Margin {load.margin}</p>
                  </div>
                  <Button variant="action" className="gap-2">
                    Open <ArrowRight size={15} />
                  </Button>
                </article>
              ))}
            </div>
          )}
        </div>

        <aside className="grid gap-5">
          <section className="rounded-[8px] border border-infamous-border bg-infamous-card/90 p-4">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 text-sm font-bold"><Route size={17} className="text-infamous-red-light" /> Shipment tracking</p>
              <Button variant="ghost" className="h-8 px-2 text-xs">Map view</Button>
            </div>
            <div className="mt-4 space-y-3">
              {trackingEvents.length === 0 && (
                <EmptyState
                  icon={<Route size={34} />}
                  title="No shipment updates yet"
                  description="Live shipment activity will appear here after tracking records are created."
                />
              )}
              {trackingEvents.map((event) => (
                <div key={`${event.load}-${event.label}`} className="rounded-[8px] border border-infamous-border bg-infamous-panel/65 p-3">
                  <p className="text-sm font-bold">{event.load} · {event.label}</p>
                  <p className="mt-1 text-xs leading-5 text-[#B88989]">{event.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[8px] border border-infamous-border bg-infamous-card/90 p-4">
            <p className="flex items-center gap-2 text-sm font-bold"><Building2 size={17} className="text-infamous-red-light" /> Carrier and customer management</p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                ['Carriers', 'API ready'],
                ['Customers', 'API ready'],
                ['Pending docs', 'Tracked'],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[8px] border border-infamous-border bg-infamous-panel/65 p-3">
                  <p className="text-lg font-black">{value}</p>
                  <p className="mt-1 text-[11px] text-[#B88989]">{label}</p>
                </div>
              ))}
            </div>
            <Button variant="outline" className="mt-4 w-full gap-2"><Users size={15} /> Review partners</Button>
          </section>
        </aside>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <div className="rounded-[8px] border border-infamous-border bg-infamous-card/90 p-4 xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-bold"><Truck size={17} className="text-infamous-red-light" /> Driver status cards</p>
            <div className="flex gap-2">
              <Button variant="ghost" className="h-8 px-3 text-xs" onClick={refreshDashboard}><RefreshCw size={14} /> Refresh</Button>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {driverStatuses.length === 0 && (
              <div className="md:col-span-2">
                <EmptyState
                  icon={<Truck size={38} />}
                  title="No drivers available"
                  description="Driver records from the tenant driver endpoint will appear here when dispatch adds them."
                />
              </div>
            )}
            {driverStatuses.map((driver) => (
              <article key={driver.id} className="rounded-[8px] border border-infamous-border bg-infamous-panel/65 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black">{driver.name}</p>
                    <p className="text-sm text-[#B88989]">Unit {driver.unit}</p>
                  </div>
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass[driver.state]}`}>{driver.state}</span>
                </div>
                <div className="mt-4 grid gap-2 text-sm text-[#D8B8B8]">
                  <p><span className="text-[#B88989]">Location:</span> {driver.location}</p>
                  <p><span className="text-[#B88989]">Next stop:</span> {driver.nextStop}</p>
                  <p className="flex items-center gap-2"><Clock3 size={14} className="text-infamous-orange" /> {driver.hoursLeft} hours available</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="grid gap-5">
          <section className="rounded-[8px] border border-infamous-border bg-infamous-card/90 p-4">
            <p className="flex items-center gap-2 text-sm font-bold"><Banknote size={17} className="text-[#36D399]" /> Billing and revenue</p>
            <div className="mt-4 space-y-3">
              {[
                ['Ready to invoice', '$68,240'],
                ['A/R aging risk', '$12,805'],
                ['Unmatched PODs', '9 loads'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between rounded-[8px] border border-infamous-border bg-infamous-panel/65 p-3">
                  <span className="text-sm text-[#B88989]">{label}</span>
                  <span className="font-black">{value}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[8px] border border-infamous-border bg-infamous-card/90 p-4">
            <p className="flex items-center gap-2 text-sm font-bold"><ShieldCheck size={17} className="text-infamous-red-light" /> Compliance checklist</p>
            <div className="mt-4 space-y-2">
              {complianceItems.map((item) => (
                <div key={item.label} className="flex items-center gap-3 rounded-[8px] border border-infamous-border bg-infamous-panel/65 p-3">
                  {item.done ? <FileCheck2 size={17} className="text-[#36D399]" /> : <ClipboardCheck size={17} className="text-infamous-orange" />}
                  <span className="text-sm text-[#D8B8B8]">{item.label}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
