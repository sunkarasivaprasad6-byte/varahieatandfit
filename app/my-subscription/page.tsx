"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  subscribeToActiveSubscription,
  updateSubscription,
  type Subscription,
} from "@/lib/subscriptionService";
import { DAYS, getPlan } from "@/lib/subscriptionData";
import {
  getAdminDeliverySlots,
  getAdminMealSchedules,
  isDeliverySlotModifiable,
  mealScheduleMap,
  type DeliverySlot,
  type AdminMealSchedule,
} from "@/lib/mealDeliveryService";
import { toast } from "react-hot-toast";

type SkippedMeal = {
  id: string;
  skippedAt: string;
  expiresAt: string;
  scheduledFor?: string;
  scheduledTime?: string;
  status: "AVAILABLE" | "SCHEDULED" | "USED" | "EXPIRED";
};

function remainingDays(date: string) {
  return Math.max(
    0,
    Math.ceil((new Date(date).getTime() - Date.now()) / 86400000)
  );
}

function todayKey() {
  const index = new Date().getDay();
  return index === 0 ? null : DAYS[index - 1];
}

function isoDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function tomorrowDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return isoDate(date);
}

export default function MySubscription() {
  const [sub, setSub] = useState<Subscription | null>(null);
  const [ready, setReady] = useState(false);
  const [time, setTime] = useState("");
  const [scheduleId, setScheduleId] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [slots, setSlots] = useState<DeliverySlot[]>([]);
  const [adminMeals, setAdminMeals] = useState<AdminMealSchedule[]>([]);
  const [loadingOperations, setLoadingOperations] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setReady(true);
      if (u) {
        return subscribeToActiveSubscription(u.uid, setSub) as any;
      }
      setSub(null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!sub) {
      setLoadingOperations(false);
      return;
    }

    let cancelled = false;
    async function loadAdminData() {
      setLoadingOperations(true);
      try {
        const [slotData, mealData] = await Promise.all([
          getAdminDeliverySlots(),
          getAdminMealSchedules(sub.planId),
        ]);
        if (cancelled) return;
        setSlots(slotData);
        setAdminMeals(mealData);
        if (slotData.length && !slotData.some((slot) => slot.label === sub.deliveryTime)) {
          setTime(slotData[0].label);
        }
      } catch (error) {
        console.error("Failed to load admin meal/delivery settings", error);
      } finally {
        if (!cancelled) setLoadingOperations(false);
      }
    }
    loadAdminData();
    return () => {
      cancelled = true;
    };
  }, [sub?.id, sub?.planId, sub?.deliveryTime]);

  const records = ((sub as Subscription & { skippedMealRecords?: SkippedMeal[] })?.skippedMealRecords || []) as SkippedMeal[];
  const available = records.filter(
    (r) => r.status === "AVAILABLE" && remainingDays(r.expiresAt) > 0
  );
  const scheduled = records.filter((r) => r.status === "SCHEDULED");

  const today = todayKey();
  const plan = sub ? getPlan(sub.planId) : null;
  const fallbackMeal = today ? plan?.meals[today.toLowerCase() as keyof typeof plan.meals] : null;
  const adminMealMap = useMemo(() => mealScheduleMap(adminMeals), [adminMeals]);
  const adminMeal = today ? adminMealMap[today.toLowerCase()] : undefined;
  const meal = adminMeal || fallbackMeal;
  const endDays = sub ? remainingDays(sub.endDate) : 0;
  const selectedSlot = slots.find((slot) => slot.label === (time || sub?.deliveryTime));
  const canChangeSelectedSlot = selectedSlot ? isDeliverySlotModifiable(selectedSlot) : true;

  async function saveRecords(next: SkippedMeal[]) {
    if (!sub?.id) return;
    await updateSubscription(sub.id, {
      skippedMeals: next.filter((x) => x.status === "AVAILABLE").length,
      ...( { skippedMealRecords: next } as any),
    });
  }

  async function skipToday() {
    if (!sub?.id) return;
    const todayIso = isoDate();
    const alreadySkipped = records.some(
      (record) =>
        record.skippedAt.slice(0, 10) === todayIso &&
        record.status !== "EXPIRED"
    );
    if (alreadySkipped) {
      toast.error("Today's meal has already been skipped.");
      return;
    }

    const now = new Date();
    const exp = new Date(now);
    exp.setDate(exp.getDate() + 15);
    const record: SkippedMeal = {
      id: crypto.randomUUID(),
      skippedAt: now.toISOString(),
      expiresAt: exp.toISOString(),
      status: "AVAILABLE",
    };

    await saveRecords([...records, record]);
    toast.success("Today's meal was skipped. You have a 15-day skip credit.");
  }

  async function scheduleMeal() {
    if (!sub?.id || !scheduleId || !scheduleDate || !scheduleTime) return;

    const target = new Date(`${scheduleDate}T00:00:00`);
    const todayTarget = new Date(`${isoDate()}T00:00:00`);
    if (target <= todayTarget) {
      toast.error("Choose a future delivery date.");
      return;
    }

    const alreadyScheduled = scheduled.some(
      (record) => record.scheduledFor === scheduleDate
    );
    if (alreadyScheduled) {
      toast.error("You already have a rescheduled delivery on that date.");
      return;
    }

    const source = records.find((record) => record.id === scheduleId);
    if (!source || source.status !== "AVAILABLE") {
      toast.error("That skip credit is no longer available.");
      return;
    }

    const next = records.map((record) =>
      record.id === scheduleId
        ? {
            ...record,
            status: "SCHEDULED" as const,
            scheduledFor: scheduleDate,
            scheduledTime: scheduleTime,
          }
        : record
    );

    await saveRecords(next);
    setScheduleId("");
    setScheduleDate("");
    setScheduleTime("");
    toast.success("Meal rescheduled successfully.");
  }

  async function changeTime() {
    if (!sub?.id || !time || !selectedSlot) return;
    if (!isDeliverySlotModifiable(selectedSlot)) {
      toast.error("This delivery slot is past its modification cutoff.");
      return;
    }
    await updateSubscription(sub.id, { deliveryTime: time });
    toast.success("Delivery time updated.");
  }

  if (!ready)
    return (
      <main className="min-h-screen bg-[#050505] grid place-items-center text-white/50">
        Loading…
      </main>
    );

  if (!auth.currentUser)
    return (
      <main className="min-h-screen bg-[#050505] grid place-items-center p-6 text-white">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Sign in to view your subscription</h1>
          <Link href="/account" className="mt-6 inline-flex rounded-full bg-[#E63946] px-6 py-3 font-bold">
            Sign in
          </Link>
        </div>
      </main>
    );

  if (!sub)
    return (
      <main className="min-h-screen bg-[#050505] grid place-items-center p-6 text-white">
        <div className="text-center">
          <h1 className="text-3xl font-bold">No active subscription</h1>
          <p className="mt-3 text-white/45">Choose a weekly plan to get started.</p>
          <Link href="/subscriptions" className="mt-6 inline-flex rounded-full bg-[#E63946] px-6 py-3 font-bold">
            Explore Plans
          </Link>
        </div>
      </main>
    );

  return (
    <main className="min-h-screen bg-[#050505] px-5 pb-20 pt-28 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-end justify-between gap-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#E63946]">
              My Subscription
            </p>
            <h1 className="mt-3 text-4xl font-bold">
              {sub.planName} <span className="text-sm font-normal text-green-400">● ACTIVE</span>
            </h1>
          </div>
          <Link href="/subscriptions" className="text-sm text-white/45">View plans</Link>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_300px]">
          <section className="rounded-[30px] border border-white/10 bg-white/[0.035] p-7">
            <p className="text-sm text-white/45">
              Today's meal {today ? `· ${today}` : "· Sunday"}
            </p>
            <div className="mt-2 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">
                  {meal?.name || "No meal scheduled today"}
                </h2>
                <p className="mt-2 text-sm text-white/45">
                  {adminMeal?.protein ?? sub.proteinPerMeal}g protein · {adminMeal?.calories ?? sub.caloriesPerMeal} kcal
                </p>
                {adminMeal && (
                  <p className="mt-2 text-xs text-green-400/80">Meal schedule managed by Varahi Eat & Fit</p>
                )}
              </div>
              <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs text-green-400">Scheduled</span>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-black/20 p-4">
                <p className="text-xs text-white/35">Delivery</p>
                <p className="mt-1 text-sm">{sub.deliveryTime}</p>
              </div>
              <div className="rounded-2xl bg-black/20 p-4">
                <p className="text-xs text-white/35">Skipped</p>
                <p className="mt-1 text-sm">{available.length} available</p>
              </div>
              <div className="rounded-2xl bg-black/20 p-4">
                <p className="text-xs text-white/35">Plan ends</p>
                <p className="mt-1 text-sm">{endDays} days</p>
              </div>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <button onClick={skipToday} className="rounded-full border border-white/10 px-5 py-3 text-sm">
                Skip today
              </button>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                disabled={loadingOperations || !slots.length}
                className="rounded-full border border-white/10 bg-[#121010] px-4 py-3 text-sm disabled:opacity-50"
              >
                <option value="">Change delivery time</option>
                {slots.map((slot) => (
                  <option key={slot.id || slot.label} value={slot.label}>
                    {slot.label}
                  </option>
                ))}
              </select>
              <button
                onClick={changeTime}
                disabled={!time || !canChangeSelectedSlot}
                className="rounded-full bg-[#E63946] px-5 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40"
              >
                Save
              </button>
            </div>
            {selectedSlot && !canChangeSelectedSlot && (
              <p className="mt-3 text-xs text-yellow-400/80">
                This slot is past the admin-defined modification cutoff.
              </p>
            )}
          </section>

          <aside className="rounded-[30px] border border-white/10 bg-[#0D0B0B] p-7">
            <p className="text-xs uppercase tracking-widest text-white/35">Current plan</p>
            <h2 className="mt-2 text-2xl font-bold">{sub.planName}</h2>
            <p className="mt-2 text-sm text-white/45">₹{sub.amount}/week</p>
            <div className="my-6 border-y border-white/10 py-5 text-sm text-white/55">
              <p>{sub.proteinPerMeal}g protein / meal</p>
              <p className="mt-2">{sub.caloriesPerMeal} kcal / meal</p>
              <p className="mt-2">Expires in {endDays} days</p>
            </div>
            <p className="text-xs text-white/30">
              Delivery address: {sub.address || "Not provided"}
            </p>
          </aside>
        </div>

        <section className="mt-5 rounded-[30px] border border-white/10 bg-white/[0.035] p-7">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Skipped meals</h2>
              <p className="mt-1 text-sm text-white/40">Each skipped meal expires 15 days after it is skipped.</p>
            </div>
            <span className="rounded-full bg-[#E63946]/10 px-3 py-1 text-xs text-[#E63946]">{available.length} available</span>
          </div>

          <div className="mt-5 space-y-3">
            {available.length === 0 ? (
              <p className="text-sm text-white/35">No available skipped meals.</p>
            ) : (
              available.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-black/20 p-4">
                  <div>
                    <p className="text-sm font-semibold">Skipped meal</p>
                    <p className="mt-1 text-xs text-white/40">Expires in {remainingDays(r.expiresAt)} days</p>
                  </div>
                  <button
                    onClick={() => {
                      setScheduleId(r.id);
                      setScheduleDate(tomorrowDate());
                      setScheduleTime(slots[0]?.label || sub.deliveryTime);
                    }}
                    className="rounded-full border border-white/10 px-4 py-2 text-xs"
                  >
                    Schedule
                  </button>
                </div>
              ))
            )}
          </div>

          {scheduleId && (
            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <input
                type="date"
                min={tomorrowDate()}
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="rounded-xl border border-white/10 bg-black/25 p-3 text-sm"
              />
              <select
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="rounded-xl border border-white/10 bg-black/25 p-3 text-sm"
              >
                {slots.map((slot) => (
                  <option key={slot.id || slot.label} value={slot.label}>{slot.label}</option>
                ))}
              </select>
              <button onClick={scheduleMeal} className="rounded-xl bg-[#E63946] px-5 py-3 text-sm font-bold">Schedule</button>
            </div>
          )}
        </section>

        <section className="mt-5 rounded-[30px] border border-white/10 bg-white/[0.035] p-7">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Rescheduled meals</h2>
              <p className="mt-1 text-sm text-white/40">Your skip credits moved to future delivery dates.</p>
            </div>
            <span className="text-xs text-white/35">{scheduled.length} scheduled</span>
          </div>
          <div className="mt-5 space-y-3">
            {scheduled.length === 0 ? (
              <p className="text-sm text-white/35">No rescheduled meals.</p>
            ) : (
              scheduled.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-2xl bg-black/20 p-4">
                  <div>
                    <p className="text-sm font-semibold">Rescheduled meal</p>
                    <p className="mt-1 text-xs text-white/40">{r.scheduledFor} · {r.scheduledTime}</p>
                  </div>
                  <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-300">SCHEDULED</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
