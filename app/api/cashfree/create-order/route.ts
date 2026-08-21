import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, customerId, customerName, customerPhone, subscriptionId, referenceId } = body;
    if (!amount || !customerId) return NextResponse.json({ error: "Missing payment details" }, { status: 400 });
    const clientId = process.env.CASHFREE_CLIENT_ID;
    const clientSecret = process.env.CASHFREE_CLIENT_SECRET;
    if (!clientId || !clientSecret) return NextResponse.json({ demo: true, message: "Cashfree credentials are not configured." });
    const tag = subscriptionId || referenceId || `guest-${Date.now()}`;
    const orderId = `VEF-${Date.now()}-${String(tag).slice(0, 8)}`;
    const base = process.env.CASHFREE_ENV === "production" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg";
    const origin = new URL(req.url).origin;
    const response = await fetch(`${base}/orders`, { method: "POST", headers: { "x-client-id": clientId, "x-client-secret": clientSecret, "x-api-version": "2025-01-01", "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ order_id: orderId, order_amount: Number(amount), order_currency: "INR", customer_details: { customer_id: String(customerId), customer_name: customerName || "Customer", customer_phone: String(customerPhone || "9999999999") }, order_meta: { return_url: subscriptionId ? `${origin}/subscriptions/checkout/success?subscriptionId=${subscriptionId}&orderId=${orderId}` : `${origin}/checkout?cashfreeOrderId=${orderId}`, notify_url: `${origin}/api/cashfree/webhook` }, order_tags: { subscriptionId: subscriptionId || "", referenceId: referenceId || "" } }) });
    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: data.message || "Cashfree order creation failed" }, { status: response.status });
    return NextResponse.json({ paymentSessionId: data.payment_session_id, orderId, mode: process.env.CASHFREE_ENV === "production" ? "production" : "sandbox" });
  } catch { return NextResponse.json({ error: "Payment server error" }, { status: 500 }); }
}
