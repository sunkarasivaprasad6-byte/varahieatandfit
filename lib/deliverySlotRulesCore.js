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

function isSameDay(now, target) {
  return now.getFullYear() === target.getFullYear()
    && now.getMonth() === target.getMonth()
    && now.getDate() === target.getDate();
}

function isSlotChangeLocked(slotIdOrLabel, now = new Date()) {
  const slot = getSlot(slotIdOrLabel);
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
  const slot = getSlot(slotIdOrLabel);
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
  isSlotChangeLocked,
  isSlotEligibleForNewSubscription,
};
