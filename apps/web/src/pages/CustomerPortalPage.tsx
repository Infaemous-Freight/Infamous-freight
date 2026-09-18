import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCircle2,
  Clock3,
  DollarSign,
  FileText,
  MapPin,
  MessageSquare,
  Package,
  RefreshCw,
  Search,
  Truck,
} from 'lucide-react';
import api from '@/api-client/client';
import { useAppStore } from '@/store/app-store';

type Shipment = Record<string, unknown>;
type Invoice = Record<string, unknown>;

const asText = (value: unknown, fallback = '—') =>
  value === null || value === undefined || String(value).trim() === '' ? fallback : String(value);

const money = (value: unknown) => {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
    : '—';
};

const statusClass = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized.includes('deliver') || normalized.includes('paid') || normalized.includes('complete')) return 'badge-green';
  if (normalized.includes('delay') || normalized.includes('exception') || normalized.includes('overdue')) return 'badge-orange';
  if (normalized.includes('pending') || normalized.includes('draft')) return 'badge-gray';
  return 'badge-blue';
};

const CustomerPortalPage: React.FC = () => {
  const user = useAppStore((state) => state.user);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [trackingInput, setTrackingInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);

  const loadPortal = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const [shipmentResponse, invoiceResponse] = await Promise.all([
        api.getShipments(),
        api.getInvoices(),
      ]);
      const nextShipments = Array.isArray(shipmentResponse?.data) ? shipmentResponse.data : [];
      const nextInvoices = Array.isArray(invoiceResponse?.data) ? invoiceResponse.data : [];
      setShipments(nextShipments);
      setInvoices(nextInvoices);
      setSelectedShipment((current) => current ?? nextShipments[0] ?? null);
    } catch {
      setError('We could not load your freight records. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPortal();
  }, [user]);

  const activeShipments = useMemo(
    () => shipments.filter((shipment) => !String(shipment.status ?? '').toLowerCase().includes('deliver')),
    [shipments],
  );

  const actionShipments = useMemo(
    () => shipments.filter((shipment) => /delay|exception|action/i.test(String(shipment.status ?? ''))),
    [shipments],
  );

  const unpaidInvoices = useMemo(
    () => invoices.filter((invoice) => !/paid|settled|complete/i.test(String(invoice.status ?? ''))),
    [invoices],
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-infamous-dark px-5 py-16 text-[#F5E8E8]">
        <div className="mx-auto max-w-xl rounded-2xl border border-infamous-border bg-infamous-card p-8 text-center">
          <Truck className="mx-auto mb-4 text-infamous-red-light" size={40} />
          <h1 className="text-3xl font-black">Client Portal</h1>
          <p className="mt-3 text-infamous-muted">Sign in to view your quotes, freight, tracking, documents, and invoices.</p>
          <Link to="/login" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-infamous-red px-6 py-3 font-semibold">
            Sign In <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-infamous-dark px-5 py-8 text-[#F5E8E8] lg:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-infamous-red-light">Infamous Freight</p>
            <h1 className="mt-2 text-3xl font-black">Client Portal</h1>
            <p className="mt-2 max-w-2xl text-infamous-muted">
              Your freight, tracking, documents, and billing in one secure workspace.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => void loadPortal()} className="inline-flex items-center gap-2 rounded-xl border border-infamous-border bg-infamous-card px-5 py-3 font-semibold">
              <RefreshCw size={16} /> Refresh
            </button>
            <Link to="/request-quote" className="inline-flex items-center gap-2 rounded-xl bg-infamous-red px-6 py-3 font-semibold">
              Request a Quote <ArrowRight size={16} />
            </Link>
          </div>
        </header>

        <div className="mb-8 flex items-center gap-3 rounded-xl border border-infamous-border bg-infamous-card p-4">
          <Search size={18} className="shrink-0 text-infamous-muted" />
          <input
            value={trackingInput}
            onChange={(event) => setTrackingInput(event.target.value)}
            placeholder="Enter a tracking number..."
            className="flex-1 bg-transparent text-sm placeholder:text-infamous-muted focus:outline-none"
          />
          <Link
            to={`/track-shipment${trackingInput ? `?tracking=${encodeURIComponent(trackingInput)}` : ''}`}
            className="rounded-lg bg-infamous-red/10 px-4 py-2 text-sm font-semibold text-infamous-red-light"
          >
            Track
          </Link>
        </div>

        {error && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-infamous-orange/30 bg-infamous-orange/10 p-4 text-sm">
            <span>{error}</span>
            <button onClick={() => void loadPortal()} className="font-semibold underline">Retry</button>
          </div>
        )}

        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { icon: Truck, value: loading ? '—' : activeShipments.length, label: 'Active Shipments' },
            { icon: AlertTriangle, value: loading ? '—' : actionShipments.length, label: 'Needs Attention' },
            { icon: DollarSign, value: loading ? '—' : unpaidInvoices.length, label: 'Open Invoices' },
            { icon: Package, value: loading ? '—' : shipments.length, label: 'Total Shipments' },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="metric-card">
              <Icon size={20} className="text-infamous-red-light" />
              <p className="mt-4 text-3xl font-black">{value}</p>
              <p className="mt-1 text-sm text-infamous-muted">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="space-y-6">
            <section className="rounded-xl border border-infamous-border bg-infamous-card">
              <div className="flex items-center justify-between border-b border-infamous-border p-5">
                <div>
                  <h2 className="text-lg font-bold">Your Shipments</h2>
                  <p className="mt-1 text-xs text-infamous-muted">Live records for your authenticated organization.</p>
                </div>
                <Link to="/track-shipment" className="text-sm font-medium text-infamous-red-light">Track</Link>
              </div>
              {loading ? (
                <div className="p-6 text-sm text-infamous-muted">Loading freight records…</div>
              ) : shipments.length === 0 ? (
                <div className="p-8 text-center">
                  <Package className="mx-auto mb-3 text-infamous-muted" size={32} />
                  <p className="font-semibold">No shipments yet</p>
                  <p className="mt-1 text-sm text-infamous-muted">Request a quote to start your next shipment.</p>
                </div>
              ) : (
                <div className="divide-y divide-infamous-border">
                  {shipments.map((shipment, index) => {
                    const status = asText(shipment.status, 'Pending');
                    const tracking = asText(shipment.trackingNumber, asText(shipment.id, `Shipment ${index + 1}`));
                    return (
                      <button
                        key={tracking}
                        type="button"
                        onClick={() => setSelectedShipment(shipment)}
                        className="w-full p-5 text-left transition hover:bg-infamous-panel/50"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs text-infamous-muted">{tracking}</span>
                              <span className={statusClass(status)}>{status}</span>
                            </div>
                            <h3 className="mt-2 truncate font-semibold">
                              {asText(shipment.origin, 'Origin')} → {asText(shipment.destination, 'Destination')}
                            </h3>
                            <div className="mt-2 flex flex-wrap gap-4 text-xs text-infamous-muted">
                              <span className="flex items-center gap-1"><MapPin size={12} /> {asText(shipment.equipmentType, asText(shipment.equipment, 'Equipment pending'))}</span>
                              <span className="flex items-center gap-1"><Clock3 size={12} /> ETA {asText(shipment.eta, asText(shipment.deliveryDate, 'Pending'))}</span>
                            </div>
                          </div>
                          <ArrowRight size={18} className="mt-2 shrink-0 text-infamous-muted" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {selectedShipment && (
              <section className="rounded-xl border border-infamous-border bg-infamous-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-xs text-infamous-muted">{asText(selectedShipment.trackingNumber, asText(selectedShipment.id))}</p>
                    <h2 className="mt-1 text-lg font-bold">Shipment Details</h2>
                  </div>
                  <span className={statusClass(asText(selectedShipment.status, 'Pending'))}>{asText(selectedShipment.status, 'Pending')}</span>
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg bg-infamous-panel p-4"><p className="text-xs text-infamous-muted">Origin</p><p className="mt-1 font-semibold">{asText(selectedShipment.origin)}</p></div>
                  <div className="rounded-lg bg-infamous-panel p-4"><p className="text-xs text-infamous-muted">Destination</p><p className="mt-1 font-semibold">{asText(selectedShipment.destination)}</p></div>
                  <div className="rounded-lg bg-infamous-panel p-4"><p className="text-xs text-infamous-muted">ETA</p><p className="mt-1 font-semibold">{asText(selectedShipment.eta, asText(selectedShipment.deliveryDate))}</p></div>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link to={`/shipment/${encodeURIComponent(asText(selectedShipment.trackingNumber, asText(selectedShipment.id))) }`} className="inline-flex items-center gap-2 rounded-lg bg-infamous-red px-4 py-2 text-sm font-semibold">
                    View Tracking <ArrowRight size={14} />
                  </Link>
                  <Link to="/contact" className="inline-flex items-center gap-2 rounded-lg border border-infamous-border px-4 py-2 text-sm font-semibold">
                    <MessageSquare size={14} /> Contact Support
                  </Link>
                </div>
              </section>
            )}
          </div>

          <div className="space-y-6">
            <section className="rounded-xl border border-infamous-border bg-infamous-card">
              <div className="border-b border-infamous-border p-5">
                <h2 className="flex items-center gap-2 text-lg font-bold"><Bell size={18} className="text-infamous-red-light" /> Attention</h2>
              </div>
              <div className="p-5">
                {actionShipments.length === 0 ? (
                  <div className="flex items-start gap-3 text-sm">
                    <CheckCircle2 className="mt-0.5 text-[#36D399]" size={18} />
                    <div><p className="font-semibold">Nothing needs your attention</p><p className="mt-1 text-infamous-muted">Your current shipment records have no flagged exceptions.</p></div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {actionShipments.map((shipment) => (
                      <div key={String(shipment.id)} className="rounded-lg bg-infamous-panel p-3 text-sm">
                        <p className="font-semibold">{asText(shipment.trackingNumber, asText(shipment.id))}</p>
                        <p className="mt-1 text-infamous-muted">{asText(shipment.status)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-xl border border-infamous-border bg-infamous-card">
              <div className="border-b border-infamous-border p-5">
                <h2 className="flex items-center gap-2 text-lg font-bold"><DollarSign size={18} className="text-[#36D399]" /> Invoices</h2>
              </div>
              {invoices.length === 0 ? (
                <div className="p-6 text-sm text-infamous-muted">No invoices are available for this organization.</div>
              ) : (
                <div className="divide-y divide-infamous-border">
                  {invoices.slice(0, 5).map((invoice) => (
                    <div key={String(invoice.id)} className="flex items-center justify-between gap-3 p-4">
                      <div>
                        <p className="text-sm font-semibold">{asText(invoice.invoiceNumber, asText(invoice.id))}</p>
                        <p className="mt-1 text-xs text-infamous-muted">{asText(invoice.status, 'Pending')}</p>
                      </div>
                      <p className="font-bold">{money(invoice.amount)}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-xl border border-infamous-border bg-infamous-card p-5">
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 text-infamous-ember" size={20} />
                <div>
                  <h2 className="font-bold">Documents & POD</h2>
                  <p className="mt-1 text-sm text-infamous-muted">Documents will appear here as your shipment records receive BOL/POD files.</p>
                </div>
              </div>
            </section>

            <Link to="/freight-assistant" className="flex items-center gap-3 rounded-xl border border-infamous-red/20 bg-infamous-red/5 p-5 transition hover:bg-infamous-red/10">
              <MessageSquare size={20} className="text-infamous-red-light" />
              <div className="flex-1">
                <p className="font-semibold">Ask Genesis</p>
                <p className="text-sm text-infamous-muted">Get help understanding your freight status.</p>
              </div>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerPortalPage;
