"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  changeActiveDeliverySlot,
  getDeliverySlotAvailability,
  DELIVERY_SLOTS,
  type DeliverySlot,
} from "@/lib/deliverySlotService";
import {
  subscribeToActiveSubscription,
  updateSubscription,
  type Subscription,
  type SkippedMealRecord,
} from "@/lib/subscriptionService";
import { DAYS, getPlan } from "@/lib/subscriptionData";
import { getAdminMealSchedules, mealScheduleMap, type AdminMealSchedule } from "@/lib/mealDeliveryService";
import { isSlotChangeLocked } from "@/lib/deliverySlotRules";
import { toast } from "react-hot-toast";

type SlotAvailability = Awaited<ReturnType<typeof getDeliverySlotAvailability>>[number];

function isoDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function localDateFromIso(value: string) {
  return isoDate(new Date(value));
}

function tomorrowDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return isoDate(date);
}

function remainingDays(date: string) {
  return Math.max(0, Math.ceil((new Date(date).getTime() - Date.now()) / 86400000));
}

function todayKey() {
  const index = new Date().getDay();
  return index === 0 ? null : DAYS[index - 1];
}

function slotLabel(value?: string) {
  return DELIVERY_SLOTS.includes(value as DeliverySlot) ? value : "Not selected";
}

/**
 * A skip belongs to the calendar date on which it was created.
 * The record remains the single source of truth even after it is rescheduled.
 * This is deliberately NOT limited to AVAILABLE records: once today's skip is
 * rescheduled to today, the customer must not be able to create another skip.
 */
function todaySkipRecord(records: SkippedMealRecord[]) {
  const today = isoDate();
  return records.find(
    (record) =>
      localDateFromIso(record.skippedAt) === today &&
      record.status !== "EXPIRED" &&
      record.status !== "USED",
  );
}

export default function MySubscription() {
  const [sub, setSub] = useState<Subscription | null>(null);
  const [ready, setReady] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<DeliverySlot | "">("");
  const [slotAvailability, setSlotAvailability] = useState<SlotAvailability[]>([]);
  const [scheduleId, setScheduleId] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleSlot, setScheduleSlot] = useState<DeliverySlot | "">("");
  const [adminMeals, setAdminMeals] = useState<AdminMealSchedule[]>([]);
  const [savingSlot, setSavingSlot] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);

  useEffect(() => {
    let subscriptionUnsubscribe: (() => void) | undefined;
    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      setReady(true);
      subscriptionUnsubscribe?.();
      subscriptionUnsubscribe = undefined;

      if (!user) {
        setSub(null);
        return;
      }

      subscriptionUnsubscribe = subscribeToActiveSubscription(user.uid, (subscription) => {
        setSub(subscription);
        setSelectedSlot(subscription?.deliverySlot || "");
      });
    });

    return () => {
      subscriptionUnsubscribe?.();
      authUnsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!sub) return;
    getAdminMealSchedules(sub.planId)
      .then(setAdminMeals)
      .catch((error) => console.error("Failed to load admin meals", error));
  }, [sub?.id, sub?.planId]);

  useEffect(() => {
    let mounted = true;
    getDeliverySlotAvailability()
      .then((items) => mounted && setSlotAvailability(items))
      .catch((error) => console.error("Failed to load delivery slot availability", error));
    return () => {
      mounted = false;
    };
  }, [sub?.id, sub?.deliverySlot]);

  const records = (sub?.skippedMealRecords || []) as SkippedMealRecord[];
  const available = records.filter(
    (record) => record.status === "AVAILABLE" && remainingDays(record.expiresAt) > 0,
  );
  const scheduled = records.filter((record) => record.status === "SCHEDULED");
  const skippedToday = todaySkipRecord(records);

  const today = todayKey();
  const plan = sub ? getPlan(sub.planId) : null;
  const fallbackMeal = today
    ? plan?.meals[today.toLowerCase() as keyof typeof plan.meals]
    : null;
  const adminMealMap = useMemo(() => mealScheduleMap(adminMeals), [adminMeals]);
  const adminMeal = today ? adminMealMap[today.toLowerCase()] : undefined;
  const meal = adminMeal || fallbackMeal;
  const endDays = sub ? remainingDays(sub.endDate) : 0;
  const currentAvailability = slotAvailability.find((item) => item.slot === sub?.deliverySlot);
  const scheduledForToday = scheduled.filter((record) => record.scheduledFor === isoDate());

  async function saveRecords(next: SkippedMealRecord[]) {
    if (!sub?.id) return;
    await updateSubscription(sub.id, {
      skippedMeals: next.filter((record) => record.status === "AVAILABLE").length,
      skippedMealRecords: next,
    });
  }

  async function skipToday() {
    if (!sub?.id || !today || !meal) {
      toast.error("There is no subscription meal scheduled today.");
      return;
    }

    // Important: check the calendar date, not just AVAILABLE status.
    // This prevents skip -> schedule today -> skip -> schedule -> infinite credits.
    if (skippedToday) {
      toast.error("Today's meal has already been skipped. Use that skipped meal to schedule it instead.");
      return;
    }

    const now = new Date();
    const expires = new Date(now);
    expires.setDate(expires.getDate() + 15);

    await saveRecords([
      ...records,
      {
        id: crypto.randomUUID(),
        skippedAt: now.toISOString(),
        expiresAt: expires.toISOString(),
        status: "AVAILABLE",
      },
    ]);

    toast.success("Today's meal was skipped. Use the skipped meal below if you want to schedule it again.");
  }

  async function changeSlot() {
    if (!sub?.id || !selectedSlot) {
      toast.error("Choose one delivery slot.");
      return;
    }

    if (skippedToday) {
      toast.error("Today's subscription meal is skipped. Schedule the skipped meal if you want a delivery today.");
      return;
    }

    if (isSlotChangeLocked(selectedSlot)) {
      toast.error("That slot has reached its 30-minute cutoff. Choose another available slot.");
      return;
    }

    if (selectedSlot === sub.deliverySlot) {
      toast.success("This is already your delivery slot.");
      return;
    }

    const target = slotAvailability.find((item) => item.slot === selectedSlot);
    if (target && !target.available) {
      toast.error("That delivery slot is full. Please choose another slot.");
      return;
    }

    setSavingSlot(true);
    try {
      await changeActiveDeliverySlot(sub.id, selectedSlot);
      toast.success("Delivery slot updated.");
      setSlotAvailability(await getDeliverySlotAvailability());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not change the delivery slot.");
    } finally {
      setSavingSlot(false);
    }
  }

  async function scheduleMeal() {
    if (!sub?.id || !scheduleId || !scheduleDate || !scheduleSlot) {
      toast.error("Choose a date and one delivery slot.");
      return;
    }

    if (scheduleDate < isoDate()) {
      toast.error("Choose today or a future delivery date.");
      return;
    }

    if (scheduleDate === isoDate() && isSlotChangeLocked(scheduleSlot)) {
      toast.error("That slot has reached its 30-minute cutoff. Choose another slot or a future date.");
      return;
    }

    if (scheduled.some((record) => record.scheduledFor === scheduleDate)) {
      toast.error("You already have a rescheduled delivery on that date.");
      return;
    }

    const source = records.find((record) => record.id === scheduleId);
    if (!source || source.status !== "AVAILABLE") {
      toast.error("That skipped meal has already been scheduled or is no longer available.");
      return;
    }

    const target = slotAvailability.find((item) => item.slot === scheduleSlot);
    if (target && !target.available) {
      toast.error("That delivery slot is full. Please choose another slot.");
      return;
    }

    setSavingSchedule(true);
    try {
      const next = records.map((record) =>
        record.id === scheduleId
          ? {
              ...record,
              status: "SCHEDULED" as const,
              scheduledFor: scheduleDate,
              scheduledTime: scheduleSlot,
            }
          : record,
      );

      await saveRecords(next);
      setScheduleId("");
      setScheduleDate("");
      setScheduleSlot("");
      toast.success(
        scheduleDate === isoDate()
          ? "Skipped meal scheduled for today. It is now your scheduled delivery for today."
          : "Meal rescheduled successfully.",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not reschedule the meal.");
    } finally {
      setSavingSchedule(false);
    }
  }

  function openSchedule(record: SkippedMealRecord) {
    if (record.status !== "AVAILABLE") return;
    setScheduleId(record.id);
    setScheduleDate(localDateFromIso(record.skippedAt) === isoDate() ? isoDate() : tomorrowDate());
    setScheduleSlot(sub?.deliverySlot || "");
  }

  if (!ready) {
    return <main className="min-h-screen bg-[#050505] grid place-items-center text-white/50">Loading…</main>;
  }

  if (!auth.currentUser) {
    return (
      <main className="min-h-screen bg-[#050505] grid place-items-center p-6 text-white">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Sign in to view your subscription</h1>
          <Link href="/account?returnTo=%2Fmy-subscription" className="mt-6 inline-flex rounded-full bg-[#E63946] px-6 py-3 font-bold">Sign in</Link>
        </div>
      </main>
    );
  }

  if (!sub) {
    return (
      <main className="min-h-screen bg-[#050505] grid place-items-center p-6 text-white">
        <div className="text-center">
          <h1 className="text-3xl font-bold">No active subscription</h1>
          <p className="mt-3 text-white/45">Choose a weekly plan to get started.</p>
          <Link href="/#subscriptions" className="mt-6 inline-flex rounded-full bg-[#E63946] px-6 py-3 font-bold">Explore Plans</Link>
        </div>
      </main>
    );
  }

  const canManageToday = Boolean(today && meal);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050505] px-4 pb-20 pt-24 text-white sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#E63946]">My Subscription</p>
            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
              {sub.planName} <span className="text-sm font-normal text-green-400">● ACTIVE</span>
            </h1>
          </div>
          <Link href="/#subscriptions" className="w-fit rounded-full border border-white/10 px-5 py-2 text-sm text-white/60 hover:text-white">Explore plans</Link>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section className="min-w-0 rounded-[30px] border border-white/10 bg-white/[0.035] p-5 sm:p-7">
            <p className="text-sm text-white/45">Today's meal {today ? `· ${today}` : "· Sunday"}</p>

            {skippedToday ? (
              <div className="mt-4 rounded-2xl border border-[#E63946]/30 bg-[#E63946]/10 p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-[#E63946]">Today's subscription meal</p>
                <h2 className="mt-2 text-2xl font-bold">Meal skipped</h2>
                <p className="mt-2 text-sm text-white/55">
                  Today's regular subscription delivery is skipped. You cannot create another skip for today.
                  If you skipped by mistake, use the skipped meal below and schedule it for today using one of the fixed delivery slots.
                </p>
                {skippedToday.status === "SCHEDULED" && skippedToday.scheduledFor === isoDate() ? (
                  <div className="mt-5 rounded-2xl border border-green-500/20 bg-green-500/5 p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-green-400">Scheduled delivery for today</p>
                    <p className="mt-2 text-lg font-semibold">{skippedToday.scheduledTime}</p>
                    <p className="mt-1 text-xs text-white/40">This is the skipped meal you scheduled back for today.</p>
                  </div>
                ) : null}
              </div>
            ) : !canManageToday ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="text-sm font-semibold">No subscription delivery today</p>
                <p className="mt-2 text-sm text-white/45">The weekly subscription menu runs Monday through Saturday.</p>
              </div>
            ) : (
              <>
                <div className="mt-3 grid gap-5 sm:grid-cols-[140px_minmax(0,1fr)] sm:items-center">
                  {meal?.image && <img src={meal.image} alt={meal.name} className="h-32 w-full rounded-2xl object-cover sm:h-36" />}
                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-2xl font-bold">{meal?.name || "No meal scheduled today"}</h2>
                        <p className="mt-2 text-sm text-white/45">{adminMeal?.protein ?? meal?.protein ?? sub.proteinPerMeal}g protein · {adminMeal?.calories ?? meal?.calories ?? sub.caloriesPerMeal} kcal</p>
                        {adminMeal && <p className="mt-2 text-xs text-green-400/80">Meal schedule managed by Varahi Eat & Fit</p>}
                      </div>
                      <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs text-green-400">Scheduled</span>
                    </div>
                  </div>
                </div>

                <div className="mt-7 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-black/20 p-4"><p className="text-xs text-white/35">Delivery slot</p><p className="mt-1 text-sm">{slotLabel(sub.deliverySlot)}</p></div>
                  <div className="rounded-2xl bg-black/20 p-4"><p className="text-xs text-white/35">Skipped credits</p><p className="mt-1 text-sm">{available.length} available</p></div>
                  <div className="rounded-2xl bg-black/20 p-4"><p className="text-xs text-white/35">Plan ends</p><p className="mt-1 text-sm">{endDays} days</p></div>
                </div>

                <div className="mt-7 rounded-2xl border border-white/10 bg-black/20 p-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold">Change delivery slot</p>
                      <p className="mt-1 text-xs text-white/35">Only 7–9 AM, 12–2 PM and 7–9 PM are available. A slot closes 30 minutes before its start time.</p>
                    </div>
                    {currentAvailability && <span className="text-xs text-white/40">{currentAvailability.count}/{currentAvailability.capacity} members</span>}
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {DELIVERY_SLOTS.map((slot) => {
                      const item = slotAvailability.find((entry) => entry.slot === slot);
                      const full = Boolean(item && !item.available && slot !== sub.deliverySlot);
                      const cutoffPassed = isSlotChangeLocked(slot);
                      const locked = full || cutoffPassed;
                      const selected = selectedSlot === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={locked || savingSlot}
                          onClick={() => setSelectedSlot(slot)}
                          className={`rounded-2xl border p-4 text-left transition ${selected ? "border-[#E63946] bg-[#E63946]/10" : "border-white/10 bg-[#121010]"} ${locked ? "cursor-not-allowed opacity-45" : "hover:border-[#E63946]/70"}`}
                        >
                          <p className="font-semibold">{slot}</p>
                          <p className="mt-1 text-xs text-white/40">{slot === sub.deliverySlot ? "Current slot" : full ? "Full / unavailable" : cutoffPassed ? "Cutoff passed" : `${item?.remaining ?? "—"} places left`}</p>
                        </button>
                      );
                    })}
                  </div>

                  <button onClick={changeSlot} disabled={savingSlot || !selectedSlot || isSlotChangeLocked(selectedSlot)} className="mt-4 w-full rounded-xl bg-[#E63946] px-5 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto">{savingSlot ? "Saving…" : "Save delivery slot"}</button>
                </div>

                <div className="mt-7">
                  <button onClick={skipToday} className="w-full rounded-full border border-white/10 px-5 py-3 text-sm hover:border-[#E63946]/60 sm:w-auto">Skip today</button>
                </div>
              </>
            )}
          </section>

          <aside className="h-fit rounded-[30px] border border-white/10 bg-[#0D0B0B] p-6 sm:p-7">
            <p className="text-xs uppercase tracking-widest text-white/35">Current plan</p>
            <h2 className="mt-2 text-2xl font-bold">{sub.planName}</h2>
            <p className="mt-2 text-sm text-white/45">₹{sub.amount}/week</p>
            <div className="my-6 border-y border-white/10 py-5 text-sm text-white/55">
              <p>{sub.proteinPerMeal}g protein / meal</p>
              <p className="mt-2">{sub.caloriesPerMeal} kcal / meal</p>
              <p className="mt-2">Expires in {endDays} days</p>
            </div>
            <p className="text-xs leading-5 text-white/30">Delivery address: {sub.address || "Not provided"}</p>
          </aside>
        </div>

        <section className="mt-5 rounded-[30px] border border-white/10 bg-white/[0.035] p-5 sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold">Skipped meals</h2>
              <p className="mt-1 text-sm text-white/40">Each skipped meal expires 15 days after it is skipped.</p>
            </div>
            <span className="w-fit rounded-full bg-[#E63946]/10 px-3 py-1 text-xs text-[#E63946]">{available.length} available</span>
          </div>

          <div className="mt-5 space-y-3">
            {available.length === 0 ? (
              <p className="text-sm text-white/35">No available skipped meals.</p>
            ) : (
              available.map((record) => (
                <div key={record.id} className="flex flex-col gap-3 rounded-2xl bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold">Skipped meal</p>
                    <p className="mt-1 text-xs text-white/40">Skipped on {localDateFromIso(record.skippedAt)} · expires in {remainingDays(record.expiresAt)} days</p>
                  </div>
                  <button onClick={() => openSchedule(record)} className="w-full rounded-full border border-white/10 px-4 py-2 text-xs hover:border-[#E63946]/60 sm:w-auto">Schedule</button>
                </div>
              ))
            )}
          </div>

          {scheduleId && (
            <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5">
              <p className="text-sm font-semibold">Schedule skipped meal</p>
              <p className="mt-1 text-xs text-white/40">You can schedule it for today or a future date. Only the three fixed delivery slots are allowed. If you skipped today by mistake, choose today's date here — no Undo button is needed.</p>

              <div className="mt-4 grid gap-3">
                <input
                  type="date"
                  min={isoDate()}
                  value={scheduleDate}
                  onChange={(event) => setScheduleDate(event.target.value)}
                  className="w-full min-w-0 rounded-xl border border-white/10 bg-[#121010] p-3 text-sm"
                />

                <div className="grid gap-2 sm:grid-cols-3">
                  {DELIVERY_SLOTS.map((slot) => {
                    const item = slotAvailability.find((entry) => entry.slot === slot);
                    const full = Boolean(item && !item.available);
                    const cutoffPassed = scheduleDate === isoDate() && isSlotChangeLocked(slot);
                    const disabled = full || cutoffPassed;
                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={disabled || savingSchedule}
                        onClick={() => setScheduleSlot(slot)}
                        className={`rounded-xl border p-3 text-left text-xs ${scheduleSlot === slot ? "border-[#E63946] bg-[#E63946]/10" : "border-white/10"} ${disabled ? "cursor-not-allowed opacity-40" : "hover:border-[#E63946]/60"}`}
                      >
                        <span className="font-semibold">{slot}</span>
                        <span className="mt-1 block text-white/35">{full ? "Full" : cutoffPassed ? "Cutoff passed" : `${item?.remaining ?? "—"} places left`}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    onClick={scheduleMeal}
                    disabled={savingSchedule || !scheduleSlot || (scheduleDate === isoDate() && isSlotChangeLocked(scheduleSlot))}
                    className="w-full rounded-xl bg-[#E63946] px-5 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                  >
                    {savingSchedule ? "Scheduling…" : "Schedule meal"}
                  </button>
                  <button
                    onClick={() => { setScheduleId(""); setScheduleDate(""); setScheduleSlot(""); }}
                    disabled={savingSchedule}
                    className="w-full rounded-xl border border-white/10 px-5 py-3 text-sm sm:w-auto"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {scheduledForToday.length > 0 && (
            <div className="mt-7 space-y-3">
              <h3 className="text-sm font-semibold">Today's scheduled skipped meal</h3>
              {scheduledForToday.map((record) => (
                <div key={record.id} className="rounded-2xl border border-green-500/20 bg-green-500/5 p-4 text-sm">
                  <p className="font-semibold">Scheduled for today · {record.scheduledTime}</p>
                  <p className="mt-1 text-xs text-white/40">This is a rescheduled skipped meal. It cannot be scheduled again.</p>
                </div>
              ))}
            </div>
          )}

          {scheduled.filter((record) => record.scheduledFor !== isoDate()).length > 0 && (
            <div className="mt-7 space-y-3">
              <h3 className="text-sm font-semibold">Upcoming rescheduled meals</h3>
              {scheduled.filter((record) => record.scheduledFor !== isoDate()).map((record) => (
                <div key={record.id} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm">
                  <p>{record.scheduledFor} · {record.scheduledTime}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
