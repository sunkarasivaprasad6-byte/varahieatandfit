import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { isSlotChangeLocked } from "@/lib/deliverySlotRules";

export const runtime = "nodejs";

const DELIVERY_SLOTS = ["7:00 AM – 9:00 AM", "12:00 PM – 2:00 PM", "7:00 PM – 9:00 PM"] as const;
const CAPACITY = 50;
const RESERVATION_MINUTES = 15;
type DeliverySlot = (typeof DELIVERY_SLOTS)[number];
type ReservationStatus = "ACTIVE" | "RELEASED" | "ACTIVATED" | "EXPIRED";
type Counter = { activeCount?: number; reservedCount?: number; initialized?: boolean };
type TimestampLike = { toMillis(): number };

function isSlot(value: unknown): value is DeliverySlot {
  return typeof value === "string" && DELIVERY_SLOTS.includes(value as DeliverySlot);
}
function slotKey(slot: DeliverySlot) { return slot.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase(); }
function counterRef(slot: DeliverySlot) { return adminDb.collection("deliverySlotCounters").doc(slotKey(slot)); }

async function requireUser(request: NextRequest) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) throw new Error("Sign in required");
  return adminAuth.verifyIdToken(header.slice(7));
}

async function reconcileExpiredReservations() {
  const snap = await adminDb.collection("deliverySlotReservations").where("status", "==", "ACTIVE").get();
  const now = Date.now();
  for (const docSnap of snap.docs) {
    const data = docSnap.data() as { slot?: DeliverySlot; expiresAt?: TimestampLike };
    if (!isSlot(data.slot) || !data.expiresAt || data.expiresAt.toMillis() > now) continue;
    await adminDb.runTransaction(async (tx) => {
      const latest = await tx.get(docSnap.ref);
      if (!latest.exists || latest.data()?.status !== "ACTIVE") return;
      const counter = counterRef(data.slot!);
      const counterSnap = await tx.get(counter);
      if (counterSnap.exists) {
        const c = (counterSnap.data() || {}) as Counter;
        tx.update(counter, { reservedCount: Math.max(0, Number(c.reservedCount || 0) - 1), updatedAt: FieldValue.serverTimestamp() });
      }
      tx.update(docSnap.ref, { status: "EXPIRED" as ReservationStatus, releasedAt: FieldValue.serverTimestamp() });
    });
  }
}

async function ensureCounter(slot: DeliverySlot) {
  const ref = counterRef(slot);
  const snap = await ref.get();
  if (snap.exists) return;
  const activeSnap = await adminDb.collection("subscriptions").where("status", "==", "ACTIVE").get();
  const reservations = await adminDb.collection("deliverySlotReservations").where("status", "==", "ACTIVE").get();
  const activeCount = activeSnap.docs.filter((d) => d.data().deliverySlot === slot).length;
  const reservedCount = reservations.docs.filter((d) => d.data().slot === slot).length;
  await adminDb.runTransaction(async (tx) => {
    const latest = await tx.get(ref);
    if (!latest.exists) tx.set(ref, { activeCount, reservedCount, initialized: true, updatedAt: FieldValue.serverTimestamp() });
  });
}

async function reserve(uid: string, slot: DeliverySlot, subscriptionId: string) {
  const subRef = adminDb.collection("subscriptions").doc(subscriptionId);
  const subSnap = await subRef.get();
  if (!subSnap.exists || subSnap.data()?.userId !== uid) throw new Error("Subscription not found");
  if (subSnap.data()?.status !== "PENDING_PAYMENT") throw new Error("Subscription is not available for checkout");

  await reconcileExpiredReservations();
  await ensureCounter(slot);
  const counter = counterRef(slot);
  const reservationRef = adminDb.collection("deliverySlotReservations").doc();
  const expiresAt = new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000);

  await adminDb.runTransaction(async (tx) => {
    const counterSnap = await tx.get(counter);
    const data = (counterSnap.data() || {}) as Counter;
    const activeCount = Number(data.activeCount || 0);
    const reservedCount = Number(data.reservedCount || 0);
    if (activeCount + reservedCount >= CAPACITY) throw new Error(`The ${slot} delivery slot is full. Please choose another slot.`);
    tx.create(reservationRef, { subscriptionId, slot, status: "ACTIVE" as ReservationStatus, expiresAt, createdAt: FieldValue.serverTimestamp() });
    tx.update(counter, { reservedCount: reservedCount + 1, updatedAt: FieldValue.serverTimestamp() });
  });
  return { reservationId: reservationRef.id, expiresAt: expiresAt.toISOString() };
}

async function release(uid: string, reservationId?: string) {
  if (!reservationId) return;
  const reservationRef = adminDb.collection("deliverySlotReservations").doc(reservationId);
  await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(reservationRef);
    if (!snap.exists) return;
    const data = snap.data() as { subscriptionId?: string; slot?: DeliverySlot; status?: ReservationStatus };
    if (!data.subscriptionId || !isSlot(data.slot)) return;
    const sub = await tx.get(adminDb.collection("subscriptions").doc(data.subscriptionId));
    if (!sub.exists || sub.data()?.userId !== uid) throw new Error("Reservation not found");
    if (data.status !== "ACTIVE") return;
    const counter = counterRef(data.slot);
    const counterSnap = await tx.get(counter);
    if (counterSnap.exists) {
      const c = (counterSnap.data() || {}) as Counter;
      tx.update(counter, { reservedCount: Math.max(0, Number(c.reservedCount || 0) - 1), updatedAt: FieldValue.serverTimestamp() });
    }
    tx.update(reservationRef, { status: "RELEASED" as ReservationStatus, releasedAt: FieldValue.serverTimestamp() });
  });
}

async function activate(uid: string, reservationId?: string) {
  if (!reservationId) throw new Error("Delivery slot reservation is missing");
  const reservationRef = adminDb.collection("deliverySlotReservations").doc(reservationId);
  return adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(reservationRef);
    if (!snap.exists) throw new Error("Delivery slot reservation not found");
    const data = snap.data() as { subscriptionId?: string; slot?: DeliverySlot; status?: ReservationStatus; expiresAt?: TimestampLike };
    if (!data.subscriptionId || !isSlot(data.slot)) throw new Error("Invalid reservation");
    const subRef = adminDb.collection("subscriptions").doc(data.subscriptionId);
    const subSnap = await tx.get(subRef);
    if (!subSnap.exists || subSnap.data()?.userId !== uid) throw new Error("Subscription not found");
    if (data.status === "ACTIVATED") return true;
    if (data.status !== "ACTIVE") throw new Error("Delivery slot reservation is no longer available");
    if (!data.expiresAt || data.expiresAt.toMillis() <= Date.now()) throw new Error("Delivery slot reservation expired. Please choose the slot again.");
    const counter = counterRef(data.slot);
    const counterSnap = await tx.get(counter);
    const c = (counterSnap.data() || {}) as Counter;
    if (Number(c.activeCount || 0) >= CAPACITY) throw new Error(`The ${data.slot} delivery slot is full. Please choose another slot.`);
    tx.update(counter, { reservedCount: Math.max(0, Number(c.reservedCount || 0) - 1), activeCount: Number(c.activeCount || 0) + 1, updatedAt: FieldValue.serverTimestamp() });
    tx.update(reservationRef, { status: "ACTIVATED" as ReservationStatus, activatedAt: FieldValue.serverTimestamp() });
    return true;
  });
}

async function changeSlot(uid: string, subscriptionId: string, nextSlot: DeliverySlot) {
  const subRef = adminDb.collection("subscriptions").doc(subscriptionId);
  await adminDb.runTransaction(async (tx) => {
    const subSnap = await tx.get(subRef);
    if (!subSnap.exists || subSnap.data()?.userId !== uid) throw new Error("Subscription not found");
    const sub = subSnap.data() as { status?: string; deliverySlot?: DeliverySlot };
    if (sub.status !== "ACTIVE") throw new Error("Only active subscriptions can change delivery slots");
    const currentSlot = sub.deliverySlot;
    if (!isSlot(currentSlot) || currentSlot === nextSlot) return;
    if (isSlotChangeLocked(currentSlot)) {
      throw new Error("Delivery slot changes are locked 20 minutes before the slot starts.");
    }
    const nextRef = counterRef(nextSlot);
    const currentRef = counterRef(currentSlot);
    const [nextSnap, currentSnap] = await Promise.all([tx.get(nextRef), tx.get(currentRef)]);
    const next = (nextSnap.data() || {}) as Counter;
    const current = (currentSnap.data() || {}) as Counter;
    if (Number(next.activeCount || 0) + Number(next.reservedCount || 0) >= CAPACITY) throw new Error(`The ${nextSlot} delivery slot is full. Please choose another slot.`);
    tx.set(nextRef, { ...next, activeCount: Number(next.activeCount || 0) + 1, initialized: true, updatedAt: FieldValue.serverTimestamp() });
    tx.set(currentRef, { ...current, activeCount: Math.max(0, Number(current.activeCount || 0) - 1), initialized: true, updatedAt: FieldValue.serverTimestamp() });
    tx.update(subRef, { deliverySlot: nextSlot, deliveryTime: nextSlot, updatedAt: FieldValue.serverTimestamp() });
  });
}

export async function GET() {
  try {
    await reconcileExpiredReservations();
    for (const slot of DELIVERY_SLOTS) await ensureCounter(slot);
    const counters = await Promise.all(DELIVERY_SLOTS.map((slot) => counterRef(slot).get()));
    return NextResponse.json(DELIVERY_SLOTS.map((slot, i) => {
      const c = (counters[i].data() || {}) as Counter;
      const active = Number(c.activeCount || 0);
      const pendingReservations = Number(c.reservedCount || 0);
      return { slot, count: active, pendingReservations, capacity: CAPACITY, available: active + pendingReservations < CAPACITY, remaining: Math.max(0, CAPACITY - active - pendingReservations) };
    }));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load delivery slots" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const decoded = await requireUser(request);
    const body = await request.json() as { action?: string; slot?: DeliverySlot; subscriptionId?: string; reservationId?: string };
    if (body.action === "reserve" && isSlot(body.slot) && body.subscriptionId) return NextResponse.json(await reserve(decoded.uid, body.slot, body.subscriptionId));
    if (body.action === "release") { await release(decoded.uid, body.reservationId); return NextResponse.json({ ok: true }); }
    if (body.action === "activate") return NextResponse.json({ ok: await activate(decoded.uid, body.reservationId) });
    if (body.action === "change" && isSlot(body.slot) && body.subscriptionId) { await changeSlot(decoded.uid, body.subscriptionId, body.slot); return NextResponse.json({ ok: true }); }
    return NextResponse.json({ error: "Invalid delivery-slot request" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delivery-slot request failed";
    return NextResponse.json({ error: message }, { status: message === "Sign in required" ? 401 : 400 });
  }
}
