import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

type OrderItem = {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
};

type GuestOrder = {
  orderId?: string;
  name?: string;
  phone?: string;
  address?: string;
  location?: string;
  items?: OrderItem[];
  total?: number;
  paymentMethod?: string;
  paymentDone?: boolean;
  paymentVerified?: boolean;
  upiTransactionId?: string;
  status?: string;
  deliveryOtp?: string;
  otpVerified?: boolean;
};

const isValidTransactionId = (value: string) => /^[A-Za-z0-9][A-Za-z0-9._-]{5,63}$/.test(value);

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GuestOrder;

    const name = String(body.name || "").trim();
    const phone = String(body.phone || "").trim();
    const address = String(body.address || "").trim();
    const location = String(body.location || "").trim();
    const items = Array.isArray(body.items) ? body.items : [];
    const total = Number(body.total);
    const paymentMethod = String(body.paymentMethod || "").trim();
    const paymentDone = Boolean(body.paymentDone);
    const paymentVerified = Boolean(body.paymentVerified);
    const upiTransactionId = String(body.upiTransactionId || "").trim();
    const orderId = String(body.orderId || "").trim();
    const deliveryOtp = String(body.deliveryOtp || "").trim();

    if (name.length < 3) return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
    if (!/^[6-9]\d{9}$/.test(phone)) return NextResponse.json({ error: "Please enter a valid 10-digit mobile number." }, { status: 400 });
    if (address.length < 20) return NextResponse.json({ error: "Please enter your complete delivery address." }, { status: 400 });
    if (items.length === 0) return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
    if (!Number.isFinite(total) || total < 0) return NextResponse.json({ error: "Invalid order total." }, { status: 400 });
    if (!paymentMethod) return NextResponse.json({ error: "Please select a payment method." }, { status: 400 });
    if (!orderId) return NextResponse.json({ error: "Unable to create the order. Please try again." }, { status: 400 });

    const isCOD = paymentMethod === "COD";
    if (!isCOD) {
      if (!paymentDone) return NextResponse.json({ error: "Please complete the online payment first." }, { status: 400 });
      if (!upiTransactionId) return NextResponse.json({ error: "Please enter your UPI Transaction ID" }, { status: 400 });
      if (!isValidTransactionId(upiTransactionId)) return NextResponse.json({ error: "Please enter a valid UPI Transaction ID" }, { status: 400 });
    }

    const statusSnap = await adminDb.collection("restaurantSettings").doc("status").get();
    const restaurantStatus = statusSnap.exists ? statusSnap.data()?.status : "available";
    if (restaurantStatus !== "available") {
      return NextResponse.json({ error: "The restaurant is currently unavailable for normal menu orders. Subscriptions are still available." }, { status: 409 });
    }

    const orderRef = adminDb.collection("orders").doc();
    await orderRef.set({
      orderId,
      name,
      phone,
      address,
      location,
      items,
      total,
      paymentMethod,
      paymentDone,
      paymentVerified,
      ...(isCOD ? {} : { upiTransactionId }),
      status: body.status || (isCOD ? "NEW" : "PAYMENT_VERIFIED"),
      deliveryOtp,
      otpVerified: Boolean(body.otpVerified),
      guest: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ orderId, documentId: orderRef.id });
  } catch (error) {
    console.error("Failed to create guest restaurant order:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to submit your order." }, { status: 500 });
  }
}
