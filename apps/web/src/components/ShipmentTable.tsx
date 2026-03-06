import type { Shipment } from "@infamous/shared";

export function ShipmentTable({ shipments }: { shipments: Shipment[] }) {
  return <pre>{JSON.stringify(shipments, null, 2)}</pre>;
}
