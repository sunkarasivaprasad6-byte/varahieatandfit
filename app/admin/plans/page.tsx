"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getDisplayPlans, savePlanOverride, type DisplayPlan } from "@/lib/planService";

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<DisplayPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    try {
      setPlans(await getDisplayPlans());
    } catch (error) {
      console.error(error);
      setMessage("Unable to load plans.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function save(plan: DisplayPlan) {
    setSaving(plan.id);
    setMessage("");
    try {
      await savePlanOverride(plan.id, {
        name: plan.name,
        price: Number(plan.price),
        tagline: plan.tagline,
        accent: plan.accent,
        active: plan.active,
      });
      setMessage(`${plan.name} saved.`);
      await load();
    } catch (error) {
      console.error(error);
      setMessage("Failed to save the plan.");
    } finally {
      setSaving(null);
    }
  }

  if (loading) return <main className="min-h-screen bg-[#050505] grid place-items-center text-white/50">Loading plans…</main>;

  return (
    <main className="min-h-screen bg-[#050505] px-5 py-8 text-white md:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#E63946]">Admin</p>
            <h1 className="mt-2 text-4xl font-bold">Subscription Plans</h1>
            <p className="mt-2 text-sm text-white/40">Change prices, names, descriptions and availability without editing code.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin" className="rounded-full border border-white/10 px-5 py-2 text-sm">Restaurant Admin</Link>
            <Link href="/admin/subscriptions" className="rounded-full border border-white/10 px-5 py-2 text-sm">Subscriptions</Link>
          </div>
        </header>

        {message && <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">{message}</div>}

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.id} className="rounded-3xl border border-white/10 bg-[#111] p-6">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: plan.accent }}>{plan.id}</span>
                <label className="flex items-center gap-2 text-xs text-white/50">
                  <input type="checkbox" checked={plan.active} onChange={(e) => setPlans((items) => items.map((item) => item.id === plan.id ? { ...item, active: e.target.checked } : item))} />
                  Active
                </label>
              </div>
              <input value={plan.name} onChange={(e) => setPlans((items) => items.map((item) => item.id === plan.id ? { ...item, name: e.target.value } : item))} className="mt-5 w-full rounded-xl border border-white/10 bg-black/25 p-3 text-xl font-bold" />
              <label className="mt-4 block text-xs text-white/40">Price / week
                <input type="number" min="1" value={plan.price} onChange={(e) => setPlans((items) => items.map((item) => item.id === plan.id ? { ...item, price: Number(e.target.value) } : item))} className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 p-3 text-white" />
              </label>
              <label className="mt-4 block text-xs text-white/40">Tagline
                <textarea value={plan.tagline} onChange={(e) => setPlans((items) => items.map((item) => item.id === plan.id ? { ...item, tagline: e.target.value } : item))} className="mt-2 min-h-24 w-full rounded-xl border border-white/10 bg-black/25 p-3 text-white" />
              </label>
              <label className="mt-4 block text-xs text-white/40">Accent
                <input value={plan.accent} onChange={(e) => setPlans((items) => items.map((item) => item.id === plan.id ? { ...item, accent: e.target.value } : item))} className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 p-3 text-white" />
              </label>
              <button disabled={saving === plan.id} onClick={() => save(plan)} className="mt-6 w-full rounded-xl bg-[#E63946] px-5 py-3 text-sm font-bold disabled:opacity-50">{saving === plan.id ? "Saving…" : "Save plan"}</button>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
