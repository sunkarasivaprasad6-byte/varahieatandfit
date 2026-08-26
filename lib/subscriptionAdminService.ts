import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";

const DELIVERY_SLOT_CAPACITY = 50;

type PaymentDetails = {
  orderId: string;
  paymentId?: string;
};

function slotKey(slot: string) {
  return slot.replace(/[^a-zA-Z0-9]+/g, "-").toLowerCase();
}

/**
 * Activates a subscription from a trusted Cashfree webhook.
 * This is deliberately server-side: the browser does not need to be signed in
 * for a paid subscription to be activated.
 */
export async function activateSubscriptionFromCashfree(
  subscriptionId: string,
  payment: PaymentDetails,
  webhookId: string
) {
  const subscriptionRef = adminDb.collection("subscriptions").doc(subscriptionId);
  const eventRef = adminDb.collection("cashfreeWebhookEvents").doc(webhookId);

  return adminDb.runTransaction(async (tx) => {
    const [eventSnap, subscriptionSnap] = await Promise.all([
      tx.get(eventRef),
      tx.get(subscriptionRef),
    ]);

    if (eventSnap.exists) {
      return { activated: false, duplicate: true };
    }

    if (!subscriptionSnap.exists) {
      throw new Error("Subscription not found");
    }

    const subscription = subscriptionSnap.data() || {};

    if (subscription.status === "ACTIVE") {
      tx.set(eventRef, {
        orderId: payment.orderId,
        paymentId: payment.paymentId || null,
        subscriptionId,
        status: "IGNORED_ALREADY_ACTIVE",
        createdAt: FieldValue.serverTimestamp(),
      });
      return { activated: false, duplicate: false };
    }

    if (subscription.status === "CANCELLED" || subscription.status === "COMPLETED") {
      throw new Error(`Subscription is ${subscription.status.toLowerCase()}`);
    }

    const reservationId = subscription.slotReservationId as string | undefined;
    const deliverySlot = subscription.deliverySlot as string | undefined;

    if (!reservationId || !deliverySlot) {
      throw new Error("Subscription delivery slot reservation is missing");
    }

    const reservationRef = adminDb.collection("deliverySlotReservations").doc(reservationId);
    const counterRef = adminDb.collection("deliverySlotCounters").doc(slotKey(deliverySlot));
    const [reservationSnap, counterSnap] = await Promise.all([
      tx.get(reservationRef),
      tx.get(counterRef),
    ]);

    if (!counterSnap.exists) {
      throw new Error("Delivery slot counter is missing");
    }

    const counter = counterSnap.data() || {};
    const activeCount = Number(counter.activeCount || 0);
    const reservedCount = Number(counter.reservedCount || 0);
    const reservationStatus = reservationSnap.exists
      ? String(reservationSnap.data()?.status || "")
      : "";

    // A valid active reservation moves from reserved -> active.
    // If the short reservation window expired before Cashfree confirmed payment,
    // still allow activation when the slot has capacity. This prevents a paid
    // customer from being left without a subscription merely because the webhook
    // arrived after the temporary checkout reservation expired.
    const reservationIsActive = reservationStatus === "ACTIVE";
    const reservationAlreadyActivated = reservationStatus === "ACTIVATED";

    if (!reservationAlreadyActivated && activeCount + (reservationIsActive ? reservedCount : 0) >= DELIVERY_SLOT_CAPACITY) {
      throw new Error(`The ${deliverySlot} delivery slot is full`);
    }

    if (!reservationAlreadyActivated) {
      tx.update(counterRef, {
        activeCount: activeCount + 1,
        ...(reservationIsActive
          ? { reservedCount: Math.max(0, reservedCount - 1) }
          : {}),
        updatedAt: FieldValue.serverTimestamp(),
      });

      if (reservationSnap.exists) {
        tx.update(reservationRef, {
          status: "ACTIVATED",
          activatedAt: FieldValue.serverTimestamp(),
        });
      }
    }

    tx.update(subscriptionRef, {
      status: "ACTIVE",
      paymentStatus: "SUCCESS",
      paymentOrderId: payment.orderId,
      ...(payment.paymentId ? { paymentId: payment.paymentId } : {}),
      paymentVerifiedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    tx.set(eventRef, {
      orderId: payment.orderId,
      paymentId: payment.paymentId || null,
      subscriptionId,
      status: "PROCESSED",
      createdAt: FieldValue.serverTimestamp(),
    });

    return { activated: true, duplicate: false };
  });
}
