"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { listSubscriptions, type Subscription, updateSubscription } from "@/lib/subscriptionService";
import { getPlan } from "@/lib/subscriptionData";
import { getOrders, updateOrderStatus, verifyDeliveryOtp } from "@/lib/orderService";
import type { Order, OrderStatus } from "@/types/order";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;
const TIMES = ["5:00 PM – 6:00 PM", "6:00 PM – 7:00 PM", "7:00 PM – 8:00 PM"];
const ORDER_STATUSES: OrderStatus[] = ["NEW", "PAYMENT_PENDING", "PAYMENT_VERIFIED", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "OTP_PENDING", "DELIVERED", "CANCELLED"];

type SkipRecord = {
  id: string;
  skippedAt: string;
  expiresAt: string;
  scheduledFor?: string;
  scheduledTime?: string;
  status: "AVAILABLE" | "SCHEDULED" | "USED" | "EXPIRED";
};

type Slot = { id?: string; label: string; active: boolean; cutoffMinutes: number };
type MealSchedule = { id?: string; planId: string; day: string; name: string; image: string; calories: number; protein: number; active: boolean };

function daysLeft(date: string) {
  return Math.max(0, Math.ceil((new Date(date).getTime() - Date.now()) / 86400000));
}
function todayKey() {
  const d = new Date().getDay();
  return d === 0 ? "SUN" : DAYS[d - 1];
}
function getRecords(sub: Subscription): SkipRecord[] {
  return ((sub as Subscription & { skippedMealRecords?: SkipRecord[] }).skippedMealRecords || []);
}

export default function AdminOperationsPage() {
  const [checking, setChecking] = useState(true);
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [meals, setMeals] = useState<MealSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [slotForm, setSlotForm] = useState<Slot>({ label: TIMES[0], active: true, cutoffMinutes: 120 });
  const [mealForm, setMealForm] = useState<MealSchedule>({ planId: "silver", day: "MON", name: "", image: "", calories: 0, protein: 0, active: true });
  const [editingSlot, setEditingSlot] = useState<string | null>(null);
  const [editingMeal, setEditingMeal] = useState<string | null>(null);
  const [otp, setOtp] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    try {
      const [s, o, slotSnap, mealSnap] = await Promise.all([
        listSubscriptions(),
        getOrders(),
        getDocs(collection(db, "deliverySlots")),
        getDocs(collection(db, "mealSchedules")),
      ]);
      setSubs(s);
      setOrders(o);
      setSlots(slotSnap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Slot, "id">) })));
      setMeals(mealSnap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<MealSchedule, "id">) })));
    } catch (e) {
      console.error(e);
      setMessage("Unable to load admin operations data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => onAuthStateChanged(auth, user => {
    if (!user) window.location.href = "/login";
    else { setChecking(false); load(); }
  }), []);

  const activeSubs = useMemo(() => subs.filter(s => s.status === "ACTIVE"), [subs]);
  const pendingSubs = subs.filter(s => s.status === "PENDING_PAYMENT");
  const today = todayKey();
  const todayDeliveries = activeSubs.filter(s => {
    const records = getRecords(s);
    const todayIso = new Date().toISOString().slice(0, 10);
    return !records.some(r => r.status === "SCHEDULED" && r.scheduledFor === todayIso);
  });
  const allSkipped = subs.flatMap(s => getRecords(s).map(r => ({ ...r, sub: s })));
  const availableSkipped = allSkipped.filter(x => x.status === "AVAILABLE" && daysLeft(x.expiresAt) > 0);
  const expiring = availableSkipped.filter(x => daysLeft(x.expiresAt) <= 3);
  const rescheduled = allSkipped.filter(x => x.status === "SCHEDULED");

  async function saveSlot() {
    try {
      if (editingSlot) await updateDoc(doc(db, "deliverySlots", editingSlot), { ...slotForm, updatedAt: serverTimestamp() });
      else await addDoc(collection(db, "deliverySlots"), { ...slotForm, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      setEditingSlot(null); setSlotForm({ label: TIMES[0], active: true, cutoffMinutes: 120 }); await load();
    } catch (e) { console.error(e); setMessage("Failed to save delivery slot."); }
  }
  async function removeSlot(id: string) {
    if (!confirm("Delete this delivery slot?")) return;
    await deleteDoc(doc(db, "deliverySlots", id)); await load();
  }
  async function saveMeal() {
    try {
      const data = { ...mealForm, calories: Number(mealForm.calories), protein: Number(mealForm.protein), updatedAt: serverTimestamp() };
      if (editingMeal) await updateDoc(doc(db, "mealSchedules", editingMeal), data);
      else await addDoc(collection(db, "mealSchedules"), { ...data, createdAt: serverTimestamp() });
      setEditingMeal(null); setMealForm({ planId: "silver", day: "MON", name: "", image: "", calories: 0, protein: 0, active: true }); await load();
    } catch (e) { console.error(e); setMessage("Failed to save meal schedule."); }
  }
  async function removeMeal(id: string) {
    if (!confirm("Delete this scheduled meal?")) return;
    await deleteDoc(doc(db, "mealSchedules", id)); await load();
  }
  async function changeSubscriptionStatus(id: string, status: Subscription["status"]) {
    await updateSubscription(id, { status }); await load();
  }
  async function verifyOtp(id: string) {
    try { await verifyDeliveryOtp(id, otp[id] || ""); setMessage("Delivery confirmed."); await load(); }
    catch (e) { setMessage(e instanceof Error ? e.message : "Invalid OTP"); }
  }
  async function changeOrder(id: string, status: string) {
    await updateOrderStatus(id, status); await load();
  }

  if (checking || loading) return <main className="min-h-screen bg-[#0F0F10] grid place-items-center text-white/50">Loading admin operations…</main>;

  return (
    <main className="min-h-screen bg-[#0F0F10] text-white px-5 py-8 md:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[0.3em] text-[#E63946]">Admin Operations</p><h1 className="mt-2 text-4xl font-bold">Eat & Fit Delivery Control</h1><p className="mt-2 text-white/40">Subscription operations, meals, delivery slots, skips and OTP delivery.</p></div>
          <div className="flex gap-2"><Link href="/admin" className="rounded-full border border-white/10 px-5 py-2 text-sm">Restaurant Admin</Link><Link href="/admin/subscriptions" className="rounded-full border border-white/10 px-5 py-2 text-sm">Subscriptions</Link><Link href="/admin/orders" className="rounded-full border border-white/10 px-5 py-2 text-sm">Orders</Link></div>
        </header>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[["Active subscriptions", activeSubs.length], ["Pending payment", pendingSubs.length], ["Today's deliveries", todayDeliveries.length], ["Skipped credits", availableSkipped.length], ["Expiring ≤3 days", expiring.length]].map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-white/10 bg-[#171717] p-5"><p className="text-xs text-white/40">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></div>)}
        </div>

        {message && <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">{message}</div>}

        <section className="mt-8 rounded-3xl border border-white/10 bg-[#171717] p-6">
          <div className="mb-5"><h2 className="text-2xl font-bold">Active Subscriptions</h2><p className="text-sm text-white/40">Customer details, plan, meal, delivery, customizations, skips and status.</p></div>
          <div className="space-y-4">
            {activeSubs.length === 0 ? <p className="text-white/40">No active subscriptions.</p> : activeSubs.map(s => {
              const plan = getPlan(s.planId); const meal = plan?.meals[today.toLowerCase()]; const records = getRecords(s); const available = records.filter(r => r.status === "AVAILABLE" && daysLeft(r.expiresAt) > 0).length;
              return <div key={s.id} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
                  <div><p className="font-bold">{s.planName}</p><p className="mt-1 text-xs text-white/40">Customer ID: {s.userId}</p><p className="mt-2 text-sm">{s.address || "No address"}</p></div>
                  <div><p className="text-xs text-white/35">Today's meal</p><p className="mt-1 text-sm">{meal?.name || "No meal"}</p><p className="mt-1 text-xs text-white/40">{s.deliveryTime}</p></div>
                  <div><p className="text-xs text-white/35">Customization</p><p className="mt-1 text-sm">{s.proteinPerMeal}g · {s.caloriesPerMeal} kcal</p><p className="mt-1 text-xs text-white/40">{s.instructions || "No instructions"}</p></div>
                  <div><p className="text-xs text-white/35">Skip / delivery</p><p className="mt-1 text-sm">{available} credits</p><p className="mt-1 text-xs text-white/40">Ends {new Date(s.endDate).toLocaleDateString()}</p></div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2"><button onClick={() => changeSubscriptionStatus(s.id!, "PAUSED")} className="rounded-lg border border-yellow-400/20 px-3 py-2 text-xs">Pause</button><button onClick={() => changeSubscriptionStatus(s.id!, "CANCELLED")} className="rounded-lg border border-red-400/20 px-3 py-2 text-xs">Cancel</button><button onClick={() => changeSubscriptionStatus(s.id!, "COMPLETED")} className="rounded-lg border border-white/10 px-3 py-2 text-xs">Complete</button></div>
              </div>;
            })}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-[#171717] p-6">
          <h2 className="text-2xl font-bold">Today's Deliveries</h2><p className="mt-1 text-sm text-white/40">Who needs food today, what they need, delivery time, changes and address.</p>
          <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="text-xs text-white/35"><tr><th className="p-3">Customer</th><th className="p-3">Plan / Meal</th><th className="p-3">Time</th><th className="p-3">Address</th><th className="p-3">Changes</th></tr></thead><tbody>{todayDeliveries.map(s => { const meal = getPlan(s.planId)?.meals[today.toLowerCase()]; return <tr key={s.id} className="border-t border-white/5"><td className="p-3">{s.userId}</td><td className="p-3">{s.planName}<br/><span className="text-white/40">{meal?.name || "No meal"}</span></td><td className="p-3">{s.deliveryTime}</td><td className="p-3 max-w-[260px]">{s.address}</td><td className="p-3">{s.instructions || "None"}</td></tr>; })}</tbody></table></div>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-[#171717] p-6"><h2 className="text-2xl font-bold">Delivery Time Slots</h2><p className="mt-1 text-sm text-white/40">Control customer-selectable delivery windows and modification cutoff.</p>
            <div className="mt-5 space-y-3">{slots.map(slot => <div key={slot.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-black/20 p-4"><div><b>{slot.label}</b><p className="text-xs text-white/40">{slot.active ? "Active" : "Inactive"} · cutoff {slot.cutoffMinutes} min</p></div><div className="flex gap-2"><button onClick={() => {setEditingSlot(slot.id!); setSlotForm(slot)}} className="rounded-lg bg-blue-600 px-3 py-2 text-xs">Edit</button><button onClick={() => removeSlot(slot.id!)} className="rounded-lg bg-red-600 px-3 py-2 text-xs">Delete</button></div></div>)}
              {slots.length === 0 && <p className="text-sm text-white/35">No admin slots yet. Add the first slots below.</p>}
            </div>
            <div className="mt-5 grid gap-3"><select value={slotForm.label} onChange={e=>setSlotForm({...slotForm,label:e.target.value})} className="rounded-xl bg-black/30 p-3"><option>{TIMES[0]}</option><option>{TIMES[1]}</option><option>{TIMES[2]}</option></select><input type="number" min="0" value={slotForm.cutoffMinutes} onChange={e=>setSlotForm({...slotForm,cutoffMinutes:Number(e.target.value)})} placeholder="Cutoff minutes" className="rounded-xl bg-black/30 p-3"/><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={slotForm.active} onChange={e=>setSlotForm({...slotForm,active:e.target.checked})}/> Active</label><button onClick={saveSlot} className="rounded-xl bg-[#E63946] px-5 py-3 font-bold">{editingSlot ? "Save Slot" : "Add Slot"}</button></div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#171717] p-6"><h2 className="text-2xl font-bold">Meal Schedule</h2><p className="mt-1 text-sm text-white/40">Configure meals for every plan and day.</p>
            <div className="mt-5 space-y-3">{meals.map(m => <div key={m.id} className="flex items-center justify-between gap-3 rounded-xl bg-black/20 p-4"><div><b className="capitalize">{m.planId}</b><span className="mx-2 text-white/25">·</span><b>{m.day}</b><p className="text-xs text-white/40">{m.name} · {m.protein}g · {m.calories} kcal</p></div><div className="flex gap-2"><button onClick={()=>{setEditingMeal(m.id!);setMealForm(m)}} className="rounded-lg bg-blue-600 px-3 py-2 text-xs">Edit</button><button onClick={()=>removeMeal(m.id!)} className="rounded-lg bg-red-600 px-3 py-2 text-xs">Delete</button></div></div>)}{meals.length===0&&<p className="text-sm text-white/35">No admin meal schedules yet.</p>}</div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2"><select value={mealForm.planId} onChange={e=>setMealForm({...mealForm,planId:e.target.value})} className="rounded-xl bg-black/30 p-3"><option value="silver">Silver</option><option value="golden">Golden</option><option value="diamond">Diamond</option></select><select value={mealForm.day} onChange={e=>setMealForm({...mealForm,day:e.target.value})} className="rounded-xl bg-black/30 p-3">{DAYS.map(d=><option key={d}>{d}</option>)}</select><input value={mealForm.name} onChange={e=>setMealForm({...mealForm,name:e.target.value})} placeholder="Meal name" className="rounded-xl bg-black/30 p-3"/><input value={mealForm.image} onChange={e=>setMealForm({...mealForm,image:e.target.value})} placeholder="Meal image URL" className="rounded-xl bg-black/30 p-3"/><input type="number" value={mealForm.protein} onChange={e=>setMealForm({...mealForm,protein:Number(e.target.value)})} placeholder="Protein g" className="rounded-xl bg-black/30 p-3"/><input type="number" value={mealForm.calories} onChange={e=>setMealForm({...mealForm,calories:Number(e.target.value)})} placeholder="Calories" className="rounded-xl bg-black/30 p-3"/><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={mealForm.active} onChange={e=>setMealForm({...mealForm,active:e.target.checked})}/> Active</label><button onClick={saveMeal} className="rounded-xl bg-[#E63946] px-5 py-3 font-bold sm:col-span-2">{editingMeal ? "Save Meal" : "Add Meal"}</button></div>
          </div>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-[#171717] p-6"><h2 className="text-xl font-bold">Skipped Meals</h2><p className="mt-1 text-xs text-white/40">Each credit expires 15 days after skip.</p><div className="mt-4 space-y-2 max-h-[420px] overflow-auto">{allSkipped.length===0?<p className="text-sm text-white/35">No skipped meals.</p>:allSkipped.map(x=><div key={x.sub.id+"-"+x.id} className="rounded-xl bg-black/20 p-3 text-sm"><b>{x.sub.userId}</b><p className="text-xs text-white/40">{x.status} · expires {new Date(x.expiresAt).toLocaleDateString()}</p></div>)}</div></div>
          <div className="rounded-3xl border border-white/10 bg-[#171717] p-6"><h2 className="text-xl font-bold">Expiring Meals</h2><p className="mt-1 text-xs text-white/40">Available credits expiring within 3 days.</p><div className="mt-4 space-y-2">{expiring.length===0?<p className="text-sm text-white/35">Nothing expiring soon.</p>:expiring.map(x=><div key={x.sub.id+"-"+x.id} className="rounded-xl bg-red-500/10 p-3 text-sm"><b>{x.sub.userId}</b><p className="text-xs text-red-300">Expires in {daysLeft(x.expiresAt)} day(s)</p></div>)}</div></div>
          <div className="rounded-3xl border border-white/10 bg-[#171717] p-6"><h2 className="text-xl font-bold">Rescheduled Meals</h2><p className="mt-1 text-xs text-white/40">Meals moved using skipped-meal credits.</p><div className="mt-4 space-y-2">{rescheduled.length===0?<p className="text-sm text-white/35">No rescheduled meals.</p>:rescheduled.map(x=><div key={x.sub.id+"-"+x.id} className="rounded-xl bg-black/20 p-3 text-sm"><b>{x.sub.userId}</b><p className="text-xs text-white/40">{x.scheduledFor || "No date"} · {x.scheduledTime || "No time"}</p></div>)}</div></div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-[#171717] p-6"><h2 className="text-2xl font-bold">Delivery Status & OTP</h2><p className="mt-1 text-sm text-white/40">Normal orders can be moved through delivery stages and confirmed with the customer OTP.</p><div className="mt-5 space-y-4">{orders.length===0?<p className="text-white/35">No normal orders yet.</p>:orders.map(order=><div key={order.id} className="rounded-2xl bg-black/20 p-5"><div className="grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr] lg:items-center"><div><b>{order.name}</b><p className="text-xs text-white/40">{order.phone} · {order.address}</p><p className="mt-1 text-sm">₹{order.total}</p></div><div><p className="text-xs text-white/35">Current status</p><select value={order.status} onChange={e=>changeOrder(order.id!,e.target.value)} className="mt-2 w-full rounded-lg bg-[#252525] p-2 text-sm">{ORDER_STATUSES.map(s=><option key={s}>{s}</option>)}</select></div><div>{["READY","OUT_FOR_DELIVERY","OTP_PENDING"].includes(order.status) ? <div><p className="text-xs text-white/35">Customer delivery OTP</p><div className="mt-2 flex gap-2"><input maxLength={4} value={otp[order.id!]||""} onChange={e=>setOtp(v=>({...v,[order.id!]:e.target.value}))} placeholder="4 digits" className="w-full rounded-lg bg-[#252525] p-2"/><button onClick={()=>verifyOtp(order.id!)} className="rounded-lg bg-[#E63946] px-4 py-2 text-xs font-bold">Verify</button></div></div> : <span className="text-xs text-white/35">{order.status === "DELIVERED" ? "OTP verified / delivered" : "OTP available at delivery stage"}</span>}</div></div></div>)}</div></section>

        <p className="mt-8 pb-10 text-center text-xs text-white/25">Existing Restaurant Admin, Offers, Reviews, Orders and Subscription pages remain available. This page adds the requested subscription-operations controls.</p>
      </div>
    </main>
  );
}
