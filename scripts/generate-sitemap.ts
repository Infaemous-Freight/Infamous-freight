import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resourceArticles } from '../apps/web/src/data/resourceArticles';
import { servicePages } from '../apps/web/src/data/publicPages';

const SITE_URL = 'https://www.infamousfreight.com';
const LASTMOD = new Date().toISOString().slice(0, 10);

const DEFAULT_CHANGEFREQ = 'weekly';
const DEFAULT_PRIORITY = '0.7';

const routeMeta: Record<string, { changefreq: string; priority: string }> = {
  '/': { changefreq: 'weekly', priority: '1.0' },
  '/tracking': { changefreq: 'daily', priority: '0.9' },
  '/request-quote': { changefreq: 'weekly', priority: '0.9' },
  '/services': { changefreq: 'weekly', priority: '0.8' },
  '/resources': { changefreq: 'weekly', priority: '0.8' },
  '/pricing': { changefreq: 'weekly', priority: '0.8' },
  '/freight-assistant': { changefreq: 'weekly', priority: '0.8' },
  '/load-board': { changefreq: 'daily', priority: '0.8' },
  '/graphhopper': { changefreq: 'monthly', priority: '0.6' },
  '/terms': { changefreq: 'yearly', priority: '0.3' },
  '/privacy': { changefreq: 'yearly', priority: '0.3' },
  '/carrier-agreement': { changefreq: 'yearly', priority: '0.3' },
  '/shipper-agreement': { changefreq: 'yearly', priority: '0.3' },
};

const publicCanonicalPaths = [
  '/',
  '/about',
  '/carrier-agreement',
  '/carrier-portal',
  '/case-studies',
  '/contact',
  '/customer-portal',
  '/drivers',
  '/faq',
  '/freight-assistant',
  '/gdpr',
  '/graphhopper',
  '/load-board',
  '/partners',
  '/pricing',
  '/privacy',
  '/product-hunt',
  '/request-quote',
  '/resources',
  '/services',
  '/shipper-agreement',
  '/terms',
  '/tracking',
] as const;

const serviceDetailPaths = servicePages.map((service) => `/services/${service.slug}`);
const resourceDetailPaths = resourceArticles.map((article) => `/resources/${article.slug}`);

const paths = [...new Set([...publicCanonicalPaths, ...serviceDetailPaths, ...resourceDetailPaths])].sort((a, b) =>
  a === '/' ? -1 : b === '/' ? 1 : a.localeCompare(b),
);

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths
  .map((routePath) => {
    const loc = routePath === '/' ? `${SITE_URL}/` : `${SITE_URL}${routePath}`;
    const meta = routeMeta[routePath] ?? {
      changefreq: DEFAULT_CHANGEFREQ,
      priority: DEFAULT_PRIORITY,
    };

    return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${LASTMOD}</lastmod>\n    <changefreq>${meta.changefreq}</changefreq>\n    <priority>${meta.priority}</priority>\n  </url>`;
  })
  .join('\n')}\n</urlset>\n`;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sitemapPath = path.join(__dirname, '..', 'apps', 'web', 'public', 'sitemap.xml');

writeFileSync(sitemapPath, xml, 'utf8');
console.log(`Generated sitemap: ${sitemapPath} (${paths.length} routes)`);
