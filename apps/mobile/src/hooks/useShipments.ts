import { useEffect, useState } from "react";
import type { Shipment } from "@infamous/shared";

interface UseShipmentsReturn {
  shipments: Shipment[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Fetches and manages shipment data for the authenticated tenant.
 *
 * Usage:
 *   const { shipments, isLoading, error, refresh } = useShipments(apiBaseUrl, token);
 */
export function useShipments(
  apiBaseUrl: string,
  token: string | null,
): UseShipmentsReturn {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetch(`${apiBaseUrl}/shipments`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<{ ok: boolean; data: Shipment[] }>;
      })
      .then(({ data }) => {
        if (!cancelled) setShipments(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, token, tick]);

  const refresh = () => setTick((t) => t + 1);

  return { shipments, isLoading, error, refresh };
}
