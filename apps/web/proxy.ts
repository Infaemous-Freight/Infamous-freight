import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Edge Proxy - Runs on Vercel Edge Network
 *
 * Features:
 * - Geolocation headers
 * - Security headers
 * - Request/response modification
 * - Rate limiting preparation
 * - A/B testing support
 * - Feature flags (Edge Config ready)
 */

// Paths that should skip edge proxy
// CRITICAL: Include /monitoring for Sentry tunnel route (prevents 401/403 errors)
const SKIP_PATHS = [
  "/_next",
  "/api/health",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/monitoring", // Sentry tunnel route - must not be intercepted
];

// API routes that need extra protection
const PROTECTED_API_ROUTES = ["/api/admin", "/api/internal"];

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Skip middleware for static assets and health checks
  if (SKIP_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Clone the request headers
  const requestHeaders = new Headers(request.headers);

  // Add geolocation data from Vercel Edge
  // @ts-ignore - Vercel adds geo property at runtime
  const country = request.geo?.country || "US";
  // @ts-ignore
  const city = request.geo?.city || "Unknown";
  // @ts-ignore
  const region = request.geo?.region || "Unknown";
  // @ts-ignore
  const latitude = request.geo?.latitude || "0";
  // @ts-ignore
  const longitude = request.geo?.longitude || "0";

  // Set custom headers for the request
  requestHeaders.set("x-geo-country", country);
  requestHeaders.set("x-geo-city", city);
  requestHeaders.set("x-geo-region", region);
  requestHeaders.set("x-geo-latitude", latitude);
  requestHeaders.set("x-geo-longitude", longitude);
  requestHeaders.set("x-forwarded-host", request.headers.get("host") || "");
  requestHeaders.set("x-pathname", pathname);

  // Create response with modified headers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Add security headers to response
  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()",
  );

  // Strengthen Content Security Policy
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.vercel.app https://*.supabase.co https://vitals.vercel-insights.com https://*.fly.dev",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  );

  // Add CORS headers for API routes
  if (pathname.startsWith("/api/")) {
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Access-Control-Allow-Origin", process.env.NEXT_PUBLIC_APP_URL || "*");
    response.headers.set("Access-Control-Allow-Methods", "GET,DELETE,PATCH,POST,PUT,OPTIONS");
    response.headers.set(
      "Access-Control-Allow-Headers",
      "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization",
    );
  }

  // Extra protection for admin/internal routes
  if (PROTECTED_API_ROUTES.some((route) => pathname.startsWith(route))) {
    const authHeader = request.headers.get("authorization");

    // Basic auth check (implement proper JWT validation in API routes)
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized", message: "Authentication required" }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }
  }

  // A/B Testing support via query params or cookies
  const variant = searchParams.get("variant") || request.cookies.get("ab-variant")?.value;
  if (variant) {
    response.cookies.set("ab-variant", variant, {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: false,
      sameSite: "lax",
    });
    response.headers.set("X-AB-Variant", variant);
  }

  // Feature flags status (Edge Config integration ready)
  response.headers.set("X-Feature-Flags-Status", "ready");

  // Add custom analytics headers
  response.headers.set("X-Country-Code", country);
  response.headers.set("X-Request-ID", crypto.randomUUID());
  response.headers.set("X-Timestamp", Date.now().toString());

  // Performance hints
  if (pathname === "/") {
    response.headers.set("Link", "</api/health>; rel=preconnect");
  }

  return response;
}


// Configure which routes use the proxy
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - monitoring (Sentry tunnel route - CRITICAL)
     */
    "/((?!_next/static|_next/image|favicon.ico|public|monitoring).*)",
  ],
};
