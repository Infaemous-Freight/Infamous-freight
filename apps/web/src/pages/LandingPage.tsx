import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ChevronDown,
  CheckCircle2,
  FileText,
  Mail,
  MapPin,
  Package,
  Phone,
  Search,
  Shield,
  Truck,
  Users,
  Zap,
  Clock,
  DollarSign,
  BarChart3,
  Eye,
  Infinity,
  Monitor,
  Cpu,
  Globe,
  Menu,
  X,
  Bell,
  MessageSquare,
  Home,
  Box,
  Navigation,
  UploadCloud,
  UserRound,
  AlertTriangle,
  Settings,
} from 'lucide-react';
import { trackPublicEvent, trackFunnelEvent } from '@/lib/analytics';
import { BRAND } from '@/lib/brand';

const navLinks = [
  { label: 'Services', href: '/services' },
  { label: 'Request Quote', href: '/request-quote' },
  { label: 'Track Shipment', href: '/track-shipment' },
  { label: 'Carriers', href: '/carrier-portal' },
  { label: 'About', href: '/about' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Contact', href: '/contact' },
] as const;

const executionSteps = [
  { number: '01', title: 'Get a Quote', description: 'Submit freight details, pickup and delivery info. Get a rate back fast.', icon: FileText },
  { number: '02', title: 'Book the Shipment', description: 'Confirm equipment, rate, and timing. Your load is locked in.', icon: Package },
  { number: '03', title: 'Track in Real Time', description: 'Follow every status update from pickup through delivery.', icon: Eye },
  { number: '04', title: 'Get Proof & Invoice', description: 'POD captured, invoice generated, payment processed. Done.', icon: CheckCircle2 },
];

const trustCards = [
  {
    icon: Shield,
    title: 'Documented Handoffs',
    description: 'Carrier documents are reviewed before dispatch and the shipment details are checked before booking.',
  },
  {
    icon: MapPin,
    title: 'Shipment Updates',
    description: 'Status updates, ETA changes, and exception notes are kept connected to the shipment record where available.',
  },
  {
    icon: Clock,
    title: 'Fast Execution',
    description: 'Quote requests are routed around lane, equipment, timing, and contact details so dispatch can respond with the right next step.',
  },
  {
    icon: DollarSign,
    title: 'Transparent Pricing',
    description: 'Rate details and payment terms are confirmed in writing before the shipment is booked.',
  },
  {
    icon: FileText,
    title: 'Proof of Delivery',
    description: 'Bills of lading, delivery notes, photos, and proof documents can stay attached to the shipment workflow.',
  },
  {
    icon: BarChart3,
    title: 'Operations Visibility',
    description: 'Quote, load, tracking, and document context stays organized so teams can see what needs follow-up.',
  },
];

const shipperBenefits = [
  'Book shipments in minutes',
  'Track loads in real time',
  'Manage quotes and invoices',
  'Download proof of delivery',
  'Message support directly',
  'Rebook frequent lanes',
];

const carrierBenefits = [
  'Browse available loads',
  'One-tap status updates',
  'Upload POD from your phone',
  'Payment terms confirmed in writing',
  'Simple dispatch communication',
  'GPS tracking built in',
];

const techFeatures = [
  {
    icon: Monitor,
    title: 'Command Center Dashboard',
    description: 'Real-time operations overview with KPIs, live shipment map, active loads, alerts, and dispatch controls.',
  },
  {
    icon: Cpu,
    title: 'Automated Workflows',
    description: 'Quote intake, carrier assignment, status updates, POD collection, and invoicing — connected in one system.',
  },
  {
    icon: Globe,
    title: 'Multi-Role Access',
    description: 'Separate interfaces for shippers, carriers, drivers, dispatchers, and admins — each sees only what they need.',
  },
  {
    icon: Zap,
    title: 'Mobile-First Driver App',
    description: 'Accept loads, navigate, update status, upload POD, and message dispatch — all from a phone.',
  },
];

const servicesList = [
  { title: 'Full Truckload', slug: 'full-truckload', description: 'Dedicated truck capacity for larger shipments.' },
  { title: 'Less Than Truckload', slug: 'ltl-freight', description: 'Share truck space for cost-effective smaller loads.' },
  { title: 'Flatbed', slug: 'flatbed', description: 'Open-deck trailers for oversized and heavy freight.' },
  { title: 'Reefer', slug: 'reefer', description: 'Temperature-controlled freight for perishable and sensitive goods.' },
  { title: 'Expedited Freight', slug: 'expedited', description: 'Time-critical shipments with priority handling.' },
  { title: 'Dedicated Lanes', slug: 'dedicated-lanes', description: 'Recurring routes with locked-in pricing and carriers.' },
  { title: 'Freight Brokerage', slug: 'freight-brokerage', description: 'Brokerage support for matching shipment details with carrier capacity.' },
  { title: 'Final Mile', slug: 'final-mile', description: 'Last-leg delivery from distribution center to end customer.' },
  { title: 'Amazon Delivery', slug: 'amazon-delivery', description: 'MCF and shipping workflow planning for eligible e-commerce orders.' },
];

const faqItems = [
  {
    question: 'How do I get a freight quote?',
    answer: 'Submit your shipment details on the Request a Quote page — pickup location, destination, freight type, timing, and contact information. Dispatch reviews the request and follows up with the next step.',
  },
  {
    question: 'What types of freight do you handle?',
    answer: 'Full truckload, LTL, flatbed, reefer, expedited, local, and regional freight. We handle everything from cargo vans to full tractor-trailers.',
  },
  {
    question: 'How does shipment tracking work?',
    answer: 'Every load gets a live tracking timeline from pickup to delivery. Enter your tracking number on the Track Shipment page for instant visibility — no login required.',
  },
  {
    question: 'How do carriers get paid?',
    answer: 'Carrier payment terms are confirmed in writing before dispatch. Carriers should review the written rate confirmation and payment terms for each load.',
  },
  {
    question: 'What is the carrier vetting process?',
    answer: 'Carrier documents and shipment requirements are reviewed before dispatch, and the agreed equipment, timing, and communication expectations are documented for the load.',
  },
  {
    question: 'Do you offer same-day freight?',
    answer: 'Expedited options can be requested for time-sensitive freight. Availability depends on lane, timing, equipment, and carrier capacity.',
  },
];

const FaqItem: React.FC<{ id: string; question: string; answer: string }> = ({ id, question, answer }) => {
  const [open, setOpen] = useState(false);
  const panelId = `${id}-panel`;
  return (
    <div className="border-b border-infamous-border/60 last:border-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
        aria-expanded={open}
        aria-controls={panelId}
      >
        <span className="text-base font-semibold text-[#F5E8E8]">{question}</span>
        <ChevronDown
          aria-hidden="true"
          size={18}
          className={`shrink-0 text-infamous-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div id={panelId} aria-hidden={!open} className={`overflow-hidden transition-all duration-200 ${open ? 'max-h-60 pb-5' : 'max-h-0'}`}>
        <p className="text-sm leading-7 text-[#B88989]">{answer}</p>
      </div>
    </div>
  );
};

const workflowHighlights = [
  { label: 'Quote Intake', value: 'Lane + contact first', color: 'text-infamous-red-light' },
  { label: 'Booking', value: 'Details reviewed', color: 'text-[#36D399]' },
  { label: 'Dispatch', value: 'Documents reviewed', color: 'text-infamous-ember' },
  { label: 'Delivery', value: 'Updates documented', color: 'text-infamous-orange' },
];

const heroProofPoints = [
  'Freight quote intake',
  'Shipment tracking context',
  'Carrier and driver coordination',
  'Proof-of-delivery workflows',
];

const urgentQuoteFields = [
  'Pickup and delivery city',
  'Equipment or freight type',
  'Weight, dimensions, and timing',
  'Best contact for dispatch follow-up',
];

const laneSignals = [
  ['FTL / LTL', 'Dry van, reefer, flatbed, box truck, cargo van'],
  ['Timing', 'Standard, same-day, expedited, recurring lanes'],
  ['Visibility', 'Status context, documents, delivery notes'],
];

const commandStats = [
  { label: 'Quote Intake', value: '4', delta: 'sample queue', icon: Package },
  { label: 'In Transit', value: '3', delta: 'sample loads', icon: Truck },
  { label: 'Delivered', value: '2', delta: 'sample PODs', icon: CheckCircle2 },
  { label: 'Exception Review', value: '1', delta: 'needs follow-up', icon: Clock },
  { label: 'Billing Review', value: '2', delta: 'sample invoices', icon: DollarSign },
];

const commandLoads = [
  ['IF-77291', 'SteelWorks Co.', 'Los Angeles, CA', 'Chicago, IL', '53 Dry Van', 'RoadKing_88', 'In Transit'],
  ['IF-77292', 'Summit Retail', 'Dallas, TX', 'Atlanta, GA', '53 Reefer', 'NightHawk_21', 'Out for Delivery'],
  ['IF-77293', 'Global Industrial', 'Houston, TX', 'Denver, CO', 'Flatbed', 'IronWolf_47', 'Picked Up'],
  ['IF-77294', 'Precision Auto', 'Detroit, MI', 'Phoenix, AZ', '53 Dry Van', 'Ghost_33', 'Pending'],
];

const deliveryEvents = [
  ['Picked Up', 'Los Angeles, CA', 'May 18', '08:15 AM'],
  ['In Transit', 'Barstow, CA', 'May 18', '11:47 AM'],
  ['In Transit', 'Flagstaff, AZ', 'May 18', '04:23 PM'],
  ['Out for Delivery', 'Joliet, IL', 'May 19', '06:33 AM'],
  ['Delivered', 'Chicago, IL', 'May 19', '09:12 AM'],
];

const LandingPage: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    trackFunnelEvent('funnel_landing_visit', { referrer: document.referrer || 'direct' });
  }, []);

  return (
    <main id="main-content" className="min-h-screen overflow-hidden bg-infamous-dark text-[#F5E8E8]">
      <a
        href="#hero-section"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-infamous-red focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-[#F5E8E8] focus:shadow-lg"
      >
        Skip to main content
      </a>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-infamous-border bg-infamous-darker/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 lg:px-6">
          <Link to="/" className="flex items-center gap-3" aria-label="Infamous Freight home">
            <Infinity aria-hidden="true" size={28} className="text-infamous-red-light" strokeWidth={2.5} style={{ filter: 'drop-shadow(0 0 8px rgba(255, 59, 48, 0.8))' }} />
            <span className="hidden sm:block">
              <span className="block font-display text-lg font-black leading-none text-[#F5E8E8]">{BRAND.displayName}</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-infamous-muted">{BRAND.tagline}</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-[#B88989] transition hover:bg-white/5 hover:text-[#F5E8E8]"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              onClick={() => trackPublicEvent('login_cta_click', { source: 'header' })}
              className="hidden sm:inline-flex rounded-lg px-4 py-2 text-sm font-semibold text-[#B88989] transition hover:text-[#F5E8E8]"
            >
              Login
            </Link>
            <Link
              to="/request-quote"
              onClick={() => trackPublicEvent('quote_cta_click', { source: 'header' })}
              className="btn-primary text-sm glow-high"
            >
              Get a Quote
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-[#B88989] hover:text-[#F5E8E8] hover:bg-white/5 transition"
              aria-controls="landing-mobile-navigation"
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X aria-hidden="true" size={22} /> : <Menu aria-hidden="true" size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav id="landing-mobile-navigation" className="lg:hidden border-t border-infamous-border bg-infamous-darker px-5 py-4 space-y-1" aria-label="Mobile navigation">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-[#B88989] transition hover:bg-white/5 hover:text-[#F5E8E8]"
              >
                {item.label}
              </Link>
            ))}
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-[#B88989] transition hover:text-[#F5E8E8]"
            >
              Login
            </Link>
          </nav>
        )}
      </header>

      {/* === HERO === */}
      <section id="hero-section" className="relative border-b border-infamous-border bg-[#030101]">
        <div className="absolute inset-0 redline-bg opacity-70" />
        <div className="absolute inset-0 circuit-texture" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-[linear-gradient(90deg,transparent,rgba(255,26,26,0.24),transparent)] blur-2xl" />

        <div className="relative mx-auto max-w-[1720px] px-4 py-8 lg:px-6 lg:py-10">
          <div className="mx-auto mb-8 grid max-w-7xl gap-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-stretch">
            <div className="flex min-h-[520px] flex-col justify-center rounded-xl border border-infamous-red-light/25 bg-[#090303]/82 p-6 shadow-[0_0_32px_rgba(255,26,26,0.18)] sm:p-8 lg:p-10">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-infamous-red-light">{BRAND.displayName}</p>
              <h1 className="mt-4 max-w-4xl font-display text-4xl font-black uppercase leading-tight text-[#F5E8E8] text-glow-strong sm:text-5xl lg:text-6xl">
                Freight quotes, dispatch coordination, and shipment tracking without the runaround.
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-8 text-[#D3B3B3] sm:text-lg">
                Send the lane, equipment, freight details, timing, and contact information. Dispatch can review the request, confirm next steps in writing, and keep shipment context organized through delivery.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link to="/request-quote" onClick={() => trackPublicEvent('quote_cta_click', { source: 'hero_primary' })} className="btn-primary btn-lg inline-flex items-center justify-center gap-2 glow-high">Request a Freight Quote <ArrowRight size={20} /></Link>
                <Link to="/contact" onClick={() => trackPublicEvent('contact_cta_click', { source: 'hero_primary' })} className="btn-secondary btn-lg inline-flex items-center justify-center gap-2"><Phone size={20} /> Talk to Dispatch</Link>
              </div>
              <div className="mt-7 flex flex-wrap gap-2" aria-label="Freight workflow highlights">
                {heroProofPoints.map((point) => (
                  <span key={point} className="rounded-full border border-infamous-red-light/25 bg-infamous-red/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-[#F5E8E8]/90">
                    {point}
                  </span>
                ))}
              </div>
              <div className="mt-8 grid gap-3 md:grid-cols-3">
                {laneSignals.map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-infamous-red-light/18 bg-black/30 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-infamous-red-light">{label}</p>
                    <p className="mt-2 text-sm leading-6 text-[#B88989]">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <aside className="rounded-xl border border-infamous-red-light/30 bg-[#100405]/95 p-5 shadow-[0_0_28px_rgba(255,26,26,0.18)] sm:p-6" aria-labelledby="quick-quote-heading">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-infamous-red-light">Fast Intake</p>
                  <h2 id="quick-quote-heading" className="mt-2 font-display text-2xl font-black uppercase text-[#F5E8E8]">Start with the details dispatch needs.</h2>
                </div>
                <FileText aria-hidden="true" className="shrink-0 text-infamous-red-light" size={28} />
              </div>
              <div className="mt-6 space-y-3">
                {urgentQuoteFields.map((field) => (
                  <div key={field} className="flex items-center gap-3 rounded-lg border border-infamous-red-light/16 bg-black/28 px-4 py-3">
                    <CheckCircle2 aria-hidden="true" className="shrink-0 text-[#36D399]" size={17} />
                    <span className="text-sm font-semibold text-[#F5E8E8]/88">{field}</span>
                  </div>
                ))}
              </div>
              <Link to="/request-quote" onClick={() => trackPublicEvent('quote_cta_click', { source: 'hero_intake_card' })} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-infamous-red px-5 py-3 text-sm font-bold text-[#F5E8E8] transition hover:bg-infamous-red-light">
                Open Quote Form <ArrowRight aria-hidden="true" size={16} />
              </Link>
              <div className="mt-5 rounded-lg border border-infamous-border/70 bg-black/25 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B88989]">Need status on an active load?</p>
                <Link to="/track-shipment" onClick={() => trackPublicEvent('tracking_cta_click', { source: 'hero_intake_card' })} className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-infamous-red-light hover:underline">
                  Track shipment <Search aria-hidden="true" size={15} />
                </Link>
              </div>
            </aside>
          </div>

          <div className="grid gap-7 xl:grid-cols-[minmax(0,1.35fr)_520px]">
            <div className="overflow-hidden rounded-[12px] border border-infamous-red-light/45 bg-[#090303]/90 shadow-[0_0_42px_rgba(255,26,26,0.22)]">
              <div className="grid min-h-[680px] lg:grid-cols-[220px_minmax(0,1fr)]">
                <aside className="hidden border-r border-infamous-red-light/25 bg-[#0c0304]/95 p-6 lg:block">
                  <Link to="/" className="mb-8 flex flex-col items-center gap-3 text-center" aria-label="Infamous Freight home">
                    <Infinity size={56} className="text-infamous-red-light text-glow-strong" strokeWidth={2.4} />
                    <span className="font-display text-2xl font-black uppercase tracking-[0.08em] text-infamous-red-light text-glow">Infamous</span>
                    <span className="-mt-3 text-xs uppercase tracking-[0.55em] text-[#F5E8E8]">Freight</span>
                  </Link>
                  <nav className="space-y-1.5" aria-label="Command center preview">
                    {([
                      ['Dashboard', BarChart3],
                      ['Shipments', Box],
                      ['Loads', Home],
                      ['Dispatch', Navigation],
                      ['Drivers', UserRound],
                      ['Billing', DollarSign],
                      ['Alerts', Bell],
                      ['Settings', Settings],
                    ] as const).map(([label, Icon], index) => (
                      <Link
                        key={String(label)}
                        to={index === 0 ? '/ops' : index === 1 ? '/track-shipment' : '/request-quote'}
                        className={`flex items-center gap-3 rounded-md border px-4 py-3 text-sm font-semibold transition ${
                          index === 0
                            ? 'border-infamous-red-light/55 bg-infamous-red/18 text-[#F5E8E8] shadow-[0_0_20px_rgba(255,26,26,0.28)]'
                            : 'border-transparent text-[#B88989] hover:border-infamous-red-light/20 hover:bg-white/5 hover:text-[#F5E8E8]'
                        }`}
                      >
                        <Icon aria-hidden="true" size={17} className="text-infamous-red-light" />
                        {String(label)}
                      </Link>
                    ))}
                  </nav>
                  <div className="mt-12 rounded-lg border border-infamous-red-light/20 bg-black/35 p-5 text-center">
                    <Infinity size={42} className="mx-auto text-infamous-red-light" />
                    <p className="mt-3 font-display text-xl font-black uppercase tracking-[0.12em] text-infamous-red-light">Infamous</p>
                    <p className="text-xs uppercase tracking-[0.34em] text-[#F5E8E8]">Freight</p>
                    <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.22em] text-infamous-red-light">{BRAND.tagline}</p>
                  </div>
                </aside>

                <div className="min-w-0 p-5 lg:p-6">
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-infamous-red-light/20 pb-5">
                    <div className="flex items-center gap-4">
                      <Menu className="text-[#F5E8E8]" size={22} />
                      <div>
                        <p className="font-display text-lg font-black uppercase text-infamous-red-light">Command Center</p>
                        <p className="text-xs text-[#B88989]">Sample freight workflow preview</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-[#F5E8E8]">
                      <Search size={20} />
                      <MessageSquare size={20} />
                      <span className="relative"><Bell size={20} /><span className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-infamous-red text-[10px] font-black">3</span></span>
                      <Link to="/login" className="hidden items-center gap-3 border-l border-infamous-red-light/20 pl-4 sm:flex">
                        <span className="grid h-10 w-10 place-items-center rounded-full border border-infamous-red-light/70 bg-black text-infamous-red-light"><UserRound size={18} /></span>
                        <span>
                          <span className="block text-sm font-bold">Disruptor_77</span>
                          <span className="block text-xs text-[#B88989]">Admin</span>
                        </span>
                      </Link>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                    {commandStats.map((stat) => (
                      <div key={stat.label} className="rounded-lg border border-infamous-red-light/25 bg-[#130607]/80 p-4 shadow-[inset_0_0_24px_rgba(255,26,26,0.05)]">
                        <stat.icon size={24} className="mb-3 text-infamous-red-light" />
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#B88989]">{stat.label}</p>
                        <p className="mt-1 font-display text-3xl font-black text-[#F5E8E8]">{stat.value}</p>
                        <p className="mt-1 text-xs text-[#36D399]">{stat.delta}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_270px]">
                    <div className="rounded-lg border border-infamous-red-light/25 bg-black/50 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <h2 className="font-display text-sm font-black uppercase tracking-[0.12em]">Shipment Tracking <span className="ml-2 text-[10px] text-infamous-red-light">Sample</span></h2>
                        <Link to="/track-shipment" className="rounded border border-infamous-red-light/50 px-3 py-1.5 text-[10px] font-black uppercase text-infamous-red-light">View all shipments</Link>
                      </div>
                      <div className="relative h-[285px] overflow-hidden rounded-md border border-infamous-red-light/10 bg-[#080304]">
                        <div className="absolute inset-0 freight-grid opacity-70" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_62%,rgba(255,59,48,0.8)_0_4px,transparent_5px),radial-gradient(circle_at_56%_48%,rgba(255,59,48,0.8)_0_4px,transparent_5px),radial-gradient(circle_at_88%_35%,rgba(255,59,48,0.9)_0_4px,transparent_5px)]" />
                        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 760 285" aria-hidden="true">
                          <path d="M90 182 C170 150 250 157 330 132 S480 156 560 94 S652 101 706 72" fill="none" stroke="#ff3b30" strokeWidth="4" filter="url(#glowLine)" />
                          <path d="M90 182 C170 150 250 157 330 132 S480 156 560 94 S652 101 706 72" fill="none" stroke="#ffd5d0" strokeWidth="1.3" />
                          <defs><filter id="glowLine"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
                        </svg>
                        <span className="absolute left-[13%] top-[62%] rounded border border-infamous-red-light/40 bg-black px-2 py-1 text-[10px] font-black uppercase">Los Angeles, CA</span>
                        <span className="absolute right-[8%] top-[30%] rounded border border-infamous-red-light/40 bg-black px-2 py-1 text-[10px] font-black uppercase">Chicago, IL</span>
                        <Truck className="absolute left-[43%] top-[45%] text-infamous-red-light" size={26} />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-lg border border-infamous-red-light/25 bg-[#130607]/80 p-4">
                        <h2 className="mb-4 font-display text-sm font-black uppercase">Delivery Status</h2>
                        <div className="space-y-4">
                          {deliveryEvents.map(([status, place, date, time], index) => (
                            <div key={`${status}-${place}`} className="grid grid-cols-[22px_minmax(0,1fr)_58px] gap-2 text-xs">
                              <span className={`mt-1 h-4 w-4 rounded-full border ${index === 4 ? 'border-[#3A0D12]' : 'border-infamous-red-light bg-infamous-red/40'}`} />
                              <span><strong className="block uppercase text-[#F5E8E8]">{status}</strong><span className="text-[#B88989]">{place}</span></span>
                              <span className="text-right text-[#B88989]">{date}<br />{time}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="rounded-lg border border-infamous-red-light/25 bg-[#130607]/80 p-4">
                        <div className="mb-3 flex items-center justify-between"><h2 className="font-display text-sm font-black uppercase">Alerts</h2><span className="text-[10px] font-black uppercase text-infamous-red-light">View all</span></div>
                        {['Delay risk', 'Driver alert', 'Maintenance'].map((item, index) => (
                          <div key={item} className="flex gap-3 border-t border-infamous-red-light/10 py-3 first:border-0">
                            <AlertTriangle className={index === 1 ? 'text-infamous-orange' : 'text-infamous-red-light'} size={20} />
                            <p className="text-xs"><strong className="block uppercase text-infamous-red-light">{item}</strong><span className="text-[#B88989]">Load IF-77291 requires dispatch review.</span></p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 overflow-hidden rounded-lg border border-infamous-red-light/25 bg-[#100405]/85">
                    <div className="border-b border-infamous-red-light/15 px-4 py-3 font-display text-sm font-black uppercase">Active Loads</div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[760px] text-left text-xs">
                        <thead className="text-infamous-red-light">
                          <tr>{['Load #', 'Customer', 'Origin', 'Destination', 'Equipment', 'Driver', 'Status'].map((head) => <th key={head} className="px-4 py-3 uppercase">{head}</th>)}</tr>
                        </thead>
                        <tbody>
                          {commandLoads.map((load) => (
                            <tr key={load[0]} className="border-t border-infamous-red-light/10 text-[#B88989]">
                              {load.map((cell, index) => <td key={`${load[0]}-${cell}`} className="px-4 py-3"><span className={index === 6 ? 'rounded border border-infamous-red-light/40 px-2 py-1 text-[10px] uppercase text-infamous-red-light' : ''}>{cell}</span></td>)}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-2 xl:items-center">
              {[0, 1].map((phone) => (
                <div key={phone} className="mx-auto w-full max-w-[250px] rounded-[36px] border border-infamous-red-light/55 bg-[#050202] p-3 shadow-[0_0_34px_rgba(255,26,26,0.35)]">
                  <div className="min-h-[560px] rounded-[28px] border border-infamous-red-light/20 bg-[#100405] p-4">
                    <div className="mb-6 flex items-center justify-between text-xs text-[#F5E8E8]"><span>9:41</span><span>LTE</span></div>
                    {phone === 0 ? (
                      <>
                        <div className="mb-4 flex items-center justify-between"><ArrowRight className="rotate-180 text-infamous-red-light" size={18} /><p className="text-center text-sm font-bold">Load Details<br /><span className="text-[10px] uppercase text-infamous-red-light">Load #IF-77291</span></p><Navigation size={16} /></div>
                        <div className="rounded-lg border border-infamous-red-light/25 bg-black/40 p-4"><p className="font-display text-xl font-black uppercase text-infamous-red-light">In Transit <span className="float-right text-[#F5E8E8]">96%</span></p><p className="mt-2 text-xs text-[#B88989]">Los Angeles, CA → Chicago, IL</p></div>
                        <div className="mt-3 rounded-lg border border-infamous-red-light/25 bg-black/40 p-4"><p className="text-[10px] uppercase text-[#B88989]">Estimated delivery</p><p className="mt-1 font-display text-xl font-black uppercase text-infamous-red-light">May 19, 2025</p><p className="text-xs text-[#B88989]">09:30 AM CDT</p></div>
                        <div className="my-3 h-28 rounded-lg border border-infamous-red-light/15 bg-black/50"><svg viewBox="0 0 220 112" className="h-full w-full"><path d="M18 76 C54 42 88 70 116 49 S168 60 204 28" stroke="#ff3b30" strokeWidth="4" fill="none" /><path d="M18 76 C54 42 88 70 116 49 S168 60 204 28" stroke="#ffd5d0" strokeWidth="1" fill="none" /></svg></div>
                        <div className="space-y-3">{deliveryEvents.slice(0, 4).map(([status, place, date]) => <p key={`${phone}-${status}-${place}`} className="grid grid-cols-[18px_1fr_46px] gap-2 text-[10px]"><span className="h-3 w-3 rounded-full bg-infamous-red-light" /><span><strong className="block uppercase text-[#F5E8E8]">{status}</strong><span className="text-[#B88989]">{place}</span></span><span className="text-right text-[#B88989]">{date}</span></p>)}</div>
                      </>
                    ) : (
                      <>
                        <div className="mb-5 flex items-center justify-between"><div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-full border border-infamous-red-light/50"><UserRound size={16} /></span><p className="text-xs text-[#B88989]">Welcome back,<br /><strong className="text-[#F5E8E8]">RoadKing_88</strong></p></div><Bell size={15} /></div>
                        <div className="rounded-lg border border-infamous-red-light/25 bg-black/40 p-4"><p className="text-[10px] uppercase text-[#B88989]">Sample Load</p><p className="mt-1 font-display text-2xl font-black">IF-77291 <span className="float-right rounded border border-infamous-red-light/40 px-2 py-1 text-[9px] text-infamous-red-light">In Transit</span></p><p className="mt-3 text-xs text-[#B88989]">Los Angeles, CA → Chicago, IL</p><p className="mt-2 text-xs text-[#B88989]">53 Dry Van <span className="float-right">42,500 lbs</span></p></div>
                        {([
                          ['Accept Load', CheckCircle2],
                          ['Arrived at Pickup', MapPin],
                          ['Mark Delivered', Box],
                          ['Upload POD', UploadCloud],
                        ] as const).map(([label, Icon]) => (
                          <Link key={String(label)} to="/driver-app" className="mt-4 flex items-center justify-center gap-3 rounded-lg border border-infamous-red-light/45 bg-infamous-red/15 px-4 py-4 font-display text-sm font-black uppercase text-[#F5E8E8] shadow-[0_0_18px_rgba(255,26,26,0.2)]">
                            <Icon size={22} className="text-infamous-red-light" /> {String(label)}
                          </Link>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-7 flex flex-col items-center justify-between gap-5 border-t border-infamous-red-light/20 pt-7 text-center lg:flex-row lg:text-left">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-infamous-red-light">{BRAND.displayName}</p>
              <h2 className="mt-3 max-w-4xl font-display text-3xl font-black uppercase leading-tight text-[#F5E8E8] text-glow-strong sm:text-5xl">
                Operations tools for quote intake, dispatch coordination, and shipment tracking.
              </h2>
              <p className="mt-4 max-w-3xl text-base leading-7 text-[#B88989]">
                Share the lane, equipment, freight details, timing, and contact information. Dispatch can review the request, confirm the next step in writing, and keep shipment context organized through delivery.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2 lg:justify-start" aria-label="Freight workflow highlights">
                {heroProofPoints.map((point) => (
                  <span key={point} className="rounded-full border border-infamous-red-light/25 bg-infamous-red/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em] text-[#F5E8E8]/90">
                    {point}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/request-quote" onClick={() => trackPublicEvent('quote_cta_click', { source: 'hero_command_center' })} className="btn-primary btn-lg inline-flex items-center justify-center gap-2 glow-high">Get a Freight Quote <ArrowRight size={20} /></Link>
              <Link to="/track-shipment" onClick={() => trackPublicEvent('tracking_cta_click', { source: 'hero_command_center' })} className="btn-secondary btn-lg inline-flex items-center justify-center gap-2"><Search size={20} /> Track Shipment</Link>
            </div>
          </div>
        </div>
      </section>

      {/* === SERVICES OVERVIEW === */}
      <section className="border-b border-infamous-border bg-infamous-darker">
        <div className="mx-auto max-w-7xl px-5 py-24 lg:px-6">
          <div className="mb-14 max-w-2xl">
            <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-infamous-red-light">Our Services</p>
            <h2 className="mt-3 font-display text-3xl font-black uppercase lg:text-4xl">
              Freight services for every load size and timeline
            </h2>
            <p className="mt-4 text-[#B88989] leading-7">
              From expedited cargo vans to full truckload, every service starts with clear shipment details, written expectations, and dispatch follow-up.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {servicesList.map((service) => (
              <Link
                key={service.slug}
                to={`/services/${service.slug}`}
                className="group glass-card-subtle rounded-[18px] p-6 transition hover:border-infamous-red/30 hover:shadow-[0_0_18px_rgba(255,26,26,0.12)]"
              >
                <h3 className="text-lg font-bold text-[#F5E8E8] group-hover:text-infamous-red-light transition">{service.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#B88989]">{service.description}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-infamous-red-light opacity-0 group-hover:opacity-100 transition">
                  Learn more <ArrowRight size={14} />
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              to="/services"
              className="inline-flex items-center gap-2 text-sm font-semibold text-infamous-red-light hover:underline"
            >
              View all services <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* === HOW IT WORKS === */}
      <section className="border-b border-infamous-border">
        <div className="mx-auto max-w-7xl px-5 py-24 lg:px-6">
          <div className="mb-14 text-center">
            <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-infamous-red-light">How It Works</p>
            <h2 className="mt-3 font-display text-3xl font-black uppercase lg:text-4xl">Quote. Book. Track. Deliver.</h2>
            <p className="mt-4 mx-auto max-w-2xl text-[#B88989]">
              A practical freight workflow from first request to delivery documents.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {executionSteps.map((step) => (
              <div key={step.number} className="relative glass-card-subtle rounded-[18px] p-6">
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-infamous-red/10 text-sm font-black text-infamous-red-light border border-infamous-red/20">
                    {step.number}
                  </span>
                  <step.icon size={20} className="text-infamous-muted" />
                </div>
                <h3 className="text-lg font-bold text-[#F5E8E8]">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#B88989]">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === LIVE TRACKING PREVIEW === */}
      <section className="border-b border-infamous-border bg-infamous-darker">
        <div className="mx-auto max-w-7xl px-5 py-24 lg:px-6">
          <div className="mb-14 text-center">
            <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-infamous-red-light">Shipment Visibility</p>
            <h2 className="mt-3 font-display text-3xl font-black uppercase lg:text-4xl">Keep freight details connected.</h2>
            <p className="mt-4 mx-auto max-w-2xl text-[#B88989]">
              Lane details, status updates, exceptions, and delivery documents stay organized around the shipment.
            </p>
          </div>

          <div className="glass-card rounded-[18px] overflow-hidden">
            <div className="border-b border-infamous-border bg-infamous-panel/50 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-infamous-red/60" />
                <div className="w-3 h-3 rounded-full bg-infamous-orange/60" />
                <div className="w-3 h-3 rounded-full bg-[#36D399]/60" />
                <span className="ml-4 text-xs text-infamous-muted font-mono">Operations Dashboard</span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs text-infamous-red-light">
                <span className="w-1.5 h-1.5 rounded-full bg-infamous-red-light animate-pulse" /> Live
              </span>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[
                  { label: 'Lane details', value: 'Ready', color: 'text-infamous-red-light' },
                  { label: 'Pickup timing', value: 'Confirmed', color: 'text-infamous-orange' },
                  { label: 'Documents', value: 'Attached', color: 'text-[#36D399]' },
                  { label: 'Exceptions', value: 'Flagged', color: 'text-[#FF0033]' },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-[14px] border border-infamous-border/60 bg-infamous-panel p-4">
                    <p className="text-xs text-infamous-muted">{stat.label}</p>
                    <p className={`mt-2 text-2xl font-black font-display ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-2.5">
                {[
                  { ref: 'IF-20491', lane: 'Chicago, IL → Dallas, TX', status: 'In Transit', statusClass: 'badge-blue', eta: 'ETA 6:30 PM' },
                  { ref: 'IF-20492', lane: 'Atlanta, GA → Charlotte, NC', status: 'At Pickup', statusClass: 'badge-green', eta: 'ETA 4:00 PM' },
                  { ref: 'IF-20493', lane: 'Houston, TX → Phoenix, AZ', status: 'Delayed', statusClass: 'badge-orange', eta: 'ETA TBD' },
                  { ref: 'IF-20494', lane: 'Los Angeles, CA → Seattle, WA', status: 'Delivered', statusClass: 'badge-green', eta: 'Complete' },
                ].map((load) => (
                  <div key={load.ref} className="flex items-center justify-between rounded-[14px] border border-infamous-border/50 bg-infamous-dark/50 px-4 py-3.5">
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-xs text-infamous-muted">{load.ref}</span>
                      <span className="text-[15px] font-medium text-[#F5E8E8]">{load.lane}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-infamous-muted hidden sm:inline">{load.eta}</span>
                      <span className={`${load.statusClass} text-xs`}>{load.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === WHY INFAMOUS FREIGHT === */}
      <section className="border-b border-infamous-border">
        <div className="mx-auto max-w-7xl px-5 py-24 lg:px-6">
          <div className="mb-14 max-w-2xl">
            <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-infamous-red-light">Why Infamous Freight</p>
            <h2 className="mt-3 font-display text-3xl font-black uppercase lg:text-4xl">
              Know where your freight is, what it costs, and who is moving it.
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {trustCards.map((card) => (
              <article key={card.title} className="group glass-card-subtle rounded-[18px] p-6 transition hover:border-infamous-red/30">
                <div className="mb-4 inline-flex rounded-lg bg-infamous-red/10 p-3 text-infamous-red-light">
                  <card.icon size={22} />
                </div>
                <h3 className="text-lg font-bold text-[#F5E8E8]">{card.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#B88989]">{card.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* === SHIPPER & CARRIER BENEFITS === */}
      <section className="border-b border-infamous-border bg-infamous-darker">
        <div className="mx-auto max-w-7xl px-5 py-24 lg:px-6">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-start">
            {/* Shipper side */}
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-infamous-red/20 bg-infamous-red/5 px-4 py-1.5 text-xs font-semibold text-infamous-red-light uppercase tracking-wider">
                <Truck size={14} /> For Shippers
              </div>
              <h3 className="mt-5 font-display text-2xl font-black uppercase">Request freight with clear details</h3>
              <p className="mt-4 text-[#B88989] leading-7">
                Start with the lane, equipment, timing, and contact details dispatch needs to respond. Add freight details when they are available.
              </p>
              <ul className="mt-8 space-y-3">
                {shipperBenefits.map((b) => (
                  <li key={b} className="flex items-center gap-3 text-[15px] text-[#F5E8E8]/80">
                    <CheckCircle2 size={16} className="shrink-0 text-[#36D399]" />
                    {b}
                  </li>
                ))}
              </ul>
              <Link
                to="/request-quote"
                onClick={() => trackPublicEvent('portal_cta_click', { portal: 'customer', source: 'shipper_section' })}
                className="mt-10 btn-primary inline-flex items-center gap-2 glow-medium"
              >
                Request Quote <ArrowRight size={16} />
              </Link>
            </div>

            {/* Carrier side */}
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#36D399]/20 bg-[#36D399]/5 px-4 py-1.5 text-xs font-semibold text-[#36D399] uppercase tracking-wider">
                <Users size={14} /> For Carriers & Drivers
              </div>
              <h3 className="mt-5 font-display text-2xl font-black uppercase">Move freight with written expectations</h3>
              <p className="mt-4 text-[#B88989] leading-7">
                Carrier and driver workflows focus on load details, communication, status updates, proof documents, and payment terms confirmed in writing.
              </p>
              <ul className="mt-8 space-y-3">
                {carrierBenefits.map((b) => (
                  <li key={b} className="flex items-center gap-3 text-[15px] text-[#F5E8E8]/80">
                    <CheckCircle2 size={16} className="shrink-0 text-[#36D399]" />
                    {b}
                  </li>
                ))}
              </ul>
              <Link
                to="/carrier-portal"
                onClick={() => trackPublicEvent('portal_cta_click', { portal: 'carrier', source: 'carrier_section' })}
                className="mt-10 inline-flex items-center gap-2 rounded-xl border border-[#36D399]/20 bg-[#36D399]/10 px-6 py-3 text-sm font-bold text-[#36D399] transition hover:bg-[#36D399]/15"
              >
                Carrier Portal <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* === TECHNOLOGY FEATURES === */}
      <section className="border-b border-infamous-border">
        <div className="mx-auto max-w-7xl px-5 py-24 lg:px-6">
          <div className="mb-14 text-center">
            <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-infamous-red-light">Technology</p>
            <h2 className="mt-3 font-display text-3xl font-black uppercase lg:text-4xl">Built for practical freight follow-through.</h2>
            <p className="mt-4 mx-auto max-w-2xl text-[#B88989]">
              Public quote intake, tracking, portals, and dispatch tools support the same operating workflow.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {techFeatures.map((feat) => (
              <div key={feat.title} className="glass-card-subtle rounded-[18px] p-7 transition hover:border-infamous-red/25">
                <div className="mb-4 inline-flex rounded-lg bg-infamous-red/10 p-3 text-infamous-red-light border border-infamous-red/15">
                  <feat.icon size={22} />
                </div>
                <h3 className="text-xl font-bold text-[#F5E8E8]">{feat.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#B88989]">{feat.description}</p>
              </div>
            ))}

          </div>
        </div>
      </section>

      {/* === TRUST PROCESS === */}
      <section className="border-b border-infamous-border bg-infamous-darker">
        <div className="mx-auto max-w-7xl px-5 py-24 lg:px-6">
          <div className="mb-14 text-center">
            <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-infamous-red-light">How Trust Is Built</p>
            <h2 className="mt-3 font-display text-3xl font-black uppercase lg:text-4xl">Clear steps before freight moves.</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              ['Quote details checked', 'Origin, destination, equipment, pickup timing, freight details, and contact information are reviewed before dispatch follow-up.'],
              ['Terms confirmed in writing', 'Rates, payment terms, pickup details, delivery expectations, and required documents are kept explicit before booking.'],
              ['Updates stay connected', 'Shipment notes, tracking references, exceptions, and delivery documents stay tied to the load record where available.'],
            ].map(([title, description]) => (
              <div key={title} className="glass-card-subtle rounded-[18px] p-6">
                <CheckCircle2 className="mb-4 text-infamous-red-light" size={22} />
                <h3 className="text-lg font-bold text-[#F5E8E8]">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#B88989]">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === FAQ === */}
      <section className="border-b border-infamous-border">
        <div className="mx-auto max-w-3xl px-5 py-24 lg:px-6">
          <div className="mb-12 text-center">
            <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-infamous-red-light">FAQ</p>
            <h2 className="mt-3 font-display text-3xl font-black uppercase">Frequently Asked Questions</h2>
          </div>

          <div className="glass-card-subtle rounded-[18px] px-6">
            {faqItems.map((faq, index) => (
              <FaqItem key={faq.question} id={`faq-${index}`} question={faq.question} answer={faq.answer} />
            ))}
          </div>

          <p className="mt-6 text-center text-sm text-infamous-muted">
            Have another question?{' '}
            <Link to="/faq" className="font-semibold text-infamous-red-light hover:underline">View all FAQs</Link>
            {' · '}
            <Link to="/contact" className="font-semibold text-infamous-red-light hover:underline">Contact dispatch</Link>
          </p>
        </div>
      </section>

      {/* === FINAL CTA === */}
      <section className="border-b border-infamous-border bg-infamous-darker">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-6">
          <div
            className="rounded-2xl border border-infamous-red/20 p-12 lg:p-16 text-center"
            style={{ background: 'radial-gradient(circle at top, rgba(255, 26, 26, 0.12), transparent 60%), rgba(36, 16, 19, 0.85)' }}
          >
            <h2 className="font-display text-3xl font-black uppercase lg:text-4xl">Ready to move freight?</h2>
            <p className="mt-5 mx-auto max-w-xl text-lg text-[#B88989]">
              Send the lane, timing, equipment, and contact details. Dispatch can follow up with the next step.
            </p>
            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                to="/request-quote"
                onClick={() => trackPublicEvent('quote_cta_click', { source: 'final_cta' })}
                className="btn-primary btn-lg inline-flex items-center justify-center gap-2 glow-high"
              >
                Get a Freight Quote <ArrowRight size={20} />
              </Link>
              <Link
                to="/track-shipment"
                onClick={() => trackPublicEvent('tracking_cta_click', { source: 'final_cta' })}
                className="btn-secondary btn-lg inline-flex items-center justify-center gap-2"
              >
                <Search size={20} /> Track a Shipment
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* === FOOTER === */}
      <footer className="bg-infamous-darker px-5 py-14 text-sm text-[#B88989] lg:px-6">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <Link to="/" className="flex items-center gap-3 text-[#F5E8E8]" aria-label="Infamous Freight home">
              <Infinity aria-hidden="true" size={32} className="text-infamous-red-light" strokeWidth={2.5} style={{ filter: 'drop-shadow(0 0 10px rgba(255, 59, 48, 0.8))' }} />
              <span className="font-display text-lg font-black">Infamous Freight</span>
            </Link>
            <p className="mt-2 font-display text-sm font-bold uppercase tracking-[0.2em] text-infamous-muted">{BRAND.tagline}</p>
            <p className="mt-3 max-w-md leading-6">
              Freight services with clear quote intake, documented handoffs, tracking context, and delivery follow-up.
            </p>
            <div className="mt-4 space-y-1.5">
              <a href={BRAND.dispatchPhoneHref} className="flex items-center gap-2 text-[#B88989] hover:text-infamous-red-light transition">
                <Phone size={14} className="text-infamous-red-light" /> {BRAND.dispatchPhone}
              </a>
              <a href={`mailto:${BRAND.supportEmail}`} className="flex items-center gap-2 text-[#B88989] hover:text-infamous-red-light transition">
                <Mail size={14} className="text-infamous-red-light" /> {BRAND.supportEmail}
              </a>
            </div>
            <p className="mt-6 text-xs text-infamous-muted">© {new Date().getFullYear()} {BRAND.legalName || 'Infamous Freight'}. All rights reserved.</p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#F5E8E8]/80">Freight</h2>
              <div className="space-y-2.5">
                <Link to="/request-quote" className="block hover:text-infamous-red-light transition">Get a Quote</Link>
                <Link to="/track-shipment" className="block hover:text-infamous-red-light transition">Track Shipment</Link>
                <Link to="/load-board" className="block hover:text-infamous-red-light transition">Load Board</Link>
                <Link to="/pricing" className="block hover:text-infamous-red-light transition">Pricing</Link>
              </div>
            </div>
            <div>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#F5E8E8]/80">Services</h2>
              <div className="space-y-2.5">
                <Link to="/services" className="block hover:text-infamous-red-light transition">All Services</Link>
                <Link to="/services/full-truckload" className="block hover:text-infamous-red-light transition">Full Truckload</Link>
                <Link to="/services/flatbed" className="block hover:text-infamous-red-light transition">Flatbed</Link>
                <Link to="/services/expedited" className="block hover:text-infamous-red-light transition">Expedited</Link>
                <Link to="/services/amazon-delivery" className="block hover:text-infamous-red-light transition">Amazon Delivery</Link>
              </div>
            </div>
            <div>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#F5E8E8]/80">Network</h2>
              <div className="space-y-2.5">
                <Link to="/customer-portal" className="block hover:text-infamous-red-light transition">Shipper Portal</Link>
                <Link to="/carrier-portal" className="block hover:text-infamous-red-light transition">Carrier Portal</Link>
                <Link to="/drive" className="block hover:text-infamous-red-light transition">Drive With Us</Link>
                <Link to="/partners" className="block hover:text-infamous-red-light transition">Partners</Link>
              </div>
            </div>
            <div>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#F5E8E8]/80">Company</h2>
              <div className="space-y-2.5">
                <Link to="/about" className="block hover:text-infamous-red-light transition">About</Link>
                <Link to="/faq" className="block hover:text-infamous-red-light transition">FAQ</Link>
                <Link to="/contact" className="block hover:text-infamous-red-light transition">Contact</Link>
                <Link to="/terms" className="block hover:text-infamous-red-light transition">Terms</Link>
                <Link to="/privacy" className="block hover:text-infamous-red-light transition">Privacy</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default LandingPage;
