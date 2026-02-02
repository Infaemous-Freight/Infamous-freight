// Structured data for SEO (JSON-LD)
export interface Organization {
  "@context": "https://schema.org";
  "@type": "Organization";
  name: string;
  url: string;
  logo: string;
  description: string;
  sameAs: string[];
  contactPoint: {
    "@type": "ContactPoint";
    contactType: string;
    email?: string;
    availableLanguage: string[];
  };
}

export interface WebSite {
  "@context": "https://schema.org";
  "@type": "WebSite";
  name: string;
  url: string;
  potentialAction: {
    "@type": "SearchAction";
    target: string;
    "query-input": string;
  };
}

export interface SoftwareApplication {
  "@context": "https://schema.org";
  "@type": "SoftwareApplication";
  name: string;
  applicationCategory: string;
  offers: {
    "@type": "Offer";
    price: string;
    priceCurrency: string;
  };
  aggregateRating?: {
    "@type": "AggregateRating";
    ratingValue: string;
    ratingCount: string;
  };
}

export function getOrganizationData(): Organization {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://infamous-freight-as-3gw.fly.dev";
  
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Infamous Freight Enterprises",
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description: "AI-powered enterprise logistics and fleet management platform with real-time tracking, autonomous dispatch, and comprehensive revenue optimization.",
    sameAs: [
      // Add social media URLs when available
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Support",
      email: "support@infamous-freight.com",
      availableLanguage: ["en"],
    },
  };
}

export function getWebSiteData(): WebSite {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://infamous-freight-as-3gw.fly.dev";
  
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Infamous Freight Enterprises",
    url: baseUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${baseUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function getSoftwareApplicationData(): SoftwareApplication {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Infamous Freight Platform",
    applicationCategory: "BusinessApplication",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "150",
    },
  };
}

// Component to inject structured data
export function StructuredData({ data }: { data: Organization | WebSite | SoftwareApplication }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
