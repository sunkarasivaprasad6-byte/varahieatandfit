import { auth } from "@/lib/firebase";
import { DELIVERY_SLOT_LABELS, normalizeDeliverySlot } from "@/lib/deliverySlotRules";

export const DELIVERY_SLOTS = DELIVERY_SLOT_LABELS;
export const DELIVERY_SLOT_CAPACITY = 50;
export const DELIVERY_RESERVATION_MINUTES = 15;
export type DeliverySlot = string;

type SlotAvailability = {
  slot: DeliverySlot;
  count: number;
  pendingReservations: number;
  capacity: number;
  available: boolean;
  remaining: number;
};

async function request<T>(method: "GET" | "POST", body?: unknown): Promise<T> {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (method === "POST") {
    const user = auth.currentUser;
    if (!user) throw new Error("Sign in required");
    headers.Authorization = `Bearer ${await user.getIdToken()}`;
  }

  const response = await fetch("/api/delivery-slots", {
    method,
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error || "Delivery-slot request failed");
  return data as T;
}

export async function reserveDeliverySlot(slot: DeliverySlot, subscriptionId: string) {
  const canonicalSlot = normalizeDeliverySlot(slot);
  if (!canonicalSlot || !DELIVERY_SLOTS.includes(canonicalSlot)) throw new Error("Invalid delivery slot");
  return request<{ reservationId: string; expiresAt: string }>("POST", {
    action: "reserve",
    slot: canonicalSlot,
    subscriptionId,
  });
}

export async function releaseDeliverySlotReservation(reservationId?: string, _status: "RELEASED" | "EXPIRED" = "RELEASED") {
  if (!reservationId) return;
  await request("POST", { action: "release", reservationId });
}

export async function activateDeliverySlotReservation(reservationId?: string) {
  if (!reservationId) return false;
  const result = await request<{ ok: boolean }>("POST", { action: "activate", reservationId });
  return result.ok;
}

export async function changeActiveDeliverySlot(subscriptionId: string, nextSlot: DeliverySlot) {
  const canonicalSlot = normalizeDeliverySlot(nextSlot);
  if (!canonicalSlot || !DELIVERY_SLOTS.includes(canonicalSlot)) throw new Error("Invalid delivery slot");
  await request("POST", { action: "change", subscriptionId, slot: canonicalSlot });
}

export async function reconcileDeliverySlotCounters() {
  // Reconciliation now happens only on the trusted server endpoint.
  await request<SlotAvailability[]>("GET");
}

export async function getDeliverySlotCounts() {
  const slots = await request<SlotAvailability[]>("GET");
  return slots.reduce((counts, item) => {
    counts[item.slot] = item.count;
    return counts;
  }, {} as Record<DeliverySlot, number>);
}

export async function getDeliverySlotAvailability() {
  return request<SlotAvailability[]>("GET");
}
