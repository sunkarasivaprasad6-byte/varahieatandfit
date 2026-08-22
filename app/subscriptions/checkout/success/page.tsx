"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { auth } from "@/lib/firebase";

export default function SuccessPage() {
  return <Suspense fallback={null}><SuccessContent /></Suspense>;
}

function SuccessContent() {
  const params = useSearchParams();
  const subscriptionId = params.get("subscriptionId");
  const orderId = params.get("orderId") || params.get("order_id");
  const [status, setStatus] = useState("Checking payment…");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function confirmPayment() {
      if (!subscriptionId || !orderId) { setStatus("Missing payment confirmation details."); return; }
      if (!auth.currentUser) { setStatus("Please sign in again to view the payment result."); return; }

      try {
        const response = await fetch("/api/cashfree/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscriptionId, orderId }),
          cache: "no-store",
        });
        const data = await response.json();
        if (cancelled) return;

        if (data.status === "SUCCESS") {
          setStatus("Payment confirmed. Your subscription is active.");
          return;
        }

        if (data.status === "PENDING" && attempt < 7) {
          setStatus("Payment is still being confirmed…");
          setTimeout(() => setAttempt((value) => value + 1), 2500);
          return;
        }

        setStatus(data.status === "FAILED" ? "Payment was not successful. You can retry the payment from My Subscription." : (data.error || "Payment is still being confirmed. Please check My Subscription shortly."));
      } catch (error) {
        console.error(error);
        if (!cancelled) setStatus(error instanceof Error ? error.message : "We could not confirm the payment yet.");
      }
    }
    confirmPayment();
    return () => { cancelled = true; };
  }, [subscriptionId, orderId, attempt]);

  return <main className="grid min-h-screen place-items-center bg-[#050505] p-6 text-white"><div className="max-w-md rounded-[32px] border border-white/10 bg-white/[0.035] p-10 text-center"><div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-[#E63946]/15 text-[#E63946]">✓</div><h1 className="text-3xl font-bold">Payment status</h1><p className="mt-3 text-white/45">{status}</p><div className="mt-8 flex flex-col gap-3"><Link href="/my-subscription" className="inline-flex justify-center rounded-full bg-[#E63946] px-7 py-3 font-bold">My Subscription</Link><Link href="/subscriptions#plans" className="inline-flex justify-center rounded-full border border-white/10 px-7 py-3 text-sm">Back to plans</Link></div></div></main>;
}
