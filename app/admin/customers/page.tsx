"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { listSubscriptions, updateSubscription, type Subscription } from "@/lib/subscriptionService";

export default function AdminCustomersPage() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    try {
      setSubs(await listSubscriptions());
    } catch (error) {
      console.error(error);
      setMessage("Unable to load customers.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    return subs.filter((sub) => {
      const matchesStatus = status === "ALL" || sub.status === status;
      const haystack = [sub.customerName, sub.customerEmail, sub.customerPhone, sub.userId, sub.planName, sub.address].join(" ").toLowerCase();
      return matchesStatus && (!text || haystack.includes(text));
    });
  }, [query, status, subs]);

  async function changeStatus(sub: Subscription, next: Subscription["status"]) {
    if (!sub.id) return;
    try {
      await updateSubscription(sub.id, { status: next });
      setMessage(`${sub.customerName || sub.customerEmail || sub.userId} → ${next}`);
      await load();
    } catch (error) {
      console.error(error);
      setMessage("Could not update the subscription.");
    }
  }

  async function saveTime(sub: Subscription, value: string) {
    if (!sub.id || !value) return;
    const [h, m] = value.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    const displayHour = h % 12 || 12;
    try {
      await updateSubscription(sub.id, { deliveryTime: `${displayHour}:${String(m).padStart(2, "0")} ${suffix}` });
      setMessage("Delivery time updated.");
      await load();
    } catch (error) {
      console.error(error);
      setMessage("Could not update delivery time.");
    }
  }

  function timeInput(value = "") {
    const match = value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return "";
    let hour = Number(match[1]);
    if (match[3].toUpperCase() === "PM" && hour !== 12) hour += 12;
    if (match[3].toUpperCase() === "AM" && hour === 12) hour = 0;
    return `${String(hour).padStart(2, "0")}:${match[2]}`;
  }

  if (loading) return <main className="min-h-screen bg-[#050505] grid place-items-center text-white/50">Loading customers…</main>;

  return (
    <main className="min-h-screen bg-[#050505] px-5 py-8 text-white md:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[0.3em] text-[#E63946]">Admin</p><h1 className="mt-2 text-4xl font-bold">Customers</h1><p className="mt-2 text-sm text-white/40">Search customers, inspect subscriptions, change status and update requested delivery times.</p></div>
          <div className="flex gap-2"><Link href="/admin" className="rounded-full border border-white/10 px-5 py-2 text-sm">Restaurant Admin</Link><Link href="/admin/operations" className="rounded-full border border-white/10 px-5 py-2 text-sm">Operations</Link></div>
        </header>

        <div className="mt-7 grid gap-3 md:grid-cols-[1fr_180px]">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email, phone, user ID, plan or address" className="rounded-xl border border-white/10 bg-[#111] p-4 text-sm outline-none focus:border-[#E63946]" />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-white/10 bg-[#111] p-4 text-sm"><option>ALL</option><option>ACTIVE</option><option>PENDING_PAYMENT</option><option>PAUSED</option><option>CANCELLED</option><option>COMPLETED</option></select>
        </div>

        {message && <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">{message}</div>}

        <div className="mt-6 space-y-4">
          {filtered.length === 0 ? <div className="rounded-2xl border border-white/10 bg-[#111] p-8 text-white/40">No customers match this filter.</div> : filtered.map((sub) => (
            <article key={sub.id} className="rounded-2xl border border-white/10 bg-[#111] p-5">
              <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr_1fr_1fr]">
                <div><p className="font-bold">{sub.customerName || "Customer"}</p><p className="mt-1 text-sm text-white/55">{sub.customerEmail || "Email not captured on this older subscription"}</p><p className="mt-1 text-xs text-white/35">{sub.customerPhone || "Phone not captured"} · {sub.userId}</p><p className="mt-3 text-sm text-white/55">{sub.address || "No address"}</p></div>
                <div><p className="text-xs text-white/35">Plan</p><p className="mt-1 font-semibold">{sub.planName} · ₹{sub.amount}/week</p><p className="mt-2 text-xs text-white/35">{sub.startDate ? new Date(sub.startDate).toLocaleDateString() : ""} → {sub.endDate ? new Date(sub.endDate).toLocaleDateString() : ""}</p></div>
                <div><p className="text-xs text-white/35">Requested delivery time</p><input aria-label="Delivery time" type="time" defaultValue={timeInput(sub.deliveryTime)} onBlur={(e) => saveTime(sub, e.target.value)} className="mt-2 rounded-xl border border-white/10 bg-black/25 p-3 text-sm" /><p className="mt-2 text-xs text-white/35">Customer can enter any time; this is the saved request.</p></div>
                <div><span className={`rounded-full px-3 py-1 text-xs ${sub.status === "ACTIVE" ? "bg-green-500/10 text-green-400" : sub.status === "CANCELLED" ? "bg-red-500/10 text-red-400" : "bg-yellow-500/10 text-yellow-300"}`}>{sub.status}</span><div className="mt-3 flex flex-wrap gap-2"><button onClick={() => changeStatus(sub, "ACTIVE")} className="rounded-lg border border-green-400/20 px-3 py-2 text-xs">Activate</button><button onClick={() => changeStatus(sub, "PAUSED")} className="rounded-lg border border-yellow-400/20 px-3 py-2 text-xs">Pause</button><button onClick={() => changeStatus(sub, "CANCELLED")} className="rounded-lg border border-red-400/20 px-3 py-2 text-xs">Cancel</button></div></div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
