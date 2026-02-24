export type Role = "admin" | "dispatcher" | "carrier";

export interface User {
  uid: string;
  email: string;
  role: Role;
  companyId: string;
}

export interface Load {
  id?: string;
  companyId: string;
  shipperName: string;
  pickupLocation: string;
  deliveryLocation: string;
  rate: number;
  carrierId: string;
  status: "booked" | "in_transit" | "delivered" | "paid";
  createdAt: number;
}

export interface Carrier {
  id?: string;
  companyId: string;
  name: string;
  mcNumber: string;
  contactEmail: string;
  phone: string;
  createdAt: number;
}

export interface Invoice {
  id?: string;
  companyId: string;
  loadId: string;
  amount: number;
  status: "draft" | "sent" | "paid" | "overdue";
  dueDate: string;
  createdAt: number;
}
