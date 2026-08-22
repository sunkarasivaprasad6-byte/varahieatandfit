import { collection, doc, getDoc, getDocs, query, runTransaction, serverTimestamp, Timestamp, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const DELIVERY_SLOTS = ["7:00 AM – 9:00 AM", "12:00 PM – 2:00 PM", "7:00 PM – 9:00 PM"] as const;
export const DELIVERY_SLOT_CAPACITY = 50;
export const DELIVERY_RESERVATION_MINUTES = 15;
export type DeliverySlot = (typeof DELIVERY_SLOTS)[number];
type SlotCounter = { activeCount: number; reservedCount: number; initialized?: boolean };
type ReservationStatus = "ACTIVE" | "RELEASED" | "ACTIVATED" | "EXPIRED";

function slotKey(slot: DeliverySlot) { return slot.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase(); }
function counterRef(slot: DeliverySlot) { return doc(db, "deliverySlotCounters", slotKey(slot)); }

async function activeReservations() {
  const snap = await getDocs(query(collection(db, "deliverySlotReservations"), where("status", "==", "ACTIVE")));
  return snap.docs;
}

async function releaseExpiredReservations(slot?: DeliverySlot) {
  const now = Date.now();
  const docs = await activeReservations();
  for (const reservation of docs) {
    const data = reservation.data() as { slot: DeliverySlot; expiresAt?: Timestamp };
    if (slot && data.slot !== slot) continue;
    if (!data.expiresAt || data.expiresAt.toMillis() > now) continue;
    await runTransaction(db, async (tx) => {
      const reservationSnap = await tx.get(reservation.ref);
      if (!reservationSnap.exists() || reservationSnap.data().status !== "ACTIVE") return;
      const latest = reservationSnap.data() as { slot: DeliverySlot };
      const ref = counterRef(latest.slot);
      const counterSnap = await tx.get(ref);
      if (counterSnap.exists()) {
        const counter = counterSnap.data() as SlotCounter;
        tx.update(ref, { reservedCount: Math.max(0, (counter.reservedCount || 0) - 1), updatedAt: serverTimestamp() });
      }
      tx.update(reservation.ref, { status: "EXPIRED", releasedAt: serverTimestamp() });
    });
  }
}

async function getExistingActiveCount(slot: DeliverySlot) {
  const snap = await getDocs(query(collection(db, "subscriptions"), where("status", "==", "ACTIVE")));
  return snap.docs.filter((d) => d.data().deliverySlot === slot).length;
}

async function ensureCounter(slot: DeliverySlot) {
  const ref = counterRef(slot);
  const [counterSnap, reservations] = await Promise.all([getDoc(ref), activeReservations()]);
  if (counterSnap.exists()) return;
  const activeCount = await getExistingActiveCount(slot);
  const reservedCount = reservations.filter((d) => d.data().slot === slot).length;
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) tx.set(ref, { activeCount, reservedCount, initialized: true, updatedAt: serverTimestamp() });
  });
}

export async function reserveDeliverySlot(slot: DeliverySlot, subscriptionId: string) {
  if (!DELIVERY_SLOTS.includes(slot)) throw new Error("Invalid delivery slot");
  await releaseExpiredReservations(slot);
  await ensureCounter(slot);
  const counter = counterRef(slot);
  const reservation = doc(collection(db, "deliverySlotReservations"));
  const expiresAt = Timestamp.fromMillis(Date.now() + DELIVERY_RESERVATION_MINUTES * 60 * 1000);
  await runTransaction(db, async (tx) => {
    const counterSnap = await tx.get(counter);
    const data = (counterSnap.data() || { activeCount: 0, reservedCount: 0 }) as SlotCounter;
    const activeCount = data.activeCount || 0;
    const reservedCount = data.reservedCount || 0;
    if (activeCount + reservedCount >= DELIVERY_SLOT_CAPACITY) throw new Error(`The ${slot} delivery slot is full. Please choose another slot.`);
    tx.set(reservation, { subscriptionId, slot, status: "ACTIVE" as ReservationStatus, expiresAt, createdAt: serverTimestamp() });
    tx.update(counter, { reservedCount: reservedCount + 1, updatedAt: serverTimestamp() });
  });
  return { reservationId: reservation.id, expiresAt: expiresAt.toDate().toISOString() };
}

export async function releaseDeliverySlotReservation(reservationId?: string, status: "RELEASED" | "EXPIRED" = "RELEASED") {
  if (!reservationId) return;
  const reservation = doc(db, "deliverySlotReservations", reservationId);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(reservation);
    if (!snap.exists() || snap.data().status !== "ACTIVE") return;
    const data = snap.data() as { slot: DeliverySlot };
    const counter = counterRef(data.slot); const counterSnap = await tx.get(counter);
    if (counterSnap.exists()) {
      const c = counterSnap.data() as SlotCounter;
      tx.update(counter, { reservedCount: Math.max(0, (c.reservedCount || 0) - 1), updatedAt: serverTimestamp() });
    }
    tx.update(reservation, { status, releasedAt: serverTimestamp() });
  });
}

export async function activateDeliverySlotReservation(reservationId?: string) {
  if (!reservationId) return false;
  const reservation = doc(db, "deliverySlotReservations", reservationId);
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(reservation);
    if (!snap.exists()) throw new Error("Delivery slot reservation not found");
    const data = snap.data() as { slot: DeliverySlot; status: ReservationStatus; expiresAt: Timestamp };
    if (data.status === "ACTIVATED") return true;
    if (data.status !== "ACTIVE") throw new Error("Delivery slot reservation is no longer available");
    if (data.expiresAt.toMillis() <= Date.now()) throw new Error("Delivery slot reservation expired. Please choose the slot again.");
    const counter = counterRef(data.slot); const counterSnap = await tx.get(counter);
    if (!counterSnap.exists()) throw new Error("Delivery slot capacity is unavailable");
    const c = counterSnap.data() as SlotCounter;
    if ((c.activeCount || 0) >= DELIVERY_SLOT_CAPACITY) throw new Error(`The ${data.slot} delivery slot is full. Please choose another slot.`);
    tx.update(counter, { reservedCount: Math.max(0, (c.reservedCount || 0) - 1), activeCount: (c.activeCount || 0) + 1, updatedAt: serverTimestamp() });
    tx.update(reservation, { status: "ACTIVATED", activatedAt: serverTimestamp() });
    return true;
  });
}

export async function reconcileDeliverySlotCounters() {
  await releaseExpiredReservations();
  for (const slot of DELIVERY_SLOTS) await ensureCounter(slot);
}

export async function getDeliverySlotCounts() {
  await reconcileDeliverySlotCounters();
  const counts: Record<DeliverySlot, number> = { "7:00 AM – 9:00 AM": 0, "12:00 PM – 2:00 PM": 0, "7:00 PM – 9:00 PM": 0 };
  const snap = await getDocs(query(collection(db, "subscriptions"), where("status", "==", "ACTIVE")));
  for (const item of snap.docs) { const slot = item.data().deliverySlot as DeliverySlot | undefined; if (slot && slot in counts) counts[slot] += 1; }
  return counts;
}

export async function getDeliverySlotAvailability() {
  await reconcileDeliverySlotCounters();
  const counters = await Promise.all(DELIVERY_SLOTS.map((slot) => getDoc(counterRef(slot))));
  return DELIVERY_SLOTS.map((slot, i) => {
    const c = (counters[i].data() || { activeCount: 0, reservedCount: 0 }) as SlotCounter;
    const active = c.activeCount || 0; const pendingReservations = c.reservedCount || 0;
    return { slot, count: active, pendingReservations, capacity: DELIVERY_SLOT_CAPACITY, available: active + pendingReservations < DELIVERY_SLOT_CAPACITY, remaining: Math.max(0, DELIVERY_SLOT_CAPACITY - active - pendingReservations) };
  });
}
