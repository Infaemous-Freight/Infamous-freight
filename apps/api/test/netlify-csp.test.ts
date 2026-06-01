import fs from 'node:fs';
import path from 'node:path';

const REQUIRED_ANALYTICS_HOSTS = [
  'https://www.googletagmanager.com',
  'https://www.google-analytics.com',
  'https://stats.g.doubleclick.net',
] as const;

function read(filePath: string): string {
  return fs.readFileSync(filePath, 'utf8');
}

describe('Netlify CSP policy', () => {
  const repoRoot = path.resolve(__dirname, '../../..');
  const rootNetlify = path.join(repoRoot, 'netlify.toml');
  it('keeps analytics domains allowed in root netlify config', () => {
    const rootContent = read(rootNetlify);

    for (const host of REQUIRED_ANALYTICS_HOSTS) {
      expect(rootContent).toContain(host);
    }
  });

  it('keeps worker-src locked to self for both root and driver PWA CSPs', () => {
    const rootContent = read(rootNetlify);
    expect(rootContent).not.toContain("worker-src 'self' blob:");
    expect(rootContent).toContain(
      'for = "/*"\n  [headers.values]\n    X-Frame-Options = "SAMEORIGIN"',
    );
    expect(rootContent).toContain("frame-ancestors 'self'; worker-src 'self'; upgrade-insecure-requests");
    expect(rootContent).toContain(
      'for = "/driver-pwa/*"\n  [headers.values]\n    Content-Security-Policy =',
    );
    expect(rootContent).toContain("frame-ancestors 'self'; worker-src 'self'; upgrade-insecure-requests");
  });
});

describe('Netlify production routing', () => {
  const repoRoot = path.resolve(__dirname, '../../..');
  const rootNetlify = path.join(repoRoot, 'netlify.toml');
  const publicRedirects = path.join(repoRoot, 'apps/web/public/_redirects');

  function indexOf(content: string, pattern: string): number {
    const index = content.indexOf(pattern);
    expect(index).toBeGreaterThanOrEqual(0);
    return index;
  }

  it('keeps the browser-critical API proxy ahead of the SPA fallback in netlify.toml', () => {
    const rootContent = read(rootNetlify);

    const healthProxy = indexOf(rootContent, 'from = "/api/health"');
    const loadRequestsProxy = indexOf(rootContent, 'from = "/api/load-requests"');
    const quoteRequestsProxy = indexOf(rootContent, 'from = "/api/public/quote-requests"');
    const shipmentLookupProxy = indexOf(rootContent, 'from = "/api/public/shipments/:trackingNumber"');
    const apiProxy = indexOf(rootContent, 'from = "/api/*"');
    const socketProxy = indexOf(rootContent, 'from = "/socket.io/*"');
    const spaFallback = indexOf(rootContent, 'from = "/*"');

    expect(healthProxy).toBeLessThan(apiProxy);
    expect(loadRequestsProxy).toBeLessThan(apiProxy);
    expect(quoteRequestsProxy).toBeLessThan(apiProxy);
    expect(shipmentLookupProxy).toBeLessThan(apiProxy);
    expect(apiProxy).toBeLessThan(spaFallback);
    expect(socketProxy).toBeLessThan(spaFallback);
    expect(rootContent).toContain('to = "https://api.infamousfreight.com/api/health"');
    expect(rootContent).toContain('to = "https://api.infamousfreight.com/api/load-requests"');
    expect(rootContent).toContain('to = "https://api.infamousfreight.com/api/public/quote-requests"');
    expect(rootContent).toContain('to = "https://api.infamousfreight.com/api/public/shipments/:trackingNumber"');
    expect(rootContent).toContain('to = "https://api.infamousfreight.com/api/:splat"');
    expect(rootContent).toContain('to = "https://api.infamousfreight.com/socket.io/:splat"');
    expect(rootContent).toContain('from = "/api/*"\n  to = "https://api.infamousfreight.com/api/:splat"\n  status = 200\n  force = true');
    expect(rootContent).toContain('from = "/socket.io/*"\n  to = "https://api.infamousfreight.com/socket.io/:splat"\n  status = 200\n  force = true');
  });

  it('keeps normal Git deploys limited to event-triggered Netlify functions', () => {
    const rootContent = read(rootNetlify);

    expect(rootContent).toContain('[build]');
    expect(rootContent).toContain('functions = "netlify/event-functions"');
    expect(rootContent).not.toContain('functions = "netlify/functions"');
  });

  it('keeps the form submission handler parked until the environment payload fits deploy limits', () => {
    const activeHandler = path.join(repoRoot, 'netlify/event-functions/submission-created.mts');
    const disabledHandler = path.join(repoRoot, 'netlify/disabled-functions/submission-created.mts.disabled');

    expect(fs.existsSync(activeHandler)).toBe(false);
    expect(fs.existsSync(disabledHandler)).toBe(true);
    // The event-functions directory must still exist (and stay package-free) so
    // the functions directive does not fall back to auto-detecting netlify/functions/.
    expect(fs.existsSync(path.join(repoRoot, 'netlify/event-functions'))).toBe(true);
  });

  it('keeps Edge Functions disabled until the Netlify environment payload fits deploy limits', () => {
    const activeSeoPrerender = path.join(repoRoot, 'netlify/edge-functions/seo-prerender.ts');
    const disabledSeoPrerender = `${activeSeoPrerender}.disabled`;
    const rootContent = read(rootNetlify);

    expect(fs.existsSync(activeSeoPrerender)).toBe(false);
    expect(fs.existsSync(disabledSeoPrerender)).toBe(true);
    expect(rootContent).toContain('seo-prerender.ts.disabled');
    expect(rootContent).toContain('4 KB Edge');
  });

  it('keeps public Netlify function source available but out of deploy packaging', () => {
    const loadRequestsContent = read(path.join(repoRoot, 'netlify/functions/load-requests.ts'));
    const publicFreightContent = read(path.join(repoRoot, 'netlify/functions/public-freight.ts'));

    expect(fs.existsSync(path.join(repoRoot, 'netlify/functions/public-freight.ts'))).toBe(true);
    expect(fs.existsSync(path.join(repoRoot, 'netlify/event-functions/public-freight.ts'))).toBe(false);
    expect(fs.existsSync(path.join(repoRoot, 'netlify/functions/load-requests.ts'))).toBe(true);
    expect(loadRequestsContent).toContain("path: ['/api/load-requests', '/api/load-requests/:id']");
    expect(publicFreightContent).toContain("path: ['/api/public/quote-requests', '/api/public/shipments/:trackingNumber']");
  });

  it('keeps _redirects as a placeholder while netlify.toml remains the redirect source of truth', () => {
    const redirectContent = read(publicRedirects);
    expect(redirectContent).toContain('# All redirect rules are managed in netlify.toml (single source of truth).');
    expect(redirectContent).toContain('# This file is kept as an empty placeholder to prevent accidental re-creation.');
    expect(redirectContent).not.toContain('/api/*');
    expect(redirectContent).not.toContain('/socket.io/*');
  });

  it('keeps CLI production deploys aligned with the normal Netlify function bundle', () => {
    const script = read(path.join(repoRoot, 'scripts/netlify-production-readiness.sh'));

    expect(script).toContain('netlify-cli deploy --prod --dir apps/web/dist --site "$NETLIFY_SITE_ID"');
    expect(script).not.toContain('--functions netlify/event-functions');
    expect(script).not.toContain('netlify-cli deploy --prod --dir apps/web/dist --functions netlify/disabled-functions');
  });

  it('keeps public Fly API route checks in production readiness automation', () => {
    const script = read(path.join(repoRoot, 'scripts/netlify-production-readiness.sh'));

    expect(script).toContain('PUBLIC_QUOTE_PREFLIGHT_URL="${PUBLIC_QUOTE_PREFLIGHT_URL:-https://www.infamousfreight.com/api/public/quote-requests}"');
    expect(script).toContain('PUBLIC_INVALID_SHIPMENT_URL="${PUBLIC_INVALID_SHIPMENT_URL:-https://www.infamousfreight.com/api/public/shipments/invalid-tracking}"');
    expect(script).toContain('run_step "Public quote API preflight check" curl_options "$PUBLIC_QUOTE_PREFLIGHT_URL"');
    expect(script).toContain('run_step "Public invalid shipment lookup check" curl_expect_status 400 "$PUBLIC_INVALID_SHIPMENT_URL"');
    expect(script).not.toContain('.netlify/functions/public-freight');
  });
});
