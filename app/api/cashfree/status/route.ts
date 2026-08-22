import { NextResponse } from "next/server";

type CashfreePayment = {
  payment_status?: string;
  cf_payment_id?: string | number;
  payment_id?: string | number;
};

export async function GET(req: Request) {
  try {
    const orderId = new URL(req.url).searchParams.get("orderId");
    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    const id = process.env.CASHFREE_CLIENT_ID;
    const secret = process.env.CASHFREE_CLIENT_SECRET;
    if (!id || !secret) {
      return NextResponse.json({ status: "PENDING", demo: true });
    }

    const base =
      process.env.CASHFREE_ENV === "production"
        ? "https://api.cashfree.com/pg"
        : "https://sandbox.cashfree.com/pg";

    const response = await fetch(
      `${base}/orders/${encodeURIComponent(orderId)}/payments`,
      {
        headers: {
          "x-client-id": id,
          "x-client-secret": secret,
          "x-api-version": "2025-01-01",
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { error: data?.message || "Unable to fetch payment status" },
        { status: response.status }
      );
    }

    const payments: CashfreePayment[] = Array.isArray(data) ? data : [];
    const success = payments.find((payment) => payment.payment_status === "SUCCESS");
    const pending = payments.some((payment) => payment.payment_status === "PENDING");
    const status = success ? "SUCCESS" : pending ? "PENDING" : "FAILED";
    const paymentId = success?.cf_payment_id ?? success?.payment_id ?? null;

    return NextResponse.json({
      status,
      orderId,
      paymentId: paymentId ? String(paymentId) : null,
    });
  } catch {
    return NextResponse.json({ error: "Status check failed" }, { status: 500 });
  }
}
