"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { activateSubscription, getSubscription } from "@/lib/subscriptionService";
import { createNotification } from "@/lib/notificationService";
import { auth } from "@/lib/firebase";

export default function SuccessPage() {
  return <Suspense fallback={null}><SuccessContent /></Suspense>;
}

function SuccessContent() {
  const params = useSearchParams();
  const subscriptionId = params.get("subscriptionId");
  const orderId = params.get("orderId");
  const [status, setStatus] = useState("Checking payment…");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function confirmPayment() {
      if (!subscriptionId || !orderId) { setStatus("Missing payment confirmation details."); return; }
      try {
        const sub = await getSubscription(subscriptionId);
        if (!sub || sub.userId !== auth.currentUser?.uid) throw new Error("Subscription not found");
        if (sub.paymentOrderId && sub.paymentOrderId !== orderId) throw new Error("Payment order mismatch");

        const response = await fetch(`/api/cashfree/status?orderId=${encodeURIComponent(orderId)}`, { cache: "no-store" });
        const data = await response.json();
        if (cancelled) return;

        if (data.status === "SUCCESS") {
          await activateSubscription(subscriptionId, orderId);
          try { await createNotification({ userId: sub.userId, title: "Subscription activated", message: `${sub.planName} is active. Your requested delivery time is ${sub.deliveryTime || "not set"}.`, type: "PAYMENT" }); } catch {}
          if (!cancelled) setStatus("Payment confirmed. Your subscription is active.");
          return;
        }

        if (data.status === "PENDING" && attempt < 5) {
          setStatus("Payment is still being confirmed…");
          setTimeout(() => setAttempt((value) => value + 1), 2500);
          return;
        }

        setStatus(data.status === "FAILED" ? "Payment was not successful. Your subscription is still pending." : "Payment is still being confirmed. Please check My Subscription shortly.");
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
