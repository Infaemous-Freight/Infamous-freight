import { RouteScaffold } from "@/app/_components/RouteScaffold";

export default function ConnectCustomAccountsPage() {
  return (
    <RouteScaffold
      eyebrow="Stripe Connect"
      title="Custom Accounts"
      description="Manage and monitor custom connected accounts used for advanced payout and billing flows."
      primaryAction={{ href: "/connect", label: "Open Connect Home" }}
      secondaryAction={{ href: "/dashboard", label: "Back to Dashboard" }}
      highlights={[
        "Account onboarding status",
        "Payout readiness checks",
        "Compliance verification controls",
      ]}
    />
  );
}
