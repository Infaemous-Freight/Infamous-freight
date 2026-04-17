import { RouteScaffold } from "@/app/_components/RouteScaffold";

export default function NewAdminSignoffPage() {
  return (
    <RouteScaffold
      eyebrow="Admin"
      title="Create New Signoff"
      description="Start a new operational signoff request for deployment, finance, or compliance workflows."
      primaryAction={{ href: "/admin/signoff-dashboard", label: "Open Signoff Dashboard" }}
      secondaryAction={{ href: "/dashboard", label: "Return to Dashboard" }}
      highlights={[
        "Capture reviewer assignments",
        "Track approval status by team",
        "Preserve a complete audit trail",
      ]}
    />
  );
}
