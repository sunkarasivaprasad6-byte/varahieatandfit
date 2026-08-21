"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { activateSubscription } from "@/lib/subscriptionService";

export default function SuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessContent />
    </Suspense>
  );
}

function SuccessContent() {
  const params = useSearchParams();
  const subscriptionId = params.get("subscriptionId");
  const orderId = params.get("orderId");
  const [status, setStatus] = useState("Checking payment...");

  useEffect(() => {
    async function confirmPayment() {
      if (!subscriptionId || !orderId) return;

      try {
        const response = await fetch(
          `/api/cashfree/status?orderId=${encodeURIComponent(orderId)}`
        );
        const data = await response.json();

        if (data.status === "SUCCESS") {
          await activateSubscription(subscriptionId);
          setStatus("Payment confirmed. Your subscription is active.");
          return;
        }

        setStatus(
          "Payment is still being confirmed. Please check My Subscription shortly."
        );
      } catch {
        setStatus(
          "We could not confirm the payment yet. Please check again shortly."
        );
      }
    }

    confirmPayment();
  }, [subscriptionId, orderId]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#050505] p-6 text-white">
      <div className="max-w-md rounded-[32px] border border-white/10 bg-white/[0.035] p-10 text-center">
        <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-[#E63946]/15 text-[#E63946]">
          ✓
        </div>

        <h1 className="text-3xl font-bold">Payment status</h1>

        <p className="mt-3 text-white/45">{status}</p>

        <Link
          href="/my-subscription"
          className="mt-8 inline-flex rounded-full bg-[#E63946] px-7 py-3 font-bold"
        >
          My Subscription
        </Link>
      </div>
    </main>
  );
}
