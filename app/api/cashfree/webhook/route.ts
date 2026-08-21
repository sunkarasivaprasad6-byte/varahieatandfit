import { NextResponse } from "next/server";
import crypto from "crypto";
export async function POST(req: Request) {
  try {
    const raw = await req.text();
    const signature = req.headers.get("x-webhook-signature");
    const timestamp = req.headers.get("x-webhook-timestamp");
    const secret = process.env.CASHFREE_CLIENT_SECRET;
    if (!signature || !timestamp || !secret) return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
    const expected = crypto.createHmac("sha256", secret).update(timestamp + raw).digest("base64");
    if (expected !== signature) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    const event = JSON.parse(raw);
    const orderId = event?.data?.order?.order_id;
    const subscriptionId = event?.data?.order?.order_tags?.subscriptionId;
    const status = event?.data?.payment?.payment_status;
    console.log("Cashfree payment event", { orderId, subscriptionId, status });
    return NextResponse.json({ received: true });
  } catch (e) { console.error(e); return NextResponse.json({ error: "Webhook error" }, { status: 500 }); }
}
