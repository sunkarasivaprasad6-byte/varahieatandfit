"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Leaf,
  Utensils,
} from "lucide-react";

type PlanSlug = "silver" | "golden" | "diamond";

type Meal = {
  name: string;
  description?: string;
};

type DayMenu = {
  day: string;
  meals: Meal[];
};

const PLAN_DATA: Record<
  PlanSlug,
  {
    name: string;
    price: string;
    subtitle: string;
    color: string;
    menu: DayMenu[];
  }
> = {
  silver: {
    name: "SILVER",
    price: "₹700",
    subtitle: "Perfect start for a healthier you",
    color: "silver",

    menu: [
      {
        day: "MON",
        meals: [
          { name: "Veg Roll" },
        ],
      },
      {
        day: "TUE",
        meals: [
          { name: "Egg Roll" },
        ],
      },
      {
        day: "WED",
        meals: [
          { name: "Chicken Roll" },
        ],
      },
      {
        day: "THU",
        meals: [
          { name: "Egg Roll" },
        ],
      },
      {
        day: "FRI",
        meals: [
          { name: "Chicken Roll" },
        ],
      },
      {
        day: "SAT",
        meals: [
          { name: "Veg Roll" },
        ],
      },
    ],
  },

  golden: {
    name: "GOLDEN",
    price: "₹1,100",
    subtitle: "Best balance of taste & nutrition",
    color: "gold",

    menu: [
      {
        day: "MON",
        meals: [
          { name: "Veg Roll" },
          { name: "Egg" },
          { name: "Sprouts" },
          { name: "Juice" },
        ],
      },
      {
        day: "TUE",
        meals: [
          { name: "Egg Roll" },
          { name: "Sprouts" },
          { name: "Juice" },
        ],
      },
      {
        day: "WED",
        meals: [
          { name: "Chicken Roll" },
          { name: "Juice" },
        ],
      },
      {
        day: "THU",
        meals: [
          { name: "Egg" },
          { name: "Chicken Roll" },
          { name: "Juice" },
        ],
      },
      {
        day: "FRI",
        meals: [
          { name: "Paneer Roll" },
          { name: "Egg" },
          { name: "Sprouts" },
        ],
      },
      {
        day: "SAT",
        meals: [
          { name: "Veg Roll" },
          { name: "Sprouts" },
          { name: "Juice" },
        ],
      },
    ],
  },

  diamond: {
    name: "DIAMOND",
    price: "₹1,600",
    subtitle: "Ultimate nutrition experience",
    color: "diamond",

    menu: [
      {
        day: "MON",
        meals: [
          { name: "Veg Roll" },
          { name: "Chicken Protein Salad" },
          { name: "Juice" },
          { name: "Egg" },
        ],
      },
      {
        day: "TUE",
        meals: [
          { name: "Egg Roll" },
          { name: "Egg Salad" },
          { name: "Protein Shake" },
        ],
      },
      {
        day: "WED",
        meals: [
          { name: "Chicken Roll" },
          { name: "Fruit Salad" },
          { name: "Juice" },
          { name: "Egg" },
        ],
      },
      {
        day: "THU",
        meals: [
          { name: "Egg" },
          { name: "Chicken Roll" },
          { name: "Paneer Salad" },
          { name: "Corn Salad" },
          { name: "Juice" },
        ],
      },
      {
        day: "FRI",
        meals: [
          { name: "Paneer Roll" },
          { name: "Lean Chicken Salad" },
          { name: "Juice" },
          { name: "Egg" },
        ],
      },
      {
        day: "SAT",
        meals: [
          { name: "Paneer Roll" },
          { name: "Veg Salad" },
          { name: "Protein Shake" },
        ],
      },
    ],
  },
};

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];

export default function MealPlanPage() {
  const [selectedPlan, setSelectedPlan] =
    useState<PlanSlug>("golden");

  const [activeDay, setActiveDay] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const plan = params.get("plan");

    if (
      plan === "silver" ||
      plan === "golden" ||
      plan === "diamond"
    ) {
      setSelectedPlan(plan);
    }
  }, []);

  const plan = PLAN_DATA[selectedPlan];
  const currentDay = plan.menu[activeDay];

  const goToPreviousDay = () => {
    setActiveDay((current) => Math.max(0, current - 1));
  };

  const goToNextDay = () => {
    setActiveDay((current) =>
      Math.min(DAYS.length - 1, current + 1)
    );
  };

  return (
    <main className="min-h-screen bg-[#050607] px-5 py-16 text-white sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1450px]">

        {/* BACK TO PLANS */}
        <Link
          href="/#subscriptions"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-white/70 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Plans
        </Link>

        {/* HEADER */}
        <div className="mt-16 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#E63946]">
              Your Weekly Meal Plan
            </p>

            <h1 className="mt-4 text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl">
              {plan.name}{" "}
              <span className="text-[#E63946]">Plan</span>
            </h1>

            <p className="mt-4 max-w-xl text-base text-white/45 sm:text-lg">
              {plan.subtitle}
            </p>

            <p className="mt-2 text-sm text-white/30">
              View your meals from Monday to Saturday.
            </p>
          </div>

          {/* PRICE */}
          <div className="flex items-center gap-8">

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/30">
                Plan Price
              </p>

              <div className="mt-2">
                <span className="text-3xl font-black text-[#E63946]">
                  {plan.price}
                </span>

                <span className="ml-2 text-sm text-white/40">
                  / week
                </span>
              </div>
            </div>

            <div className="h-14 w-px bg-white/10" />

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/30">
                Plan
              </p>

              <p className="mt-2 text-sm font-bold">
                {plan.name} PACKAGE
              </p>
            </div>

          </div>
        </div>

        {/* DAY SELECTOR */}
        <div className="mt-14 overflow-x-auto rounded-[20px] border border-white/10 bg-[#090a0b] p-2">
          <div className="grid min-w-[600px] grid-cols-6 gap-2">

            {DAYS.map((day, index) => (
              <button
                key={day}
                type="button"
                onClick={() => setActiveDay(index)}
                className={`rounded-[14px] px-5 py-4 text-sm font-bold transition ${
                  activeDay === index
                    ? "bg-[#E63946] text-white shadow-[0_8px_30px_rgba(230,57,70,0.2)]"
                    : "text-white/40 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                {day}
              </button>
            ))}

          </div>
        </div>

        {/* CURRENT DAY HEADER */}
        <div className="mt-14 flex items-end justify-between">

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#E63946]">
              {currentDay.day}
            </p>

            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              Your Meals for the Day
            </h2>
          </div>

          <p className="hidden text-sm text-white/25 sm:block">
            Day {activeDay + 1} of 6
          </p>

        </div>

        {/* MEALS */}
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

          {currentDay.meals.map((meal, index) => (
            <div
              key={`${meal.name}-${index}`}
              className="group overflow-hidden rounded-[22px] border border-white/10 bg-[#0b0c0d] transition hover:-translate-y-1 hover:border-[#E63946]/40"
            >

              {/* IMAGE / ICON AREA */}
              <div className="relative flex h-[210px] items-center justify-center overflow-hidden bg-gradient-to-br from-[#211515] via-[#110c0d] to-black">

                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(230,57,70,0.12),transparent_65%)]" />

                <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] transition group-hover:scale-105">
                  <Utensils className="h-8 w-8 text-[#E63946]" />
                </div>

                <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white/50 backdrop-blur">
                  Meal {index + 1}
                </div>

              </div>

              {/* DETAILS */}
              <div className="p-6">

                <div className="mb-4 h-1 w-8 rounded-full bg-[#E63946]" />

                <h3 className="text-xl font-bold">
                  {meal.name}
                </h3>

                <div className="mt-4 flex items-center gap-2 text-xs text-white/35">
                  <Leaf className="h-4 w-4 text-[#E63946]" />
                  <span>
                    Fresh & nutritious
                  </span>
                </div>

              </div>

            </div>
          ))}

        </div>

        {/* EMPTY STATE - SHOULD NEVER APPEAR */}
        {currentDay.meals.length === 0 && (
          <div className="mt-8 rounded-[22px] border border-white/10 bg-[#0b0c0d] p-12 text-center">
            <p className="text-white/40">
              No meals available for this day.
            </p>
          </div>
        )}

        {/* DAY NAVIGATION */}
        <div className="mt-10 flex items-center justify-between">

          <button
            type="button"
            onClick={goToPreviousDay}
            disabled={activeDay === 0}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white/60 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-20"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </button>

          <span className="text-xs text-white/25">
            {activeDay + 1} / 6
          </span>

          <button
            type="button"
            onClick={goToNextDay}
            disabled={activeDay === DAYS.length - 1}
            className="inline-flex items-center gap-2 rounded-full bg-[#E63946] px-5 py-3 text-sm font-bold transition hover:bg-[#f0444f] disabled:cursor-not-allowed disabled:opacity-20"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </button>

        </div>

        {/* PLAN SUMMARY */}
        <div className="mt-16 overflow-hidden rounded-[24px] border border-white/10 bg-[#090a0b]">

          <div className="grid md:grid-cols-3">

            <div className="border-b border-white/10 p-7 md:border-b-0 md:border-r">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/30">
                Selected Plan
              </p>

              <p className="mt-2 text-xl font-bold">
                {plan.name}
              </p>
            </div>

            <div className="border-b border-white/10 p-7 md:border-b-0 md:border-r">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/30">
                Weekly Price
              </p>

              <p className="mt-2 text-xl font-bold text-[#E63946]">
                {plan.price}
              </p>
            </div>

            <div className="p-7">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/30">
                Weekly Menu
              </p>

              <p className="mt-2 text-xl font-bold">
                6 Days
              </p>
            </div>

          </div>

        </div>

        {/* CHECKOUT */}
        <div className="mt-10 flex flex-col items-center justify-between gap-5 rounded-[24px] border border-[#E63946]/20 bg-[#E63946]/[0.04] p-7 sm:flex-row">

          <div>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-[#E63946]" />

              <p className="font-bold">
                Ready to continue?
              </p>
            </div>

            <p className="mt-1 text-sm text-white/40">
              Continue with the {plan.name.toLowerCase()} plan.
            </p>
          </div>

          <Link
            href={`/subscriptions/checkout?plan=${selectedPlan}`}
            className="inline-flex items-center justify-center gap-3 rounded-full bg-[#E63946] px-7 py-4 text-sm font-bold transition hover:bg-[#f0444f]"
          >
            Continue to Checkout
            <ArrowRight className="h-5 w-5" />
          </Link>

        </div>

      </div>
    </main>
  );
}