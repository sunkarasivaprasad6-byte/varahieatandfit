import { addDoc, collection, doc, getDoc, getDocs, onSnapshot, query, runTransaction, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { DELIVERY_SLOT_CAPACITY, type DeliverySlot } from "@/lib/deliverySlotService";

export type SkippedMealRecord = { id: string; skippedAt: string; expiresAt: string; scheduledFor?: string; scheduledTime?: string; status: "AVAILABLE" | "SCHEDULED" | "USED" | "EXPIRED" };

export type Subscription = {
  id?: string;
  userId: string;
  customerName: string;
  phone: string;
  planId: string;
  planName: string;
  amount: number;
  status: "PENDING_PAYMENT" | "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED";
  startDate: string;
  endDate: string;
  deliverySlot: DeliverySlot;
  deliveryTime: string;
  address: string;
  proteinPerMeal: number;
  caloriesPerMeal: number;
  instructions: string;
  skippedMeals: number;
  skippedMealRecords?: SkippedMealRecord[];
  paymentOrderId?: string;
  paymentId?: string;
  paymentStatus?: "PENDING" | "SUCCESS" | "FAILED";
  paymentVerifiedAt?: unknown;
  paymentFailedAt?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export async function createSubscriptionDraft(data: Omit<Subscription, "id" | "createdAt" | "updatedAt">) {
  if (!data.deliverySlot) throw new Error("Please select a delivery slot");
  if (!data.customerName.trim()) throw new Error("Customer name is required");
  if (!/^[6-9]\d{9}$/.test(data.phone)) throw new Error("Enter a valid 10-digit phone number");
  const ref = await addDoc(collection(db, "subscriptions"), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return ref.id;
}

function isExpired(subscription: Subscription) { return Boolean(subscription.endDate) && new Date(subscription.endDate).getTime() < Date.now(); }

export async function getActiveSubscription(userId: string) {
  const snap = await getDocs(query(collection(db, "subscriptions"), where("userId", "==", userId), where("status", "==", "ACTIVE")));
  if (snap.empty) return null;
  const d = snap.docs[0];
  const subscription = { id: d.id, ...(d.data() as Omit<Subscription, "id">) } as Subscription;
  if (isExpired(subscription)) { await updateDoc(doc(db, "subscriptions", d.id), { status: "COMPLETED", updatedAt: serverTimestamp() }); return null; }
  return subscription;
}

export function subscribeToActiveSubscription(userId: string, callback: (value: Subscription | null) => void) {
  const q = query(collection(db, "subscriptions"), where("userId", "==", userId), where("status", "==", "ACTIVE"));
  return onSnapshot(q, (snap) => {
    if (snap.empty) return callback(null);
    const d = snap.docs[0];
    const subscription = { id: d.id, ...(d.data() as Omit<Subscription, "id">) } as Subscription;
    if (isExpired(subscription)) { updateDoc(doc(db, "subscriptions", d.id), { status: "COMPLETED", updatedAt: serverTimestamp() }).catch(console.error); return callback(null); }
    callback(subscription);
  });
}

export async function activateSubscription(id: string, payment?: { orderId?: string; paymentId?: string }) {
  const user = auth.currentUser;
  if (!user) throw new Error("Sign in required");
  const ref = doc(db, "subscriptions", id);
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists() || snap.data().userId !== user.uid) throw new Error("Subscription not found");
    const current = snap.data() as Subscription;
    if (current.status === "CANCELLED" || current.status === "COMPLETED") throw new Error("This subscription can no longer be activated");
    if (current.status === "ACTIVE") return;
    const activeSnap = await transaction.get(query(collection(db, "subscriptions"), where("status", "==", "ACTIVE"), where("deliverySlot", "==", current.deliverySlot)));
    if (activeSnap.docs.filter((item) => item.id !== id).length >= DELIVERY_SLOT_CAPACITY) throw new Error(`The ${current.deliverySlot} delivery slot is full. Please choose another slot.`);
    transaction.update(ref, { status: "ACTIVE", paymentStatus: "SUCCESS", ...(payment?.orderId ? { paymentOrderId: payment.orderId } : {}), ...(payment?.paymentId ? { paymentId: payment.paymentId } : {}), paymentVerifiedAt: serverTimestamp(), updatedAt: serverTimestamp() });
  });
}

export async function markSubscriptionPaymentFailed(id: string) {
  const user = auth.currentUser; if (!user) throw new Error("Sign in required");
  const ref = doc(db, "subscriptions", id); const snap = await getDoc(ref);
  if (!snap.exists() || snap.data().userId !== user.uid) throw new Error("Subscription not found");
  await updateDoc(ref, { status: "CANCELLED", paymentStatus: "FAILED", paymentFailedAt: serverTimestamp(), updatedAt: serverTimestamp() });
}

export async function markPaymentPending(id: string, orderId: string) {
  const user = auth.currentUser; if (!user) throw new Error("Sign in required");
  const ref = doc(db, "subscriptions", id); const snap = await getDoc(ref);
  if (!snap.exists() || snap.data().userId !== user.uid) throw new Error("Subscription not found");
  await updateDoc(ref, { paymentOrderId: orderId, paymentStatus: "PENDING", updatedAt: serverTimestamp() });
}

export async function updateSubscription(id: string, data: Partial<Subscription>) { await updateDoc(doc(db, "subscriptions", id), { ...data, updatedAt: serverTimestamp() }); }

export async function listSubscriptions() {
  const snap = await getDocs(collection(db, "subscriptions"));
  const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Subscription, "id">) }) as Subscription);
  const expired = items.filter((s) => s.status === "ACTIVE" && isExpired(s));
  await Promise.all(expired.filter((s) => s.id).map((s) => updateDoc(doc(db, "subscriptions", s.id!), { status: "COMPLETED", updatedAt: serverTimestamp() })));
  return items.map((s) => expired.some((e) => e.id === s.id) ? { ...s, status: "COMPLETED" as const } : s);
}
