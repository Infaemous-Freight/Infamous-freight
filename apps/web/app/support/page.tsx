import { RouteScaffold } from "@/app/_components/RouteScaffold";

export default function SupportPage() {
  return (
    <RouteScaffold
      eyebrow="Support"
      title="Help Center"
      description="Get product help, account support, and technical guidance for your operations team."
      primaryAction={{ href: "/docs", label: "Browse Documentation" }}
      secondaryAction={{ href: "/contact", label: "Contact Support" }}
      highlights={[
        "Setup and onboarding help",
        "Billing and account troubleshooting",
        "Dispatch workflow best practices",
      ]}
    />
  );
}
