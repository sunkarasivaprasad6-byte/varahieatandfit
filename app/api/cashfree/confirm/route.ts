import { NextResponse } from "next/server";
import {
  createFirestoreDocument,
  firestoreString,
  firestoreTimestamp,
  getFirestoreDocument,
  patchFirestoreDocument,
} from "@/lib/firebaseAdminRest";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { subscriptionId, orderId } = await req.json();
    if (!subscriptionId || !orderId) return NextResponse.json({ error: "Missing payment confirmation details" }, { status: 400 });

    const clientId = process.env.CASHFREE_CLIENT_ID;
    const clientSecret = process.env.CASHFREE_CLIENT_SECRET;
    if (!clientId || !clientSecret) return NextResponse.json({ error: "Cashfree is not configured" }, { status: 503 });

    const subscription = await getFirestoreDocument("subscriptions", String(subscriptionId));
    if (!subscription) return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    const storedOrderId = subscription.fields?.paymentOrderId?.stringValue || "";
    if (storedOrderId && storedOrderId !== String(orderId)) return NextResponse.json({ error: "Payment order mismatch" }, { status: 409 });

    const base = process.env.CASHFREE_ENV === "production" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg";
    const response = await fetch(`${base}/orders/${encodeURIComponent(orderId)}/payments`, {
      headers: { "x-client-id": clientId, "x-client-secret": clientSecret, "x-api-version": "2025-01-01", Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) return NextResponse.json({ error: "Unable to verify payment with Cashfree" }, { status: 502 });

    const payments = await response.json() as Array<{ cf_payment_id?: string; payment_status?: string }>;
    const success = payments.find((payment) => payment.payment_status === "SUCCESS");
    const pending = payments.some((payment) => payment.payment_status === "PENDING");
    const status = success ? "SUCCESS" : pending ? "PENDING" : "FAILED";

    if (success) {
      await patchFirestoreDocument("subscriptions", String(subscriptionId), {
        status: firestoreString("ACTIVE"),
        paymentStatus: firestoreString("SUCCESS"),
        paymentOrderId: firestoreString(String(orderId)),
        paymentAttemptId: firestoreString(String(success.cf_payment_id || "")),
        updatedAt: firestoreTimestamp(),
      });

      const userId = subscription.fields?.userId?.stringValue;
      const planName = subscription.fields?.planName?.stringValue || "Your plan";
      if (userId) {
        const notificationId = `payment_${String(success.cf_payment_id || orderId).replace(/[^a-zA-Z0-9_-]/g, "_")}`;
        await createFirestoreDocument("notifications", notificationId, {
          userId: firestoreString(userId),
          title: firestoreString("Subscription activated"),
          message: firestoreString(`${planName} is active. Your payment was confirmed and your delivery request has been saved.`),
          type: firestoreString("PAYMENT"),
          read: { booleanValue: false },
          createdAt: firestoreTimestamp(),
        });
      }
    } else if (status === "FAILED") {
      await patchFirestoreDocument("subscriptions", String(subscriptionId), {
        paymentStatus: firestoreString("FAILED"),
        updatedAt: firestoreTimestamp(),
      });
    }

    return NextResponse.json({ status, subscriptionId, orderId });
  } catch (error) {
    console.error("Cashfree confirmation error", error);
    return NextResponse.json({ error: "Payment confirmation failed" }, { status: 500 });
  }
}
