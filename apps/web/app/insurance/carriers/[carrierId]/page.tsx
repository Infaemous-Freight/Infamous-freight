import type { Metadata } from "next";

import { RouteScaffold } from "@/app/_components/RouteScaffold";

type CarrierRouteProps = {
  params: Promise<{ carrierId: string }>;
};

export async function generateMetadata({ params }: CarrierRouteProps): Promise<Metadata> {
  const carrierId = (await params).carrierId;

  return {
    title: `Carrier Profile | ${carrierId}`,
    description: "Insurance carrier profile and qualification summary.",
  };
}

export default async function CarrierInsurancePage({ params }: CarrierRouteProps) {
  const carrierId = (await params).carrierId;

  return (
    <RouteScaffold
      eyebrow="Insurance"
      title={`Carrier: ${carrierId}`}
      description="Review insurance documents, policy status, and freight qualification details for this carrier."
      primaryAction={{ href: "/insurance/requirements", label: "View Requirements" }}
      secondaryAction={{ href: "/dashboard", label: "Back to Dashboard" }}
      highlights={[
        "Policy verification status",
        "Coverage limits and expiration checks",
        "Safety and compliance reference fields",
      ]}
    />
  );
}
