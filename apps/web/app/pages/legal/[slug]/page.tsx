import { notFound } from "next/navigation";

import { RouteScaffold } from "@/app/_components/RouteScaffold";

const legalPages = {
  "privacy-policy": {
    title: "Privacy Policy",
    description: "How data is collected, used, stored, and protected across the Infamous Freight platform.",
  },
  "terms-of-service": {
    title: "Terms of Service",
    description: "Service usage terms, account responsibilities, and billing obligations for customers.",
  },
};

type LegalRouteProps = {
  params: Promise<{ slug: string }>;
};

export default async function LegacyLegalRoutePage({ params }: LegalRouteProps) {
  const slug = (await params).slug;
  const page = legalPages[slug as keyof typeof legalPages];

  if (!page) {
    notFound();
  }

  return (
    <RouteScaffold
      eyebrow="Legal"
      title={page.title}
      description={page.description}
      primaryAction={{ href: `/${slug}`, label: `Open /${slug}` }}
      secondaryAction={{ href: "/", label: "Return Home" }}
      highlights={[
        "Legal content is mirrored for backwards-compatible links",
        "Policy updates are handled in production documentation",
      ]}
    />
  );
}
