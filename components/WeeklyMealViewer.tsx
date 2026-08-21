"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];

const menus = {
  silver: [
    {
      day: "MON",
      name: "Veg Roll",
      description: "Fresh and nutritious vegetable roll.",
      protein: "18g",
      calories: "320 kcal",
    },
    {
      day: "TUE",
      name: "Egg Roll",
      description: "Fresh egg roll prepared for a balanced meal.",
      protein: "24g",
      calories: "360 kcal",
    },
    {
      day: "WED",
      name: "Chicken Roll",
      description: "High-protein chicken roll with fresh ingredients.",
      protein: "32g",
      calories: "410 kcal",
    },
    {
      day: "THU",
      name: "Egg Roll",
      description: "Freshly prepared egg roll.",
      protein: "24g",
      calories: "360 kcal",
    },
    {
      day: "FRI",
      name: "Chicken Roll",
      description: "Protein-rich chicken roll.",
      protein: "32g",
      calories: "410 kcal",
    },
    {
      day: "SAT",
      name: "Veg Roll",
      description: "Light and nutritious vegetable roll.",
      protein: "18g",
      calories: "320 kcal",
    },
  ],

  golden: [
    {
      day: "MON",
      name: "Veg Roll + Egg + Sprouts + Juice",
      description:
        "A balanced combination of vegetable roll, egg, fresh sprouts and juice.",
      protein: "24g",
      calories: "420 kcal",
    },
    {
      day: "TUE",
      name: "Egg Roll + Sprouts + Juice",
      description:
        "Protein-rich egg roll served with fresh sprouts and juice.",
      protein: "26g",
      calories: "400 kcal",
    },
    {
      day: "WED",
      name: "Chicken Roll + Juice",
      description:
        "High-protein chicken roll served with refreshing juice.",
      protein: "34g",
      calories: "440 kcal",
    },
    {
      day: "THU",
      name: "Egg + Chicken Roll + Juice",
      description:
        "A protein-packed combination of egg, chicken roll and juice.",
      protein: "38g",
      calories: "480 kcal",
    },
    {
      day: "FRI",
      name: "Paneer Roll + Egg + Sprouts",
      description:
        "Paneer roll with egg and fresh sprouts for extra protein.",
      protein: "32g",
      calories: "460 kcal",
    },
    {
      day: "SAT",
      name: "Veg Roll + Sprouts + Juice",
      description:
        "Fresh vegetable roll with nutritious sprouts and juice.",
      protein: "22g",
      calories: "390 kcal",
    },
  ],

  diamond: [
    {
      day: "MON",
      name: "Veg Roll + Chicken Protein Salad + Juice + Egg",
      description:
        "Premium meal with a vegetable roll, chicken protein salad, juice and egg.",
      protein: "42g",
      calories: "520 kcal",
    },
    {
      day: "TUE",
      name: "Egg Roll + Egg Salad + Protein Shake",
      description:
        "High-protein egg roll with egg salad and a protein shake.",
      protein: "40g",
      calories: "510 kcal",
    },
    {
      day: "WED",
      name: "Chicken Roll + Fruit Salad + Juice + Egg",
      description:
        "Chicken roll paired with fresh fruit salad, juice and egg.",
      protein: "42g",
      calories: "530 kcal",
    },
    {
      day: "THU",
      name: "Egg + Chicken Roll + Paneer Salad + Corn Salad + Juice",
      description:
        "Premium protein meal combining egg, chicken roll, paneer salad, corn salad and juice.",
      protein: "48g",
      calories: "590 kcal",
    },
    {
      day: "FRI",
      name: "Paneer Roll + Lean Chicken Salad + Juice + Egg",
      description:
        "Premium paneer roll with lean chicken salad, juice and egg.",
      protein: "46g",
      calories: "560 kcal",
    },
    {
      day: "SAT",
      name: "Paneer Roll + Veg Salad + Protein Shake",
      description:
        "Paneer roll with fresh vegetable salad and a protein shake.",
      protein: "42g",
      calories: "540 kcal",
    },
  ],
};

export default function WeeklyMealViewer() {
  const [activeDay, setActiveDay] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState("golden");

  useEffect(() => {
    const savedPlan = localStorage.getItem(
      "selectedSubscriptionPlan"
    );

    if (
      savedPlan === "silver" ||
      savedPlan === "golden" ||
      savedPlan === "diamond"
    ) {
      setSelectedPlan(savedPlan);
    }
  }, []);

  const currentMenu =
    menus[selectedPlan as keyof typeof menus] || menus.golden;

  const meal = currentMenu[activeDay];

  const isFirstDay = activeDay === 0;
  const isLastDay = activeDay === DAYS.length - 1;

  const planName =
    selectedPlan === "silver"
      ? "Silver"
      : selectedPlan === "diamond"
        ? "Diamond"
        : "Golden";

  const paymentUrl = `/subscriptions/checkout?plan=${selectedPlan}`;

  return (
    <section
      id="weekly-meals"
      className="scroll-mt-24 mx-auto w-full max-w-5xl px-4 py-16 sm:px-6"
    >
      {/* HEADER */}
      <div className="mb-8 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#E63946]">
          {planName} Plan Menu
        </p>

        <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
          This Week&apos;s Menu
        </h2>

        <p className="mx-auto mt-2 max-w-xl text-sm text-white/45">
          View the meals included in your {planName} subscription.
        </p>
      </div>

      {/* DAY SELECTOR */}
      <div className="mb-6 flex justify-center overflow-x-auto">
        <div className="flex rounded-full border border-white/10 bg-white/[0.035] p-1">
          {DAYS.map((day, index) => (
            <button
              key={day}
              type="button"
              onClick={() => setActiveDay(index)}
              className={`min-w-[62px] rounded-full px-4 py-2.5 text-xs font-bold transition ${
                activeDay === index
                  ? "bg-[#E63946] text-white"
                  : "text-white/45 hover:text-white"
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* MEAL CARD */}
      <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#0D0B0B]">
        <div className="grid md:grid-cols-[1.15fr_0.85fr]">

          {/* IMAGE AREA */}
          <div className="relative min-h-[300px] bg-gradient-to-br from-[#211515] via-[#120D0D] to-black md:min-h-[390px]">

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-2xl">
                  🍽️
                </div>

                <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                  {planName} Meal
                </p>

                <p className="mt-1 text-xs text-white/20">
                  {meal.day}
                </p>
              </div>
            </div>

            <div className="absolute left-5 top-5 rounded-full border border-white/10 bg-black/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white/70 backdrop-blur">
              {meal.day}
            </div>

          </div>

          {/* DETAILS */}
          <div className="flex flex-col justify-between p-7 sm:p-9">

            <div>
              <div className="mb-5 h-1 w-10 rounded-full bg-[#E63946]" />

              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#E63946]">
                {planName} · {meal.day}&apos;s meal
              </p>

              <h3 className="mt-2 text-2xl font-bold sm:text-3xl">
                {meal.name}
              </h3>

              <p className="mt-3 max-w-md text-sm leading-6 text-white/45">
                {meal.description}
              </p>

              {/* NUTRITION */}
              <div className="mt-7 flex gap-3">

                <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3">
                  <p className="text-[10px] uppercase tracking-wider text-white/35">
                    Protein
                  </p>

                  <p className="mt-1 text-sm font-bold">
                    {meal.protein}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3">
                  <p className="text-[10px] uppercase tracking-wider text-white/35">
                    Calories
                  </p>

                  <p className="mt-1 text-sm font-bold">
                    {meal.calories}
                  </p>
                </div>

              </div>
            </div>

            {/* NAVIGATION */}
            <div className="mt-8 flex items-center justify-between gap-3">

              <button
                type="button"
                onClick={() =>
                  setActiveDay((current) =>
                    Math.max(0, current - 1)
                  )
                }
                disabled={isFirstDay}
                className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white/65 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
              >
                ← Previous
              </button>

              {isLastDay ? (
                <Link
                  href={paymentUrl}
                  className="rounded-full bg-[#E63946] px-6 py-3 text-sm font-bold transition hover:bg-[#ff4b57]"
                >
                  Continue to Payment →
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    setActiveDay((current) =>
                      Math.min(DAYS.length - 1, current + 1)
                    )
                  }
                  className="rounded-full bg-[#E63946] px-6 py-3 text-sm font-bold transition hover:bg-[#ff4b57]"
                >
                  Next Day →
                </button>
              )}

            </div>

          </div>
        </div>
      </div>

      {/* PROGRESS */}
      <p className="mt-4 text-center text-xs text-white/25">
        Day {activeDay + 1} of {DAYS.length}
      </p>
    </section>
  );
}