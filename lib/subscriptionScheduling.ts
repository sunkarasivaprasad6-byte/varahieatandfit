const DELIVERY_SLOT_STARTS: Record<string, { hour: number; minute: number }> = {
  "7:00 AM – 9:00 AM": { hour: 7, minute: 0 },
  "12:00 PM – 2:00 PM": { hour: 12, minute: 0 },
  "7:00 PM – 9:00 PM": { hour: 19, minute: 0 },
};

function nextDeliveryDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  if (result.getDay() === 0) result.setDate(result.getDate() + 1);
  return result;
}

/**
 * Calculates the first eligible delivery at owner-confirmation time.
 * Subscriptions deliver Monday-Saturday; Sunday is never a delivery day.
 * If today's selected slot has already started, delivery moves to the next
 * available delivery day. The 20-minute cutoff is intentionally not used here;
 * it applies only to changing an existing delivery slot.
 */
export function getFirstDeliveryDate(confirmationTime: Date, deliverySlot: string) {
  const result = nextDeliveryDay(confirmationTime);
  const slotStart = DELIVERY_SLOT_STARTS[deliverySlot];

  if (!slotStart) return result;

  const isToday = result.toDateString() === confirmationTime.toDateString();
  if (isToday) {
    const slotStartTime = new Date(result);
    slotStartTime.setHours(slotStart.hour, slotStart.minute, 0, 0);
    if (confirmationTime >= slotStartTime) {
      result.setDate(result.getDate() + 1);
      if (result.getDay() === 0) result.setDate(result.getDate() + 1);
    }
  }

  return result;
}

/**
 * A weekly plan contains six delivery days (Monday-Saturday), so the
 * subscription window ends six calendar days after its first delivery date.
 */
export function getSubscriptionEndDate(firstDeliveryDate: Date) {
  const end = new Date(firstDeliveryDate);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}
