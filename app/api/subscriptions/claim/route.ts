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
    const requestedPhone = String(body.phone || "").trim();

    // Explicit claim: used immediately after checkout/signup when the subscription
    // id is available. The phone must match the subscription to prevent another
    // account from claiming it.
    if (subscriptionId) {
      if (!validPhone(requestedPhone)) {
        return NextResponse.json({ error: "Enter the same 10-digit phone number used for the subscription." }, { status: 400 });
      }

      const subscriptionRef = adminDb.collection("subscriptions").doc(subscriptionId);
      const subscriptionSnap = await subscriptionRef.get();
      if (!subscriptionSnap.exists) return NextResponse.json({ error: "Subscription not found." }, { status: 404 });

      const subscription = subscriptionSnap.data() || {};
      if (String(subscription.phone || "") !== requestedPhone) {
        return NextResponse.json({ error: "The phone number does not match this subscription." }, { status: 403 });
      }

      const currentUserId = String(subscription.userId || "");
      if (currentUserId && currentUserId !== decoded.uid && !currentUserId.startsWith("guest_")) {
        return NextResponse.json({ error: "This subscription is already linked to another account." }, { status: 409 });
      }

      await subscriptionRef.update({
        userId: decoded.uid,
        guest: false,
        email: decoded.email || null,
        updatedAt: FieldValue.serverTimestamp(),
      });

      await adminDb.collection("users").doc(decoded.uid).set({
        phone: requestedPhone,
        email: decoded.email || null,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });

      return NextResponse.json({ success: true, subscriptionId });
    }

    // Recovery when the customer opens My Subscription on another browser/device.
    // The previous implementation only searched legacy users by email. Guest
    // subscriptions do not necessarily have a users document, so also recover
    // using the phone stored on the authenticated user's profile.
    const email = String(decoded.email || "").trim().toLowerCase();
    const currentUserDoc = await adminDb.collection("users").doc(decoded.uid).get();
    const profilePhone = String(currentUserDoc.data()?.phone || "").trim();
    const phone = validPhone(requestedPhone) ? requestedPhone : profilePhone;

    const linkedIds: string[] = [];

    if (email) {
      const usersSnap = await adminDb.collection("users").where("email", "==", email).get();
      const legacyUserIds = usersSnap.docs.map((item) => item.id).filter((id) => id !== decoded.uid);
      for (const legacyUserId of legacyUserIds) {
        const subscriptionsSnap = await adminDb.collection("subscriptions").where("userId", "==", legacyUserId).where("status", "==", "ACTIVE").get();
        for (const subscriptionDoc of subscriptionsSnap.docs) {
          await subscriptionDoc.ref.update({ userId: decoded.uid, guest: false, email, updatedAt: FieldValue.serverTimestamp() });
          linkedIds.push(subscriptionDoc.id);
        }
      }
    }

    // A guest subscription created before account signup has a synthetic guest_* userId.
    // Match by phone and only claim subscriptions that are still ACTIVE and unlinked.
    if (phone) {
      const phoneSubscriptions = await adminDb.collection("subscriptions").where("phone", "==", phone).where("status", "==", "ACTIVE").get();
      for (const subscriptionDoc of phoneSubscriptions.docs) {
        if (linkedIds.includes(subscriptionDoc.id)) continue;
        const subscription = subscriptionDoc.data() || {};
        const currentUserId = String(subscription.userId || "");
        if (currentUserId && currentUserId !== decoded.uid && !currentUserId.startsWith("guest_")) continue;
        await subscriptionDoc.ref.update({ userId: decoded.uid, guest: false, email: email || null, updatedAt: FieldValue.serverTimestamp() });
        linkedIds.push(subscriptionDoc.id);
      }
    }

    if (linkedIds.length > 0) {
      await adminDb.collection("users").doc(decoded.uid).set({
        ...(phone ? { phone } : {}),
        ...(email ? { email } : {}),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    }

    return NextResponse.json({ success: true, linked: linkedIds.length, subscriptionIds: linkedIds });
  } catch (error) {
    console.error("Failed to claim subscription:", error);
    return NextResponse.json({ error: "Unable to link the subscription to your account." }, { status: 500 });
  }
}
