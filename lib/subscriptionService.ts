import { addDoc, collection, doc, getDoc, getDocs, onSnapshot, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

export type Subscription = {
  id?: string;
  userId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
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
  paymentOrderId?: string;
  paymentStatus?: "PENDING" | "SUCCESS" | "FAILED";
  skippedMealRecords?: Array<{
    id: string;
    skippedAt: string;
    expiresAt: string;
    scheduledFor?: string;
    scheduledTime?: string;
    status: "AVAILABLE" | "SCHEDULED" | "USED" | "EXPIRED";
  }>;
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

export async function getSubscription(id: string) {
  const snap = await getDoc(doc(db, "subscriptions", id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<Subscription, "id">) } as Subscription;
}

export async function activateSubscription(id: string, paymentOrderId?: string) {
  const user = auth.currentUser;
  if (!user) throw new Error("Sign in required");
  const ref = doc(db, "subscriptions", id);
  const snap = await getDoc(ref);
  if (!snap.exists() || snap.data().userId !== user.uid) throw new Error("Subscription not found");

  const data = snap.data() as Partial<Subscription>;
  if (paymentOrderId && data.paymentOrderId && data.paymentOrderId !== paymentOrderId) {
    throw new Error("Payment order does not match this subscription");
  }

  await updateDoc(ref, {
    status: "ACTIVE",
    paymentStatus: "SUCCESS",
    ...(paymentOrderId ? { paymentOrderId } : {}),
    updatedAt: serverTimestamp(),
  });
}

export async function updateSubscription(id: string, data: Partial<Subscription>) {
  const user = auth.currentUser;
  const ref = doc(db, "subscriptions", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Subscription not found");
  const ownerId = String(snap.data().userId || "");
  const isOwner = !!user && user.uid === ownerId;
  const adminEmail = user?.email?.toLowerCase();
  const configuredAdmins = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(",").map((x) => x.trim().toLowerCase()).filter(Boolean) || ["sunkarasivaprasad6@gmail.com"];
  const isAdmin = !!adminEmail && configuredAdmins.includes(adminEmail);
  if (!isOwner && !isAdmin) throw new Error("Not authorized");
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

export async function listSubscriptions() {
  const snap = await getDocs(collection(db, "subscriptions"));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Subscription, "id">) })) as Subscription[];
}
