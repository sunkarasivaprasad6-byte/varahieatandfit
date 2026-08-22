import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export const DELIVERY_SLOTS = [
  "7:00 AM – 9:00 AM",
  "12:00 PM – 2:00 PM",
  "7:00 PM – 9:00 PM",
] as const;

export const DELIVERY_SLOT_CAPACITY = 50;
export type DeliverySlot = (typeof DELIVERY_SLOTS)[number];

export async function getDeliverySlotCounts() {
  const counts: Record<DeliverySlot, number> = {
    "7:00 AM – 9:00 AM": 0,
    "12:00 PM – 2:00 PM": 0,
    "7:00 PM – 9:00 PM": 0,
  };

  const snap = await getDocs(
    query(collection(db, "subscriptions"), where("status", "==", "ACTIVE"))
  );

  for (const item of snap.docs) {
    const slot = item.data().deliverySlot as DeliverySlot | undefined;
    if (slot && slot in counts) counts[slot] += 1;
  }

  return counts;
}

export async function getDeliverySlotAvailability() {
  const counts = await getDeliverySlotCounts();
  return DELIVERY_SLOTS.map((slot) => ({
    slot,
    count: counts[slot],
    capacity: DELIVERY_SLOT_CAPACITY,
    available: counts[slot] < DELIVERY_SLOT_CAPACITY,
    remaining: Math.max(0, DELIVERY_SLOT_CAPACITY - counts[slot]),
  }));
}
