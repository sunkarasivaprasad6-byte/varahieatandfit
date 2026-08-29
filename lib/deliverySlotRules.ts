import core from "./deliverySlotRulesCore";

export const DELIVERY_SLOTS = core.DELIVERY_SLOTS as ReadonlyArray<{
  id: "morning" | "afternoon" | "evening";
  label: string;
  startHour: number;
  startMinute: number;
}>;

export const DELIVERY_SLOT_LABELS = DELIVERY_SLOTS.map((slot) => slot.label);
export type DeliverySlotId = (typeof DELIVERY_SLOTS)[number]["id"];

export const SLOT_CHANGE_CUTOFF_MINUTES = 30;

export function getSlot(slotIdOrLabel: string | undefined) {
  return core.getSlot(core.normalizeDeliverySlot(slotIdOrLabel) || slotIdOrLabel);
}

export function normalizeDeliverySlot(value: string | undefined) {
  return core.normalizeDeliverySlot(value);
}

export function countActiveSubscriptionsBySlot(subscriptions: unknown[], now = new Date()) {
  return core.countActiveSubscriptionsBySlot(subscriptions, now) as Record<string, number>;
}

export function isSlotChangeLocked(slotId: string | undefined, now = new Date()) {
  return core.isSlotChangeLocked(slotId, now);
}

export function isSlotEligibleForNewSubscription(slotId: string | undefined, now = new Date(), minimumLeadMinutes = 30) {
  return core.isSlotEligibleForNewSubscription(slotId, now, minimumLeadMinutes);
}
