import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

function validPhone(value: unknown) {
  return typeof value === "string" && /^[6-9]\d{9}$/.test(value);
}

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization") || "";
    if (!authorization.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Sign in to create or link your account." }, { status: 401 });
    }

    const token = authorization.slice("Bearer ".length).trim();
    const decoded = await adminAuth.verifyIdToken(token);
    const body = await request.json().catch(() => ({})) as { subscriptionId?: string; phone?: string };
    const subscriptionId = String(body.subscriptionId || "").trim();
    const phone = String(body.phone || "").trim();

    if (!subscriptionId) return NextResponse.json({ error: "Subscription reference is missing." }, { status: 400 });
    if (!validPhone(phone)) return NextResponse.json({ error: "Enter the same 10-digit phone number used for the subscription." }, { status: 400 });

    const subscriptionRef = adminDb.collection("subscriptions").doc(subscriptionId);
    const subscriptionSnap = await subscriptionRef.get();
    if (!subscriptionSnap.exists) return NextResponse.json({ error: "Subscription not found." }, { status: 404 });

    const subscription = subscriptionSnap.data() || {};
    if (String(subscription.phone || "") !== phone) {
      return NextResponse.json({ error: "The phone number does not match this subscription." }, { status: 403 });
    }

    const currentUserId = String(subscription.userId || "");
    if (currentUserId && currentUserId !== decoded.uid && !currentUserId.startsWith("guest_")) {
      return NextResponse.json({ error: "This subscription is already linked to another account." }, { status: 409 });
    }

    await subscriptionRef.update({
      userId: decoded.uid,
      guest: false,
      updatedAt: FieldValue.serverTimestamp(),
    });

    await adminDb.collection("users").doc(decoded.uid).set({
      phone,
      email: decoded.email || null,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    return NextResponse.json({ success: true, subscriptionId });
  } catch (error) {
    console.error("Failed to claim subscription:", error);
    return NextResponse.json({ error: "Unable to link the subscription to your account." }, { status: 500 });
  }
}
