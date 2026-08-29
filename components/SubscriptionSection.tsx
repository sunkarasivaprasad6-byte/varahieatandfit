"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Check, SlidersHorizontal, Truck, Utensils } from "lucide-react";

const plans = [
  { name: "SILVER", slug: "silver", subtitle: "Perfect start for a healthier you", price: "₹700", mealImage: "/images/subscriptions/silver-meal.png", showImage: true, badge: "silver", features: ["6 Meals Per Week", "High Protein Options", "Customizable Protein", "One Delivery Per Day", "Skip & Reschedule Meals"] },
  { name: "GOLDEN", slug: "golden", subtitle: "Best balance of taste & nutrition", price: "₹1,100", mealImage: "/images/subscriptions/golden-meal.png", showImage: true, badge: "gold", popular: true, features: ["6 Meals Per Week", "High Protein & Clean Meals", "Customizable Protein", "One Delivery Per Day", "Priority Support"] },
  { name: "DIAMOND", slug: "diamond", subtitle: "Ultimate nutrition experience", price: "₹1,600", mealImage: "/images/subscriptions/diamond-meal.png", showImage: true, badge: "diamond", features: ["6 Premium Meals Per Week", "High Protein & Gourmet Meals", "Customizable Protein", "One Delivery Per Day", "Priority Support"] },
  { name: "BABY VIP KIT", slug: "baby-vip-kit", subtitle: "Balanced weekly meals for your fitness goals", price: "₹1,499", mealImage: "", showImage: false, badge: "vip-green", features: ["6 Meals Per Week", "High Protein & Balanced Meals", "Customizable Protein", "One Delivery Per Day", "Priority Support"] },
  { name: "VIP KIT", slug: "vip-kit", subtitle: "Premium weekly meals for your fitness goals", price: "₹2,499", mealImage: "", showImage: false, badge: "vip-gold", features: ["6 Premium Meals Per Week", "High Protein & Premium Meals", "Customizable Protein", "One Delivery Per Day", "Priority Support"] },
];

function PlanBadge({ type }: { type: string }) {
  if (type === "silver") return <div className="relative flex h-12 w-12 shrink-0 items-center justify-center"><div className="absolute inset-0 rotate-45 rounded-lg border-2 border-white/50 bg-gradient-to-br from-white/80 via-gray-300 to-gray-500 shadow-lg" /><div className="relative flex h-8 w-8 items-center justify-center rounded-full border border-black/30 bg-gray-300"><span className="text-lg font-black text-gray-700">★</span></div></div>;
  if (type === "gold") return <div className="relative flex h-12 w-12 shrink-0 items-center justify-center"><div className="absolute inset-0 rotate-45 rounded-lg border-2 border-yellow-400 bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 shadow-[0_0_22px_rgba(250,190,30,0.35)]" /><div className="relative flex h-8 w-8 items-center justify-center rounded-full border border-yellow-700 bg-yellow-400"><span className="text-lg font-black text-yellow-800">★</span></div></div>;
  if (type === "vip-green") return <div className="relative flex h-12 w-12 shrink-0 items-center justify-center"><div className="absolute inset-0 rotate-45 rounded-lg border-2 border-emerald-400 bg-gradient-to-br from-emerald-200 via-emerald-500 to-emerald-700 shadow-lg" /><div className="relative flex h-8 w-8 items-center justify-center rounded-full border border-emerald-900 bg-emerald-500"><span className="text-lg font-black text-emerald-950">★</span></div></div>;
  if (type === "vip-gold") return <div className="relative flex h-12 w-12 shrink-0 items-center justify-center"><div className="absolute inset-0 rotate-45 rounded-lg border-2 border-orange-400 bg-gradient-to-br from-orange-200 via-orange-400 to-orange-600 shadow-lg" /><div className="relative flex h-8 w-8 items-center justify-center rounded-full border border-orange-800 bg-orange-400"><span className="text-lg font-black text-orange-900">★</span></div></div>;
  return <div className="relative flex h-12 w-12 shrink-0 items-center justify-center"><div className="absolute h-10 w-10 rotate-45 border-2 border-white/80 bg-gradient-to-br from-white via-gray-200 to-gray-500 shadow-lg" /><div className="relative text-[25px] leading-none text-gray-700">◇</div></div>;
}

export default function SubscriptionSection() {
  return (
    <section id="subscriptions" className="relative overflow-hidden bg-[#050607] px-5 py-24 text-white sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1450px]">
        <div className="mb-14 text-center">
          <div className="mb-4 flex items-center justify-center gap-4"><span className="h-px w-12 bg-gradient-to-r from-transparent to-[#E63946]" /><span className="text-[13px] font-semibold uppercase tracking-[0.22em] text-[#E63946]">Choose Your Plan</span><span className="h-px w-12 bg-gradient-to-l from-transparent to-[#E63946]" /></div>
          <h2 className="font-playfair text-5xl font-bold tracking-tight sm:text-6xl lg:text-[68px]">Subscription Plans</h2>
          <p className="mt-4 text-lg text-white/65">Simple. Nutritious. Delivered to your doorstep.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.name} className={`relative overflow-hidden rounded-[20px] border bg-[#08090a] ${plan.popular ? "border-[#E63946]" : "border-white/25"}`}>
              {plan.popular && <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2 rounded-b-md bg-[#E63946] px-5 py-2 text-xs font-bold uppercase tracking-wide text-white">★ Most Popular</div>}
              <div className="relative min-h-[560px] p-8">
                <div className="relative z-10 flex items-center gap-5"><PlanBadge type={plan.badge} /><div><h3 className="text-[27px] font-bold tracking-wide">{plan.name}</h3><p className="mt-1 text-[15px] text-white/75">{plan.subtitle}</p></div></div>
                {plan.showImage && <div className="absolute right-[-10px] top-[85px] h-[215px] w-[245px]"><Image src={plan.mealImage} alt={`${plan.name} meal`} fill sizes="245px" className="object-contain object-right" priority /></div>}
                <div className="absolute left-8 top-[120px] h-[2px] w-10 bg-[#E63946]" />
                <div className="relative z-10 mt-[58px]"><span className="text-[31px] font-semibold">{plan.price}</span><span className="ml-2 text-[16px] font-medium text-[#E63946]">/ week</span></div>
                <div className="relative z-10 mt-8 space-y-4 pb-1">{plan.features.map((feature) => <div key={feature} className="flex items-center gap-4"><Check className="h-5 w-5 shrink-0 text-[#E63946]" /><span className="text-[15px] text-white/85">{feature}</span></div>)}</div>
                <div className="relative z-10 mt-10"><Link href={`/subscriptions/meal-plan?plan=${plan.slug}`} className={`flex h-[66px] w-full items-center justify-center gap-4 rounded-[16px] border text-[18px] font-semibold transition-all ${plan.popular ? "border-[#E63946] bg-[#E63946] hover:bg-[#f0444f]" : "border-[#E63946] bg-transparent hover:bg-[#E63946]/10"}`}>Choose Plan<ArrowRight className="h-6 w-6" /></Link></div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 overflow-hidden rounded-[20px] border border-white/15 bg-[#090a0b]"><div className="grid md:grid-cols-2 lg:grid-cols-4">
          <Benefit icon={<Utensils className="h-9 w-9" />} title="Nutritious & Delicious" description="Chef crafted meals with perfect nutrition." />
          <Benefit icon={<Truck className="h-9 w-9" />} title="Daily Delivery" description="Fresh meals delivered to your doorstep." />
          <Benefit icon={<SlidersHorizontal className="h-9 w-9" />} title="Customizable" description="Adjust protein and preferences." />
          <Benefit icon={<CalendarDays className="h-9 w-9" />} title="Flexible" description="Skip, reschedule or change delivery anytime." />
        </div></div>
      </div>
    </section>
  );
}

function Benefit({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return <div className="flex items-center gap-5 border-white/10 px-8 py-7 lg:border-r last:border-r-0"><div className="shrink-0 text-[#E63946]">{icon}</div><div><h4 className="text-[16px] font-semibold">{title}</h4><p className="mt-1 text-[14px] leading-5 text-white/55">{description}</p></div></div>;
}
