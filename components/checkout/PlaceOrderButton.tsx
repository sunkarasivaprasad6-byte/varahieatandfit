"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle2, Loader2, MessageCircle } from "lucide-react";

import { createRestaurantOrder } from "@/lib/orderService";
import type { CartItem } from "@/components/cart/CartContext";

interface Props {
  cart: CartItem[];
  name: string;
  phone: string;
  address: string;
  location: string;
  phoneValid: boolean;
  nameValid: boolean;
  addressValid: boolean;
  paymentMethod: string;
  paymentDone: boolean;
  upiTransactionId: string;
  grandTotal: number;
  placingOrder: boolean;
  setPlacingOrder: (value: boolean) => void;
}

export default function PlaceOrderButton({
  cart,
  name,
  phone,
  address,
  location,
  phoneValid,
  nameValid,
  addressValid,
  paymentMethod,
  paymentDone,
  upiTransactionId,
  grandTotal,
  placingOrder,
  setPlacingOrder,
}: Props) {
  const [orderGenerated, setOrderGenerated] = useState(false);
  const isCOD = paymentMethod === "COD";
  const isCashfree = paymentMethod === "CASHFREE";
  const submissionStarted = useRef(false);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }
    if (!nameValid) {
      toast.error("Please enter your full name.");
      return;
    }
    if (!phoneValid) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!addressValid) {
      toast.error("Please enter your complete delivery address.");
      return;
    }

    // Online orders cannot be submitted without a valid UPI transaction ID.
    if (!isCOD) {
      const transactionId = upiTransactionId.trim();
      if (!transactionId) {
        toast.error("Please enter your UPI Transaction ID");
        return;
      }
      if (!/^[A-Za-z0-9][A-Za-z0-9._-]{5,63}$/.test(transactionId)) {
        toast.error("Please enter a valid UPI Transaction ID");
        return;
      }
      if (!paymentDone) {
        toast.error("Please click 'I Have Paid' after completing the payment.");
        return;
      }
    }

    if (placingOrder || orderGenerated || submissionStarted.current) return;

    submissionStarted.current = true;
    setPlacingOrder(true);

    const orderId = `VEF-${Date.now().toString().slice(-8)}`;
    const items = cart
      .map((item) => `• ${item.name} × ${item.quantity} = ₹${item.price * item.quantity}`)
      .join("\n");

    const orderItems = cart.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
    }));

    const paymentText = isCOD
      ? "Cash on Delivery"
      : isCashfree
        ? "Cashfree Online Payment"
        : "Online Payment";
    const restaurantStatus = isCOD ? "NEW" : "PAYMENT_VERIFIED";

    try {
      await createRestaurantOrder({
        orderId,
        name,
        phone,
        address,
        location,
        items: orderItems,
        total: grandTotal,
        paymentMethod,
        paymentDone,
        paymentVerified: false,
        status: restaurantStatus,
        otpVerified: false,
        ...(isCOD ? {} : { upiTransactionId: upiTransactionId.trim() }),
      });
    } catch (error) {
      console.error("Failed to create restaurant order:", error);
      toast.error("Unable to submit your order. Please try again.");
      submissionStarted.current = false;
      setPlacingOrder(false);
      return;
    }

    const message = `🍽️ *NEW VARAHI EAT & FIT ORDER*

━━━━━━━━━━━━━━━━━━━━

🆔 *Order ID*
${orderId}

👤 *Customer*
${name}

📞 *Phone*
${phone}

🏠 *Delivery Address*
${address}

📍 *Location*
${location || "Not Shared"}

━━━━━━━━━━━━━━━━━━━━

🛒 *ORDER ITEMS*

${items}

━━━━━━━━━━━━━━━━━━━━

💰 *GRAND TOTAL*
₹${grandTotal}

💳 *PAYMENT METHOD*
${paymentText}

${isCOD ? "" : `🔖 *UPI TRANSACTION ID*\n${upiTransactionId.trim()}\n`}
━━━━━━━━━━━━━━━━━━━━

${isCOD
  ? "🟡 COD ORDER — PAYMENT TO BE COLLECTED ON DELIVERY"
  : "🟢 PAYMENT SUBMITTED — PLEASE VERIFY THE UPI TRANSACTION"}

━━━━━━━━━━━━━━━━━━━━

⚠️ *Restaurant Action*

${isCOD
  ? "Confirm COD order and prepare the meal."
  : "Verify the UPI transaction. If payment is received, confirm the order. If not, contact the customer."}

Thank you for ordering from *Varahi Eat & Fit* ❤️`;

    const whatsappUrl = `https://wa.me/919014863642?text=${encodeURIComponent(message)}`;
    setOrderGenerated(true);
    toast.success(isCOD ? "Order submitted successfully." : "Payment submitted for verification.");
    setPlacingOrder(false);
    setTimeout(() => {
      window.location.href = whatsappUrl;
    }, 500);
  };

  useEffect(() => {
    // I Have Paid sets paymentDone only after a valid transaction ID is entered.
    if (!isCOD && paymentDone && !orderGenerated && !placingOrder && !submissionStarted.current) {
      handlePlaceOrder();
    }
  }, [paymentDone, isCOD, orderGenerated, placingOrder, upiTransactionId]);

  return (
    <div className="w-full">
      {orderGenerated && !isCOD && (
        <div className="mb-5 rounded-2xl border border-green-500/30 bg-green-500/10 p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-green-400 font-bold text-lg">Payment submitted for verification.</h3>
              <p className="text-white/60 text-sm mt-2 leading-6">Your payment has been submitted. Opening WhatsApp with your order details...</p>
            </div>
          </div>
        </div>
      )}

      {placingOrder && !isCOD && (
        <div className="mb-5 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-5">
          <div className="flex items-center justify-center gap-3"><Loader2 className="w-5 h-5 text-blue-400 animate-spin" /><p className="text-blue-300 font-semibold">Submitting payment for verification...</p></div>
        </div>
      )}

      {isCOD && (
        <div className="mb-5 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-5">
          <div className="flex items-start gap-3"><span className="text-xl">💵</span><div><h3 className="text-blue-400 font-bold">Cash on Delivery</h3><p className="text-white/60 text-sm mt-1 leading-6">Payment will be collected when your order is delivered.</p></div></div>
        </div>
      )}

      {isCOD && !orderGenerated && (
        <button type="button" onClick={handlePlaceOrder} disabled={placingOrder} className="w-full bg-[#E63946] hover:bg-red-600 disabled:bg-[#7f242c] disabled:cursor-not-allowed rounded-2xl py-4 text-lg font-bold text-white transition-all duration-300 hover:scale-[1.01] active:scale-[0.98] shadow-lg flex items-center justify-center gap-3">
          {placingOrder ? <><Loader2 className="w-5 h-5 animate-spin" />Sending Order...</> : <><MessageCircle className="w-5 h-5" />Place COD Order</>}
        </button>
      )}

      {isCOD && orderGenerated && (
        <div className="mb-5 rounded-2xl border border-green-500/30 bg-green-500/10 p-5">
          <div className="flex items-start gap-3"><CheckCircle2 className="w-6 h-6 text-green-400 shrink-0" /><div><h3 className="text-green-400 font-bold">Order submitted successfully.</h3><p className="text-white/60 text-sm mt-1 leading-6">Opening WhatsApp with your order details...</p></div></div>
        </div>
      )}

      <p className="text-center text-white/35 text-xs mt-4 leading-5">
        {isCOD ? "Your COD order will be sent to Varahi Eat & Fit for confirmation." : "Your payment is not automatically verified. The restaurant will verify the UPI transaction before confirming your order."}
      </p>
    </div>
  );
}
