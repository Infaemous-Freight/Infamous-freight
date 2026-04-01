import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

import { requireDb } from "@/lib/firebase";
import type { Carrier, Invoice, Load } from "@/types";

export async function createLoad(loadData: Omit<Load, "createdAt">) {
  await addDoc(collection(requireDb(), "loads"), {
    ...loadData,
    createdAt: Date.now(),
  });
}

export const listLoads = async () => {
  const snapshot = await getDocs(collection(requireDb(), "loads"));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Load));
};

export const updateLoad = (id: string, data: Partial<Load>) =>
  updateDoc(doc(requireDb(), "loads", id), data);

export const deleteLoad = (id: string) => deleteDoc(doc(requireDb(), "loads", id));

export async function createCarrier(carrierData: Omit<Carrier, "createdAt">) {
  await addDoc(collection(requireDb(), "carriers"), {
    ...carrierData,
    createdAt: Date.now(),
  });
}

export const listCarriers = async () => {
  const snapshot = await getDocs(collection(requireDb(), "carriers"));
  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  })) as Carrier[];
};

export const updateCarrier = (id: string, data: Partial<Carrier>) =>
  updateDoc(doc(requireDb(), "carriers", id), data);

export const deleteCarrier = (id: string) => deleteDoc(doc(requireDb(), "carriers", id));

export async function createInvoice(invoiceData: Omit<Invoice, "createdAt">) {
  await addDoc(collection(requireDb(), "invoices"), {
    ...invoiceData,
    createdAt: Date.now(),
  });
}

export const listInvoices = async () => {
  const snapshot = await getDocs(collection(requireDb(), "invoices"));
  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  })) as Invoice[];
};

export const updateInvoice = (id: string, data: Partial<Invoice>) =>
  updateDoc(doc(requireDb(), "invoices", id), data);

export const deleteInvoice = (id: string) => deleteDoc(doc(requireDb(), "invoices", id));

export const getLoadById = async (id: string) => {
  const load = await getDoc(doc(requireDb(), "loads", id));
  if (!load.exists()) return null;
  return { id: load.id, ...load.data() } as Load;
};
