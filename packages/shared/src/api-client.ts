/**
 * Type-Safe API Client for Infamous Freight Enterprises
 * Provides consistent, type-safe access to backend APIs
 *
 * @example
 * ```typescript
 * const client = new ApiClient(process.env.API_BASE_URL);
 * const shipments = await client.getShipments();
 * if (shipments.success) {
 *   console.log(shipments.data);
 * }
 * ```
 */

import type { ApiResponse, Shipment, ShipmentStatus } from "./types";

export interface CreateShipmentPayload {
  origin: string;
  destination: string;
  weightKg: number;
  expectedDeliveryDate?: string;
}

export interface UpdateShipmentPayload {
  status?: ShipmentStatus;
  currentLocation?: string;
  notes?: string;
}

export interface ApiClientOptions {
  baseUrl: string;
  token?: string;
  timeout?: number;
}

export class ApiClient {
  private baseUrl: string;
  private token?: string;
  private timeout: number;

  constructor(options: string | ApiClientOptions) {
    if (typeof options === "string") {
      this.baseUrl = options;
      this.timeout = 30000;
    } else {
      this.baseUrl = options.baseUrl;
      this.token = options.token;
      this.timeout = options.timeout || 30000;
    }
  }

  /**
   * Set authentication token for subsequent requests
   */
  setToken(token: string): void {
    this.token = token;
  }

  /**
   * Make authenticated request to API
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = (await response.json()) as any;

      if (!response.ok) {
        return {
          success: false,
          error: data?.error || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return data as ApiResponse<T>;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          return {
            success: false,
            error: `Request timeout after ${this.timeout}ms`,
          };
        }
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: false,
        error: "Unknown error occurred",
      };
    }
  }

  // ==========================================
  // Shipment Endpoints
  // ==========================================

  /**
   * Get all shipments
   */
  async getShipments(): Promise<ApiResponse<Shipment[]>> {
    return this.request<Shipment[]>("/shipments");
  }

  /**
   * Get single shipment by ID
   */
  async getShipment(id: string): Promise<ApiResponse<Shipment>> {
    return this.request<Shipment>(`/shipments/${id}`);
  }

  /**
   * Create new shipment
   */
  async createShipment(payload: CreateShipmentPayload): Promise<ApiResponse<Shipment>> {
    return this.request<Shipment>("/shipments", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  /**
   * Update existing shipment
   */
  async updateShipment(id: string, payload: UpdateShipmentPayload): Promise<ApiResponse<Shipment>> {
    return this.request<Shipment>(`/shipments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }

  /**
   * Delete shipment
   */
  async deleteShipment(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/shipments/${id}`, {
      method: "DELETE",
    });
  }

  // ==========================================
  // Health Check
  // ==========================================

  /**
   * Check API health status
   */
  async healthCheck(): Promise<ApiResponse<{ status: string; uptime: number }>> {
    return this.request<{ status: string; uptime: number }>("/health");
  }
}

/**
 * Create a pre-configured API client for browser use
 */
export function createBrowserClient(token?: string): ApiClient {
  // Check if running in browser environment
  const isBrowser =
    typeof globalThis !== "undefined" &&
    "location" in globalThis &&
    "origin" in (globalThis as any).location;

  const baseUrl = isBrowser
    ? (globalThis as any).location.origin + "/api"
    : process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

  return new ApiClient({ baseUrl, token });
}

/**
 * Create a pre-configured API client for server use
 */
export function createServerClient(token?: string): ApiClient {
  const baseUrl = process.env.API_BASE_URL || "http://localhost:4000/api";
  return new ApiClient({ baseUrl, token });
}

export async function apiFetch<T>(
  baseUrl: string,
  path: string,
  token: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {})
    }
  });

  if (!res.ok) {
    throw new Error(`API request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}
