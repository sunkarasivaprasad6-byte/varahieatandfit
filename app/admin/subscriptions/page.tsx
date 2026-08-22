"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { listSubscriptions, type Subscription } from "@/lib/subscriptionService";

function paymentLabel(item: Subscription) {
  if (item.paymentStatus === "SUCCESS" || item.status === "ACTIVE") return "PAID";
  if (item.paymentStatus === "FAILED" || item.status === "CANCELLED") return "FAILED";
  return "PENDING";
}

function paymentClass(status: string) {
  if (status === "PAID") return "bg-green-500/10 text-green-400";
  if (status === "FAILED") return "bg-red-500/10 text-red-400";
  return "bg-yellow-500/10 text-yellow-400";
}

export default function AdminSubscriptions() {
  const r = useRouter();
  const [items, setItems] = useState<Subscription[]>([]);
  const [checking, setChecking] = useState(true);

  async function load() {
    try {
      setItems(await listSubscriptions());
    } catch (error) {
      console.error("Failed to load subscriptions", error);
    }
  }

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      if (!u) r.replace("/login");
      else {
        setChecking(false);
        load();
      }
    });
  }, [r]);

  const stats = useMemo(
    () => ({
      active: items.filter((x) => x.status === "ACTIVE").length,
      pending: items.filter((x) => x.status === "PENDING_PAYMENT").length,
      failed: items.filter((x) => paymentLabel(x) === "FAILED").length,
      skipped: items.reduce((a, x) => a + (x.skippedMeals || 0), 0),
      plans: new Set(items.map((x) => x.planId)).size,
    }),
    [items]
  );

  if (checking) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#0F0F10] text-white/50">
        Checking login…
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0F0F10] px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#E63946]">Admin</p>
            <h1 className="mt-2 text-4xl font-bold">Subscriptions</h1>
            <p className="mt-2 text-sm text-white/40">Payment, plan and delivery state for every customer subscription.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/operations" className="rounded-full bg-[#E63946] px-5 py-2 text-sm font-bold">Delivery Operations</Link>
            <button onClick={() => r.push("/admin")} className="rounded-full border border-white/10 px-5 py-2 text-sm">Menu admin</button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-2xl border border-white/10 bg-[#171717] p-5"><p className="text-xs text-white/40">Active</p><p className="mt-2 text-3xl font-bold">{stats.active}</p></div>
          <div className="rounded-2xl border border-white/10 bg-[#171717] p-5"><p className="text-xs text-white/40">Pending payment</p><p className="mt-2 text-3xl font-bold">{stats.pending}</p></div>
          <div className="rounded-2xl border border-white/10 bg-[#171717] p-5"><p className="text-xs text-white/40">Failed / cancelled</p><p className="mt-2 text-3xl font-bold">{stats.failed}</p></div>
          <div className="rounded-2xl border border-white/10 bg-[#171717] p-5"><p className="text-xs text-white/40">Skipped meals</p><p className="mt-2 text-3xl font-bold">{stats.skipped}</p></div>
          <div className="rounded-2xl border border-white/10 bg-[#171717] p-5"><p className="text-xs text-white/40">Plans</p><p className="mt-2 text-3xl font-bold">{stats.plans}</p></div>
        </div>

        <div className="mt-6 space-y-3">
          {items.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#171717] p-8 text-white/40">No subscriptions yet.</div>
          ) : items.map((x) => {
            const payment = paymentLabel(x);
            return (
              <div key={x.id} className="rounded-2xl border border-white/10 bg-[#171717] p-5">
                <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr_1fr_1fr_1fr] lg:items-center">
                  <div>
                    <p className="font-bold">{x.planName}</p>
                    <p className="mt-1 text-xs text-white/35">User {x.userId}</p>
                    <p className="mt-2 text-sm">₹{x.amount}/week</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/35">Payment</p>
                    <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs ${paymentClass(payment)}`}>{payment}</span>
                    {x.paymentId && <p className="mt-2 text-[11px] text-white/30">Payment ID: {x.paymentId}</p>}
                  </div>
                  <div>
                    <p className="text-xs text-white/35">Subscription</p>
                    <span className="mt-2 inline-flex rounded-full bg-white/5 px-3 py-1 text-xs text-white/70">{x.status}</span>
                  </div>
                  <div>
                    <p className="text-xs text-white/35">Delivery</p>
                    <p className="mt-1 text-sm">{x.deliveryTime || "Not set"}</p>
                    <p className="mt-1 text-xs text-white/35">{x.address || "No address"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/35">Nutrition / skips</p>
                    <p className="mt-1 text-sm">{x.proteinPerMeal}g · {x.caloriesPerMeal} kcal</p>
                    <p className="mt-1 text-xs text-white/35">Skipped: {x.skippedMeals || 0}</p>
                  </div>
                </div>
                {x.paymentOrderId && <p className="mt-4 border-t border-white/5 pt-3 text-[11px] text-white/25">Cashfree order: {x.paymentOrderId}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
