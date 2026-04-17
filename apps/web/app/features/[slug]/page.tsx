import type { Metadata } from "next";

import { RouteScaffold } from "@/app/_components/RouteScaffold";

type FeatureRouteProps = {
  params: Promise<{ slug: string }>;
};

const featureTitles: Record<string, string> = {
  dispatch: "Dispatch Automation",
  ledger: "Freight Ledger",
  revenue: "Revenue Intelligence",
};

export async function generateMetadata({ params }: FeatureRouteProps): Promise<Metadata> {
  const slug = (await params).slug;

  return {
    title: featureTitles[slug] ?? "Feature Overview",
    description: "Capability page for a core Infamous Freight product feature.",
  };
}

export default async function FeatureDetailPage({ params }: FeatureRouteProps) {
  const slug = (await params).slug;
  const title = featureTitles[slug] ?? "Feature Overview";

  return (
    <RouteScaffold
      eyebrow="Features"
      title={title}
      description="Explore how this capability improves fleet velocity, visibility, and financial control."
      primaryAction={{ href: "/pricing", label: "Compare Plans" }}
      secondaryAction={{ href: "/contact-sales", label: "Talk to Sales" }}
      highlights={[
        `Feature key: ${slug}`,
        "Built for dispatcher and carrier workflows",
        "Mobile-friendly operations tooling",
      ]}
    />
  );
}
