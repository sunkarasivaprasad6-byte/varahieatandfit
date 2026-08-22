import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export type AdminMealSchedule = {
  id?: string;
  planId: string;
  day: string;
  name: string;
  image?: string;
  calories: number;
  protein: number;
  active: boolean;
};

export type DeliverySlot = {
  id?: string;
  label: string;
  active: boolean;
  cutoffMinutes: number;
};

export const FALLBACK_DELIVERY_SLOTS: DeliverySlot[] = [
  { label: "5:00 PM – 6:00 PM", active: true, cutoffMinutes: 120 },
  { label: "6:00 PM – 7:00 PM", active: true, cutoffMinutes: 120 },
  { label: "7:00 PM – 8:00 PM", active: true, cutoffMinutes: 120 },
];

export async function getAdminMealSchedules(planId: string) {
  const snap = await getDocs(
    query(collection(db, "mealSchedules"), where("planId", "==", planId))
  );
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<AdminMealSchedule, "id">) }))
    .filter((meal) => meal.active)
    .sort((a, b) => a.day.localeCompare(b.day)) as AdminMealSchedule[];
}

export async function getAdminDeliverySlots() {
  const snap = await getDocs(collection(db, "deliverySlots"));
  const slots = snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<DeliverySlot, "id">) }))
    .filter((slot) => slot.active)
    .sort((a, b) => a.label.localeCompare(b.label)) as DeliverySlot[];

  return slots.length ? slots : FALLBACK_DELIVERY_SLOTS;
}

function parseSlotStart(label: string) {
  const match = label.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3].toUpperCase();
  if (meridiem === "PM" && hour !== 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;
  return { hour, minute };
}

export function isDeliverySlotModifiable(slot: DeliverySlot) {
  const start = parseSlotStart(slot.label);
  if (!start) return true;
  const now = new Date();
  const slotStart = new Date(now);
  slotStart.setHours(start.hour, start.minute, 0, 0);
  const cutoff = new Date(slotStart.getTime() - Math.max(0, slot.cutoffMinutes) * 60000);
  return now.getTime() < cutoff.getTime();
}

export function mealScheduleMap(meals: AdminMealSchedule[]) {
  return meals.reduce<Record<string, AdminMealSchedule>>((map, meal) => {
    map[meal.day.toLowerCase()] = meal;
    return map;
  }, {});
}
