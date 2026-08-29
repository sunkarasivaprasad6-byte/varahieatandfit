import core from "./deliverySlotRulesCore";

export const DELIVERY_SLOTS = core.DELIVERY_SLOTS as readonly [
  { id: "morning"; label: "7:00 AM – 9:00 AM"; startHour: 7; startMinute: 0 },
  { id: "afternoon"; label: "12:00 PM – 2:00 PM"; startHour: 12; startMinute: 0 },
  { id: "evening"; label: "7:00 PM – 9:00 PM"; startHour: 19; startMinute: 0 },
];

export type DeliverySlotId = (typeof DELIVERY_SLOTS)[number]["id"];

export const SLOT_CHANGE_CUTOFF_MINUTES = 20;

export function getSlot(slotId: string | undefined) {
  return core.getSlot(slotId);
}

export function isSlotChangeLocked(slotId: string | undefined, now = new Date()) {
  return core.isSlotChangeLocked(slotId, now);
}
