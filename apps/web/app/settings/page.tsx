import { RouteScaffold } from "@/app/_components/RouteScaffold";

export default function SettingsPage() {
  return (
    <RouteScaffold
      eyebrow="Account"
      title="Settings"
      description="Control account security, billing, and operational defaults in one place."
      primaryAction={{ href: "/settings/billing", label: "Open Billing Settings" }}
      secondaryAction={{ href: "/profile", label: "View Profile" }}
      highlights={[
        "Account and organization controls",
        "Billing and plan settings",
        "Security and sign-in preferences",
      ]}
    />
  );
}
