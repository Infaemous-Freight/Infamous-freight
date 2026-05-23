import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Clock3, Headset, Infinity, Mail, Menu, PackageSearch, Phone, ShieldCheck, X } from 'lucide-react';
import { BRAND } from '@/lib/brand';
import { trackPublicEvent } from '@/lib/analytics';

const navLinks = [
  { label: 'Services', href: '/services' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Load Board', href: '/load-board' },
  { label: 'Freight Assistant', href: '/freight-assistant' },
  { label: 'Partners', href: '/partners' },
  { label: 'Case Studies', href: '/case-studies' },
  { label: 'Request Quote', href: '/request-quote' },
  { label: 'Track Shipment', href: '/track-shipment' },
  { label: 'Carriers', href: '/carrier-portal' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

const footerGroups = [
  {
    title: 'Freight',
    links: [
      { label: 'Get a Quote', href: '/request-quote' },
      { label: 'Track Shipment', href: '/track-shipment' },
      { label: 'Load Board', href: '/load-board' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Freight Assistant', href: '/freight-assistant' },
    ],
  },
  {
    title: 'Services',
    links: [
      { label: 'All Services', href: '/services' },
      { label: 'Full Truckload', href: '/services/full-truckload' },
      { label: 'Flatbed', href: '/services/flatbed' },
      { label: 'Expedited', href: '/services/expedited' },
      { label: 'Amazon Delivery', href: '/services/amazon-delivery' },
    ],
  },
  {
    title: 'Network',
    links: [
      { label: 'Shipper Portal', href: '/customer-portal' },
      { label: 'Carrier Portal', href: '/carrier-portal' },
      { label: 'Drive With Us', href: '/drive' },
      { label: 'Partners', href: '/partners' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Case Studies', href: '/case-studies' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Contact', href: '/contact' },
      { label: 'Terms', href: '/terms' },
      { label: 'Privacy', href: '/privacy' },
    ],
  },
];

const pageActions: Record<string, { eyebrow: string; title: string; body: string; primaryLabel: string; primaryHref: string; secondaryLabel: string; secondaryHref: string }> = {
  '/services': {
    eyebrow: 'Ready to plan a shipment?',
    title: 'Send the lane, freight details, and timing so dispatch can review the right option.',
    body: 'The quote form collects pickup, delivery, freight type, dimensions, weight, timeline, and notes in one short workflow.',
    primaryLabel: 'Request a quote',
    primaryHref: '/request-quote',
    secondaryLabel: 'Talk to dispatch',
    secondaryHref: '/contact',
  },
  '/request-quote': {
    eyebrow: 'Need help before submitting?',
    title: 'Dispatch can review your lane details and help route urgent or unusual freight.',
    body: 'Include as much shipment detail as possible so the follow-up can focus on capacity, timing, and next steps.',
    primaryLabel: 'Call dispatch',
    primaryHref: BRAND.dispatchPhoneHref,
    secondaryLabel: 'Contact support',
    secondaryHref: '/contact',
  },
  '/track-shipment': {
    eyebrow: 'Have an active-load issue?',
    title: 'Use the tracking reference first, then contact dispatch with the load context.',
    body: 'Clear references help support locate status, ETA changes, delivery notes, and proof-of-delivery information faster.',
    primaryLabel: 'Contact dispatch',
    primaryHref: '/contact',
    secondaryLabel: 'Request another quote',
    secondaryHref: '/request-quote',
  },
  '/carrier-portal': {
    eyebrow: 'Carrier conversation',
    title: 'Start with your equipment, lanes, and contact details so onboarding can review fit.',
    body: 'Carrier and driver opportunities depend on equipment, location, timing, documentation, and available freight.',
    primaryLabel: 'Apply to drive',
    primaryHref: '/drive',
    secondaryLabel: 'Partner inquiry',
    secondaryHref: '/partners',
  },
  '/drive': {
    eyebrow: 'Driver onboarding',
    title: 'Share your equipment, city, and availability to start the driver review workflow.',
    body: 'The team reviews applications against current lane needs and follows up when there is a practical match.',
    primaryLabel: 'Contact onboarding',
    primaryHref: '/contact',
    secondaryLabel: 'View carrier portal',
    secondaryHref: '/carrier-portal',
  },
  '/contact': {
    eyebrow: 'Faster routing',
    title: 'Use the quote form for new shipments and the contact form for support, onboarding, or partnerships.',
    body: 'For urgent active-load issues, call dispatch and include the tracking or load number when available.',
    primaryLabel: 'Request a quote',
    primaryHref: '/request-quote',
    secondaryLabel: 'Track shipment',
    secondaryHref: '/track-shipment',
  },
};

const defaultPageAction = {
  eyebrow: 'Next freight step',
  title: 'Keep the conversation moving with a quote, tracking lookup, or dispatch contact.',
  body: 'Every public page should make the next action obvious: request capacity, check shipment status, or reach the right team.',
  primaryLabel: 'Request a quote',
  primaryHref: '/request-quote',
  secondaryLabel: 'Track shipment',
  secondaryHref: '/track-shipment',
};

const trustPoints = [
  { label: 'Clear shipment intake', icon: CheckCircle2 },
  { label: 'Dispatch follow-up', icon: Headset },
  { label: 'Tracking context', icon: Clock3 },
  { label: 'Documented handoffs', icon: ShieldCheck },
];

const ActionLink: React.FC<{
  href: string;
  className: string;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ href, className, onClick, children }) => (
  href.startsWith('tel:') || href.startsWith('mailto:') ? (
    <a href={href} onClick={onClick} className={className}>
      {children}
    </a>
  ) : (
    <Link to={href} onClick={onClick} className={className}>
      {children}
    </Link>
  )
);

const PublicPageActionBand: React.FC<{ pathname: string }> = ({ pathname }) => {
  const action = pageActions[pathname] ?? (
    pathname.startsWith('/services/') ? pageActions['/services'] : defaultPageAction
  );

  return (
    <section className="border-t border-infamous-border bg-[#100406] px-5 py-12 lg:px-6" aria-labelledby="public-next-step-heading">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
        <div>
          <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-infamous-red-light">{action.eyebrow}</p>
          <h2 id="public-next-step-heading" className="mt-3 max-w-3xl font-display text-3xl font-black leading-tight text-[#F5E8E8] sm:text-4xl">
            {action.title}
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#B88989]">{action.body}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <ActionLink
              href={action.primaryHref}
              onClick={() => trackPublicEvent('quote_cta_click', { location: 'public_page_action_band', path: pathname, cta: action.primaryLabel })}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-infamous-red px-5 py-3 text-sm font-bold text-[#F5E8E8] transition hover:bg-infamous-red-light"
            >
              {action.primaryLabel} <ArrowRight aria-hidden="true" size={16} />
            </ActionLink>
            <ActionLink
              href={action.secondaryHref}
              onClick={() => trackPublicEvent('contact_cta_click', { location: 'public_page_action_band', path: pathname, cta: action.secondaryLabel })}
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-infamous-border bg-infamous-card px-5 py-3 text-sm font-bold text-[#F5E8E8] transition hover:border-infamous-red/40"
            >
              {action.secondaryLabel}
            </ActionLink>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {trustPoints.map((point) => {
            const Icon = point.icon;
            return (
              <div key={point.label} className="rounded-lg border border-infamous-border/70 bg-infamous-darker p-4">
                <Icon aria-hidden="true" className="text-infamous-red-light" size={20} />
                <p className="mt-3 text-sm font-semibold text-[#F5E8E8]">{point.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const PublicLayout: React.FC = () => {
  const { pathname } = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-infamous-dark pb-20 text-[#F5E8E8] lg:pb-0">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-infamous-red focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-[#F5E8E8] focus:shadow-lg"
      >
        Skip to main content
      </a>
      <header className="sticky top-0 z-50 border-b border-infamous-border bg-infamous-darker/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 lg:px-6">
          <Link to="/" className="flex items-center gap-3" aria-label="Infamous Freight home">
            <Infinity aria-hidden="true" size={28} className="text-infamous-red-light" strokeWidth={2.5} style={{ filter: 'drop-shadow(0 0 8px rgba(255, 59, 48, 0.8))' }} />
            <span className="hidden sm:block">
              <span className="block font-display text-lg font-black leading-none text-[#F5E8E8]">{BRAND.displayName}</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-infamous-muted">{BRAND.tagline}</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Public site navigation">
            {navLinks.map((item) => {
              const active = pathname === item.href
                || (item.href === '/services' && pathname.startsWith('/services'))
                || (item.href === '/carrier-portal' && pathname.startsWith('/carrier'));
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                    active
                      ? 'bg-infamous-red/10 text-infamous-red-light'
                      : 'text-[#B88989] hover:bg-white/5 hover:text-[#F5E8E8]'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="hidden sm:inline-flex rounded-lg px-4 py-2 text-sm font-semibold text-[#B88989] transition hover:text-[#F5E8E8]"
            >
              Login
            </Link>
            <Link
              to="/request-quote"
              onClick={() => trackPublicEvent('quote_cta_click', { location: 'desktop_header', cta: 'get_quote' })}
              className="inline-flex items-center gap-2 btn-primary text-sm glow-high"
            >
              Get a Quote <ArrowRight aria-hidden="true" size={15} />
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-[#B88989] hover:text-[#F5E8E8] hover:bg-white/5 transition"
              aria-controls="public-mobile-navigation"
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X aria-hidden="true" size={22} /> : <Menu aria-hidden="true" size={22} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav id="public-mobile-navigation" className="lg:hidden border-t border-infamous-border bg-infamous-darker px-5 py-4 space-y-1" aria-label="Mobile navigation">
            {navLinks.map((item) => {
              const active = pathname === item.href
                || (item.href === '/services' && pathname.startsWith('/services'))
                || (item.href === '/carrier-portal' && pathname.startsWith('/carrier'));
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? 'bg-infamous-red/10 text-infamous-red-light'
                      : 'text-[#B88989] hover:bg-white/5 hover:text-[#F5E8E8]'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
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

      <main id="main-content">
        <Outlet />
      </main>

      <PublicPageActionBand pathname={pathname} />

      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-infamous-border bg-infamous-darker/95 px-3 py-2 shadow-[0_-10px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl lg:hidden"
        aria-label="Quick freight actions"
      >
        <div className="mx-auto grid max-w-md grid-cols-3 gap-2">
          <Link
            to="/request-quote"
            onClick={() => trackPublicEvent('quote_cta_click', { location: 'mobile_sticky_bar', cta: 'quote' })}
            className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-lg bg-infamous-red px-2 text-xs font-bold text-[#F5E8E8]"
          >
            <ArrowRight aria-hidden="true" size={15} /> Quote
          </Link>
          <Link
            to="/track-shipment"
            onClick={() => trackPublicEvent('tracking_cta_click', { location: 'mobile_sticky_bar', cta: 'track' })}
            className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-lg border border-infamous-border bg-infamous-card px-2 text-xs font-bold text-[#F5E8E8]"
          >
            <PackageSearch aria-hidden="true" size={15} /> Track
          </Link>
          <a
            href={BRAND.dispatchPhoneHref}
            onClick={() => trackPublicEvent('contact_cta_click', { location: 'mobile_sticky_bar', cta: 'call' })}
            className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-lg border border-infamous-border bg-infamous-card px-2 text-xs font-bold text-[#F5E8E8]"
          >
            <Phone aria-hidden="true" size={15} /> Call
          </a>
        </div>
      </nav>

      <footer className="border-t border-infamous-border bg-infamous-darker px-5 py-14 text-sm text-[#B88989] lg:px-6">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <Link to="/" className="flex items-center gap-3 text-[#F5E8E8]" aria-label="Infamous Freight home">
              <Infinity aria-hidden="true" size={32} className="text-infamous-red-light" strokeWidth={2.5} style={{ filter: 'drop-shadow(0 0 10px rgba(255, 59, 48, 0.8))' }} />
              <span className="font-display text-lg font-black">{BRAND.displayName}</span>
            </Link>
            <p className="mt-2 font-display text-sm font-bold uppercase tracking-[0.2em] text-infamous-muted">{BRAND.tagline}</p>
            <p className="mt-3 max-w-md leading-6">
              Freight services with clear quote intake, documented handoffs, tracking context, and delivery follow-up.
            </p>
            <div className="mt-4 space-y-1.5">
              <a href={BRAND.dispatchPhoneHref} className="flex items-center gap-2 text-sm hover:text-infamous-red-light transition">
                <Phone aria-hidden="true" size={14} className="text-infamous-red-light" /> {BRAND.dispatchPhone}
              </a>
              <a href={`mailto:${BRAND.supportEmail}`} className="flex items-center gap-2 text-sm hover:text-infamous-red-light transition">
                <Mail aria-hidden="true" size={14} className="text-infamous-red-light" /> {BRAND.supportEmail}
              </a>
            </div>
            <p className="mt-6 text-xs text-infamous-muted">© {new Date().getFullYear()} {BRAND.legalName}. All rights reserved.</p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#F5E8E8]/80">{group.title}</h2>
                <div className="space-y-2.5">
                  {group.links.map((link) => (
                    <Link key={link.href} to={link.href} className="block hover:text-infamous-red-light transition">
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
