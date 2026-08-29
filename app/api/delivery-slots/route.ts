import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import core from "@/lib/deliverySlotRulesCore";

export const runtime = "nodejs";

const { DELIVERY_SLOTS, countActiveSubscriptionsBySlot, normalizeDeliverySlot, isSlotChangeLocked } = core;
const SLOT_LABELS = DELIVERY_SLOTS.map((slot) => slot.label);
const CAPACITY = 50;
const RESERVATION_MINUTES = 15;
type DeliverySlot = string;
type ReservationStatus = "ACTIVE" | "RELEASED" | "ACTIVATED" | "EXPIRED";
type Counter = { activeCount?: number; reservedCount?: number; initialized?: boolean };
type TimestampLike = { toMillis(): number };

function canonicalSlot(value: unknown) {
  return normalizeDeliverySlot(typeof value === "string" ? value : undefined);
}

function slotKey(slot: DeliverySlot) {
  return slot.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase();
}

function counterRef(slot: DeliverySlot) {
  return adminDb.collection("deliverySlotCounters").doc(slotKey(slot));
}

async function requireUser(request: NextRequest) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) throw new Error("Sign in required");
  return adminAuth.verifyIdToken(header.slice(7));
}

async function reconcileExpiredReservations() {
  const snap = await adminDb.collection("deliverySlotReservations").where("status", "==", "ACTIVE").get();
  const now = Date.now();
  for (const docSnap of snap.docs) {
    const data = docSnap.data() as { slot?: string; expiresAt?: TimestampLike };
    const slot = canonicalSlot(data.slot);
    if (!slot || !data.expiresAt || data.expiresAt.toMillis() > now) continue;
    await adminDb.runTransaction(async (tx) => {
      const latest = await tx.get(docSnap.ref);
      if (!latest.exists || latest.data()?.status !== "ACTIVE") return;
      const counter = counterRef(slot);
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
  const activeCount = countActiveSubscriptionsBySlot(activeSnap.docs.map((d) => d.data()))[slot] || 0;
  const reservedCount = reservations.docs.filter((d) => canonicalSlot(d.data()?.slot) === slot && !isReservationExpired(d.data()?.expiresAt)).length;
  await adminDb.runTransaction(async (tx) => {
    const latest = await tx.get(ref);
    if (!latest.exists) tx.set(ref, { activeCount, reservedCount, initialized: true, updatedAt: FieldValue.serverTimestamp() });
  });
}

function isReservationExpired(value: unknown) {
  if (!value || typeof (value as TimestampLike).toMillis !== "function") return false;
  return (value as TimestampLike).toMillis() <= Date.now();
}

async function getLiveSlotCapacity() {
  const [activeSnap, reservationSnap] = await Promise.all([
    adminDb.collection("subscriptions").where("status", "==", "ACTIVE").get(),
    adminDb.collection("deliverySlotReservations").where("status", "==", "ACTIVE").get(),
  ]);
  const activeCounts = countActiveSubscriptionsBySlot(activeSnap.docs.map((d) => d.data())) as Record<string, number>;
  const pendingCounts: Record<string, number> = Object.fromEntries(SLOT_LABELS.map((slot) => [slot, 0]));
  for (const docSnap of reservationSnap.docs) {
    const data = docSnap.data();
    const slot = canonicalSlot(data.slot);
    if (slot && !isReservationExpired(data.expiresAt)) pendingCounts[slot] += 1;
  }
  return { activeCounts, pendingCounts };
}

async function getLiveActiveCount(slot: DeliverySlot) {
  const activeSnap = await adminDb.collection("subscriptions").where("status", "==", "ACTIVE").get();
  return (countActiveSubscriptionsBySlot(activeSnap.docs.map((d) => d.data())) as Record<string, number>)[slot] || 0;
}

async function reserve(uid: string, slot: DeliverySlot, subscriptionId: string) {
  const subRef = adminDb.collection("subscriptions").doc(subscriptionId);
  const subSnap = await subRef.get();
  if (!subSnap.exists || subSnap.data()?.userId !== uid) throw new Error("Subscription not found");
  if (subSnap.data()?.status !== "PENDING_PAYMENT") throw new Error("Subscription is not available for checkout");

  await reconcileExpiredReservations();
  await ensureCounter(slot);
  const liveActiveCount = await getLiveActiveCount(slot);
  const counter = counterRef(slot);
  const reservationRef = adminDb.collection("deliverySlotReservations").doc();
  const expiresAt = new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000);

  await adminDb.runTransaction(async (tx) => {
    const counterSnap = await tx.get(counter);
    const data = (counterSnap.data() || {}) as Counter;
    const activeCount = Math.max(Number(data.activeCount || 0), liveActiveCount);
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
    const data = snap.data() as { subscriptionId?: string; slot?: string; status?: ReservationStatus };
    const slot = canonicalSlot(data.slot);
    if (!data.subscriptionId || !slot) return;
    const sub = await tx.get(adminDb.collection("subscriptions").doc(data.subscriptionId));
    if (!sub.exists || sub.data()?.userId !== uid) throw new Error("Reservation not found");
    if (data.status !== "ACTIVE") return;
    const counter = counterRef(slot);
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
    const data = snap.data() as { subscriptionId?: string; slot?: string; status?: ReservationStatus; expiresAt?: TimestampLike };
    const slot = canonicalSlot(data.slot);
    if (!data.subscriptionId || !slot) throw new Error("Invalid reservation");
    const subRef = adminDb.collection("subscriptions").doc(data.subscriptionId);
    const subSnap = await tx.get(subRef);
    if (!subSnap.exists || subSnap.data()?.userId !== uid) throw new Error("Subscription not found");
    if (data.status === "ACTIVATED") return true;
    if (data.status !== "ACTIVE") throw new Error("Delivery slot reservation is no longer available");
    if (!data.expiresAt || data.expiresAt.toMillis() <= Date.now()) throw new Error("Delivery slot reservation expired. Please choose the slot again.");
    const counter = counterRef(slot);
    const counterSnap = await tx.get(counter);
    const c = (counterSnap.data() || {}) as Counter;
    if (Number(c.activeCount || 0) >= CAPACITY) throw new Error(`The ${slot} delivery slot is full. Please choose another slot.`);
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
    const sub = subSnap.data() as { status?: string; deliverySlot?: string };
    if (sub.status !== "ACTIVE") throw new Error("Only active subscriptions can change delivery slots");
    const currentSlot = canonicalSlot(sub.deliverySlot);
    if (!currentSlot || currentSlot === nextSlot) return;
    if (isSlotChangeLocked(nextSlot)) throw new Error("The selected new delivery slot is locked for changes. Please choose another slot.");

    const nextRef = counterRef(nextSlot);
    const currentRef = counterRef(currentSlot);
    const [nextSnap, currentSnap] = await Promise.all([tx.get(nextRef), tx.get(currentRef)]);
    const next = (nextSnap.data() || {}) as Counter;
    const current = (currentSnap.data() || {}) as Counter;
    if (Number(next.activeCount || 0) + Number(next.reservedCount || 0) >= CAPACITY) throw new Error(`The ${nextSlot} delivery slot is full. Please choose another slot.`);
    tx.set(nextRef, { ...next, activeCount: Number(next.activeCount || 0) + 1, initialized: true, updatedAt: FieldValue.serverTimestamp() });
    tx.set(currentRef, { ...current, activeCount: Math.max(0, Number(current.activeCount || 0) - 1), initialized: true, updatedAt: FieldValue.serverTimestamp() });
    tx.update(subRef, { deliverySlot: nextSlot, deliveryTime: nextSlot, regularDeliverySlot: nextSlot, updatedAt: FieldValue.serverTimestamp() });
  });
}

export async function GET() {
  try {
    const { activeCounts, pendingCounts } = await getLiveSlotCapacity();
    return NextResponse.json(SLOT_LABELS.map((slot) => {
      const active = Number(activeCounts[slot] || 0);
      const pendingReservations = Number(pendingCounts[slot] || 0);
      return { slot, count: active, pendingReservations, capacity: CAPACITY, available: active + pendingReservations < CAPACITY, remaining: Math.max(0, CAPACITY - active - pendingReservations) };
    }));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load delivery slots" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const decoded = await requireUser(request);
    const body = await request.json() as { action?: string; slot?: string; subscriptionId?: string; reservationId?: string };
    const slot = canonicalSlot(body.slot);
    if (body.action === "reserve" && slot && body.subscriptionId) return NextResponse.json(await reserve(decoded.uid, slot, body.subscriptionId));
    if (body.action === "release") { await release(decoded.uid, body.reservationId); return NextResponse.json({ ok: true }); }
    if (body.action === "activate") return NextResponse.json({ ok: await activate(decoded.uid, body.reservationId) });
    if (body.action === "change" && slot && body.subscriptionId) { await changeSlot(decoded.uid, body.subscriptionId, slot); return NextResponse.json({ ok: true }); }
    return NextResponse.json({ error: "Invalid delivery-slot request" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delivery-slot request failed";
    return NextResponse.json({ error: message }, { status: message === "Sign in required" ? 401 : 400 });
  }
}
