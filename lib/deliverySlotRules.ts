export const DELIVERY_SLOTS = [
  { id: "morning", label: "7:00 AM – 9:00 AM", startHour: 7, startMinute: 0 },
  { id: "afternoon", label: "12:00 PM – 2:00 PM", startHour: 12, startMinute: 0 },
  { id: "evening", label: "7:00 PM – 9:00 PM", startHour: 19, startMinute: 0 },
] as const;

export type DeliverySlotId = (typeof DELIVERY_SLOTS)[number]["id"];

export const SLOT_CHANGE_CUTOFF_MINUTES = 20;

export function getSlot(slotId: string | undefined) {
  return DELIVERY_SLOTS.find((slot) => slot.id === slotId);
}

export function isSlotChangeLocked(slotId: string | undefined, now = new Date()) {
  const slot = getSlot(slotId);
  if (!slot) return false;

  const cutoff = new Date(now);
  cutoff.setHours(slot.startHour, slot.startMinute - SLOT_CHANGE_CUTOFF_MINUTES, 0, 0);
  return now >= cutoff;
}
