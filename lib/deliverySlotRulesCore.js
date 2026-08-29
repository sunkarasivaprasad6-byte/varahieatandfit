const DELIVERY_SLOTS = [
  { id: "morning", label: "7:00 AM – 9:00 AM", startHour: 7, startMinute: 0 },
  { id: "afternoon", label: "12:00 PM – 2:00 PM", startHour: 12, startMinute: 0 },
  { id: "evening", label: "7:00 PM – 9:00 PM", startHour: 19, startMinute: 0 },
];

// A regular delivery slot can be changed until 30 minutes before its start.
// The 12–2 PM slot has a business cutoff of 11:30 PM for changing the
// regular slot (the change applies to the subscription's regular schedule,
// not to today's already-passed delivery).
const SLOT_CHANGE_CUTOFF_MINUTES = 30;
const AFTERNOON_CHANGE_CUTOFF_HOUR = 23;
const AFTERNOON_CHANGE_CUTOFF_MINUTE = 30;

function getSlot(slotIdOrLabel) {
  return DELIVERY_SLOTS.find(
    (slot) => slot.id === slotIdOrLabel || slot.label === slotIdOrLabel
  );
}

function toMinutes(hour, minute, meridiem) {
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  if (meridiem) {
    if (hour < 1 || hour > 12) return null;
    const normalizedHour = hour % 12 + (meridiem.toUpperCase() === "PM" ? 12 : 0);
    return normalizedHour * 60 + minute;
  }
  return hour <= 23 ? hour * 60 + minute : null;
}

function parseSlotEndpoint(hourText, minuteText, meridiem) {
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return [];

  if (meridiem) {
    const minutes = toMinutes(hour, minute, meridiem);
    return minutes === null ? [] : [minutes];
  }

  // 24-hour inputs such as 19:00 are unambiguous. For 1–12 without AM/PM,
  // keep both possibilities; normalizeDeliverySlot applies the morning
  // preference for the common shorthand "7:00-09:00".
  if (hour > 12) {
    const minutes = toMinutes(hour, minute);
    return minutes === null ? [] : [minutes];
  }
  const am = toMinutes(hour, minute, "AM");
  const pm = toMinutes(hour, minute, "PM");
  return [am, pm].filter((value) => value !== null);
}

function normalizeDeliverySlot(value) {
  if (typeof value !== "string") return undefined;
  const input = value.trim().replace(/[–—−]/g, "-").replace(/\s+/g, " ");
  const match = input.match(/^\s*(\d{1,2}):?(\d{2})\s*(AM|PM)?\s*-\s*(\d{1,2}):?(\d{2})\s*(AM|PM)?\s*$/i);
  if (!match) return undefined;

  const [, startHour, startMinute, startMeridiem, endHour, endMinute, endMeridiem] = match;
  const startCandidates = parseSlotEndpoint(startHour, startMinute, startMeridiem);
  const endCandidates = parseSlotEndpoint(endHour, endMinute, endMeridiem);
  if (!startCandidates.length || !endCandidates.length) return undefined;

  const exactMatches = DELIVERY_SLOTS.filter((slot) => {
    const start = slot.startHour * 60 + slot.startMinute;
    const end = start + 120;
    return startCandidates.includes(start) && endCandidates.includes(end);
  });
  if (exactMatches.length === 1) return exactMatches[0].label;

  // The requested shorthand "7:00-09:00" is conventionally the morning
  // slot in this application. Prefer AM when neither endpoint specifies a
  // meridiem and both endpoints are in the 1–12 hour range.
  if (!startMeridiem && !endMeridiem && Number(startHour) <= 12 && Number(endHour) <= 12) {
    const morning = DELIVERY_SLOTS.find((slot) => slot.id === "morning");
    const morningStart = morning.startHour * 60 + morning.startMinute;
    if (startCandidates.includes(morningStart) && endCandidates.includes(morningStart + 120)) {
      return morning.label;
    }
  }

  return undefined;
}

function countActiveSubscriptionsBySlot(subscriptions, now = new Date()) {
  const counts = Object.fromEntries(DELIVERY_SLOTS.map((slot) => [slot.label, 0]));
  for (const subscription of subscriptions || []) {
    if (!subscription || subscription.status !== "ACTIVE") continue;
    if (subscription.endDate) {
      const end = new Date(subscription.endDate);
      if (Number.isNaN(end.getTime()) || end.getTime() < now.getTime()) continue;
    }
    const canonicalSlot = normalizeDeliverySlot(subscription.deliverySlot || subscription.deliveryTime);
    if (canonicalSlot && Object.prototype.hasOwnProperty.call(counts, canonicalSlot)) counts[canonicalSlot] += 1;
  }
  return counts;
}

function isSameDay(now, target) {
  return now.getFullYear() === target.getFullYear()
    && now.getMonth() === target.getMonth()
    && now.getDate() === target.getDate();
}

function isSlotChangeLocked(slotIdOrLabel, now = new Date()) {
  const slot = getSlot(normalizeDeliverySlot(slotIdOrLabel) || slotIdOrLabel);
  if (!slot) return false;

  // Business rule: 12–2 PM can be selected/changed as the regular slot
  // until 11:30 PM. This does not make today's passed delivery available.
  if (slot.id === "afternoon") {
    const cutoff = new Date(now);
    cutoff.setHours(AFTERNOON_CHANGE_CUTOFF_HOUR, AFTERNOON_CHANGE_CUTOFF_MINUTE, 0, 0);
    return now >= cutoff;
  }

  const cutoff = new Date(now);
  cutoff.setHours(slot.startHour, slot.startMinute - SLOT_CHANGE_CUTOFF_MINUTES, 0, 0);
  return now >= cutoff;
}

function isSlotEligibleForNewSubscription(slotIdOrLabel, now = new Date(), minimumLeadMinutes = 30) {
  const slot = getSlot(normalizeDeliverySlot(slotIdOrLabel) || slotIdOrLabel);
  if (!slot) return false;

  // For today's first delivery, a slot is eligible only when its delivery
  // start is still at least 30 minutes away. Once a slot has started/passed,
  // it must not be offered as today's first delivery.
  const start = new Date(now);
  start.setHours(slot.startHour, slot.startMinute, 0, 0);
  return start.getTime() - now.getTime() >= minimumLeadMinutes * 60 * 1000;
}

module.exports = {
  DELIVERY_SLOTS,
  SLOT_CHANGE_CUTOFF_MINUTES,
  getSlot,
  normalizeDeliverySlot,
  countActiveSubscriptionsBySlot,
  isSlotChangeLocked,
  isSlotEligibleForNewSubscription,
};
