"use client";

import { useEffect, useState } from "react";

import {
  getOrders,
  updateOrderStatus,
  deleteOrder,
  verifyDeliveryOtp,
} from "@/lib/orderService";

import { Order } from "@/types/order";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [otp, setOtp] = useState<Record<string,string>>({});

  async function loadOrders() {
    const data = await getOrders();

    setOrders(data);
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function changeStatus(
    id: string,
    status: string
  ) {
    await updateOrderStatus(id, status);

    loadOrders();
  }

  async function removeOrder(id: string) {
    if (!confirm("Delete this order?")) return;

    await deleteOrder(id);

    loadOrders();
  }

  return (
    <main className="min-h-screen bg-[#0F0F10] text-white p-10">
      <div className="max-w-7xl mx-auto">

        <h1 className="text-5xl font-bold mb-10">
          Orders Dashboard
        </h1>

        <div className="space-y-8">

          {orders.length === 0 ? (

            <p className="text-white/50">
              No Orders Yet
            </p>

          ) : (

            orders.map((order) => (

              <div
                key={order.id}
                className="bg-[#171717] rounded-3xl p-8 border border-white/10"
              >

                <div className="flex justify-between items-start flex-wrap gap-6">

                  {/* CUSTOMER DETAILS */}

                  <div>

                    <h2 className="text-3xl font-bold text-[#E63946]">
                      {order.orderId}
                    </h2>

                    <p className="mt-4">
                      <span className="font-bold">
                        Customer:
                      </span>{" "}
                      {order.name}
                    </p>

                    <p>
                      <span className="font-bold">
                        Phone:
                      </span>{" "}
                      {order.phone}
                    </p>

                    <p>
                      <span className="font-bold">
                        Address:
                      </span>{" "}
                      {order.address}
                    </p>

                    <p>
                      <span className="font-bold">
                        Payment:
                      </span>{" "}
                      {order.paymentMethod}
                    </p>

                    <p>
                      <span className="font-bold">
                        Payment Status:
                      </span>{" "}
                      {order.paymentVerified
                        ? "Payment Verified"
                        : order.paymentDone
                        ? "Customer Says Paid"
                        : "Payment Pending"}
                    </p>

                    <p className="mt-3 text-2xl font-bold">
                      ₹{order.total}
                    </p>

                  </div>

                  {/* ORDER ITEMS */}

                  <div>

                    <h3 className="text-xl font-bold mb-3">
                      Ordered Items
                    </h3>

                    <div className="space-y-2">

                      {order.items.map((item, index) => (

                        <div key={index}>

                          {item.name} × {item.quantity}

                          {" - "}

                          ₹{item.price}

                        </div>

                      ))}

                    </div>

                  </div>

                  {/* STATUS + DELETE */}

                  <div className="space-y-4">

                    <label className="block text-sm mb-2">
                      Order Status
                    </label>

                    {order.status === "READY" || order.status === "OUT_FOR_DELIVERY" || order.status === "OTP_PENDING" ? (
                      <div className="rounded-xl border border-white/10 bg-[#111] p-3">
                        <label className="block text-xs text-white/50 mb-2">Customer delivery OTP</label>
                        <div className="flex gap-2">
                          <input value={otp[order.id || ""] || ""} onChange={e => setOtp(v => ({...v, [order.id || ""]: e.target.value}))} maxLength={4} placeholder="4 digits" className="w-full rounded-lg bg-[#252525] px-3 py-2 text-white" />
                          <button onClick={async()=>{try{if(!order.id) return; await verifyDeliveryOtp(order.id, otp[order.id] || ""); alert("Delivery confirmed"); loadOrders();}catch(e){alert(e instanceof Error?e.message:"Invalid OTP")}}} className="rounded-lg bg-[#E63946] px-3 py-2 text-xs font-bold">Verify</button>
                        </div>
                      </div>
                    ) : null}

                    <select
                      value={order.status}
                      onChange={(e) => {

                        if (!order.id) return;

                        changeStatus(
                          order.id,
                          e.target.value
                        );

                      }}
                      className="bg-[#252525] rounded-xl p-3"
                    >

                      <option value="NEW">
                        New
                      </option>

                      <option value="PAYMENT_PENDING">
                        Payment Pending
                      </option>

                      <option value="PAYMENT_VERIFIED">
                        Payment Verified
                      </option>

                      <option value="CONFIRMED">
                        Confirmed
                      </option>

                      <option value="PREPARING">
                        Preparing
                      </option>

                      <option value="READY">
                        Ready
                      </option>

                      <option value="DELIVERED">
                        Delivered
                      </option>

                      <option value="CANCELLED">
                        Cancelled
                      </option>

                    </select>

                    <button
                      onClick={() => {

                        if (!order.id) return;

                        removeOrder(order.id);

                      }}
                      className="w-full bg-red-600 hover:bg-red-700 rounded-xl py-3 font-bold"
                    >
                      Delete Order
                    </button>

                  </div>

                </div>

              </div>

            ))

          )}

        </div>

      </div>
    </main>
  );
}