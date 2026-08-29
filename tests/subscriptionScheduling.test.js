const test = require("node:test");
const assert = require("node:assert/strict");
const { getFirstDeliveryDate, getSubscriptionEndDate } = require("../lib/subscriptionSchedulingCore.js");
const { isSlotChangeLocked, SLOT_CHANGE_CUTOFF_MINUTES } = require("../lib/deliverySlotRulesCore.js");

function localDate(year, month, day, hour = 0, minute = 0) {
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

function dateOnly(date) {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()];
}

test("Friday 10 AM + morning slot starts Saturday", () => {
  const first = getFirstDeliveryDate(localDate(2026, 8, 28, 10), "7:00 AM – 9:00 AM");
  assert.deepEqual(dateOnly(first), [2026, 8, 29]);
});

test("Friday 6:30 AM + morning slot starts Friday", () => {
  const first = getFirstDeliveryDate(localDate(2026, 8, 28, 6, 30), "7:00 AM – 9:00 AM");
  assert.deepEqual(dateOnly(first), [2026, 8, 28]);
});

test("Friday 10 AM + afternoon slot starts Friday", () => {
  const first = getFirstDeliveryDate(localDate(2026, 8, 28, 10), "12:00 PM – 2:00 PM");
  assert.deepEqual(dateOnly(first), [2026, 8, 28]);
});

test("Friday 10 AM + evening slot starts Friday", () => {
  const first = getFirstDeliveryDate(localDate(2026, 8, 28, 10), "7:00 PM – 9:00 PM");
  assert.deepEqual(dateOnly(first), [2026, 8, 28]);
});

test("Sunday confirmation moves first delivery to Monday", () => {
  const first = getFirstDeliveryDate(localDate(2026, 8, 30, 10), "7:00 AM – 9:00 AM");
  assert.deepEqual(dateOnly(first), [2026, 8, 31]);
});

test("subscription ends six calendar days after first delivery", () => {
  const first = localDate(2026, 8, 28);
  const end = getSubscriptionEndDate(first);
  assert.deepEqual(dateOnly(end), [2026, 9, 3]);
  assert.equal(end.getHours(), 23);
  assert.equal(end.getMinutes(), 59);
  assert.equal(end.getSeconds(), 59);
});

test("delivery slot changes lock 20 minutes before slot start", () => {
  assert.equal(SLOT_CHANGE_CUTOFF_MINUTES, 20);
  assert.equal(isSlotChangeLocked("morning", localDate(2026, 8, 28, 6, 39)), false);
  assert.equal(isSlotChangeLocked("morning", localDate(2026, 8, 28, 6, 40)), true);
  assert.equal(isSlotChangeLocked("morning", localDate(2026, 8, 28, 7, 0)), true);
});
