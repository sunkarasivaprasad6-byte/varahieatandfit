const test = require("node:test");
const assert = require("node:assert/strict");
const {
  DELIVERY_SLOTS,
  normalizeDeliverySlot,
  countActiveSubscriptionsBySlot,
} = require("../lib/deliverySlotRulesCore.js");

const morning = "7:00 AM – 9:00 AM";
const afternoon = "12:00 PM – 2:00 PM";
const evening = "7:00 PM – 9:00 PM";

test("equivalent delivery slot formats normalize to one canonical label", () => {
  assert.equal(normalizeDeliverySlot("7:00 AM - 9:00 AM"), morning);
  assert.equal(normalizeDeliverySlot("7:00 AM – 9:00 AM"), morning);
  assert.equal(normalizeDeliverySlot("07:00 AM - 09:00 AM"), morning);
  assert.equal(normalizeDeliverySlot("7:00-09:00"), morning);
  assert.equal(normalizeDeliverySlot("12:00 PM - 2:00 PM"), afternoon);
  assert.equal(normalizeDeliverySlot("19:00-21:00"), evening);
});

test("active subscriptions are counted by canonical slot", () => {
  const subscriptions = [
    { status: "ACTIVE", deliverySlot: "7:00 AM - 9:00 AM", endDate: "2026-09-10T23:59:59.999Z" },
    { status: "ACTIVE", deliverySlot: "07:00 AM – 09:00 AM", endDate: "2026-09-10T23:59:59.999Z" },
    { status: "PENDING_PAYMENT", deliverySlot: morning, endDate: "2026-09-10T23:59:59.999Z" },
    { status: "CANCELLED", deliverySlot: morning, endDate: "2026-09-10T23:59:59.999Z" },
    { status: "ACTIVE", deliverySlot: afternoon, endDate: "2026-08-20T23:59:59.999Z" },
    { status: "ACTIVE", deliverySlot: evening, endDate: "2026-09-10T23:59:59.999Z" },
    { status: "ACTIVE", deliverySlot: "not-a-slot", endDate: "2026-09-10T23:59:59.999Z" },
  ];

  const counts = countActiveSubscriptionsBySlot(subscriptions, new Date("2026-08-29T12:00:00.000Z"));
  assert.deepEqual(counts, {
    [DELIVERY_SLOTS[0].label]: 2,
    [DELIVERY_SLOTS[1].label]: 0,
    [DELIVERY_SLOTS[2].label]: 1,
  });
});

test("an active subscription with no expired end date is counted, while invalid expiry is excluded", () => {
  const subscriptions = [
    { status: "ACTIVE", deliverySlot: morning },
    { status: "ACTIVE", deliverySlot: morning, endDate: "not-a-date" },
  ];
  const counts = countActiveSubscriptionsBySlot(subscriptions, new Date("2026-08-29T12:00:00.000Z"));
  assert.equal(counts[morning], 1);
});
