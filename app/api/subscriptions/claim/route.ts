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

    // Existing customers can recover subscriptions created under an older Firebase
    // account with the same verified email. This fixes the case where one browser
    // has the subscription but another browser is signed into a newer account.
    if (!subscriptionId) {
      const email = String(decoded.email || "").trim().toLowerCase();
      if (!email) return NextResponse.json({ error: "Verified email is required to recover your subscription." }, { status: 400 });

      const usersSnap = await adminDb.collection("users").where("email", "==", email).get();
      const legacyUserIds = usersSnap.docs.map((item) => item.id).filter((id) => id !== decoded.uid);
      if (legacyUserIds.length === 0) return NextResponse.json({ success: true, linked: 0 });

      const linkedIds: string[] = [];
      for (const legacyUserId of legacyUserIds) {
        const subscriptionsSnap = await adminDb.collection("subscriptions").where("userId", "==", legacyUserId).where("status", "==", "ACTIVE").get();
        for (const subscriptionDoc of subscriptionsSnap.docs) {
          await subscriptionDoc.ref.update({ userId: decoded.uid, guest: false, updatedAt: FieldValue.serverTimestamp() });
          linkedIds.push(subscriptionDoc.id);
        }
      }

      if (linkedIds.length > 0) {
        await adminDb.collection("users").doc(decoded.uid).set({ email, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      }
      return NextResponse.json({ success: true, linked: linkedIds.length, subscriptionIds: linkedIds });
    }

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
