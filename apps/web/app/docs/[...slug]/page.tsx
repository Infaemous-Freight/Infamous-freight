import type { Metadata } from "next";

import { RouteScaffold } from "@/app/_components/RouteScaffold";

type DocsRouteProps = {
  params: Promise<{ slug: string[] }>;
};

const docTitles: Record<string, string> = {
  "faq": "FAQ",
  "getting-started": "Getting Started",
  "video-tutorials": "Video Tutorials",
  "billing/subscriptions/usage-based": "Usage-Based Billing",
  "payments/payment-intents": "Payment Intents",
  "payments/save-and-reuse": "Save and Reuse Payments",
};

function normalizeSlug(slug: string[]) {
  return slug.join("/");
}

export async function generateMetadata({ params }: DocsRouteProps): Promise<Metadata> {
  const key = normalizeSlug((await params).slug);
  const section = docTitles[key] ?? "Documentation";

  return {
    title: `Docs | ${section}`,
    description: `Documentation section for ${section}.`,
  };
}

export default async function DocsDetailPage({ params }: DocsRouteProps) {
  const key = normalizeSlug((await params).slug);
  const section = docTitles[key] ?? "Documentation";

  return (
    <RouteScaffold
      eyebrow="Documentation"
      title={section}
      description="Implementation guides and walkthroughs for dispatch, billing, and payment workflows."
      primaryAction={{ href: "/docs", label: "Open Docs Home" }}
      secondaryAction={{ href: "/support", label: "Contact Support" }}
      highlights={[
        `Current section: ${key}`,
        "Step-by-step setup instructions",
        "Production-safe integration notes",
      ]}
    />
  );
}
