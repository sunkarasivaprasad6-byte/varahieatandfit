"use client";

export const dynamic = "force-dynamic";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ChevronLeft, ChevronRight, Clock, MapPin, MessageSquare, ShieldCheck, LocateFixed, CheckCircle2, ExternalLink } from "lucide-react";
import { DAYS } from "@/lib/subscriptionData";
import { getDisplayPlan, type DisplayPlan } from "@/lib/planService";
import { createSubscriptionDraft, updateSubscription } from "@/lib/subscriptionService";
import { toast } from "react-hot-toast";

const steps = ["Delivery time", "Customize meal", "Instructions", "Address", "Review", "Payment"];
const STORAGE_KEY = "varahi-subscription-checkout";

function formatTime(value: string) {
  if (!value) return "";
  const [hourString, minute] = value.split(":");
  const hour = Number(hourString);
  if (!Number.isFinite(hour)) return value;
  return `${hour % 12 || 12}:${minute} ${hour >= 12 ? "PM" : "AM"}`;
}

type SavedState = { step: number; day: (typeof DAYS)[number]; deliveryTime: string; protein: number; calories: number; instructions: string; address: string };

export default function SubscriptionCheckoutPage() {
  return <Suspense fallback={null}><SubscriptionCheckoutContent /></Suspense>;
}

function SubscriptionCheckoutContent() {
  const params = useSearchParams();
  const planId = params.get("plan") || "silver";
  const [plan, setPlan] = useState<DisplayPlan | null>(null);
  const [step, setStep] = useState(0);
  const [day, setDay] = useState<(typeof DAYS)[number]>("MON");
  const [userId, setUserId] = useState<string | null>(null);
  const [deliveryTime, setDeliveryTime] = useState("");
  const [protein, setProtein] = useState(30);
  const [calories, setCalories] = useState(400);
  const [instructions, setInstructions] = useState("");
  const [address, setAddress] = useState("");
  const [locationDetected, setLocationDetected] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getDisplayPlan(planId).then((value) => { setPlan(value); setReady(true); }).catch(() => setReady(true));
  }, [planId]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved) as SavedState & { planId?: string };
        if (!data.planId || data.planId === planId) {
          setStep(Math.min(5, Math.max(0, Number(data.step) || 0)));
          setDay(data.day || "MON"); setDeliveryTime(data.deliveryTime || ""); setProtein(Number(data.protein) || 30); setCalories(Number(data.calories) || 400); setInstructions(data.instructions || ""); setAddress(data.address || "");
        }
      }
    } catch {}
  }, [planId]);

  useEffect(() => onAuthStateChanged(auth, (u) => setUserId(u?.uid || null)), []);

  useEffect(() => {
    if (!ready || !plan) return;
    const payload: SavedState & { planId: string } = { planId, step, day, deliveryTime, protein, calories, instructions, address };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [ready, plan, planId, step, day, deliveryTime, protein, calories, instructions, address]);

  const meal = useMemo(() => plan?.meals[day.toLowerCase() as keyof typeof plan.meals], [plan, day]);
  if (!ready || !plan || !meal) return <main className="min-h-screen bg-[#050505] grid place-items-center text-white/50">Loading checkout…</main>;
  if (!plan.active) return <main className="min-h-screen bg-[#050505] grid place-items-center p-6 text-white"><div className="text-center"><h1 className="text-3xl font-bold">Plan unavailable</h1><Link href="/subscriptions#plans" className="mt-5 inline-flex rounded-full bg-[#E63946] px-6 py-3 font-bold">Back to plans</Link></div></main>;

  function detectLocation() {
    if (!navigator.geolocation) return toast.error("Location detection is not supported by your browser.");
    setDetectingLocation(true); toast.loading("Detecting your location...", { id: "detect-location" });
    navigator.geolocation.getCurrentPosition(({ coords }) => { setAddress(`https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`); setLocationDetected(true); setDetectingLocation(false); toast.success("Your location has been detected!", { id: "detect-location" }); }, (error) => { setDetectingLocation(false); toast.error(error.code === 1 ? "Location permission was denied. Please allow location access." : error.code === 2 ? "Your location could not be determined. Please try again." : error.code === 3 ? "Location detection timed out. Please try again." : "Unable to detect your location.", { id: "detect-location" }); }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  }

  const isGoogleMapsLocation = address.startsWith("https://www.google.com/maps?q=");

  async function continueStep() {
    if (step === 0 && !deliveryTime) return toast.error("Enter your preferred delivery time.");
    if (step === 3 && address.trim().length < 10) return toast.error("Enter your delivery address or detect your location.");
    if (step < 4) return setStep(step + 1);
    if (step === 4) return setStep(5);
    await startPayment();
  }

  async function startPayment() {
    if (!userId) {
      const returnTo = `/subscriptions/checkout?plan=${encodeURIComponent(plan.id)}`;
      toast("Your checkout details are saved. Sign in to continue.");
      window.location.href = `/account?returnTo=${encodeURIComponent(returnTo)}`;
      return;
    }

    setLoading(true);
    try {
      const start = new Date();
      const end = new Date(start); end.setDate(start.getDate() + 6);
      const customerName = auth.currentUser?.displayName || auth.currentUser?.email?.split("@")[0] || "Customer";
      const customerEmail = auth.currentUser?.email || "";
      const customerPhone = auth.currentUser?.phoneNumber || "";

      const checkoutPlan = plan;
      const subscriptionId = await createSubscriptionDraft({ userId, customerName, customerEmail, customerPhone, planId: checkoutPlan.id, planName: checkoutPlan.name, amount: checkoutPlan.price, status: "PENDING_PAYMENT", startDate: start.toISOString(), endDate: end.toISOString(), deliveryTime: formatTime(deliveryTime), address, proteinPerMeal: protein, caloriesPerMeal: calories, instructions, skippedMeals: 0, paymentStatus: "PENDING" });

      const res = await fetch("/api/cashfree/create-order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: checkoutPlan.price, customerId: userId, customerName, customerPhone: customerPhone || "9999999999", customerEmail, subscriptionId }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to create payment");
      if (data.demo) { toast.error("Cashfree is not configured. Add the Cashfree keys in Vercel."); return; }
      await updateSubscription(subscriptionId, { paymentOrderId: data.orderId, paymentStatus: "PENDING" });
      localStorage.removeItem(STORAGE_KEY);

      const script = document.createElement("script");
      script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
      script.onload = () => {
        // @ts-ignore Cashfree global SDK
        const cashfree = window.Cashfree({ mode: data.mode || "sandbox" });
        cashfree.checkout({ paymentSessionId: data.paymentSessionId, redirectTarget: "_self" });
      };
      document.body.appendChild(script);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Payment setup failed");
    } finally { setLoading(false); }
  }

  return <main className="min-h-screen bg-[#050505] px-5 pb-20 pt-28 text-white"><div className="mx-auto max-w-6xl">
    <Link href="/subscriptions#plans" className="mb-8 inline-flex items-center gap-2 text-sm text-white/45 hover:text-white"><ChevronLeft className="h-4 w-4" /> Plans</Link>
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <section>
        <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-2">{steps.map((name, index) => <div key={name} className="flex min-w-max items-center gap-2 text-xs"><span className={`flex h-7 w-7 items-center justify-center rounded-full ${index < step ? "bg-[#E63946] text-white" : index === step ? "border border-[#E63946] text-[#E63946]" : "border border-white/10 text-white/30"}`}>{index < step ? "✓" : index + 1}</span><span className={index === step ? "text-white" : "text-white/30"}>{name}</span>{index < steps.length - 1 && <span className="mx-1 text-white/15">—</span>}</div>)}</div>
        <div className="rounded-[32px] border border-white/10 bg-white/[0.035] p-6 sm:p-9">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#E63946]">{steps[step]}</p>
          {step === 0 && <><h1 className="mt-3 text-3xl font-bold">When should we deliver?</h1><p className="mt-2 max-w-xl text-sm text-white/40">There are no fixed delivery slots. Enter the time you prefer and we will save it as your requested delivery time.</p><div className="mt-8 max-w-sm"><label className="text-sm text-white/55">Your preferred delivery time<div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 focus-within:border-[#E63946]"><Clock className="h-5 w-5 text-[#E63946]" /><input type="time" value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} className="w-full bg-transparent py-4 text-white outline-none" /></div></label><p className="mt-3 text-xs text-white/30">Any time you prefer. Example: 7:30 PM.</p></div></>}
          {step === 1 && <><h1 className="mt-3 text-3xl font-bold">Customize each meal</h1><div className="mt-7 flex gap-2 overflow-x-auto">{DAYS.map((d) => <button key={d} type="button" onClick={() => setDay(d)} className={`rounded-full px-5 py-2 text-xs font-bold ${day === d ? "bg-[#E63946] text-white" : "bg-white/5 text-white/50"}`}>{d}</button>)}</div><div className="mt-6 grid gap-6 sm:grid-cols-[180px_1fr]"><div className="relative h-44 overflow-hidden rounded-2xl"><Image src={meal.image} alt={meal.name} fill className="object-cover" sizes="180px" /></div><div><h2 className="text-xl font-bold">{meal.name}</h2><p className="mt-2 text-sm text-white/45">Default: {meal.protein}g protein · {meal.calories} kcal</p><div className="mt-5 grid grid-cols-2 gap-3"><label className="text-xs text-white/45">Protein / meal<input type="number" min="10" max="100" value={protein} onChange={(e) => setProtein(Number(e.target.value))} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 p-3 text-white outline-none focus:border-[#E63946]" /></label><label className="text-xs text-white/45">Calories / meal<input type="number" min="150" max="1200" value={calories} onChange={(e) => setCalories(Number(e.target.value))} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 p-3 text-white outline-none focus:border-[#E63946]" /></label></div></div></div></>}
          {step === 2 && <><h1 className="mt-3 text-3xl font-bold">Any special instructions?</h1><div className="mt-8"><MessageSquare className="mb-3 h-5 w-5 text-[#E63946]" /><textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Less spicy, no onion, etc." className="min-h-40 w-full rounded-2xl border border-white/10 bg-black/25 p-5 text-white outline-none placeholder:text-white/25 focus:border-[#E63946]" /></div></>}
          {step === 3 && <><h1 className="mt-3 text-3xl font-bold">Where should we deliver?</h1><p className="mt-2 text-sm text-white/40">Enter your address manually or use your current location.</p><div className="mt-8"><div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2"><MapPin className="h-5 w-5 text-[#E63946]" /><span className="text-sm font-medium text-white/70">Delivery location</span></div>{locationDetected && <div className="flex items-center gap-1 text-xs text-green-400"><CheckCircle2 className="h-4 w-4" />Location detected</div>}</div><div className={`rounded-2xl border bg-black/25 ${locationDetected ? "border-green-500/30" : "border-white/10 focus-within:border-[#E63946]"}`}><textarea value={address} onChange={(e) => { setAddress(e.target.value); setLocationDetected(false); }} placeholder="Enter your full delivery address..." className="min-h-36 w-full resize-none bg-transparent p-5 text-white outline-none placeholder:text-white/25" />{isGoogleMapsLocation && <div className="mx-4 mb-4 rounded-xl border border-white/10 bg-white/[0.035] p-4"><p className="text-sm font-semibold">Current location detected</p><p className="mt-1 text-xs text-white/35">Your Google Maps location link has been saved.</p><a href={address} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-[#E63946]">View location in Google Maps <ExternalLink className="h-3.5 w-3.5" /></a></div>}</div><button type="button" onClick={detectLocation} disabled={detectingLocation} className="mt-4 flex w-full items-center justify-center gap-3 rounded-2xl border border-[#E63946]/40 bg-[#E63946]/10 px-5 py-4 text-sm font-bold text-[#E63946] disabled:opacity-50"><LocateFixed className="h-5 w-5" />{detectingLocation ? "Detecting your location..." : locationDetected ? "Detect My Location Again" : "Detect My Location"}</button></div></>}
          {step === 4 && <><h1 className="mt-3 text-3xl font-bold">Review your subscription</h1><div className="mt-8 space-y-4 text-sm text-white/60"><p><b className="text-white">Plan:</b> {plan.name} · ₹{plan.price}/week</p><p><b className="text-white">Delivery:</b> {formatTime(deliveryTime)}</p><p><b className="text-white">Nutrition:</b> {protein}g protein · {calories} kcal per meal</p><div><b className="text-white">Address:</b>{isGoogleMapsLocation ? <a href={address} target="_blank" rel="noopener noreferrer" className="mt-2 block text-[#E63946]">Open Google Maps location</a> : <p className="mt-2 text-white/50">{address}</p>}</div><p><b className="text-white">Instructions:</b> {instructions || "None"}</p></div></>}
          {step === 5 && <><h1 className="mt-3 text-3xl font-bold">Secure payment</h1><div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-6"><div className="flex items-center gap-3 text-sm text-white/65"><ShieldCheck className="h-5 w-5 text-green-400" />One-time payment · ₹{plan.price}</div><p className="mt-4 text-sm leading-6 text-white/35">{userId ? "You'll be securely redirected to Cashfree Checkout." : "Your checkout is saved. Sign in before payment and you will return here automatically."}</p></div></>}
          <div className="mt-10 flex justify-between gap-3"><button type="button" disabled={step === 0} onClick={() => setStep(Math.max(0, step - 1))} className="rounded-full border border-white/10 px-6 py-3 text-sm disabled:opacity-20">Back</button><button type="button" disabled={loading || detectingLocation} onClick={continueStep} className="inline-flex items-center gap-2 rounded-full bg-[#E63946] px-7 py-3 text-sm font-bold disabled:opacity-50">{loading ? "Preparing..." : step === 5 ? (userId ? `Pay ₹${plan.price}` : "Sign in & continue") : "Continue"}{step < 5 && <ChevronRight className="h-4 w-4" />}</button></div>
        </div>
      </section>
      <aside className="h-fit rounded-[28px] border border-white/10 bg-[#0D0B0B] p-6"><p className="text-xs font-bold uppercase tracking-[0.25em] text-[#E63946]">Summary</p><h2 className="mt-3 text-2xl font-bold">{plan.name} Plan</h2><p className="mt-1 text-sm text-white/40">7-day nutrition plan</p><div className="my-7 border-y border-white/10 py-5"><div className="flex justify-between text-sm"><span className="text-white/45">Weekly total</span><b>₹{plan.price}</b></div><div className="mt-3 flex justify-between text-sm"><span className="text-white/45">Requested delivery</span><span>{deliveryTime ? formatTime(deliveryTime) : "Not selected"}</span></div>{locationDetected && <div className="mt-4 flex items-center gap-2 text-xs text-green-400"><CheckCircle2 className="h-4 w-4" />Location detected</div>}</div><p className="text-xs leading-5 text-white/35">Your selections are saved with the subscription draft and finalized after payment confirmation.</p></aside>
    </div>
  </div></main>;
}