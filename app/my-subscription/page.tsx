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

function remainingDays(date: string) {
  return Math.max(0, Math.ceil((new Date(date).getTime() - Date.now()) / 86400000));
}

function todayKey() {
  const index = new Date().getDay();
  return index === 0 ? null : DAYS[index - 1];
}

function isoDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function tomorrowDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return isoDate(date);
}

function slotLabel(value?: string) {
  return DELIVERY_SLOTS.includes(value as DeliverySlot) ? value : "Not selected";
}

function todaySkipped(records: SkippedMealRecord[]) {
  const today = isoDate();
  return records.find((record) => record.skippedAt.slice(0, 10) === today && record.status === "AVAILABLE");
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setReady(true);
      if (user) {
        return subscribeToActiveSubscription(user.uid, (subscription) => {
          setSub(subscription);
          setSelectedSlot(subscription?.deliverySlot || "");
        }) as any;
      }
      setSub(null);
    });
    return () => unsubscribe();
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
    return () => { mounted = false; };
  }, [sub?.id, sub?.deliverySlot]);

  const records = (sub?.skippedMealRecords || []) as SkippedMealRecord[];
  const available = records.filter((r) => r.status === "AVAILABLE" && remainingDays(r.expiresAt) > 0);
  const scheduled = records.filter((r) => r.status === "SCHEDULED");
  const skippedToday = todaySkipped(records);

  const today = todayKey();
  const plan = sub ? getPlan(sub.planId) : null;
  const fallbackMeal = today ? plan?.meals[today.toLowerCase() as keyof typeof plan.meals] : null;
  const adminMealMap = useMemo(() => mealScheduleMap(adminMeals), [adminMeals]);
  const adminMeal = today ? adminMealMap[today.toLowerCase()] : undefined;
  const meal = adminMeal || fallbackMeal;
  const endDays = sub ? remainingDays(sub.endDate) : 0;
  const slotLocked = sub?.deliverySlot ? isSlotChangeLocked(sub.deliverySlot) : false;
  const currentAvailability = slotAvailability.find((item) => item.slot === sub?.deliverySlot);

  async function saveRecords(next: SkippedMealRecord[]) {
    if (!sub?.id) return;
    await updateSubscription(sub.id, {
      skippedMeals: next.filter((x) => x.status === "AVAILABLE").length,
      skippedMealRecords: next,
    });
  }

  async function skipToday() {
    if (!sub?.id) return;
    if (skippedToday) {
      toast.error("Today's meal is already skipped.");
      return;
    }
    const now = new Date();
    const expires = new Date(now);
    expires.setDate(expires.getDate() + 15);
    await saveRecords([...records, {
      id: crypto.randomUUID(),
      skippedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      status: "AVAILABLE",
    }]);
    toast.success("Today's meal was skipped. You can undo this if it was a mistake.");
  }

  async function undoSkipToday() {
    if (!sub?.id || !skippedToday) return;
    await saveRecords(records.filter((record) => record.id !== skippedToday.id));
    toast.success("Today's meal has been restored.");
  }

  async function changeSlot() {
    if (!sub?.id || !selectedSlot) {
      toast.error("Choose one delivery slot.");
      return;
    }
    if (skippedToday) {
      toast.error("Today's meal is skipped. Restore it before changing today's delivery slot.");
      return;
    }
    if (slotLocked) {
      toast.error("Today's slot can no longer be changed. Changes close 30 minutes before the slot starts.");
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
      const availability = await getDeliverySlotAvailability();
      setSlotAvailability(availability);
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
    if (scheduled.some((record) => record.scheduledFor === scheduleDate)) {
      toast.error("You already have a rescheduled delivery on that date.");
      return;
    }
    const target = slotAvailability.find((item) => item.slot === scheduleSlot);
    if (target && !target.available) {
      toast.error("That delivery slot is full. Please choose another slot.");
      return;
    }
    const source = records.find((record) => record.id === scheduleId);
    if (!source || source.status !== "AVAILABLE") {
      toast.error("That skip credit is no longer available.");
      return;
    }
    const next = records.map((record) => record.id === scheduleId
      ? { ...record, status: "SCHEDULED" as const, scheduledFor: scheduleDate, scheduledTime: scheduleSlot }
      : record);
    await saveRecords(next);
    setScheduleId("");
    setScheduleDate("");
    setScheduleSlot("");
    toast.success("Meal rescheduled successfully.");
  }

  if (!ready) return <main className="min-h-screen bg-[#050505] grid place-items-center text-white/50">Loading…</main>;

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

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050505] px-4 pb-20 pt-24 text-white sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#E63946]">My Subscription</p>
            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{sub.planName} <span className="text-sm font-normal text-green-400">● ACTIVE</span></h1>
          </div>
          <Link href="/#subscriptions" className="w-fit rounded-full border border-white/10 px-5 py-2 text-sm text-white/60 hover:text-white">Explore plans</Link>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section className="min-w-0 rounded-[30px] border border-white/10 bg-white/[0.035] p-5 sm:p-7">
            <p className="text-sm text-white/45">Today's meal {today ? `· ${today}` : "· Sunday"}</p>

            {skippedToday ? (
              <div className="mt-4 rounded-2xl border border-[#E63946]/30 bg-[#E63946]/10 p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-[#E63946]">Today's meal</p>
                <h2 className="mt-2 text-2xl font-bold">Meal skipped</h2>
                <p className="mt-2 text-sm text-white/55">You skipped today's delivery. Delivery-time controls are hidden for today.</p>
                <button onClick={undoSkipToday} className="mt-5 rounded-xl bg-[#E63946] px-5 py-3 text-sm font-bold">Undo Skip — Restore Today's Meal</button>
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
                      <p className="mt-1 text-xs text-white/35">Only these three fixed slots are available. Changes close 30 minutes before the current slot starts.</p>
                    </div>
                    {currentAvailability && <span className="text-xs text-white/40">{currentAvailability.count}/{currentAvailability.capacity} members</span>}
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {DELIVERY_SLOTS.map((slot) => {
                      const item = slotAvailability.find((entry) => entry.slot === slot);
                      const full = Boolean(item && !item.available && slot !== sub.deliverySlot);
                      const locked = slotLocked || full;
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
                          <p className="mt-1 text-xs text-white/40">{slot === sub.deliverySlot ? "Current slot" : full ? "Full / unavailable" : `${item?.remaining ?? "—"} places left`}</p>
                        </button>
                      );
                    })}
                  </div>

                  {slotLocked && <p className="mt-3 text-xs text-amber-400">Slot changes are locked for today because the 30-minute cutoff has passed.</p>}
                  <button onClick={changeSlot} disabled={savingSlot || slotLocked} className="mt-4 w-full rounded-xl bg-[#E63946] px-5 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto">{savingSlot ? "Saving…" : "Save delivery slot"}</button>
                </div>

                <div className="mt-7"><button onClick={skipToday} className="rounded-full border border-white/10 px-5 py-3 text-sm hover:border-[#E63946]/60">Skip today</button></div>
              </>
            )}
          </section>

          <aside className="h-fit rounded-[30px] border border-white/10 bg-[#0D0B0B] p-6 sm:p-7">
            <p className="text-xs uppercase tracking-widest text-white/35">Current plan</p>
            <h2 className="mt-2 text-2xl font-bold">{sub.planName}</h2>
            <p className="mt-2 text-sm text-white/45">₹{sub.amount}/week</p>
            <div className="my-6 border-y border-white/10 py-5 text-sm text-white/55"><p>{sub.proteinPerMeal}g protein / meal</p><p className="mt-2">{sub.caloriesPerMeal} kcal / meal</p><p className="mt-2">Expires in {endDays} days</p></div>
            <p className="text-xs leading-5 text-white/30">Delivery address: {sub.address || "Not provided"}</p>
          </aside>
        </div>

        <section className="mt-5 rounded-[30px] border border-white/10 bg-white/[0.035] p-5 sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="text-xl font-bold">Skipped meals</h2><p className="mt-1 text-sm text-white/40">Each skipped meal expires 15 days after it is skipped.</p></div>
            <span className="w-fit rounded-full bg-[#E63946]/10 px-3 py-1 text-xs text-[#E63946]">{available.length} available</span>
          </div>

          <div className="mt-5 space-y-3">
            {available.length === 0 ? <p className="text-sm text-white/35">No available skipped meals.</p> : available.map((record) => (
              <div key={record.id} className="flex flex-col gap-3 rounded-2xl bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="text-sm font-semibold">Skipped meal</p><p className="mt-1 text-xs text-white/40">Expires in {remainingDays(record.expiresAt)} days</p></div>
                <button onClick={() => { setScheduleId(record.id); setScheduleDate(tomorrowDate()); setScheduleSlot(sub.deliverySlot); }} className="w-full rounded-full border border-white/10 px-4 py-2 text-xs sm:w-auto">Schedule</button>
              </div>
            ))}
          </div>

          {scheduleId && (
            <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5">
              <p className="text-sm font-semibold">Reschedule skipped meal</p>
              <p className="mt-1 text-xs text-white/40">Choose a date and one of the fixed delivery slots.</p>
              <div className="mt-4 grid gap-3 lg:grid-cols-[180px_1fr_auto]">
                <input type="date" min={isoDate()} value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="min-w-0 rounded-xl border border-white/10 bg-[#121010] p-3 text-sm" />
                <div className="grid gap-2 sm:grid-cols-3">
                  {DELIVERY_SLOTS.map((slot) => {
                    const item = slotAvailability.find((entry) => entry.slot === slot);
                    const full = Boolean(item && !item.available);
                    return <button key={slot} type="button" disabled={full} onClick={() => setScheduleSlot(slot)} className={`rounded-xl border p-3 text-left text-xs ${scheduleSlot === slot ? "border-[#E63946] bg-[#E63946]/10" : "border-white/10"} ${full ? "cursor-not-allowed opacity-40" : ""}`}><span className="font-semibold">{slot}</span><span className="mt-1 block text-white/35">{full ? "Full" : `${item?.remaining ?? "—"} places left`}</span></button>;
                  })}
                </div>
                <button onClick={scheduleMeal} className="rounded-xl bg-[#E63946] px-5 py-3 text-sm font-bold">Reschedule</button>
              </div>
            </div>
          )}

          {scheduled.length > 0 && <div className="mt-7 space-y-3"><h3 className="text-sm font-semibold">Upcoming rescheduled meals</h3>{scheduled.map((record) => <div key={record.id} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm"><p>{record.scheduledFor} · {record.scheduledTime}</p></div>)}</div>}
        </section>
      </div>
    </main>
  );
}
