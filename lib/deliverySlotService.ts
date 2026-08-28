import { auth } from "@/lib/firebase";

export const DELIVERY_SLOTS = ["7:00 AM – 9:00 AM", "12:00 PM – 2:00 PM", "7:00 PM – 9:00 PM"] as const;
export const DELIVERY_SLOT_CAPACITY = 50;
export const DELIVERY_RESERVATION_MINUTES = 15;
export type DeliverySlot = (typeof DELIVERY_SLOTS)[number];

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
  if (!DELIVERY_SLOTS.includes(slot)) throw new Error("Invalid delivery slot");
  return request<{ reservationId: string; expiresAt: string }>("POST", {
    action: "reserve",
    slot,
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
  if (!DELIVERY_SLOTS.includes(nextSlot)) throw new Error("Invalid delivery slot");
  await request("POST", { action: "change", subscriptionId, slot: nextSlot });
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
