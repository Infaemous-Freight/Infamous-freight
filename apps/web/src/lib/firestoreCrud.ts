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

// Short-lived in-memory cache with in-flight request deduplication so that
// concurrent callers on the same page do not each pay a round-trip to Firestore.
// Writes invalidate the relevant key so stale data does not linger after mutations.
const LIST_TTL_MS = 30_000;
const cacheEntries = new Map<string, { data: unknown; expiresAt: number }>();
const inflight = new Map<string, Promise<unknown>>();

function invalidate(key: string): void {
  cacheEntries.delete(key);
  inflight.delete(key);
}

async function cachedRead<T>(key: string, loader: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const entry = cacheEntries.get(key);
  if (entry && entry.expiresAt > now) {
    return entry.data as T;
  }

  const existing = inflight.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  const promise = loader()
    .then((data) => {
      if (inflight.get(key) === promise) {
        cacheEntries.set(key, { data, expiresAt: Date.now() + LIST_TTL_MS });
      }
      return data;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, promise);
  return promise;
}

export async function createLoad(loadData: Omit<Load, "createdAt">) {
  await addDoc(collection(requireDb(), "loads"), {
    ...loadData,
    createdAt: Date.now(),
  });
  invalidate("loads");
}

export const listLoads = async () =>
  cachedRead<Load[]>("loads", async () => {
    const snapshot = await getDocs(collection(requireDb(), "loads"));
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Load));
  });

export const updateLoad = async (id: string, data: Partial<Load>) => {
  const result = await updateDoc(doc(requireDb(), "loads", id), data);
  invalidate("loads");
  invalidate(`loads:${id}`);
  return result;
};

export const deleteLoad = async (id: string) => {
  const result = await deleteDoc(doc(requireDb(), "loads", id));
  invalidate("loads");
  invalidate(`loads:${id}`);
  return result;
};

export async function createCarrier(carrierData: Omit<Carrier, "createdAt">) {
  await addDoc(collection(requireDb(), "carriers"), {
    ...carrierData,
    createdAt: Date.now(),
  });
  invalidate("carriers");
}

export const listCarriers = async () =>
  cachedRead<Carrier[]>("carriers", async () => {
    const snapshot = await getDocs(collection(requireDb(), "carriers"));
    return snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    })) as Carrier[];
  });

export const updateCarrier = async (id: string, data: Partial<Carrier>) => {
  const result = await updateDoc(doc(requireDb(), "carriers", id), data);
  invalidate("carriers");
  return result;
};

export const deleteCarrier = async (id: string) => {
  const result = await deleteDoc(doc(requireDb(), "carriers", id));
  invalidate("carriers");
  return result;
};

export async function createInvoice(invoiceData: Omit<Invoice, "createdAt">) {
  await addDoc(collection(requireDb(), "invoices"), {
    ...invoiceData,
    createdAt: Date.now(),
  });
  invalidate("invoices");
}

export const listInvoices = async () =>
  cachedRead<Invoice[]>("invoices", async () => {
    const snapshot = await getDocs(collection(requireDb(), "invoices"));
    return snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    })) as Invoice[];
  });

export const updateInvoice = async (id: string, data: Partial<Invoice>) => {
  const result = await updateDoc(doc(requireDb(), "invoices", id), data);
  invalidate("invoices");
  return result;
};

export const deleteInvoice = async (id: string) => {
  const result = await deleteDoc(doc(requireDb(), "invoices", id));
  invalidate("invoices");
  return result;
};

export const getLoadById = async (id: string) =>
  cachedRead<Load | null>(`loads:${id}`, async () => {
    const load = await getDoc(doc(requireDb(), "loads", id));
    if (!load.exists()) return null;
    return { id: load.id, ...load.data() } as Load;
  });
