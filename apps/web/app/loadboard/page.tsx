import { RouteScaffold } from "@/app/_components/RouteScaffold";

export default function LoadboardPage() {
  return (
    <RouteScaffold
      eyebrow="Operations"
      title="Load Board"
      description="Browse available loads, inspect lane details, and move quickly from discovery to dispatch assignment."
      primaryAction={{ href: "/loads", label: "Open Loads" }}
      secondaryAction={{ href: "/dashboard", label: "Go to Dashboard" }}
      highlights={[
        "Lane-level rate visibility",
        "Fast assignment workflows",
        "Built for mobile field access",
      ]}
    />
  );
}
