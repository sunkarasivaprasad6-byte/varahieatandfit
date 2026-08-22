"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Leaf } from "lucide-react";
import { DAYS, getPlan, type SubscriptionMeal } from "@/lib/subscriptionData";

type PlanSlug = "silver" | "golden" | "diamond";

export default function MealPlanPage() {
  const [selectedPlan, setSelectedPlan] = useState<PlanSlug>("golden");
  const [activeDay, setActiveDay] = useState(0);

  useEffect(() => {
    const plan = new URLSearchParams(window.location.search).get("plan");
    if (plan === "silver" || plan === "golden" || plan === "diamond") setSelectedPlan(plan);
  }, []);

  const plan = getPlan(selectedPlan)!;
  const currentDay = DAYS[activeDay];
  const meal = plan.meals[currentDay.toLowerCase()] as SubscriptionMeal;

  return (
    <main className="min-h-screen bg-[#050607] px-4 py-12 text-white sm:px-6 sm:py-16 lg:px-10">
      <div className="mx-auto max-w-[1450px]">
        <Link href="/#subscriptions" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-white/70 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to Plans
        </Link>

        <div className="mt-12 flex flex-col gap-8 lg:mt-16 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#E63946]">Your Weekly Meal Plan</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl lg:text-7xl">{plan.name} <span className="text-[#E63946]">Plan</span></h1>
            <p className="mt-4 max-w-xl text-base text-white/45 sm:text-lg">{plan.tagline}</p>
            <p className="mt-2 text-sm text-white/30">View the actual subscription menu from Monday to Saturday.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:min-w-[240px]">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/30">Plan Price</p>
            <p className="mt-2 text-3xl font-black text-[#E63946]">₹{plan.price}<span className="ml-2 text-sm font-normal text-white/40">/ week</span></p>
          </div>
        </div>

        <div className="mt-10 overflow-x-auto rounded-[20px] border border-white/10 bg-[#090a0b] p-2 sm:mt-14">
          <div className="grid min-w-[600px] grid-cols-6 gap-2">
            {DAYS.map((day, index) => (
              <button key={day} type="button" onClick={() => setActiveDay(index)} className={`rounded-[14px] px-5 py-4 text-sm font-bold transition ${activeDay === index ? "bg-[#E63946] text-white" : "text-white/40 hover:bg-white/[0.04] hover:text-white"}`}>
                {day}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-12 flex items-end justify-between gap-4 sm:mt-14">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#E63946]">{currentDay}</p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">Your Meal for the Day</h2>
          </div>
          <p className="hidden text-sm text-white/25 sm:block">Day {activeDay + 1} of 6</p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <article className="overflow-hidden rounded-[28px] border border-white/10 bg-[#0b0c0d]">
            <div className="relative h-[280px] overflow-hidden sm:h-[380px]">
              <img src={meal.image} alt={`${plan.name} ${currentDay} meal`} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 sm:bottom-7 sm:left-7">
                <span className="rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white/70 backdrop-blur">{currentDay} menu</span>
                <h3 className="mt-3 text-2xl font-black sm:text-4xl">{meal.name}</h3>
              </div>
            </div>
            <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-7">
              <div className="rounded-2xl bg-white/[0.03] p-4"><p className="text-xs text-white/35">Protein</p><p className="mt-1 text-xl font-bold">{meal.protein}g</p></div>
              <div className="rounded-2xl bg-white/[0.03] p-4"><p className="text-xs text-white/35">Calories</p><p className="mt-1 text-xl font-bold">{meal.calories} kcal</p></div>
            </div>
          </article>

          <aside className="h-fit rounded-[28px] border border-white/10 bg-[#090a0b] p-6 sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/30">Weekly menu</p>
            <div className="mt-5 space-y-2">
              {DAYS.map((day, index) => {
                const dayMeal = plan.meals[day.toLowerCase()] as SubscriptionMeal;
                return (
                  <button key={day} type="button" onClick={() => setActiveDay(index)} className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${activeDay === index ? "bg-[#E63946]/10 ring-1 ring-[#E63946]/40" : "bg-white/[0.02] hover:bg-white/[0.05]"}`}>
                    <img src={dayMeal.image} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                    <span className="min-w-0"><b className="text-xs text-[#E63946]">{day}</b><span className="mt-1 block truncate text-sm font-semibold">{dayMeal.name}</span></span>
                  </button>
                );
              })}
            </div>
          </aside>
        </div>

        <div className="mt-8 flex items-center justify-between gap-3">
          <button type="button" onClick={() => setActiveDay((value) => Math.max(0, value - 1))} disabled={activeDay === 0} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white/60 disabled:cursor-not-allowed disabled:opacity-20"><ArrowLeft className="h-4 w-4" /> Previous</button>
          <span className="text-xs text-white/25">{activeDay + 1} / 6</span>
          <button type="button" onClick={() => setActiveDay((value) => Math.min(DAYS.length - 1, value + 1))} disabled={activeDay === DAYS.length - 1} className="inline-flex items-center gap-2 rounded-full bg-[#E63946] px-5 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-20">Next <ArrowRight className="h-4 w-4" /></button>
        </div>

        <div className="mt-12 grid gap-4 sm:mt-16 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-[#090a0b] p-6"><Check className="h-5 w-5 text-[#E63946]" /><p className="mt-4 text-xs uppercase tracking-widest text-white/30">Selected Plan</p><p className="mt-2 text-xl font-bold">{plan.name}</p></div>
          <div className="rounded-2xl border border-white/10 bg-[#090a0b] p-6"><Leaf className="h-5 w-5 text-[#E63946]" /><p className="mt-4 text-xs uppercase tracking-widest text-white/30">Weekly Menu</p><p className="mt-2 text-xl font-bold">Monday–Saturday</p></div>
          <div className="rounded-2xl border border-white/10 bg-[#090a0b] p-6"><p className="text-xs uppercase tracking-widest text-white/30">Weekly Price</p><p className="mt-2 text-xl font-bold text-[#E63946]">₹{plan.price}</p></div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-5 rounded-[24px] border border-[#E63946]/20 bg-[#E63946]/[0.04] p-7 sm:mt-10 sm:flex-row">
          <div><div className="flex items-center gap-2"><Check className="h-5 w-5 text-[#E63946]" /><p className="font-bold">Ready to continue?</p></div><p className="mt-1 text-sm text-white/40">Continue with the {plan.name.toLowerCase()} plan.</p></div>
          <Link href={`/subscriptions/checkout?plan=${selectedPlan}`} className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-[#E63946] px-7 py-4 text-sm font-bold transition hover:bg-[#f0444f] sm:w-auto">Continue to Checkout <ArrowRight className="h-5 w-5" /></Link>
        </div>
      </div>
    </main>
  );
}
