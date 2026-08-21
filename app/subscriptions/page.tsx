"use client";

import Navbar from "@/components/Navbar";
import { Dumbbell, HeartPulse, Leaf, Check, ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

const subscriptionPlans = [
  {
    id: "silver",
    name: "Silver",
    price: 1499,
    tagline: "A simple weekly healthy meal routine.",
    accent: "#C0C0C0",
  },
  {
    id: "golden",
    name: "Golden",
    price: 1999,
    tagline: "A balanced plan for consistent healthy eating.",
    accent: "#D4AF37",
  },
  {
    id: "diamond",
    name: "Diamond",
    price: 2499,
    tagline: "A premium weekly meal experience.",
    accent: "#B9F2FF",
  },
];

const lifestyleCards: Array<[LucideIcon, string, string]> = [
  [
    Dumbbell,
    "Gym & Fitness",
    "Protein-focused meals for active routines.",
  ],
  [
    HeartPulse,
    "Yoga & Wellness",
    "Balanced, clean meals for everyday wellness.",
  ],
  [
    Leaf,
    "Healthy Families",
    "Nutritious food made for healthier routines.",
  ],
];

export default function SubscriptionsPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white pt-28 pb-24">
      <Navbar />

      <div className="mx-auto max-w-6xl px-6">
        <section className="mb-20 text-center">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.35em] text-[#E63946]">
            Built around your lifestyle
          </p>

          <h1 className="font-playfair text-5xl font-bold sm:text-7xl">
            Healthy meals,{" "}
            <span className="italic text-[#E63946]">
              made simple.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-white/55">
            One flexible weekly subscription for people who train, practise
            yoga, and families who simply want to eat better.
          </p>
        </section>

        <section className="mb-24 grid gap-5 md:grid-cols-3">
          {lifestyleCards.map(([Icon, title, text]) => (
            <div
              key={title}
              className="rounded-[28px] border border-white/10 bg-white/[0.035] p-7 transition hover:border-[#E63946]/40"
            >
              <Icon className="mb-8 h-7 w-7 text-[#E63946]" />

              <h2 className="text-xl font-bold">
                {title}
              </h2>

              <p className="mt-2 text-sm leading-6 text-white/45">
                {text}
              </p>
            </div>
          ))}
        </section>

        <section id="plans">
          <div className="mb-10 flex items-end justify-between gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#E63946]">
                Weekly subscriptions
              </p>

              <h2 className="mt-3 font-playfair text-4xl font-bold sm:text-5xl">
                Choose your plan
              </h2>
            </div>

            <p className="hidden max-w-sm text-right text-sm text-white/40 md:block">
              Same plans for everyone. Your lifestyle only helps you choose
              what fits you best.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {subscriptionPlans.map((plan, i) => (
              <article
                key={plan.id}
                className={`relative overflow-hidden rounded-[32px] border ${
                  i === 1
                    ? "border-[#E63946]/60"
                    : "border-white/10"
                } bg-[#0D0B0B] p-7`}
              >
                {i === 1 && (
                  <span className="absolute right-6 top-6 rounded-full bg-[#E63946] px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                    Popular
                  </span>
                )}

                <div className="mb-10">
                  <span
                    className="text-xs font-bold uppercase tracking-[0.25em]"
                    style={{ color: plan.accent }}
                  >
                    {plan.name}
                  </span>

                  <h3 className="mt-3 text-4xl font-bold">
                    ₹{plan.price}
                    <span className="text-sm font-normal text-white/35">
                      {" "}
                      / week
                    </span>
                  </h3>

                  <p className="mt-2 text-sm text-white/45">
                    {plan.tagline}
                  </p>
                </div>

                <ul className="mb-10 space-y-3 text-sm text-white/65">
                  <li className="flex gap-3">
                    <Check className="h-5 w-5 text-[#E63946]" />
                    7 planned meals
                  </li>

                  <li className="flex gap-3">
                    <Check className="h-5 w-5 text-[#E63946]" />
                    Meal images & nutrition info
                  </li>

                  <li className="flex gap-3">
                    <Check className="h-5 w-5 text-[#E63946]" />
                    Delivery-time selection
                  </li>

                  <li className="flex gap-3">
                    <Check className="h-5 w-5 text-[#E63946]" />
                    Skip & reschedule support
                  </li>
                </ul>

                <Link
                  href={`/subscriptions/checkout?plan=${plan.id}`}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#E63946] px-5 py-4 text-sm font-bold transition hover:bg-[#ff4b57]"
                >
                  Choose Plan
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
