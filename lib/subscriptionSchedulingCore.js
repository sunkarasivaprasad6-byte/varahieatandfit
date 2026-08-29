const DELIVERY_SLOT_STARTS = {
  "7:00 AM – 9:00 AM": { hour: 7, minute: 0 },
  "12:00 PM – 2:00 PM": { hour: 12, minute: 0 },
  "7:00 PM – 9:00 PM": { hour: 19, minute: 0 },
};

function nextDeliveryDay(date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  while (result.getDay() === 0) result.setDate(result.getDate() + 1);
  return result;
}

function getFirstDeliveryDate(confirmationTime, deliverySlot) {
  const result = nextDeliveryDay(confirmationTime);
  const slotStart = DELIVERY_SLOT_STARTS[deliverySlot];
  if (!slotStart) return result;

  const isToday = result.toDateString() === confirmationTime.toDateString();
  if (isToday) {
    const slotStartTime = new Date(result);
    slotStartTime.setHours(slotStart.hour, slotStart.minute, 0, 0);
    if (confirmationTime >= slotStartTime) {
      result.setDate(result.getDate() + 1);
      while (result.getDay() === 0) result.setDate(result.getDate() + 1);
    }
  }
  return result;
}

function getSubscriptionEndDate(firstDeliveryDate) {
  const end = new Date(firstDeliveryDate);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

module.exports = { getFirstDeliveryDate, getSubscriptionEndDate };
