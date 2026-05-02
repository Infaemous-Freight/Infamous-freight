import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

type SeoConfig = {
  title: string;
  description: string;
};

const SITE_URL = (import.meta.env.VITE_SITE_URL ?? 'https://infamousfreight.com').replace(/\/$/, '');
const OG_IMAGE = `${SITE_URL}/og-image.svg`;

const DEFAULT_SEO: SeoConfig = {
  title: 'Infamous Freight — AI Freight Command Center',
  description:
    'Infamous Freight is an AI-powered freight command center with auto-dispatch, rate negotiation, voice booking, ELD sync, and end-to-end shipment visibility.'
};

const SEO_BY_PATH: Record<string, SeoConfig> = {
  '/': {
    title: 'Infamous Freight — AI Freight Operating System',
    description:
      'Run dispatch, visibility, and carrier operations from one AI-powered operating system built for modern fleets.'
  },
  '/home': {
    title: 'Infamous Freight — AI Freight Operating System',
    description:
      'Run dispatch, visibility, and carrier operations from one AI-powered operating system built for modern fleets.'
  },
  '/request-quote': {
    title: 'Request a Freight Quote | Infamous Freight',
    description:
      'Submit shipment details and receive a fast quote with AI-assisted lane and carrier matching from Infamous Freight.'
  },
  '/track-shipment': {
    title: 'Track Shipment in Real Time | Infamous Freight',
    description:
      'Track shipments in real time with live status updates, ETA visibility, and proactive issue alerts.'
  },
  '/freight-assistant': {
    title: 'AI Freight Assistant | Infamous Freight',
    description:
      'Use the Infamous Freight AI assistant to automate dispatch workflows, booking tasks, and operational decisions.'
  }
};

const INDEXABLE_ROUTES = new Set(['/', '/home', '/request-quote', '/track-shipment', '/freight-assistant']);

const SeoManager = () => {
  const location = useLocation();
  const pathname = (location.pathname || '/').replace(/\/$/, '') || '/';
  const seo = SEO_BY_PATH[pathname] ?? DEFAULT_SEO;
  const canonicalPath = pathname === '/home' ? '/' : pathname;
  const canonicalUrl = `${SITE_URL}${canonicalPath}`;
  const isIndexable = INDEXABLE_ROUTES.has(pathname);

  return (
    <Helmet>
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      <meta name="robots" content={isIndexable ? 'index,follow' : 'noindex,nofollow'} />
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={OG_IMAGE} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seo.title} />
      <meta name="twitter:description" content={seo.description} />
      <meta name="twitter:image" content={OG_IMAGE} />
    </Helmet>
  );
};

export default SeoManager;
