import { addDoc, collection, doc, getDoc, getDocs, onSnapshot, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

export type Subscription = {
  id?: string;
  userId: string;
  planId: string;
  planName: string;
  amount: number;
  status: "PENDING_PAYMENT" | "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED";
  startDate: string;
  endDate: string;
  deliveryTime: string;
  address: string;
  proteinPerMeal: number;
  caloriesPerMeal: number;
  instructions: string;
  skippedMeals: number;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export async function createSubscriptionDraft(data: Omit<Subscription, "id" | "createdAt" | "updatedAt">) {
  const ref = await addDoc(collection(db, "subscriptions"), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return ref.id;
}

export async function getActiveSubscription(userId: string) {
  const snap = await getDocs(query(collection(db, "subscriptions"), where("userId", "==", userId), where("status", "==", "ACTIVE")));
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...(d.data() as Omit<Subscription, "id">) } as Subscription;
}

export function subscribeToActiveSubscription(userId: string, callback: (value: Subscription | null) => void) {
  const q = query(collection(db, "subscriptions"), where("userId", "==", userId), where("status", "==", "ACTIVE"));
  return onSnapshot(q, (snap) => {
    if (snap.empty) return callback(null);
    const d = snap.docs[0];
    callback({ id: d.id, ...(d.data() as Omit<Subscription, "id">) } as Subscription);
  });
}

export async function activateSubscription(id: string) {
  const user = auth.currentUser;
  if (!user) throw new Error("Sign in required");
  const ref = doc(db, "subscriptions", id);
  const snap = await getDoc(ref);
  if (!snap.exists() || snap.data().userId !== user.uid) throw new Error("Subscription not found");
  await updateDoc(ref, { status: "ACTIVE", updatedAt: serverTimestamp() });
}

export async function updateSubscription(id: string, data: Partial<Subscription>) {
  await updateDoc(doc(db, "subscriptions", id), { ...data, updatedAt: serverTimestamp() });
}

export async function listSubscriptions() {
  const snap = await getDocs(collection(db, "subscriptions"));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Subscription, "id">) })) as Subscription[];
}
