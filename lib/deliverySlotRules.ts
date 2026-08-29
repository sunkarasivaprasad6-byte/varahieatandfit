import core from "./deliverySlotRulesCore";

export const DELIVERY_SLOTS = core.DELIVERY_SLOTS as ReadonlyArray<{
  id: "morning" | "afternoon" | "evening";
  label: string;
  startHour: number;
  startMinute: number;
}>;

export type DeliverySlotId = (typeof DELIVERY_SLOTS)[number]["id"];

export const SLOT_CHANGE_CUTOFF_MINUTES = 20;

export function getSlot(slotId: string | undefined) {
  return core.getSlot(slotId);
}

export function isSlotChangeLocked(slotId: string | undefined, now = new Date()) {
  return core.isSlotChangeLocked(slotId, now);
}
