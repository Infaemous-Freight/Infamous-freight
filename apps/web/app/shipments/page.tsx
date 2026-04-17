import { RouteScaffold } from "@/app/_components/RouteScaffold";

export default function ShipmentsPage() {
  return (
    <RouteScaffold
      eyebrow="Operations"
      title="Shipments"
      description="Track shipment execution from pickup to delivery with live status checkpoints and exception visibility."
      primaryAction={{ href: "/dashboard", label: "Open Dashboard" }}
      secondaryAction={{ href: "/loadboard", label: "View Load Board" }}
      highlights={[
        "In-transit status tracking",
        "Delay and exception monitoring",
        "Dispatcher-ready shipment timeline",
      ]}
    />
  );
}
