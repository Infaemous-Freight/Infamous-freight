import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, updateDoc } from "firebase/firestore";

import { db } from "@/lib/firebase";
import type { Carrier, Invoice, Load } from "@/types";

function requireDb() {
  if (!db) {
    throw new Error("Firebase Firestore is not configured");
  }
  return db;
}

export async function createLoad(loadData: Omit<Load, "createdAt">) {
  const firestore = requireDb();
  await addDoc(collection(firestore, "loads"), {
    ...loadData,
    createdAt: Date.now(),
  });
}

export const listLoads = async () => {
  const firestore = requireDb();
  const snapshot = await getDocs(collection(firestore, "loads"));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Load);
};

export const updateLoad = (id: string, data: Partial<Load>) =>
  updateDoc(doc(requireDb(), "loads", id), data);

export const deleteLoad = (id: string) => deleteDoc(doc(requireDb(), "loads", id));

export async function createCarrier(carrierData: Omit<Carrier, "createdAt">) {
  const firestore = requireDb();
  await addDoc(collection(firestore, "carriers"), {
    ...carrierData,
    createdAt: Date.now(),
  });
}

export const listCarriers = async () => {
  const firestore = requireDb();
  const snapshot = await getDocs(collection(firestore, "carriers"));
  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  })) as Carrier[];
};

export const updateCarrier = (id: string, data: Partial<Carrier>) =>
  updateDoc(doc(requireDb(), "carriers", id), data);

export const deleteCarrier = (id: string) => deleteDoc(doc(requireDb(), "carriers", id));

export async function createInvoice(invoiceData: Omit<Invoice, "createdAt">) {
  const firestore = requireDb();
  await addDoc(collection(firestore, "invoices"), {
    ...invoiceData,
    createdAt: Date.now(),
  });
}

export const listInvoices = async () => {
  const firestore = requireDb();
  const snapshot = await getDocs(collection(firestore, "invoices"));
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
