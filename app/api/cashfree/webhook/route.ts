import { NextResponse } from "next/server";
import crypto from "crypto";

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export async function POST(req: Request) {
  try {
    const raw = await req.text();
    const signature = req.headers.get("x-webhook-signature");
    const timestamp = req.headers.get("x-webhook-timestamp");
    const secret = process.env.CASHFREE_CLIENT_SECRET;

    if (!signature || !timestamp || !secret) {
      return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
    }

    // Cashfree signs timestamp + raw request body using HMAC-SHA256 and base64.
    const expected = crypto
      .createHmac("sha256", secret)
      .update(timestamp + raw)
      .digest("base64");

    if (!safeEqual(expected, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(raw);
    const orderId = event?.data?.order?.order_id;
    const subscriptionId = event?.data?.order?.order_tags?.subscriptionId;
    const status = event?.data?.payment?.payment_status;
    const paymentId = event?.data?.payment?.cf_payment_id;

    // The browser never trusts a webhook/client callback for activation. The
    // success page verifies the order against Cashfree's Payments API before
    // changing the Firebase subscription state. Keep the webhook endpoint
    // available for Cashfree notifications and observability.
    console.log("Cashfree payment event", {
      orderId,
      subscriptionId,
      status,
      paymentId,
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Cashfree webhook error", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
