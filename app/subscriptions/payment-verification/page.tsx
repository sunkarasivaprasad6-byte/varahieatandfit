"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function VerificationContent() {
  const params = useSearchParams();
  const plan = params.get("plan");

  return (
    <main className="min-h-screen bg-[#050505] px-5 pb-20 pt-24 text-white">
      <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center">
        <section className="w-full rounded-[32px] border border-white/10 bg-white/[0.035] p-8 text-center sm:p-12">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-yellow-500/10 text-4xl text-yellow-300">⏳</div>
          <p className="mt-7 text-xs font-bold uppercase tracking-[0.25em] text-[#E63946]">Payment Verification</p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Payment verification is in progress</h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-white/55">
            Your payment has been submitted successfully. We will verify your payment and update your subscription within 12 hours.
          </p>
          <div className="mx-auto mt-8 max-w-md rounded-2xl border border-white/10 bg-black/20 p-5 text-left">
            <p className="text-xs uppercase tracking-wider text-white/35">Status</p>
            <p className="mt-2 font-semibold text-yellow-300">Payment Verification Pending</p>
            {plan && <p className="mt-2 text-sm text-white/45">Plan: {plan}</p>}
          </div>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/my-subscription" className="rounded-full bg-[#E63946] px-7 py-3 text-sm font-bold">View My Subscription</Link>
            <Link href="/" className="rounded-full border border-white/10 px-7 py-3 text-sm font-semibold">Back to Home</Link>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function PaymentVerificationPage() {
  return <Suspense fallback={<main className="grid min-h-screen place-items-center bg-[#050505] text-white/50">Loading…</main>}><VerificationContent /></Suspense>;
}
