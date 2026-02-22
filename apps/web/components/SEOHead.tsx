import Head from "next/head";
import { useRouter } from "next/router";

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  type?: "website" | "article";
  noindex?: boolean;
  canonical?: string;
  keywords?: string[];
}

export default function SEOHead({
  title = "Infamous Freight Enterprises - Enterprise Logistics & Fleet Management",
  description = "Commercial-grade logistics platform with real-time tracking, AI-powered route optimization, and comprehensive fleet management. Trusted by enterprises worldwide.",
  image = "/og-image.png",
  type = "website",
  noindex = false,
  canonical,
  keywords = [
    "logistics",
    "fleet management",
    "freight tracking",
    "supply chain",
    "enterprise logistics",
    "route optimization",
    "AI logistics",
  ],
}: SEOHeadProps): React.ReactElement {
  const router = useRouter();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://infamous-freight-as-3gw.fly.dev";
  const fullUrl = `${siteUrl}${router.asPath}`;
  const canonicalUrl = canonical || fullUrl;
  const fullImageUrl = image.startsWith("http") ? image : `${siteUrl}${image}`;

  return (
    <Head>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      {keywords.length > 0 && <meta name="keywords" content={keywords.join(", ")} />}
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:site_name" content="Infamous Freight Enterprises" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={fullUrl} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={fullImageUrl} />

      {/* Favicon */}
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="shortcut icon" href="/favicon.ico" />

      {/* PWA */}
      <meta name="application-name" content="Infamous Freight" />
      <meta name="apple-mobile-web-app-title" content="Infamous Freight" />

      {/* Security */}
      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      <meta httpEquiv="X-Frame-Options" content="DENY" />
      <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />

      {/* Performance */}
      <link rel="dns-prefetch" href="//api.fly.dev" />
      <link rel="preconnect" href="https://api.fly.dev" crossOrigin="anonymous" />
    </Head>
  );
}
