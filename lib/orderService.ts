import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import type {
  Order,
  OrderItem,
  OrderStatus,
} from "@/types/order";

/* =========================================
   CREATE ORDER
========================================= */

export async function createRestaurantOrder(
  order: Omit<
    Order,
    "id" | "createdAt" | "updatedAt"
  >
) {
  const orderRef = await addDoc(
    collection(db, "orders"),
    {
      ...order,

      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
  );

  return orderRef.id;
}

/* =========================================
   REAL-TIME ORDERS
========================================= */

export function subscribeToOrders(
  callback: (orders: Order[]) => void
) {
  const ordersQuery = query(
    collection(db, "orders"),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    ordersQuery,
    (snapshot) => {
      const orders: Order[] =
        snapshot.docs.map((item) => ({
          id: item.id,
          ...(item.data() as Omit<Order, "id">),
        }));

      callback(orders);
    },
    (error) => {
      console.error(
        "Error loading orders:",
        error
      );
    }
  );
}

/* =========================================
   GET ORDERS
   Compatibility function
========================================= */

export async function getOrders(): Promise<Order[]> {
  return new Promise((resolve, reject) => {
    const ordersQuery = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const orders: Order[] =
          snapshot.docs.map((item) => ({
            id: item.id,
            ...(item.data() as Omit<Order, "id">),
          }));

        unsubscribe();
        resolve(orders);
      },
      (error) => {
        unsubscribe();
        reject(error);
      }
    );
  });
}

/* =========================================
   VERIFY PAYMENT
========================================= */

export async function verifyPayment(
  orderId: string
) {
  await updateDoc(
    doc(db, "orders", orderId),
    {
      paymentVerified: true,

      status: "PAYMENT_VERIFIED",

      updatedAt: serverTimestamp(),
    }
  );
}

/* =========================================
   PAYMENT NOT RECEIVED
========================================= */

export async function paymentNotReceived(
  orderId: string
) {
  await updateDoc(
    doc(db, "orders", orderId),
    {
      paymentVerified: false,

      status: "CANCELLED",

      updatedAt: serverTimestamp(),
    }
  );
}

/* =========================================
   CONFIRM ORDER
========================================= */

export async function confirmOrder(
  orderId: string
) {
  await updateDoc(
    doc(db, "orders", orderId),
    {
      status: "CONFIRMED",

      updatedAt: serverTimestamp(),
    }
  );
}

/* =========================================
   START PREPARING
========================================= */

export async function startPreparingOrder(
  orderId: string
) {
  await updateDoc(
    doc(db, "orders", orderId),
    {
      status: "PREPARING",

      updatedAt: serverTimestamp(),
    }
  );
}

/* =========================================
   MARK READY
========================================= */

export async function markOrderReady(
  orderId: string
) {
  await updateDoc(
    doc(db, "orders", orderId),
    {
      status: "READY",

      updatedAt: serverTimestamp(),
    }
  );
}

/* =========================================
   MARK DELIVERED
========================================= */

export async function markOrderDelivered(
  orderId: string
) {
  await updateDoc(
    doc(db, "orders", orderId),
    {
      status: "DELIVERED",

      updatedAt: serverTimestamp(),
    }
  );
}

/* =========================================
   CANCEL ORDER
========================================= */

export async function cancelOrder(
  orderId: string
) {
  await updateDoc(
    doc(db, "orders", orderId),
    {
      status: "CANCELLED",

      updatedAt: serverTimestamp(),
    }
  );
}

/* =========================================
   GENERIC STATUS UPDATE
   Compatibility with old admin code
========================================= */

export async function updateOrderStatus(
  orderId: string,
  status: string
) {
  await updateDoc(
    doc(db, "orders", orderId),
    {
      status: status as OrderStatus,

      updatedAt: serverTimestamp(),
    }
  );
}

/* =========================================
   DELETE ORDER
========================================= */

export async function deleteOrder(
  orderId: string
) {
  await deleteDoc(
    doc(db, "orders", orderId)
  );
}
export async function verifyDeliveryOtp(orderId: string, otp: string) {
  const snap = await import("firebase/firestore").then(({ getDoc }) => getDoc(doc(db, "orders", orderId)));
  const data = snap.data() as { deliveryOtp?: string } | undefined;
  if (!data?.deliveryOtp || data.deliveryOtp !== otp) throw new Error("Invalid delivery OTP");
  await updateDoc(doc(db, "orders", orderId), { otpVerified: true, status: "DELIVERED", updatedAt: serverTimestamp() });
}
