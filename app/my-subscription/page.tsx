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
import { getAdminMealSchedules, mealScheduleMap, type AdminMealSchedule } from "@/lib/mealDeliveryService";
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
  return Math.max(0, Math.ceil((new Date(date).getTime() - Date.now()) / 86400000));
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

function toTimeInput(value = "") {
  const match = value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return "";
  let hour = Number(match[1]);
  const minute = match[2];
  const meridiem = match[3].toUpperCase();
  if (meridiem === "PM" && hour !== 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${minute}`;
}

function formatTime(value: string) {
  if (!value) return "";
  const [hourString, minute] = value.split(":");
  const hour = Number(hourString);
  if (!Number.isFinite(hour)) return value;
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${minute} ${suffix}`;
}

export default function MySubscription() {
  const [sub, setSub] = useState<Subscription | null>(null);
  const [ready, setReady] = useState(false);
  const [deliveryTime, setDeliveryTime] = useState("");
  const [scheduleId, setScheduleId] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [adminMeals, setAdminMeals] = useState<AdminMealSchedule[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setReady(true);
      if (user) {
        return subscribeToActiveSubscription(user.uid, (subscription) => {
          setSub(subscription);
          if (subscription) setDeliveryTime(toTimeInput(subscription.deliveryTime));
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

  const records = (((sub as Subscription & { skippedMealRecords?: SkippedMeal[] })?.skippedMealRecords || []) as SkippedMeal[]);
  const available = records.filter((r) => r.status === "AVAILABLE" && remainingDays(r.expiresAt) > 0);
  const scheduled = records.filter((r) => r.status === "SCHEDULED");

  const today = todayKey();
  const plan = sub ? getPlan(sub.planId) : null;
  const fallbackMeal = today ? plan?.meals[today.toLowerCase() as keyof typeof plan.meals] : null;
  const adminMealMap = useMemo(() => mealScheduleMap(adminMeals), [adminMeals]);
  const adminMeal = today ? adminMealMap[today.toLowerCase()] : undefined;
  const meal = adminMeal || fallbackMeal;
  const endDays = sub ? remainingDays(sub.endDate) : 0;

  async function saveRecords(next: SkippedMeal[]) {
    if (!sub?.id) return;
    await updateSubscription(sub.id, {
      skippedMeals: next.filter((x) => x.status === "AVAILABLE").length,
      ...({ skippedMealRecords: next } as any),
    });
  }

  async function skipToday() {
    if (!sub?.id) return;
    const todayIso = isoDate();
    if (records.some((record) => record.skippedAt.slice(0, 10) === todayIso && record.status !== "EXPIRED")) {
      toast.error("Today's meal has already been skipped.");
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
    toast.success("Today's meal was skipped. You have a 15-day skip credit.");
  }

  async function scheduleMeal() {
    if (!sub?.id || !scheduleId || !scheduleDate || !scheduleTime) {
      toast.error("Choose a date and time.");
      return;
    }
    if (scheduleDate <= isoDate()) {
      toast.error("Choose a future delivery date.");
      return;
    }
    if (scheduled.some((record) => record.scheduledFor === scheduleDate)) {
      toast.error("You already have a rescheduled delivery on that date.");
      return;
    }

    const source = records.find((record) => record.id === scheduleId);
    if (!source || source.status !== "AVAILABLE") {
      toast.error("That skip credit is no longer available.");
      return;
    }

    const next = records.map((record) => record.id === scheduleId
      ? { ...record, status: "SCHEDULED" as const, scheduledFor: scheduleDate, scheduledTime: formatTime(scheduleTime) }
      : record);

    await saveRecords(next);
    setScheduleId("");
    setScheduleDate("");
    setScheduleTime("");
    toast.success("Meal rescheduled successfully.");
  }

  async function changeTime() {
    if (!sub?.id || !deliveryTime) {
      toast.error("Enter your preferred delivery time.");
      return;
    }
    await updateSubscription(sub.id, { deliveryTime: formatTime(deliveryTime) });
    toast.success("Delivery time updated.");
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
          <Link href="/subscriptions#plans" className="mt-6 inline-flex rounded-full bg-[#E63946] px-6 py-3 font-bold">Explore Plans</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] px-5 pb-20 pt-28 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#E63946]">My Subscription</p>
            <h1 className="mt-3 text-4xl font-bold">{sub.planName} <span className="text-sm font-normal text-green-400">● ACTIVE</span></h1>
          </div>
          <Link href="/subscriptions#plans" className="rounded-full border border-white/10 px-5 py-2 text-sm text-white/60 hover:text-white">Explore plans</Link>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_300px]">
          <section className="rounded-[30px] border border-white/10 bg-white/[0.035] p-7">
            <p className="text-sm text-white/45">Today's meal {today ? `· ${today}` : "· Sunday"}</p>
            <div className="mt-2 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">{meal?.name || "No meal scheduled today"}</h2>
                <p className="mt-2 text-sm text-white/45">{adminMeal?.protein ?? sub.proteinPerMeal}g protein · {adminMeal?.calories ?? sub.caloriesPerMeal} kcal</p>
                {adminMeal && <p className="mt-2 text-xs text-green-400/80">Meal schedule managed by Varahi Eat & Fit</p>}
              </div>
              <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs text-green-400">Scheduled</span>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-black/20 p-4"><p className="text-xs text-white/35">Delivery time</p><p className="mt-1 text-sm">{sub.deliveryTime || "Not set"}</p></div>
              <div className="rounded-2xl bg-black/20 p-4"><p className="text-xs text-white/35">Skipped</p><p className="mt-1 text-sm">{available.length} available</p></div>
              <div className="rounded-2xl bg-black/20 p-4"><p className="text-xs text-white/35">Plan ends</p><p className="mt-1 text-sm">{endDays} days</p></div>
            </div>

            <div className="mt-7 rounded-2xl border border-white/10 bg-black/20 p-5">
              <p className="text-sm font-semibold">Choose your delivery time</p>
              <p className="mt-1 text-xs text-white/35">There are no fixed delivery slots. Enter the time you want.</p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input type="time" value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} className="rounded-xl border border-white/10 bg-[#121010] px-4 py-3 text-sm text-white outline-none focus:border-[#E63946]" />
                <button onClick={changeTime} className="rounded-xl bg-[#E63946] px-5 py-3 text-sm font-bold">Save time</button>
              </div>
            </div>

            <div className="mt-7"><button onClick={skipToday} className="rounded-full border border-white/10 px-5 py-3 text-sm">Skip today</button></div>
          </section>

          <aside className="rounded-[30px] border border-white/10 bg-[#0D0B0B] p-7">
            <p className="text-xs uppercase tracking-widest text-white/35">Current plan</p>
            <h2 className="mt-2 text-2xl font-bold">{sub.planName}</h2>
            <p className="mt-2 text-sm text-white/45">₹{sub.amount}/week</p>
            <div className="my-6 border-y border-white/10 py-5 text-sm text-white/55"><p>{sub.proteinPerMeal}g protein / meal</p><p className="mt-2">{sub.caloriesPerMeal} kcal / meal</p><p className="mt-2">Expires in {endDays} days</p></div>
            <p className="text-xs text-white/30">Delivery address: {sub.address || "Not provided"}</p>
          </aside>
        </div>

        <section className="mt-5 rounded-[30px] border border-white/10 bg-white/[0.035] p-7">
          <div className="flex items-center justify-between gap-4"><div><h2 className="text-xl font-bold">Skipped meals</h2><p className="mt-1 text-sm text-white/40">Each skipped meal expires 15 days after it is skipped.</p></div><span className="rounded-full bg-[#E63946]/10 px-3 py-1 text-xs text-[#E63946]">{available.length} available</span></div>
          <div className="mt-5 space-y-3">
            {available.length === 0 ? <p className="text-sm text-white/35">No available skipped meals.</p> : available.map((record) => (
              <div key={record.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-black/20 p-4">
                <div><p className="text-sm font-semibold">Skipped meal</p><p className="mt-1 text-xs text-white/40">Expires in {remainingDays(record.expiresAt)} days</p></div>
                <button onClick={() => { setScheduleId(record.id); setScheduleDate(tomorrowDate()); setScheduleTime(toTimeInput(sub.deliveryTime) || "18:00"); }} className="rounded-full border border-white/10 px-4 py-2 text-xs">Schedule</button>
              </div>
            ))}
          </div>

          {scheduleId && (
            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <input type="date" min={tomorrowDate()} value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="rounded-xl border border-white/10 bg-black/25 p-3 text-sm" />
              <input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="rounded-xl border border-white/10 bg-black/25 p-3 text-sm" />
              <button onClick={scheduleMeal} className="rounded-xl bg-[#E63946] px-5 py-3 text-sm font-bold">Reschedule</button>
            </div>
          )}

          {scheduled.length > 0 && <div className="mt-7 space-y-3"><h3 className="text-sm font-semibold">Upcoming rescheduled meals</h3>{scheduled.map((record) => <div key={record.id} className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm"><p>{record.scheduledFor} · {record.scheduledTime}</p></div>)}</div>}
        </section>
      </div>
    </main>
  );
}
