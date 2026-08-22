"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  activateSubscription,
  markSubscriptionPaymentFailed,
} from "@/lib/subscriptionService";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForAuthenticatedUser(timeoutMs = 10000): Promise<User | null> {
  const currentUser = auth.currentUser;
  if (currentUser) return currentUser;

  return new Promise<User | null>((resolve) => {
    let finished = false;
    let unsubscribe: (() => void) | undefined;

    const finish = (user: User | null) => {
      if (finished) return;
      finished = true;
      unsubscribe?.();
      resolve(user);
    };

    unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) finish(user);
    });

    window.setTimeout(() => finish(auth.currentUser), timeoutMs);
  });
}

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
  const orderId = params.get("orderId") || params.get("order_id");
  const [status, setStatus] = useState("Checking payment...");
  const [confirmed, setConfirmed] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function confirmPayment() {
      if (!subscriptionId || !orderId) {
        setStatus("We could not find the payment reference. Please contact support if money was debited.");
        return;
      }

      setStatus("Verifying your payment with Cashfree...");

      try {
        let latest: { status?: string; paymentId?: string | null } | null = null;

        // Cashfree can briefly report PENDING immediately after checkout. Poll the
        // server-side Payments API instead of trusting the browser callback.
        for (let attempt = 0; attempt < 12 && !cancelled; attempt += 1) {
          const response = await fetch(
            `/api/cashfree/status?orderId=${encodeURIComponent(orderId)}`,
            { cache: "no-store" }
          );
          const data = await response.json();
          latest = data;

          if (data.status === "SUCCESS" || data.status === "FAILED") break;
          await wait(2000);
        }

        if (cancelled) return;

        const user = await waitForAuthenticatedUser();
        if (!user) {
          setStatus("Your payment was verified, but your sign-in session is not ready. Please open My Subscription after signing in again.");
          return;
        }

        if (latest?.status === "SUCCESS") {
          setStatus("Payment confirmed. Activating your subscription...");

          await activateSubscription(subscriptionId, {
            orderId,
            paymentId: latest.paymentId || undefined,
          });

          if (!cancelled) {
            setConfirmed(true);
            setStatus("Payment confirmed. Your subscription is active.");
          }
          return;
        }

        if (latest?.status === "FAILED") {
          await markSubscriptionPaymentFailed(subscriptionId);
          setFailed(true);
          setStatus("Payment was not completed. Your subscription was not activated.");
          return;
        }

        setStatus(
          "Payment is still being confirmed. Your subscription will remain inactive until Cashfree reports success."
        );
      } catch (error) {
        console.error("Subscription payment confirmation failed", error);
        if (!cancelled) {
          setStatus(
            "We could not confirm the payment yet. Please open My Subscription again shortly."
          );
        }
      }
    }

    confirmPayment();
    return () => {
      cancelled = true;
    };
  }, [subscriptionId, orderId]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#050505] p-6 text-white">
      <div className="max-w-md rounded-[32px] border border-white/10 bg-white/[0.035] p-10 text-center">
        <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-[#E63946]/15 text-[#E63946]">
          {confirmed ? "✓" : failed ? "!" : "…"}
        </div>

        <h1 className="text-3xl font-bold">Payment status</h1>
        <p className="mt-3 text-white/45">{status}</p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/my-subscription"
            className="inline-flex justify-center rounded-full bg-[#E63946] px-7 py-3 font-bold"
          >
            My Subscription
          </Link>
          {(failed || !confirmed) && (
            <Link
              href="/#subscriptions"
              className="inline-flex justify-center rounded-full border border-white/10 px-7 py-3 font-bold text-white/70"
            >
              Back to Plans
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
