import { RouteScaffold } from "@/app/_components/RouteScaffold";

export default function PrivacyPolicyPage() {
  return (
    <RouteScaffold
      eyebrow="Legal"
      title="Privacy Policy"
      description="This page summarizes how personal and operational data is handled within Infamous Freight services."
      primaryAction={{ href: "/gdpr-rights", label: "Manage Data Rights" }}
      secondaryAction={{ href: "/data-protection", label: "Read Data Protection" }}
      highlights={[
        "Scope of data collection",
        "Data retention and deletion windows",
        "Security and access safeguards",
      ]}
    />
  );
}
