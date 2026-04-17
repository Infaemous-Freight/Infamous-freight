import { RouteScaffold } from "@/app/_components/RouteScaffold";

export default function BlogPage() {
  return (
    <RouteScaffold
      eyebrow="Insights"
      title="Freight Operations Journal"
      description="Read dispatch playbooks, market updates, and practical workflow improvements for high-performing fleets."
      primaryAction={{ href: "/docs/getting-started", label: "Read Getting Started" }}
      secondaryAction={{ href: "/contact", label: "Request a Live Demo" }}
      highlights={[
        "Dispatch workflow guides",
        "Revenue and lane strategy insights",
        "Compliance updates for carriers",
      ]}
    />
  );
}
