"use client";
export const dynamic = "force-dynamic";
import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { DAYS, getPlan } from "@/lib/subscriptionData";
import { createSubscriptionDraft } from "@/lib/subscriptionService";
import { DELIVERY_SLOTS, getDeliverySlotAvailability, type DeliverySlot } from "@/lib/deliverySlotService";
import { toast } from "react-hot-toast";
import { ChevronLeft, ExternalLink, LocateFixed, MapPin, MessageSquare } from "lucide-react";
import QRCode from "react-qr-code";

type DraftState = { name: string; phone: string; slot: DeliverySlot | ""; instructions: string; address: string; protein: number; step: number; day: (typeof DAYS)[number] };
const DRAFT_KEY = "varahi-subscription-checkout";
const UPI_VPA = "rajasekar.bukke@oksbi";
const UPI_NAME = "Varahi Eat & Fit";

function proteinRange(actual: number) {
  return { min: Math.max(0, actual - 2), max: actual + 6 };
}

export default function SubscriptionCheckoutPage() { return <Suspense fallback={null}><SubscriptionCheckoutContent /></Suspense>; }

function SubscriptionCheckoutContent() {
  const params = useSearchParams();
  const plan = getPlan(params.get("plan") || "silver") as NonNullable<ReturnType<typeof getPlan>>;
  const [step, setStep] = useState(0);
  const [day, setDay] = useState<(typeof DAYS)[number]>("MON");
  const [userId, setUserId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [slot, setSlot] = useState<DeliverySlot | "">("");
  const [slots, setSlots] = useState<Awaited<ReturnType<typeof getDeliverySlotAvailability>>>([]);
  const [protein, setProtein] = useState(30);
  const [instructions, setInstructions] = useState("");
  const [address, setAddress] = useState("");
  const [locationDetected, setLocationDetected] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);

  useEffect(() => onAuthStateChanged(auth, (u) => setUserId(u?.uid || null)), []);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null") as DraftState | null;
      if (saved) {
        setName(saved.name || ""); setPhone(saved.phone || ""); setSlot(saved.slot || ""); setInstructions(saved.instructions || ""); setAddress(saved.address || "");
        setDay(saved.day || "MON"); setStep(typeof saved.step === "number" ? saved.step : 0);
        setProtein(Number(saved.protein) || 30);
      }
    } catch {}
    getDeliverySlotAvailability().then(setSlots).catch(() => toast.error("Unable to load delivery slot availability."));
  }, []);

  const meal = useMemo(() => plan?.meals[day.toLowerCase() as keyof typeof plan.meals], [plan, day]);
  const range = proteinRange(meal?.protein || 0);

  useEffect(() => {
    if (!meal) return;
    setProtein((current) => current >= range.min && current <= range.max ? current : meal.protein);
  }, [meal, range.min, range.max]);

  if (!plan || !meal) return <main className="grid min-h-screen place-items-center bg-[#050505] text-white">Invalid subscription plan.</main>;

  function saveDraft(nextStep = step) {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ name, phone, slot, instructions, address, protein, step: nextStep, day } satisfies DraftState));
  }
  function detectLocation() {
    if (!navigator.geolocation) { toast.error("Location detection is not supported by your browser."); return; }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(({ coords }) => { setAddress(`https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`); setLocationDetected(true); setDetectingLocation(false); toast.success("Location detected."); }, () => { setDetectingLocation(false); toast.error("Unable to detect your location. Please enter it manually."); }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  }
  function validateCurrentStep() {
    if (step === 0) {
      if (name.trim().length < 3) { toast.error("Enter your full name."); return false; }
      if (!/^[6-9]\d{9}$/.test(phone)) { toast.error("Enter a valid 10-digit phone number."); return false; }
      if (!slot) { toast.error("Select a delivery slot."); return false; }
      const selected = slots.find((x) => x.slot === slot);
      if (!selected?.available) { toast.error("That delivery slot is full. Choose another slot."); return false; }
    }
    if (step === 1 && (protein < range.min || protein > range.max)) { toast.error(`Protein must be between ${range.min}g and ${range.max}g.`); return false; }
    if (step === 3 && address.trim().length < 10) { toast.error("Enter your delivery address or detect your location."); return false; }
    return true;
  }
  async function continueStep() {
    if (!validateCurrentStep()) return;
    const nextStep = step < 5 ? step + 1 : step;
    saveDraft(nextStep);
    if (step < 5) { setStep(nextStep); return; }
    await startPayment();
  }
  function openUPI() {
    const upiLink = `upi://pay?pa=${encodeURIComponent(UPI_VPA)}&pn=${encodeURIComponent(UPI_NAME)}&am=${encodeURIComponent(String(plan.price))}&cu=INR`;
    window.location.href = upiLink;
  }
  async function submitPayment() {
    if (!userId) {
      saveDraft(5);
      const returnTo = `/subscriptions/checkout?plan=${encodeURIComponent(plan.id)}`;
      window.location.href = `/account?returnTo=${encodeURIComponent(returnTo)}`;
      return;
    }
    if (!paymentDone) { toast.error("Complete the UPI payment and then tap 'I've Completed Payment'."); return; }
    setLoading(true);
    try {
      const selected = slots.find((x) => x.slot === slot);
      if (!selected?.available) throw new Error("That delivery slot is now full. Please choose another slot.");
      const start = new Date(); const end = new Date(start); end.setDate(start.getDate() + 6);
      const subscriptionPayload = { userId, customerName: name.trim(), phone, planId: plan.id, planName: plan.name, amount: plan.price, status: "PENDING_PAYMENT" as const, startDate: start.toISOString(), endDate: end.toISOString(), deliverySlot: slot as DeliverySlot, deliveryTime: String(slot), address, proteinPerMeal: protein, caloriesPerMeal: meal.calories, instructions, skippedMeals: 0 };
      await createSubscriptionDraft(subscriptionPayload);
      localStorage.removeItem(DRAFT_KEY);
      toast.success("Payment submitted for verification. We will confirm your subscription shortly.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to submit payment");
    } finally { setLoading(false); }
  }
  async function startPayment() { await submitPayment(); }

  const isMap = address.startsWith("https://www.google.com/maps?q=");
  const steps = ["Customer & slot", "Meal", "Instructions", "Location", "Review", "Payment"];
  const upiLink = `upi://pay?pa=${encodeURIComponent(UPI_VPA)}&pn=${encodeURIComponent(UPI_NAME)}&am=${encodeURIComponent(String(plan.price))}&cu=INR`;
  return <main className="min-h-screen bg-[#050505] px-5 pb-20 pt-24 text-white"><div className="mx-auto max-w-6xl">
    <Link href="/#subscriptions" className="mb-8 inline-flex items-center gap-2 text-sm text-white/45 hover:text-white"><ChevronLeft className="h-4 w-4"/> Plans</Link>
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <section>
        <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-2">{steps.map((name, index) => <div key={name} className="flex min-w-max items-center gap-2 text-xs"><span className={`flex h-7 w-7 items-center justify-center rounded-full ${index < step ? "bg-[#E63946] text-white" : index === step ? "border border-[#E63946] text-[#E63946]" : "border border-white/10 text-white/30"}`}>{index < step ? "✓" : index + 1}</span><span className={index === step ? "text-white" : "text-white/30"}>{name}</span>{index < steps.length - 1 && <span className="mx-1 text-white/15">—</span>}</div>)}</div>
        <div className="rounded-[32px] border border-white/10 bg-white/[0.035] p-6 sm:p-9">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#E63946]">{steps[step]}</p>
          {step === 0 && <><h1 className="mt-3 text-3xl font-bold">Your details</h1><div className="mt-8 grid gap-5 sm:grid-cols-2"><label className="text-sm text-white/55">Full name<input value={name} onChange={(e) => setName(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 p-4 text-white outline-none focus:border-[#E63946]" placeholder="Your full name" /></label><label className="text-sm text-white/55">Phone<input value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 p-4 text-white outline-none focus:border-[#E63946]" placeholder="10-digit mobile number" /></label></div><h2 className="mt-8 text-lg font-bold">Delivery slot</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{DELIVERY_SLOTS.map((value) => { const item = slots.find((x) => x.slot === value); const available = item?.available ?? true; return <button type="button" key={value} disabled={!available} onClick={() => setSlot(value)} className={`rounded-2xl border p-4 text-left ${slot === value ? "border-[#E63946] bg-[#E63946]/10" : "border-white/10 bg-white/[0.02]"} ${!available ? "opacity-30" : ""}`}><p className="font-bold">{value}</p><p className="mt-1 text-xs text-white/35">{available ? "Available" : "Full"}</p></button>; })}</div></>}
          {step === 1 && <><h1 className="mt-3 text-3xl font-bold">Customize your meal</h1><div className="mt-7 flex gap-2 overflow-x-auto">{DAYS.map((d) => <button key={d} type="button" onClick={() => setDay(d)} className={`rounded-full px-5 py-2 text-xs font-bold ${day === d ? "bg-[#E63946] text-white" : "bg-white/5 text-white/50"}`}>{d}</button>)}</div><div className="mt-6 grid gap-6 sm:grid-cols-[180px_1fr]"><div className="relative h-44 overflow-hidden rounded-2xl"><Image src={meal.image} alt={meal.name} fill className="object-cover" sizes="180px" /></div><div><h2 className="text-xl font-bold">{meal.name}</h2><p className="mt-2 text-sm text-white/45">Default: {meal.protein}g protein · {meal.calories} kcal</p><label className="mt-5 block text-xs text-white/45">Protein / meal<input type="number" min={range.min} max={range.max} value={protein} onChange={(e) => setProtein(Number(e.target.value))} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 p-3 text-white outline-none focus:border-[#E63946]" /></label></div></div></>}
          {step === 2 && <><h1 className="mt-3 text-3xl font-bold">Any special instructions?</h1><div className="mt-8"><MessageSquare className="mb-3 h-5 w-5 text-[#E63946]" /><textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Less spicy, no onion, etc." className="min-h-40 w-full rounded-2xl border border-white/10 bg-black/25 p-5 text-white outline-none placeholder:text-white/25 focus:border-[#E63946]" /></div></>}
          {step === 3 && <><h1 className="mt-3 text-3xl font-bold">Where should we deliver?</h1><p className="mt-2 text-sm text-white/40">Enter your address manually or use your current location.</p><div className="mt-8"><div className="mb-3 flex items-center justify-between"><div className="flex items-center gap-2"><MapPin className="h-5 w-5 text-[#E63946]" /><span className="text-sm font-medium text-white/70">Delivery location</span></div>{locationDetected && <span className="text-xs text-green-400">Location detected</span>}</div><textarea value={address} onChange={(e) => { setAddress(e.target.value); setLocationDetected(false); }} placeholder="Enter your full delivery address..." className="min-h-36 w-full rounded-2xl border border-white/10 bg-black/25 p-5 text-white outline-none placeholder:text-white/25" />{isMap && <a href={address} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-[#E63946]">View location in Google Maps <ExternalLink className="h-3.5 w-3.5" /></a>}<button type="button" onClick={detectLocation} disabled={detectingLocation} className="mt-4 flex w-full items-center justify-center gap-3 rounded-2xl border border-[#E63946]/40 bg-[#E63946]/10 px-5 py-4 text-sm font-bold text-[#E63946] disabled:opacity-50"><LocateFixed className="h-5 w-5" />{detectingLocation ? "Detecting..." : "Detect My Location"}</button></div></>}
          {step === 4 && <><h1 className="mt-3 text-3xl font-bold">Review your subscription</h1><div className="mt-8 space-y-4 text-sm text-white/60"><p><b className="text-white">Plan:</b> {plan.name} · ₹{plan.price}/week</p><p><b className="text-white">Delivery:</b> {slot}</p><p><b className="text-white">Nutrition:</b> {protein}g protein · {meal.calories} kcal per meal</p><p><b className="text-white">Address:</b> {isMap ? <a href={address} target="_blank" rel="noopener noreferrer" className="text-[#E63946]">Open Google Maps location</a> : address}</p><p><b className="text-white">Instructions:</b> {instructions || "None"}</p></div></>}
          {step === 5 && <><h1 className="mt-3 text-3xl font-bold">Pay with UPI</h1><div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-6"><p className="text-sm text-white/60">Pay ₹{plan.price} to <b className="text-white">{UPI_VPA}</b></p><div className="mt-6 flex justify-center"><div className="rounded-2xl bg-white p-4"><QRCode value={upiLink} size={220} /></div></div><p className="mt-4 text-center text-sm font-semibold text-white">Scan this QR code with any UPI app</p><p className="mt-1 text-center text-xs text-white/40">PhonePe · Google Pay · Paytm · BHIM · Any UPI App</p><button type="button" onClick={openUPI} className="mt-6 w-full rounded-2xl bg-[#E63946] px-5 py-4 font-bold">Open UPI App</button><label className="mt-5 flex items-center gap-3 text-sm text-white/60"><input type="checkbox" checked={paymentDone} onChange={(e) => setPaymentDone(e.target.checked)} /> I've Completed Payment</label></div></>}
          <div className="mt-10 flex justify-between gap-3"><button type="button" disabled={step === 0 || loading} onClick={() => setStep(Math.max(0, step - 1))} className="rounded-full border border-white/10 px-6 py-3 text-sm disabled:opacity-20">Back</button><button type="button" disabled={loading || detectingLocation} onClick={continueStep} className="rounded-full bg-[#E63946] px-7 py-3 text-sm font-bold disabled:opacity-50">{loading ? "Submitting..." : step === 5 ? "Submit Payment" : "Continue"}</button></div>
        </div>
      </section>
      <aside className="h-fit rounded-[28px] border border-white/10 bg-[#0D0B0B] p-6"><p className="text-xs font-bold uppercase tracking-[0.25em] text-[#E63946]">Summary</p><h2 className="mt-3 text-2xl font-bold">{plan.name} Plan</h2><p className="mt-1 text-sm text-white/40">7-day nutrition plan</p><div className="my-7 border-y border-white/10 py-5"><div className="flex justify-between text-sm"><span className="text-white/45">Weekly total</span><b>₹{plan.price}</b></div><div className="mt-3 flex justify-between text-sm"><span className="text-white/45">Delivery slot</span><span>{slot || "Not selected"}</span></div></div><p className="text-xs leading-5 text-white/35">After you complete the UPI payment, submit it for manual verification.</p></aside>
    </div>
  </div></main>;
}
