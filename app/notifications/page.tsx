"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getUserNotifications, markNotificationRead, type AppNotification } from "@/lib/notificationService";

export default function NotificationsPage() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      setReady(true);
      if (!user) return;
      try { setItems(await getUserNotifications(user.uid)); } catch (error) { console.error(error); }
    });
  }, []);

  async function read(item: AppNotification) {
    if (!item.id || item.read) return;
    await markNotificationRead(item.id);
    setItems((current) => current.map((x) => x.id === item.id ? { ...x, read: true } : x));
  }

  if (!ready) return <main className="min-h-screen bg-[#050505] grid place-items-center text-white/50">Loading…</main>;
  if (!auth.currentUser) return <main className="min-h-screen bg-[#050505] grid place-items-center p-6 text-white"><div className="text-center"><h1 className="text-3xl font-bold">Sign in to view notifications</h1><Link href="/account?returnTo=%2Fnotifications" className="mt-5 inline-flex rounded-full bg-[#E63946] px-6 py-3 font-bold">Sign in</Link></div></main>;

  return <main className="min-h-screen bg-[#050505] px-5 pb-20 pt-28 text-white"><div className="mx-auto max-w-3xl"><Link href="/my-subscription" className="text-sm text-white/40 hover:text-white">← My Subscription</Link><h1 className="mt-4 text-4xl font-bold">Notifications</h1><p className="mt-2 text-sm text-white/40">Payment, subscription and delivery updates.</p><div className="mt-7 space-y-3">{items.length === 0 ? <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-7 text-white/40">No notifications yet.</div> : items.map((item) => <button key={item.id} onClick={() => read(item)} className={`w-full rounded-2xl border p-5 text-left transition ${item.read ? "border-white/10 bg-white/[0.025]" : "border-[#E63946]/30 bg-[#E63946]/5"}`}><div className="flex items-start justify-between gap-4"><div><p className="font-semibold">{item.title}</p><p className="mt-1 text-sm text-white/50">{item.message}</p></div>{!item.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#E63946]" />}</div></button>)}</div></div></main>;
}
