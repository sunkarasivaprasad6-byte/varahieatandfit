const DELIVERY_SLOTS = [
  { id: "morning", label: "7:00 AM – 9:00 AM", startHour: 7, startMinute: 0 },
  { id: "afternoon", label: "12:00 PM – 2:00 PM", startHour: 12, startMinute: 0 },
  { id: "evening", label: "7:00 PM – 9:00 PM", startHour: 19, startMinute: 0 },
];

const SLOT_CHANGE_CUTOFF_MINUTES = 20;

function getSlot(slotId) {
  return DELIVERY_SLOTS.find((slot) => slot.id === slotId);
}

function isSlotChangeLocked(slotId, now = new Date()) {
  const slot = getSlot(slotId);
  if (!slot) return false;
  const cutoff = new Date(now);
  cutoff.setHours(slot.startHour, slot.startMinute - SLOT_CHANGE_CUTOFF_MINUTES, 0, 0);
  return now >= cutoff;
}

module.exports = { DELIVERY_SLOTS, SLOT_CHANGE_CUTOFF_MINUTES, getSlot, isSlotChangeLocked };
