import { NextResponse } from "next/server";
import crypto from "crypto";
import {
  createFirestoreDocument,
  firestoreString,
  firestoreTimestamp,
  getFirestoreDocument,
  patchFirestoreDocument,
} from "@/lib/firebaseAdminRest";

export const runtime = "nodejs";

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export async function POST(req: Request) {
  try {
    // Cashfree signs the raw request body. Do not JSON.stringify/reformat it before verification.
    const raw = await req.text();
    const signature = req.headers.get("x-webhook-signature");
    const timestamp = req.headers.get("x-webhook-timestamp");
    const secret = process.env.CASHFREE_CLIENT_SECRET;
    if (!signature || !timestamp || !secret) return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });

    const expected = crypto.createHmac("sha256", secret).update(timestamp + raw).digest("base64");
    if (!safeEqual(expected, signature)) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

    const event = JSON.parse(raw) as {
      type?: string;
      data?: {
        order?: { order_id?: string; order_tags?: { subscriptionId?: string; referenceId?: string } | null };
        payment?: { cf_payment_id?: string; payment_status?: string; payment_amount?: number };
      };
    };

    const orderId = event.data?.order?.order_id || "";
    const subscriptionId = event.data?.order?.order_tags?.subscriptionId || "";
    const paymentId = String(event.data?.payment?.cf_payment_id || "");
    const paymentStatus = String(event.data?.payment?.payment_status || "").toUpperCase();

    if (!orderId || !paymentId) return NextResponse.json({ received: true, ignored: true });

    // Cashfree can retry a webhook. Use the payment id as an idempotency key.
    const eventDocId = paymentId.replace(/[^a-zA-Z0-9_-]/g, "_");
    const existingEvent = await getFirestoreDocument("cashfreeWebhookEvents", eventDocId);
    if (existingEvent) return NextResponse.json({ received: true, duplicate: true });

    if (subscriptionId) {
      const subscription = await getFirestoreDocument("subscriptions", subscriptionId);
      if (subscription) {
        const currentStatus = subscription.fields?.status?.stringValue || "";
        const currentPaymentOrderId = subscription.fields?.paymentOrderId?.stringValue || "";

        // Only process a webhook for the order that belongs to this subscription.
        if (!currentPaymentOrderId || currentPaymentOrderId === orderId) {
          if (paymentStatus === "SUCCESS") {
            await patchFirestoreDocument("subscriptions", subscriptionId, {
              status: firestoreString("ACTIVE"),
              paymentStatus: firestoreString("SUCCESS"),
              paymentOrderId: firestoreString(orderId),
              paymentAttemptId: firestoreString(paymentId),
              updatedAt: firestoreTimestamp(),
            });

            const userId = subscription.fields?.userId?.stringValue;
            const planName = subscription.fields?.planName?.stringValue || "Your plan";
            if (userId) {
              const notificationId = `payment_${paymentId.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
              await createFirestoreDocument("notifications", notificationId, {
                userId: firestoreString(userId),
                title: firestoreString("Subscription activated"),
                message: firestoreString(`${planName} is active. Your payment was confirmed and your delivery request has been saved.`),
                type: firestoreString("PAYMENT"),
                read: { booleanValue: false },
                createdAt: firestoreTimestamp(),
              });
            }
          } else if (["FAILED", "USER_DROPPED"].includes(paymentStatus) && !["ACTIVE", "COMPLETED", "CANCELLED"].includes(currentStatus)) {
            await patchFirestoreDocument("subscriptions", subscriptionId, {
              paymentStatus: firestoreString("FAILED"),
              paymentAttemptId: firestoreString(paymentId),
              updatedAt: firestoreTimestamp(),
            });
          }
        }
      }
    }

    await createFirestoreDocument("cashfreeWebhookEvents", eventDocId, {
      orderId: firestoreString(orderId),
      subscriptionId: firestoreString(subscriptionId),
      paymentId: firestoreString(paymentId),
      paymentStatus: firestoreString(paymentStatus),
      eventType: firestoreString(String(event.type || "")),
      receivedAt: firestoreTimestamp(),
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Cashfree webhook error", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
