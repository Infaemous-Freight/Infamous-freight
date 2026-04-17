import { RouteScaffold } from "@/app/_components/RouteScaffold";

export default function TermsOfServicePage() {
  return (
    <RouteScaffold
      eyebrow="Legal"
      title="Terms of Service"
      description="Service terms, acceptable use expectations, and billing obligations for Infamous Freight customers."
      primaryAction={{ href: "/pricing", label: "Review Plans" }}
      secondaryAction={{ href: "/contact", label: "Contact Legal" }}
      highlights={[
        "Service access and account duties",
        "Payment and subscription terms",
        "Liability, support, and termination clauses",
      ]}
    />
  );
}
