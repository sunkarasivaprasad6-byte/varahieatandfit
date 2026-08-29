import core from "./subscriptionSchedulingCore";

/**
 * Canonical subscription scheduling rules shared by admin flows.
 * Subscriptions deliver Monday-Saturday; Sunday is never a delivery day.
 * The first delivery is determined at owner-confirmation time.
 */
export function getFirstDeliveryDate(confirmationTime: Date, deliverySlot: string): Date {
  return core.getFirstDeliveryDate(confirmationTime, deliverySlot);
}

/**
 * A weekly plan contains six delivery days (Monday-Saturday), so the
 * subscription window ends six calendar days after its first delivery date.
 */
export function getSubscriptionEndDate(firstDeliveryDate: Date): Date {
  return core.getSubscriptionEndDate(firstDeliveryDate);
}
