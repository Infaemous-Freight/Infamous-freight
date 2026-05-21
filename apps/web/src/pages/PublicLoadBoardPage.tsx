import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  DollarSign,
  Filter,
  Flame,
  MapPin,
  Search,
  ShieldCheck,
  Truck,
  X,
  Zap,
} from 'lucide-react';
import { demoLoadBoardLoads, type LoadBoardLoad } from '@/data/mvpFreightData';
import { trackPublicEvent } from '@/lib/analytics';

const regions: LoadBoardLoad['originRegion'][] = [
  'Northeast',
  'Southeast',
  'Midwest',
  'South',
  'West',
  'Northwest',
];

const equipmentOptions: LoadBoardLoad['equipment'][] = [
  'Dry van',
  'Reefer',
  'Flatbed',
  'Power only',
  'Box truck',
  'Sprinter van',
];

const pickupWindows: LoadBoardLoad['pickupWindow'][] = [
  'Today',
  'Tomorrow',
  'This week',
  'Next week',
];

const formatMoney = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

type ApiLoad = {
  id?: unknown;
  trackingNumber?: unknown;
  origin?: unknown;
  destination?: unknown;
  pickupAt?: unknown;
  deliveryAt?: unknown;
  rate?: unknown;
  miles?: unknown;
  equipment?: unknown;
  weightLbs?: unknown;
  commodity?: unknown;
  notes?: unknown;
  createdAt?: unknown;
};

const regionFromLocation = (location: string): LoadBoardLoad['originRegion'] => {
  const state = location.match(/,\s*([A-Z]{2})\b/)?.[1] ?? '';
  if (['CT', 'DE', 'MA', 'MD', 'ME', 'NH', 'NJ', 'NY', 'PA', 'RI', 'VT'].includes(state)) return 'Northeast';
  if (['AL', 'FL', 'GA', 'KY', 'MS', 'NC', 'SC', 'TN', 'VA', 'WV'].includes(state)) return 'Southeast';
  if (['IA', 'IL', 'IN', 'MI', 'MN', 'MO', 'ND', 'NE', 'OH', 'SD', 'WI'].includes(state)) return 'Midwest';
  if (['AR', 'LA', 'OK', 'TX'].includes(state)) return 'South';
  if (['AZ', 'CA', 'CO', 'KS', 'NM', 'NV', 'UT', 'WY'].includes(state)) return 'West';
  if (['AK', 'ID', 'MT', 'OR', 'WA'].includes(state)) return 'Northwest';
  return 'South';
};

const normalizeEquipment = (value: unknown): LoadBoardLoad['equipment'] => {
  const normalized = String(value ?? '').toLowerCase();
  if (normalized.includes('reefer')) return 'Reefer';
  if (normalized.includes('flat')) return 'Flatbed';
  if (normalized.includes('power')) return 'Power only';
  if (normalized.includes('box')) return 'Box truck';
  if (normalized.includes('sprinter') || normalized.includes('cargo')) return 'Sprinter van';
  return 'Dry van';
};

const pickupWindowFromDate = (value: unknown): LoadBoardLoad['pickupWindow'] => {
  if (typeof value !== 'string' || !value) return 'This week';
  const pickup = new Date(value);
  if (Number.isNaN(pickup.getTime())) return 'This week';

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfPickup = new Date(pickup.getFullYear(), pickup.getMonth(), pickup.getDate()).getTime();
  const days = Math.round((startOfPickup - startOfToday) / 86_400_000);

  if (days <= 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days <= 7) return 'This week';
  return 'Next week';
};

const formatLoadDate = (value: unknown): string => {
  if (typeof value !== 'string' || !value) return 'Confirm with dispatch';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

const postedAgo = (value: unknown): string => {
  if (typeof value !== 'string' || !value) return 'recently';
  const created = new Date(value).getTime();
  if (Number.isNaN(created)) return 'recently';
  const minutes = Math.max(1, Math.round((Date.now() - created) / 60_000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
};

const mapApiLoadToBoardLoad = (load: ApiLoad): LoadBoardLoad | null => {
  const id = String(load.trackingNumber || load.id || '').trim();
  const origin = String(load.origin || '').trim();
  const destination = String(load.destination || '').trim();
  if (!id || !origin || !destination) return null;

  const miles = Number(load.miles) > 0 ? Number(load.miles) : 0;
  const totalPay = Number(load.rate) > 0 ? Number(load.rate) : 0;
  const ratePerMile = miles > 0 && totalPay > 0 ? totalPay / miles : 0;

  return {
    id,
    origin,
    destination,
    originRegion: regionFromLocation(origin),
    destRegion: regionFromLocation(destination),
    equipment: normalizeEquipment(load.equipment),
    freightType: String(load.commodity || 'General freight'),
    weightLbs: Number(load.weightLbs) > 0 ? Number(load.weightLbs) : 0,
    miles,
    totalPay,
    ratePerMile,
    pickupAt: formatLoadDate(load.pickupAt),
    pickupWindow: pickupWindowFromDate(load.pickupAt),
    deliveryAt: formatLoadDate(load.deliveryAt),
    postedAgo: postedAgo(load.createdAt),
    isHot: pickupWindowFromDate(load.pickupAt) === 'Today',
    quickPay: totalPay > 0,
    notes: typeof load.notes === 'string' ? load.notes : undefined,
  };
};

const PublicLoadBoardPage: React.FC = () => {
  const navigate = useNavigate();
  const [liveLoads, setLiveLoads] = useState<LoadBoardLoad[]>(demoLoadBoardLoads);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [search, setSearch] = useState('');
  const [originRegion, setOriginRegion] = useState<'All' | LoadBoardLoad['originRegion']>('All');
  const [destRegion, setDestRegion] = useState<'All' | LoadBoardLoad['destRegion']>('All');
  const [equipment, setEquipment] = useState<'All' | LoadBoardLoad['equipment']>('All');
  const [pickupWindow, setPickupWindow] = useState<'All' | LoadBoardLoad['pickupWindow']>('All');
  const [minRpm, setMinRpm] = useState('');
  const [minPay, setMinPay] = useState('');
  const [quickPayOnly, setQuickPayOnly] = useState(false);

  const [requestLoad, setRequestLoad] = useState<LoadBoardLoad | null>(null);
  const [carrierName, setCarrierName] = useState('');
  const [mcNumber, setMcNumber] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [askingRate, setAskingRate] = useState('');
  const [requestNotes, setRequestNotes] = useState('');
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    trackPublicEvent('load_board_view', { source: 'public_load_board' });
  }, []);

  useEffect(() => {
    let active = true;

    const loadAvailableFreight = async () => {
      try {
        const response = await fetch('/api/loads/search');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = (await response.json()) as { loads?: ApiLoad[] };
        const mapped = (data.loads ?? []).map(mapApiLoadToBoardLoad).filter((load): load is LoadBoardLoad => Boolean(load));

        if (!active) return;
        setLiveLoads(mapped.length > 0 ? mapped : demoLoadBoardLoads);
        setLoadState('ready');
      } catch {
        if (!active) return;
        setLiveLoads(demoLoadBoardLoads);
        setLoadState(demoLoadBoardLoads.length > 0 ? 'ready' : 'error');
      }
    };

    void loadAvailableFreight();

    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return liveLoads.filter((load) => {
      if (search) {
        const q = search.toLowerCase();
        const haystack = `${load.id} ${load.origin} ${load.destination} ${load.equipment} ${load.freightType}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (originRegion !== 'All' && load.originRegion !== originRegion) return false;
      if (destRegion !== 'All' && load.destRegion !== destRegion) return false;
      if (equipment !== 'All' && load.equipment !== equipment) return false;
      if (pickupWindow !== 'All' && load.pickupWindow !== pickupWindow) return false;
      if (minRpm && load.ratePerMile < parseFloat(minRpm)) return false;
      if (minPay && load.totalPay < parseFloat(minPay)) return false;
      if (quickPayOnly && !load.quickPay) return false;
      return true;
    });
  }, [liveLoads, search, originRegion, destRegion, equipment, pickupWindow, minRpm, minPay, quickPayOnly]);

  const totals = useMemo(() => {
    const count = filtered.length;
    const totalMiles = filtered.reduce((sum, l) => sum + l.miles, 0);
    const totalPay = filtered.reduce((sum, l) => sum + l.totalPay, 0);
    const avgRpm = totalMiles > 0 ? totalPay / totalMiles : 0;
    return { count, totalMiles, totalPay, avgRpm };
  }, [filtered]);

  const onFilterChange = (field: string, value: string | boolean) => {
    trackPublicEvent('load_board_filter', { field, value: String(value) });
  };

  const onBookClick = (load: LoadBoardLoad) => {
    trackPublicEvent('load_board_book_click', {
      load_id: load.id,
      lane: `${load.origin} -> ${load.destination}`,
      total_pay: load.totalPay,
      rate_per_mile: load.ratePerMile,
    });
    setRequestLoad(load);
    setSubmitState('idle');
    setSubmitError('');
  };

  const closeRequest = () => {
    if (submitState === 'submitting') return;
    setRequestLoad(null);
    setCarrierName('');
    setMcNumber('');
    setContactEmail('');
    setContactPhone('');
    setAskingRate('');
    setRequestNotes('');
    setSubmitState('idle');
    setSubmitError('');
  };

  const submitRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!requestLoad) return;

    if (!carrierName.trim() || !mcNumber.trim() || (!contactEmail.trim() && !contactPhone.trim())) {
      setSubmitError('Carrier name, MC#, and an email or phone are required.');
      setSubmitState('error');
      return;
    }

    setSubmitState('submitting');
    setSubmitError('');

    const askingRateValue = askingRate.trim() ? Number(askingRate) : null;

    try {
      const response = await fetch('/api/load-requests', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          loadId: requestLoad.id,
          lane: `${requestLoad.origin} -> ${requestLoad.destination}`,
          equipment: requestLoad.equipment,
          totalPay: requestLoad.totalPay,
          ratePerMile: requestLoad.ratePerMile,
          carrierName: carrierName.trim(),
          mcNumber: mcNumber.trim(),
          contactEmail: contactEmail.trim(),
          contactPhone: contactPhone.trim(),
          askingRate: askingRateValue,
          notes: requestNotes.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const reason = typeof data?.error === 'string' ? data.error : `HTTP ${response.status}`;
        throw new Error(reason);
      }

      setSubmitState('success');
      trackPublicEvent('load_board_book_submit_success', {
        load_id: requestLoad.id,
        lane: `${requestLoad.origin} -> ${requestLoad.destination}`,
        total_pay: requestLoad.totalPay,
        asking_rate: askingRateValue ?? undefined,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'submit_failed';
      setSubmitError('We could not submit the request. Please try again or call dispatch.');
      setSubmitState('error');
      trackPublicEvent('load_board_book_submit_error', {
        load_id: requestLoad.id,
        reason: message,
      });
    }
  };

  return (
    <main className="bg-[#090909] text-[#F5E8E8]">
      <section className="relative border-b border-white/10">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,61,0,0.18),transparent_42%),linear-gradient(180deg,#11100f_0%,#090909_72%)]" />
        <div className="relative mx-auto max-w-7xl px-5 py-12 lg:px-6 lg:py-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-infamous-orange/35 bg-infamous-orange/10 px-4 py-2 text-sm font-semibold text-infamous-orange">
            <Truck size={16} /> Carrier load board
          </div>
          <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
            Available freight from Infamous Freight.
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-7 text-[#F5E8E8]/80">
            Rate confirmation in writing before you roll. Payment terms are confirmed on each load.
            Browse open lanes and request the ones that fit your truck.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <Link
              to="/drive"
              onClick={() => trackPublicEvent('driver_cta_click', { source: 'load_board_hero' })}
              className="inline-flex items-center gap-2 rounded-lg bg-infamous-orange px-5 py-3 font-semibold text-[#F5E8E8] transition hover:bg-infamous-orange-light"
            >
              Carrier sign up <ArrowRight size={16} />
            </Link>
            <Link
              to="/carrier-portal"
              onClick={() =>
                trackPublicEvent('portal_cta_click', { portal: 'carrier', source: 'load_board_hero' })
              }
              className="inline-flex items-center gap-2 rounded-lg border border-white/[0.14] bg-white/[0.04] px-5 py-3 font-semibold text-[#F5E8E8] transition hover:border-infamous-orange/50"
            >
              Carrier portal <ShieldCheck size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section
        aria-label="Load board filters"
        className="border-b border-white/10 bg-[#0b0b0b]"
      >
        <div className="mx-auto max-w-7xl px-5 py-4 lg:px-6">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#B88989]">
            <Filter size={14} aria-hidden="true" /> Filters
          </div>
          <div className="grid gap-3 lg:grid-cols-[1.4fr_repeat(4,minmax(0,1fr))]">
            <div className="relative">
              <Search size={16} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B88989]/70" />
              <label htmlFor="lb-search" className="sr-only">
                Search loads
              </label>
              <input
                id="lb-search"
                type="text"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  onFilterChange('search', event.target.value);
                }}
                placeholder="Search lane, freight, or load ID"
                className="w-full rounded-lg border border-white/10 bg-infamous-panel py-2.5 pl-9 pr-3 text-sm text-[#F5E8E8] placeholder:text-[#B88989]/70 focus:border-infamous-orange focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="lb-origin" className="sr-only">
                Origin region
              </label>
              <select
                id="lb-origin"
                value={originRegion}
                onChange={(event) => {
                  const value = event.target.value as typeof originRegion;
                  setOriginRegion(value);
                  onFilterChange('origin_region', value);
                }}
                className="w-full rounded-lg border border-white/10 bg-infamous-panel px-3 py-2.5 text-sm text-[#F5E8E8] focus:border-infamous-orange focus:outline-none"
              >
                <option value="All">Origin · all regions</option>
                {regions.map((r) => (
                  <option key={r} value={r}>
                    From {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="lb-dest" className="sr-only">
                Destination region
              </label>
              <select
                id="lb-dest"
                value={destRegion}
                onChange={(event) => {
                  const value = event.target.value as typeof destRegion;
                  setDestRegion(value);
                  onFilterChange('dest_region', value);
                }}
                className="w-full rounded-lg border border-white/10 bg-infamous-panel px-3 py-2.5 text-sm text-[#F5E8E8] focus:border-infamous-orange focus:outline-none"
              >
                <option value="All">Destination · all regions</option>
                {regions.map((r) => (
                  <option key={r} value={r}>
                    To {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="lb-equipment" className="sr-only">
                Equipment
              </label>
              <select
                id="lb-equipment"
                value={equipment}
                onChange={(event) => {
                  const value = event.target.value as typeof equipment;
                  setEquipment(value);
                  onFilterChange('equipment', value);
                }}
                className="w-full rounded-lg border border-white/10 bg-infamous-panel px-3 py-2.5 text-sm text-[#F5E8E8] focus:border-infamous-orange focus:outline-none"
              >
                <option value="All">All equipment</option>
                {equipmentOptions.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="lb-pickup" className="sr-only">
                Pickup window
              </label>
              <select
                id="lb-pickup"
                value={pickupWindow}
                onChange={(event) => {
                  const value = event.target.value as typeof pickupWindow;
                  setPickupWindow(value);
                  onFilterChange('pickup_window', value);
                }}
                className="w-full rounded-lg border border-white/10 bg-infamous-panel px-3 py-2.5 text-sm text-[#F5E8E8] focus:border-infamous-orange focus:outline-none"
              >
                <option value="All">Any pickup</option>
                {pickupWindows.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(3,minmax(0,1fr))_auto]">
            <div>
              <label htmlFor="lb-min-rpm" className="sr-only">
                Minimum rate per mile
              </label>
              <div className="relative">
                <DollarSign size={14} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B88989]/70" />
                <input
                  id="lb-min-rpm"
                  type="number"
                  step="0.05"
                  min="0"
                  value={minRpm}
                  onChange={(event) => {
                    setMinRpm(event.target.value);
                    onFilterChange('min_rpm', event.target.value);
                  }}
                  placeholder="Min $/mi"
                  className="w-full rounded-lg border border-white/10 bg-infamous-panel py-2.5 pl-8 pr-3 text-sm text-[#F5E8E8] placeholder:text-[#B88989]/70 focus:border-infamous-orange focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label htmlFor="lb-min-pay" className="sr-only">
                Minimum total pay
              </label>
              <div className="relative">
                <DollarSign size={14} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B88989]/70" />
                <input
                  id="lb-min-pay"
                  type="number"
                  step="50"
                  min="0"
                  value={minPay}
                  onChange={(event) => {
                    setMinPay(event.target.value);
                    onFilterChange('min_pay', event.target.value);
                  }}
                  placeholder="Min total pay"
                  className="w-full rounded-lg border border-white/10 bg-infamous-panel py-2.5 pl-8 pr-3 text-sm text-[#F5E8E8] placeholder:text-[#B88989]/70 focus:border-infamous-orange focus:outline-none"
                />
              </div>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-infamous-panel px-3 py-2.5 text-sm text-[#F5E8E8]/80">
              <input
                type="checkbox"
                checked={quickPayOnly}
                onChange={(event) => {
                  setQuickPayOnly(event.target.checked);
                  onFilterChange('quick_pay_only', event.target.checked);
                }}
                className="h-4 w-4 accent-infamous-orange"
              />
              <Zap size={14} className="text-infamous-orange" aria-hidden="true" /> Payment terms listed
            </label>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setOriginRegion('All');
                setDestRegion('All');
                setEquipment('All');
                setPickupWindow('All');
                setMinRpm('');
                setMinPay('');
                setQuickPayOnly(false);
                onFilterChange('reset', true);
              }}
              className="rounded-lg border border-white/10 bg-transparent px-4 py-2.5 text-sm font-semibold text-[#F5E8E8]/80 transition hover:border-white/30 hover:text-[#F5E8E8]"
            >
              Reset filters
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-6">
        <div
          aria-label="Load board summary"
          className="mb-6 grid gap-3 rounded-2xl border border-white/10 bg-[#101010] p-4 sm:grid-cols-4"
        >
          <div>
            <p className="text-xs uppercase tracking-wider text-[#B88989]/70">Loads matching</p>
            <p className="mt-1 text-2xl font-black">{totals.count}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-[#B88989]/70">Total miles</p>
            <p className="mt-1 text-2xl font-black">{totals.totalMiles.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-[#B88989]/70">Total pay</p>
            <p className="mt-1 text-2xl font-black">{formatMoney(totals.totalPay)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-[#B88989]/70">Average $/mi</p>
            <p className="mt-1 text-2xl font-black text-infamous-orange">
              {totals.avgRpm > 0 ? `$${totals.avgRpm.toFixed(2)}` : '—'}
            </p>
          </div>
        </div>

        {loadState === 'loading' ? (
          <div className="mb-4 rounded-lg border border-infamous-orange/20 bg-infamous-orange/10 px-4 py-3 text-sm text-[#F5E8E8]/80">
            Loading current available freight...
          </div>
        ) : null}

        {loadState === 'error' ? (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            The live load board is temporarily unavailable. Contact dispatch for current availability.
          </div>
        ) : null}

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#101010] p-10 text-center">
            <p className="text-lg font-bold text-[#F5E8E8]">No loads match those filters right now.</p>
            <p className="mt-2 text-sm text-[#B88989]">
              Reset filters or check back shortly — new freight is posted throughout the day.
            </p>
          </div>
        ) : (
          <ul className="grid gap-4 lg:grid-cols-2">
            {filtered.map((load) => (
              <li key={load.id}>
                <article className="flex h-full flex-col rounded-2xl border border-white/10 bg-[#101010] p-5">
                  <header className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-[#B88989]/70">{load.id}</span>
                      <span className="rounded-full bg-infamous-orange/10 px-2.5 py-0.5 text-xs font-semibold text-infamous-orange">
                        {load.equipment}
                      </span>
                      {load.isHot ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-300">
                          <Flame size={12} /> Hot
                        </span>
                      ) : null}
                      {load.quickPay ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#36D399]/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                          <Zap size={12} /> Terms listed
                        </span>
                      ) : null}
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs text-[#B88989]/70">
                      <Clock size={12} aria-hidden="true" /> Posted {load.postedAgo} ago
                    </span>
                  </header>

                  <div className="mt-3">
                    <p className="flex items-start gap-2 text-base font-bold text-[#F5E8E8]">
                      <MapPin size={16} className="mt-0.5 text-infamous-orange" aria-hidden="true" />
                      <span>
                        {load.origin} <span className="text-[#B88989]/70">→</span> {load.destination}
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-[#B88989]">
                      {load.freightType} · {load.weightLbs.toLocaleString()} lb · {load.miles.toLocaleString()} mi
                    </p>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-[#B88989]/70">Pickup</dt>
                      <dd className="mt-0.5 text-[#F5E8E8]">{load.pickupAt}</dd>
                    </div>
                    <div>
                      <dt className="text-xs uppercase tracking-wider text-[#B88989]/70">Delivery</dt>
                      <dd className="mt-0.5 text-[#F5E8E8]">{load.deliveryAt}</dd>
                    </div>
                  </dl>

                  {load.notes ? (
                    <p className="mt-3 rounded-lg border border-white/5 bg-black/30 px-3 py-2 text-xs text-[#B88989]">
                      {load.notes}
                    </p>
                  ) : null}

                  <footer className="mt-5 flex items-end justify-between border-t border-white/10 pt-4">
                    <div>
                      <p className="text-2xl font-black text-[#F5E8E8]">{formatMoney(load.totalPay)}</p>
                      <p className="text-xs text-[#B88989]/70">${load.ratePerMile.toFixed(2)}/mi all-in</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onBookClick(load)}
                      aria-label={`Book load ${load.id}, ${load.origin} to ${load.destination}`}
                      className="inline-flex items-center gap-2 rounded-lg bg-infamous-orange px-4 py-2.5 text-sm font-bold text-[#F5E8E8] transition hover:bg-infamous-orange-light focus:outline-none focus:ring-2 focus:ring-infamous-orange focus:ring-offset-2 focus:ring-offset-[#101010]"
                    >
                      Book this load <ArrowRight size={14} />
                    </button>
                  </footer>
                </article>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="border-t border-white/10 bg-[#0b0b0b]">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-10 sm:grid-cols-3 lg:px-6">
          {[
            {
              title: 'Verified shipper, every load',
              detail:
                'No double brokering. Infamous Freight is the broker of record on every load posted here.',
              icon: <ShieldCheck size={20} />,
            },
            {
              title: 'Rate confirmation in writing',
              detail:
                'You see the line-haul, accessorials, and detention policy before you accept.',
              icon: <CheckCircle2 size={20} />,
            },
            {
              title: 'Written payment terms',
              detail:
                'Payment terms are confirmed in writing before dispatch and should be reviewed on each rate confirmation.',
              icon: <Zap size={20} />,
            },
          ].map((card) => (
            <article key={card.title} className="rounded-2xl border border-white/10 bg-[#101010] p-5">
              <div className="mb-3 inline-flex rounded-lg bg-infamous-orange/10 p-2.5 text-infamous-orange">
                {card.icon}
              </div>
              <h3 className="text-base font-bold text-[#F5E8E8]">{card.title}</h3>
              <p className="mt-2 text-sm text-[#B88989]">{card.detail}</p>
            </article>
          ))}
        </div>
        <div className="mx-auto max-w-7xl px-5 pb-12 lg:px-6">
          <p className="text-xs text-[#B88989]/70">
            Loads shown are representative of recent Infamous Freight postings. Rates, pickup
            windows, and load details are confirmed by dispatch on a per-load rate confirmation
            before pickup. New to Infamous? Start with the carrier signup to unlock booking.
          </p>
        </div>
      </section>

      {requestLoad ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="load-request-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={closeRequest}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0d0d0d] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-infamous-orange">
                  Request load
                </p>
                <h2 id="load-request-title" className="mt-1 text-lg font-bold text-[#F5E8E8]">
                  {requestLoad.id} · {requestLoad.origin} → {requestLoad.destination}
                </h2>
                <p className="mt-1 text-xs text-[#B88989]">
                  {requestLoad.equipment} · {formatMoney(requestLoad.totalPay)} · ${requestLoad.ratePerMile.toFixed(2)}/mi
                </p>
              </div>
              <button
                type="button"
                onClick={closeRequest}
                aria-label="Close request load dialog"
                className="rounded-md p-1 text-[#B88989] transition hover:bg-white/10 hover:text-[#F5E8E8]"
              >
                <X size={18} />
              </button>
            </div>

            {submitState === 'success' ? (
              <div className="px-5 py-6 text-sm text-[#F5E8E8]/80">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#36D399]/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                  <CheckCircle2 size={14} /> Request received
                </div>
                <p>
                  Dispatch has the request for <span className="font-semibold text-[#F5E8E8]">{requestLoad.id}</span>{' '}
                  and will respond with a written rate confirmation if the required carrier documents are on file.
                  Approved carriers can also track this in the carrier portal.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => navigate('/carrier-portal')}
                    className="inline-flex items-center gap-2 rounded-lg bg-infamous-orange px-4 py-2 text-sm font-bold text-[#F5E8E8] hover:bg-infamous-orange-light"
                  >
                    Open carrier portal <ArrowRight size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={closeRequest}
                    className="rounded-lg border border-white/10 bg-transparent px-4 py-2 text-sm font-semibold text-[#F5E8E8]/80 hover:border-white/30 hover:text-[#F5E8E8]"
                  >
                    Back to board
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={submitRequest} className="px-5 py-4">
                <p className="mb-4 text-xs text-[#B88989]">
                  Send your authority and contact info. Dispatch reviews carrier documents before
                  issuing a rate confirmation — this does not commit you to the load.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#B88989]">Carrier name</span>
                    <input
                      type="text"
                      required
                      value={carrierName}
                      onChange={(event) => setCarrierName(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-infamous-panel px-3 py-2 text-sm text-[#F5E8E8] placeholder:text-[#B88989]/70 focus:border-infamous-orange focus:outline-none"
                      placeholder="Acme Trucking LLC"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#B88989]">MC number</span>
                    <input
                      type="text"
                      required
                      value={mcNumber}
                      onChange={(event) => setMcNumber(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-infamous-panel px-3 py-2 text-sm text-[#F5E8E8] placeholder:text-[#B88989]/70 focus:border-infamous-orange focus:outline-none"
                      placeholder="MC-123456"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#B88989]">Contact email</span>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(event) => setContactEmail(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-infamous-panel px-3 py-2 text-sm text-[#F5E8E8] placeholder:text-[#B88989]/70 focus:border-infamous-orange focus:outline-none"
                      placeholder="dispatch@yourcompany.com"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#B88989]">Contact phone</span>
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(event) => setContactPhone(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-infamous-panel px-3 py-2 text-sm text-[#F5E8E8] placeholder:text-[#B88989]/70 focus:border-infamous-orange focus:outline-none"
                      placeholder="555-555-0100"
                    />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#B88989]">
                      Counter-offer (optional)
                    </span>
                    <div className="relative mt-1">
                      <DollarSign size={14} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B88989]/70" />
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={askingRate}
                        onChange={(event) => setAskingRate(event.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-infamous-panel py-2 pl-8 pr-3 text-sm text-[#F5E8E8] placeholder:text-[#B88989]/70 focus:border-infamous-orange focus:outline-none"
                        placeholder={`Posted ${formatMoney(requestLoad.totalPay)} — leave blank to accept`}
                      />
                    </div>
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#B88989]">Notes for dispatch</span>
                    <textarea
                      rows={3}
                      value={requestNotes}
                      onChange={(event) => setRequestNotes(event.target.value)}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-infamous-panel px-3 py-2 text-sm text-[#F5E8E8] placeholder:text-[#B88989]/70 focus:border-infamous-orange focus:outline-none"
                      placeholder="Driver, equipment notes, ETA constraints, accessorials…"
                    />
                  </label>
                </div>

                {submitState === 'error' && submitError ? (
                  <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                    {submitError}
                  </p>
                ) : null}

                <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeRequest}
                    disabled={submitState === 'submitting'}
                    className="rounded-lg border border-white/10 bg-transparent px-4 py-2 text-sm font-semibold text-[#F5E8E8]/80 transition hover:border-white/30 hover:text-[#F5E8E8] disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitState === 'submitting'}
                    className="inline-flex items-center gap-2 rounded-lg bg-infamous-orange px-4 py-2 text-sm font-bold text-[#F5E8E8] transition hover:bg-infamous-orange-light disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitState === 'submitting' ? 'Sending…' : 'Send request'}
                    {submitState === 'submitting' ? null : <ArrowRight size={14} />}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </main>
  );
};

export default PublicLoadBoardPage;
