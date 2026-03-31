import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import type { Carrier, Invoice, Load } from "@/types";

function ensureDb() {
  if (!db) {
    throw new Error("Firebase is not configured");
  }

  return db;
}

export async function createLoad(loadData: Omit<Load, "createdAt">) {
  await addDoc(collection(ensureDb(), "loads"), {
    ...loadData,
    createdAt: Date.now(),
  });
}

export const listLoads = async () => {
  const snapshot = await getDocs(collection(ensureDb(), "loads"));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Load));
};

export const updateLoad = (id: string, data: Partial<Load>) =>
  updateDoc(doc(ensureDb(), "loads", id), data);

export const deleteLoad = (id: string) => deleteDoc(doc(ensureDb(), "loads", id));

export async function createCarrier(carrierData: Omit<Carrier, "createdAt">) {
  await addDoc(collection(ensureDb(), "carriers"), {
    ...carrierData,
    createdAt: Date.now(),
  });
}

export const listCarriers = async () => {
  const snapshot = await getDocs(collection(ensureDb(), "carriers"));
  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  })) as Carrier[];
};

export const updateCarrier = (id: string, data: Partial<Carrier>) =>
  updateDoc(doc(ensureDb(), "carriers", id), data);

export const deleteCarrier = (id: string) => deleteDoc(doc(ensureDb(), "carriers", id));

export async function createInvoice(invoiceData: Omit<Invoice, "createdAt">) {
  await addDoc(collection(ensureDb(), "invoices"), {
    ...invoiceData,
    createdAt: Date.now(),
  });
}

export const listInvoices = async () => {
  const snapshot = await getDocs(collection(ensureDb(), "invoices"));
  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  })) as Invoice[];
};

export const updateInvoice = (id: string, data: Partial<Invoice>) =>
  updateDoc(doc(ensureDb(), "invoices", id), data);

export const deleteInvoice = (id: string) => deleteDoc(doc(ensureDb(), "invoices", id));

export const getLoadById = async (id: string) => {
  const load = await getDoc(doc(ensureDb(), "loads", id));
  if (!load.exists()) return null;
  return { id: load.id, ...load.data() } as Load;
};
