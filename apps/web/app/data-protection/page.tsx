import { RouteScaffold } from "@/app/_components/RouteScaffold";

export default function DataProtectionPage() {
  return (
    <RouteScaffold
      eyebrow="Privacy"
      title="Data Protection"
      description="Review how operational data, account records, and shipment information are protected across the platform."
      primaryAction={{ href: "/privacy-policy", label: "View Privacy Policy" }}
      secondaryAction={{ href: "/gdpr-rights", label: "See Data Rights" }}
      highlights={[
        "Role-based access controls",
        "Security monitoring and retention practices",
        "Procedures for data export and deletion requests",
      ]}
    />
  );
}
