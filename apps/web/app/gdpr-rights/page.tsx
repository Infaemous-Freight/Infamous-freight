import { RouteScaffold } from "@/app/_components/RouteScaffold";

export default function GdprRightsPage() {
  return (
    <RouteScaffold
      eyebrow="Privacy"
      title="GDPR Rights"
      description="Submit requests to access, correct, export, or delete personal data associated with your account."
      primaryAction={{ href: "/contact", label: "Submit Request" }}
      secondaryAction={{ href: "/privacy-policy", label: "Read Privacy Policy" }}
      highlights={[
        "Right to access and portability",
        "Right to erasure and correction",
        "Right to object to processing",
      ]}
    />
  );
}
