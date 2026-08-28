import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Order, OrderStatus } from "@/types/order";

export async function createRestaurantOrder(
  order: Omit<Order, "id" | "createdAt" | "updatedAt">
) {
  const response = await fetch("/api/orders/guest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(order),
  });

  const data = (await response.json().catch(() => ({}))) as {
    orderId?: string;
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error || "Unable to submit your order.");
  }

  return data.orderId || "";
}

export function subscribeToOrders(callback: (orders: Order[]) => void) {
  const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (s) =>
      callback(
        s.docs.map(
          (d) => ({ id: d.id, ...(d.data() as Omit<Order, "id">) }) as Order
        )
      ),
    (e) => console.error("Error loading orders:", e)
  );
}

export async function getOrders(): Promise<Order[]> {
  return new Promise((resolve, reject) => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (s) => {
        unsub();
        resolve(
          s.docs.map(
            (d) => ({ id: d.id, ...(d.data() as Omit<Order, "id">) }) as Order
          )
        );
      },
      (e) => {
        unsub();
        reject(e);
      }
    );
  });
}

export async function verifyPayment(orderId: string) {
  await updateDoc(doc(db, "orders", orderId), {
    paymentVerified: true,
    status: "PAYMENT_VERIFIED",
    updatedAt: serverTimestamp(),
  });
}

export async function paymentNotReceived(orderId: string) {
  await updateDoc(doc(db, "orders", orderId), {
    paymentVerified: false,
    status: "CANCELLED",
    updatedAt: serverTimestamp(),
  });
}

export async function confirmOrder(orderId: string) {
  await updateDoc(doc(db, "orders", orderId), {
    status: "CONFIRMED",
    updatedAt: serverTimestamp(),
  });
}

export async function startPreparingOrder(orderId: string) {
  await updateDoc(doc(db, "orders", orderId), {
    status: "PREPARING",
    updatedAt: serverTimestamp(),
  });
}

export async function markOrderReady(orderId: string) {
  await updateDoc(doc(db, "orders", orderId), {
    status: "READY",
    updatedAt: serverTimestamp(),
  });
}

export async function markOrderDelivered(orderId: string) {
  await updateDoc(doc(db, "orders", orderId), {
    status: "DELIVERED",
    updatedAt: serverTimestamp(),
  });
}

export async function cancelOrder(orderId: string) {
  await updateDoc(doc(db, "orders", orderId), {
    status: "CANCELLED",
    updatedAt: serverTimestamp(),
  });
}

export async function updateOrderStatus(orderId: string, status: string) {
  await updateDoc(doc(db, "orders", orderId), {
    status: status as OrderStatus,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteOrder(orderId: string) {
  await deleteDoc(doc(db, "orders", orderId));
}

export async function verifyDeliveryOtp(orderId: string, otp: string) {
  const snap = await getDoc(doc(db, "orders", orderId));
  const data = snap.data() as { deliveryOtp?: string } | undefined;

  if (!data?.deliveryOtp || data.deliveryOtp !== otp) {
    throw new Error("Invalid delivery OTP");
  }

  await updateDoc(doc(db, "orders", orderId), {
    otpVerified: true,
    status: "DELIVERED",
    updatedAt: serverTimestamp(),
  });
}
