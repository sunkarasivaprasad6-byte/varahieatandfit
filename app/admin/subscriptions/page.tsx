"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { listSubscriptions, updateSubscription, type Subscription } from "@/lib/subscriptionService";

export default function AdminSubscriptions() {
  const router = useRouter();
  const [items, setItems] = useState<Subscription[]>([]);
  const [checking, setChecking] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [message, setMessage] = useState("");

  async function load() { try { setItems(await listSubscriptions()); } catch (error) { console.error(error); setMessage("Unable to load subscriptions."); } }
  useEffect(() => { setChecking(false); load(); }, []);

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    return items.filter((x) => (status === "ALL" || x.status === status) && (!text || [x.customerName, x.customerEmail, x.customerPhone, x.userId, x.planName, x.address].join(" ").toLowerCase().includes(text)));
  }, [items, query, status]);

  async function setSubStatus(id: string, next: Subscription["status"]) { try { await updateSubscription(id, { status: next }); setMessage(`Subscription updated to ${next}.`); await load(); } catch (error) { setMessage(error instanceof Error ? error.message : "Update failed."); } }

  if (checking) return <main className="min-h-screen bg-[#0F0F10] grid place-items-center text-white/50">Checking admin…</main>;

  return <main className="min-h-screen bg-[#0F0F10] px-5 py-10 text-white md:px-8"><div className="mx-auto max-w-7xl">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.3em] text-[#E63946]">Admin</p><h1 className="mt-2 text-4xl font-bold">Subscriptions</h1><p className="mt-2 text-sm text-white/40">Customers, payments, plans, delivery requests and subscription lifecycle.</p></div><div className="flex flex-wrap gap-2"><Link href="/admin/customers" className="rounded-full bg-[#E63946] px-5 py-2 text-sm font-bold">Customers</Link><Link href="/admin/operations" className="rounded-full border border-white/10 px-5 py-2 text-sm">Operations</Link><Link href="/admin/plans" className="rounded-full border border-white/10 px-5 py-2 text-sm">Plans</Link><button onClick={() => router.push('/admin')} className="rounded-full border border-white/10 px-5 py-2 text-sm">Menu admin</button></div></div>

    <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><div className="rounded-2xl border border-white/10 bg-[#171717] p-5"><p className="text-xs text-white/40">Active</p><p className="mt-2 text-3xl font-bold">{items.filter((x) => x.status === "ACTIVE").length}</p></div><div className="rounded-2xl border border-white/10 bg-[#171717] p-5"><p className="text-xs text-white/40">Pending payment</p><p className="mt-2 text-3xl font-bold">{items.filter((x) => x.status === "PENDING_PAYMENT").length}</p></div><div className="rounded-2xl border border-white/10 bg-[#171717] p-5"><p className="text-xs text-white/40">Paused</p><p className="mt-2 text-3xl font-bold">{items.filter((x) => x.status === "PAUSED").length}</p></div><div className="rounded-2xl border border-white/10 bg-[#171717] p-5"><p className="text-xs text-white/40">Skipped credits</p><p className="mt-2 text-3xl font-bold">{items.reduce((a, x) => a + (x.skippedMeals || 0), 0)}</p></div></div>

    <div className="mt-6 grid gap-3 md:grid-cols-[1fr_200px]"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search customer, email, phone, user ID, plan or address" className="rounded-xl border border-white/10 bg-[#111] p-4 text-sm outline-none focus:border-[#E63946]" /><select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-white/10 bg-[#111] p-4 text-sm"><option>ALL</option><option>ACTIVE</option><option>PENDING_PAYMENT</option><option>PAUSED</option><option>CANCELLED</option><option>COMPLETED</option></select></div>
    {message && <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">{message}</div>}

    <div className="mt-6 space-y-4">{filtered.length === 0 ? <div className="rounded-2xl border border-white/10 bg-[#171717] p-8 text-white/40">No subscriptions match the filter.</div> : filtered.map((x) => <article key={x.id} className="rounded-2xl border border-white/10 bg-[#171717] p-5"><div className="grid gap-5 lg:grid-cols-[1.3fr_1fr_1fr_1fr]"><div><p className="font-bold">{x.customerName || "Customer"}</p><p className="mt-1 text-sm text-white/50">{x.customerEmail || "Email not captured"}</p><p className="mt-1 text-xs text-white/35">{x.customerPhone || "Phone not captured"} · {x.userId}</p><p className="mt-3 text-sm text-white/50">{x.address || "No address"}</p></div><div><p className="text-xs text-white/35">Plan</p><p className="mt-1 font-semibold">{x.planName} · ₹{x.amount}/week</p><p className="mt-2 text-xs text-white/35">{x.startDate ? new Date(x.startDate).toLocaleDateString() : ""} → {x.endDate ? new Date(x.endDate).toLocaleDateString() : ""}</p><p className="mt-2 text-xs text-white/35">Payment: {x.paymentStatus || "LEGACY"}</p></div><div><p className="text-xs text-white/35">Delivery</p><p className="mt-1 text-sm">{x.deliveryTime || "Not set"}</p><p className="mt-2 text-xs text-white/35">{x.proteinPerMeal}g · {x.caloriesPerMeal} kcal</p><p className="mt-2 text-xs text-white/35">{x.instructions || "No instructions"}</p></div><div><span className={`rounded-full px-3 py-1 text-xs ${x.status === "ACTIVE" ? "bg-green-500/10 text-green-400" : x.status === "CANCELLED" ? "bg-red-500/10 text-red-400" : "bg-yellow-500/10 text-yellow-300"}`}>{x.status}</span><div className="mt-3 flex flex-wrap gap-2">{x.status !== "ACTIVE" && <button onClick={() => setSubStatus(x.id!, "ACTIVE")} className="rounded-lg border border-green-400/20 px-3 py-2 text-xs">Activate/Resume</button>}{x.status === "ACTIVE" && <button onClick={() => setSubStatus(x.id!, "PAUSED")} className="rounded-lg border border-yellow-400/20 px-3 py-2 text-xs">Pause</button>}{x.status !== "CANCELLED" && <button onClick={() => setSubStatus(x.id!, "CANCELLED")} className="rounded-lg border border-red-400/20 px-3 py-2 text-xs">Cancel</button>}</div></div></div></article>)}</div>
  </div></main>;
}
