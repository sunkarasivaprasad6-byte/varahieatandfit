"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { listSubscriptions, type Subscription, updateSubscription } from "@/lib/subscriptionService";
import { getPlan } from "@/lib/subscriptionData";

function paymentLabel(item: Subscription) {
  if (item.status === "ACTIVE") return "PAID";
  if (item.status === "CANCELLED") return "REJECTED";
  return "PENDING";
}
function paymentClass(status: string) {
  if (status === "PAID") return "bg-green-500/10 text-green-400";
  if (status === "REJECTED") return "bg-red-500/10 text-red-400";
  return "bg-yellow-500/10 text-yellow-400";
}

function getDeliverySlotStart(slot: string, date: Date) {
  const match = slot.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2] || "0");
  const period = match[3].toUpperCase();
  if (period === "PM" && hour !== 12) hour += 12;
  if (period === "AM" && hour === 12) hour = 0;

  const start = new Date(date);
  start.setHours(hour, minute, 0, 0);
  return start;
}

function getFirstDeliveryDate(item: Subscription, confirmationTime: Date) {
  const selectedDate = new Date(item.startDate);
  if (Number.isNaN(selectedDate.getTime())) return confirmationTime;

  const slotStart = getDeliverySlotStart(item.deliverySlot || item.deliveryTime || "", selectedDate);
  if (!slotStart) return selectedDate;

  // The owner confirms the subscription. If the selected delivery slot has
  // already started/passed, the first delivery moves to the next calendar day.
  // The 20-minute cutoff is for changing an existing delivery slot, not for
  // deciding whether a newly confirmed subscription can use today's slot.
  if (confirmationTime >= slotStart) {
    selectedDate.setDate(selectedDate.getDate() + 1);
  }

  return selectedDate;
}

export default function AdminSubscriptions() {
  const r = useRouter();
  const [items, setItems] = useState<Subscription[]>([]);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function load() {
    try { setItems(await listSubscriptions()); }
    catch (error) { console.error("Failed to load subscriptions", error); setMessage("Unable to load subscriptions."); }
  }
  useEffect(() => onAuthStateChanged(auth, (u) => { if (!u) r.replace("/login"); else { setChecking(false); load(); } }), [r]);

  const stats = useMemo(() => ({
    active: items.filter((x) => x.status === "ACTIVE").length,
    pending: items.filter((x) => x.status === "PENDING_PAYMENT").length,
    failed: items.filter((x) => x.status === "CANCELLED").length,
    skipped: items.reduce((a, x) => a + (x.skippedMeals || 0), 0),
    plans: new Set(items.map((x) => x.planId)).size,
  }), [items]);

  async function confirmPayment(item: Subscription) {
    if (!item.id) return;
    setBusy(item.id); setMessage("");
    try {
      const confirmationTime = new Date();
      const firstDelivery = getFirstDeliveryDate(item, confirmationTime);
      const end = new Date(firstDelivery);
      end.setDate(firstDelivery.getDate() + 6);
      await updateSubscription(item.id, {
        status: "ACTIVE",
        paymentStatus: "SUCCESS",
        paymentVerifiedAt: confirmationTime.toISOString(),
        startDate: firstDelivery.toISOString(),
        endDate: end.toISOString(),
      });
      setMessage(`${item.customerName} subscription confirmed.`);
      await load();
    } catch (error) { console.error(error); setMessage("Unable to confirm subscription."); }
    finally { setBusy(null); }
  }

  async function rejectPayment(item: Subscription) {
    if (!item.id) return;
    if (!window.confirm(`Reject payment for ${item.customerName || "this customer"}?`)) return;
    setBusy(item.id); setMessage("");
    try {
      await updateSubscription(item.id, { status: "CANCELLED", paymentStatus: "FAILED", paymentFailedAt: new Date().toISOString() });
      setMessage(`${item.customerName} payment rejected.`);
      await load();
    } catch (error) { console.error(error); setMessage("Unable to reject payment."); }
    finally { setBusy(null); }
  }

  if (checking) return <main className="grid min-h-screen place-items-center bg-[#0F0F10] text-white/50">Checking login…</main>;
  const pending = items.filter((x) => x.status === "PENDING_PAYMENT");

  return <main className="min-h-screen bg-[#0F0F10] px-6 py-10 text-white"><div className="mx-auto max-w-7xl">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.3em] text-[#E63946]">Admin</p><h1 className="mt-2 text-4xl font-bold">Subscriptions</h1><p className="mt-2 text-sm text-white/40">Payment, plan and delivery state for every customer subscription.</p></div><div className="flex gap-2"><Link href="/admin/operations" className="rounded-full bg-[#E63946] px-5 py-2 text-sm font-bold">Delivery Operations</Link><button onClick={() => r.push("/admin")} className="rounded-full border border-white/10 px-5 py-2 text-sm">Menu admin</button></div></div>
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5"><Stat label="Active" value={stats.active}/><Stat label="Pending payment" value={stats.pending}/><Stat label="Failed / cancelled" value={stats.failed}/><Stat label="Skipped meals" value={stats.skipped}/><Stat label="Plans" value={stats.plans}/></div>
    {message && <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">{message}</div>}

    <section className="mt-8 rounded-3xl border border-yellow-500/20 bg-[#171717] p-6"><div className="flex items-center justify-between gap-4"><div><h2 className="text-2xl font-bold">Payments to Confirm</h2><p className="mt-1 text-sm text-white/40">Check the UPI payment in your bank/UPI app before confirming.</p></div><span className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs text-yellow-300">{pending.length} pending</span></div>
      <div className="mt-5 space-y-3">{pending.map((x) => <div key={x.id} className="rounded-2xl border border-white/10 bg-black/20 p-5"><div className="grid gap-5 lg:grid-cols-[1.2fr_1fr_1fr_auto] lg:items-center"><div><p className="font-bold">{x.customerName || "Customer"}</p><p className="mt-1 text-sm text-white/55">{x.phone || "—"}</p></div><div><p className="text-xs text-white/35">Plan</p><p className="mt-1 font-semibold">{x.planName}</p><p className="text-xs text-white/40">₹{x.amount}/week</p></div><div><p className="text-xs text-white/35">Delivery</p><p className="mt-1">{x.deliverySlot || x.deliveryTime}</p>{x.address?.startsWith("https://www.google.com/maps?q=") ? <a href={x.address} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex text-xs font-semibold text-[#E63946] hover:underline">Open Google Maps</a> : <p className="mt-1 text-xs text-white/40">{x.address || "No address"}</p>}</div><div className="flex gap-2"><button disabled={busy === x.id} onClick={() => confirmPayment(x)} className="rounded-xl bg-green-600 px-4 py-3 text-xs font-bold disabled:opacity-50">{busy === x.id ? "Saving…" : "✓ Confirm"}</button><button disabled={busy === x.id} onClick={() => rejectPayment(x)} className="rounded-xl border border-red-500/30 px-4 py-3 text-xs font-bold text-red-300 disabled:opacity-50">Reject</button></div></div>{x.instructions && <div className="mt-4 border-t border-white/5 pt-3 text-sm text-white/55"><b className="text-white/75">Special instructions:</b> {x.instructions}</div>}</div>)}{pending.length === 0 && <p className="p-5 text-white/40">No payments waiting for confirmation.</p>}</div>
    </section>

    <div className="mt-8 space-y-3">{items.map((x) => { const payment = paymentLabel(x); return <div key={x.id} className="rounded-2xl border border-white/10 bg-[#171717] p-5"><div className="grid gap-5 lg:grid-cols-[1.2fr_1fr_1fr_1fr_1fr] lg:items-center"><div><p className="font-bold">{x.customerName || x.planName}</p><p className="mt-1 text-xs text-white/35">{x.phone || `User ${x.userId}`}</p><p className="mt-2 text-sm">{x.planName} · ₹{x.amount}/week</p></div><div><p className="text-xs text-white/35">Payment</p><span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs ${paymentClass(payment)}`}>{payment}</span></div><div><p className="text-xs text-white/35">Subscription</p><span className="mt-2 inline-flex rounded-full bg-white/5 px-3 py-1 text-xs text-white/70">{x.status}</span></div><div><p className="text-xs text-white/35">Delivery</p><p className="mt-1 text-sm">{x.deliveryTime || "Not set"}</p><p className="mt-1 text-xs text-white/35">{x.address || "No address"}</p></div><div><p className="text-xs text-white/35">Nutrition / skips</p><p className="mt-1 text-sm">{x.proteinPerMeal}g · {x.caloriesPerMeal} kcal</p><p className="mt-1 text-xs text-white/35">Skipped: {x.skippedMeals || 0}</p></div></div>{x.instructions && <p className="mt-4 border-t border-white/5 pt-3 text-xs text-white/40"><b>Instructions:</b> {x.instructions}</p>}{x.startDate && <p className="mt-2 text-xs text-white/30">Start: {new Date(x.startDate).toLocaleString()} · End: {x.endDate ? new Date(x.endDate).toLocaleString() : "—"}</p>}</div>; })}</div>
  </div></main>;
}
function Stat({label,value}:{label:string;value:number}){return <div className="rounded-2xl border border-white/10 bg-[#171717] p-5"><p className="text-xs text-white/40">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></div>}
