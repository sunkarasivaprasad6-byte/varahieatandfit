"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { listSubscriptions, type Subscription } from "@/lib/subscriptionService";

export default function AdminSubscriptions(){
  const r=useRouter();
  const [items,setItems]=useState<Subscription[]>([]);
  const [checking,setChecking]=useState(true);

  useEffect(()=>onAuthStateChanged(auth,u=>{
    if(!u) r.replace('/login');
    else {setChecking(false);listSubscriptions().then(setItems)}
  }),[r]);

  if(checking)return <main className="min-h-screen bg-[#0F0F10] grid place-items-center text-white/50">Checking login…</main>;

  return <main className="min-h-screen bg-[#0F0F10] px-6 py-10 text-white"><div className="mx-auto max-w-6xl">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs uppercase tracking-[0.3em] text-[#E63946]">Admin</p><h1 className="mt-2 text-4xl font-bold">Subscriptions</h1></div>
      <div className="flex gap-2">
        <Link href="/admin/operations" className="rounded-full bg-[#E63946] px-5 py-2 text-sm font-bold">Delivery Operations</Link>
        <button onClick={()=>r.push('/admin')} className="rounded-full border border-white/10 px-5 py-2 text-sm">Menu admin</button>
      </div>
    </div>
    <div className="mt-8 grid gap-4 md:grid-cols-4">
      <div className="rounded-2xl border border-white/10 bg-[#171717] p-5"><p className="text-xs text-white/40">Active</p><p className="mt-2 text-3xl font-bold">{items.filter(x=>x.status==='ACTIVE').length}</p></div>
      <div className="rounded-2xl border border-white/10 bg-[#171717] p-5"><p className="text-xs text-white/40">Pending payment</p><p className="mt-2 text-3xl font-bold">{items.filter(x=>x.status==='PENDING_PAYMENT').length}</p></div>
      <div className="rounded-2xl border border-white/10 bg-[#171717] p-5"><p className="text-xs text-white/40">Skipped meals</p><p className="mt-2 text-3xl font-bold">{items.reduce((a,x)=>a+(x.skippedMeals||0),0)}</p></div>
      <div className="rounded-2xl border border-white/10 bg-[#171717] p-5"><p className="text-xs text-white/40">Plans</p><p className="mt-2 text-3xl font-bold">{new Set(items.map(x=>x.planId)).size}</p></div>
    </div>
    <div className="mt-6 space-y-3">
      {items.length===0?<div className="rounded-2xl border border-white/10 bg-[#171717] p-8 text-white/40">No subscriptions yet.</div>:items.map(x=><div key={x.id} className="rounded-2xl border border-white/10 bg-[#171717] p-5"><div className="grid gap-4 md:grid-cols-[1.3fr_1fr_1fr_1fr] md:items-center"><div><p className="font-bold">{x.planName}</p><p className="mt-1 text-xs text-white/35">User {x.userId}</p></div><div><p className="text-xs text-white/35">Delivery</p><p className="mt-1 text-sm">{x.deliveryTime}</p></div><div><p className="text-xs text-white/35">Nutrition</p><p className="mt-1 text-sm">{x.proteinPerMeal}g · {x.caloriesPerMeal} kcal</p></div><div><span className="rounded-full bg-green-500/10 px-3 py-1 text-xs text-green-400">{x.status}</span><p className="mt-2 text-xs text-white/35">Skipped: {x.skippedMeals||0}</p></div></div></div>)}
    </div>
  </div></main>
}
