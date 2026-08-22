import { NextResponse } from "next/server";
import { getFirestoreDocument } from "@/lib/firebaseAdminRest";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, customerId, customerName, customerPhone, subscriptionId, referenceId } = body;
    if (!amount || !customerId) return NextResponse.json({ error: "Missing payment details" }, { status: 400 });

    const clientId = process.env.CASHFREE_CLIENT_ID;
    const clientSecret = process.env.CASHFREE_CLIENT_SECRET;
    if (!clientId || !clientSecret) return NextResponse.json({ demo: true, message: "Cashfree credentials are not configured." });

    let payableAmount = Number(amount);
    if (subscriptionId) {
      const subscription = await getFirestoreDocument("subscriptions", String(subscriptionId));
      if (!subscription) return NextResponse.json({ error: "Subscription draft not found" }, { status: 404 });
      const ownerId = subscription.fields?.userId?.stringValue || "";
      const draftStatus = subscription.fields?.status?.stringValue || "";
      const draftAmount = Number(subscription.fields?.amount?.doubleValue ?? subscription.fields?.amount?.integerValue ?? NaN);
      if (ownerId !== String(customerId)) return NextResponse.json({ error: "Subscription ownership mismatch" }, { status: 403 });
      if (draftStatus !== "PENDING_PAYMENT") return NextResponse.json({ error: "Subscription is not awaiting payment" }, { status: 409 });
      if (!Number.isFinite(draftAmount) || draftAmount <= 0) return NextResponse.json({ error: "Invalid subscription amount" }, { status: 409 });
      payableAmount = draftAmount;
    }

    const tag = subscriptionId || referenceId || `guest-${Date.now()}`;
    const orderId = `VEF-${Date.now()}-${String(tag).slice(0, 8)}`;
    const base = process.env.CASHFREE_ENV === "production" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg";
    const origin = process.env.APP_URL?.replace(/\/$/, "") || new URL(req.url).origin;
    const response = await fetch(`${base}/orders`, {
      method: "POST",
      headers: { "x-client-id": clientId, "x-client-secret": clientSecret, "x-api-version": "2025-01-01", "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: payableAmount,
        order_currency: "INR",
        customer_details: { customer_id: String(customerId), customer_name: customerName || "Customer", customer_phone: String(customerPhone || "9999999999") },
        order_meta: {
          return_url: subscriptionId ? `${origin}/subscriptions/checkout/success?subscriptionId=${encodeURIComponent(subscriptionId)}&orderId=${encodeURIComponent(orderId)}` : `${origin}/checkout?cashfreeOrderId=${encodeURIComponent(orderId)}`,
          notify_url: `${origin}/api/cashfree/webhook`,
        },
        order_tags: { subscriptionId: subscriptionId || "", referenceId: referenceId || "" },
      }),
    });
    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: data.message || "Cashfree order creation failed" }, { status: response.status });
    return NextResponse.json({ paymentSessionId: data.payment_session_id, orderId, mode: process.env.CASHFREE_ENV === "production" ? "production" : "sandbox" });
  } catch (error) {
    console.error("Cashfree order creation error", error);
    return NextResponse.json({ error: "Payment server error" }, { status: 500 });
  }
}
