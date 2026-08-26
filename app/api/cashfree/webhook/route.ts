import { NextResponse } from "next/server";
import crypto from "crypto";
import { activateSubscriptionFromCashfree } from "@/lib/subscriptionAdminService";
import { adminDb } from "@/lib/firebaseAdmin";

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export async function POST(req: Request) {
  try {
    // Cashfree signs the exact raw request body. Do not JSON.stringify the
    // parsed payload before verification.
    const raw = await req.text();
    const signature = req.headers.get("x-webhook-signature");
    const timestamp = req.headers.get("x-webhook-timestamp");
    const secret = process.env.CASHFREE_CLIENT_SECRET;

    if (!signature || !timestamp || !secret) {
      return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
    }

    const expected = crypto
      .createHmac("sha256", secret)
      .update(timestamp + raw)
      .digest("base64");

    if (!safeEqual(expected, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(raw) as {
      type?: string;
      event_time?: string;
      data?: {
        order?: {
          order_id?: string;
          order_tags?: Record<string, string> | null;
        };
        payment?: {
          cf_payment_id?: string | number;
          payment_status?: string;
        };
      };
    };

    const orderId = event.data?.order?.order_id;
    const paymentStatus = event.data?.payment?.payment_status;
    const paymentId = event.data?.payment?.cf_payment_id
      ? String(event.data.payment.cf_payment_id)
      : undefined;

    // Cashfree allows multiple payment attempts for one order. Only SUCCESS is
    // a terminal payment state; FAILED/PENDING/USER_DROPPED must not cancel or
    // activate the subscription here.
    if (!orderId || paymentStatus !== "SUCCESS") {
      console.log("Cashfree non-success webhook received", {
        type: event.type,
        orderId,
        paymentStatus,
        paymentId,
      });
      return NextResponse.json({ received: true });
    }

    const tags = event.data?.order?.order_tags || {};
    let subscriptionId = tags.subscriptionId || "";

    // Do not depend on order_tags being returned by every Cashfree webhook
    // version. The order ID is already stored on the subscription when checkout
    // starts, so it is the reliable fallback lookup.
    if (!subscriptionId) {
      const snapshot = await adminDb
        .collection("subscriptions")
        .where("paymentOrderId", "==", orderId)
        .limit(1)
        .get();

      if (!snapshot.empty) subscriptionId = snapshot.docs[0].id;
    }

    if (!subscriptionId) {
      console.error("Cashfree success webhook has no matching subscription", { orderId, paymentId });
      // Return 200 so an unrelated Cashfree order does not get retried forever.
      return NextResponse.json({ received: true, matched: false });
    }

    // 2025-01-01 webhooks provide x-idempotency-key. Older versions do not, so
    // payment ID is used as a stable fallback. The server transaction records
    // the event before/with activation, making duplicate deliveries harmless.
    const webhookId =
      req.headers.get("x-idempotency-key") ||
      req.headers.get("x-idempotency-header") ||
      (paymentId ? `payment-${paymentId}` : `order-${orderId}-${event.event_time || "success"}`);

    const result = await activateSubscriptionFromCashfree(
      subscriptionId,
      { orderId, paymentId },
      webhookId
    );

    console.log("Cashfree payment success processed", {
      orderId,
      paymentId,
      subscriptionId,
      ...result,
    });

    return NextResponse.json({ received: true, activated: result.activated });
  } catch (error) {
    console.error("Cashfree webhook error", error);
    // A 5xx tells Cashfree to retry the webhook. This is intentional for
    // transient Firestore/server failures so a successful payment is not lost.
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
