// Common types used across services
export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "driver" | "customer";
  createdAt: Date;
  updatedAt: Date;
}

export interface Shipment {
  id: string;
  trackingNumber: string;
  origin: string;
  destination: string;
  status: ShipmentStatus;
  estimatedDelivery: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type ShipmentStatus =
  | "pending"
  | "in_transit"
  | "delivered"
  | "cancelled";

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface AiDecision {
  id: string;
  organizationId: string;
  invoiceId: string;
  agent: string;
  decision: "approve" | "dispute";
  confidence: number;
  rationale: Record<string, any>;
  createdAt: Date;
  feedback?: AiFeedback;
}

export interface AiFeedback {
  id: string;
  aiDecisionId: string;
  outcome: "correct" | "false_positive" | "missed";
  notes?: string;
  createdAt: Date;
  aiDecision?: AiDecision;
}
