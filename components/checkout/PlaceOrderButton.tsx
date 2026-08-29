"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  CheckCircle2,
  Loader2,
  MessageCircle,
} from "lucide-react";

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

  grandTotal,

  placingOrder,
  setPlacingOrder,
}: Props) {
  const [orderGenerated, setOrderGenerated] = useState(false);

  const isCOD = paymentMethod === "COD";
  const isCashfree = paymentMethod === "CASHFREE";

  /*
   * Prevent the automatic UPI submission
   * from running more than once.
   */
  const submissionStarted = useRef(false);

  const handlePlaceOrder = async () => {
    /* ========================================
       1. BASIC VALIDATION
    ======================================== */

    if (cart.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }

    if (!nameValid) {
      toast.error("Please enter your full name.");
      return;
    }

    if (!phoneValid) {
      toast.error(
        "Please enter a valid 10-digit mobile number."
      );
      return;
    }

    if (!addressValid) {
      toast.error(
        "Please enter your complete delivery address."
      );
      return;
    }

    /* ========================================
       2. UPI PAYMENT VALIDATION
    ======================================== */

    if (!isCOD && !paymentDone) {
      toast.error("Please complete the online payment first.");
      return;
    }

    /* ========================================
       3. PREVENT DOUBLE SUBMISSION
    ======================================== */

    if (
      placingOrder ||
      orderGenerated ||
      submissionStarted.current
    ) {
      return;
    }

    submissionStarted.current = true;

    setPlacingOrder(true);

    /* ========================================
       4. GENERATE ORDER ID
    ======================================== */

    const orderId = `VEF-${Date.now().toString().slice(-8)}`;

    /* ========================================
       5. PREPARE ITEMS
    ======================================== */

    const items = cart
      .map(
        (item) =>
          `• ${item.name} × ${item.quantity} = ₹${
            item.price * item.quantity
          }`
      )
      .join("\n");

    const orderItems = cart.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
    }));

    /* ========================================
       6. PAYMENT STATUS
    ======================================== */

    const paymentText = isCOD ? "Cash on Delivery" : isCashfree ? "Cashfree Online Payment" : "Online Payment";

    const restaurantStatus = isCOD ? "NEW" : "PAYMENT_VERIFIED";

    /* ========================================
       7. SAVE ORDER TO FIREBASE
    ======================================== */

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

        /*
         * Customer says they paid.
         * Restaurant still needs to verify it.
         */
        paymentDone,

        /*
         * Restaurant verification remains false.
         */
        paymentVerified: false,

        status: restaurantStatus,
        otpVerified: false,
      });
    } catch (error) {
      console.error(
        "Failed to create restaurant order:",
        error
      );

      toast.error(
        "Unable to submit your order. Please try again."
      );

      submissionStarted.current = false;
      setPlacingOrder(false);

      return;
    }

    /* ========================================
       8. CREATE WHATSAPP MESSAGE
    ======================================== */

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

━━━━━━━━━━━━━━━━━━━━

${
  isCOD
    ? "🟡 COD ORDER — PAYMENT TO BE COLLECTED ON DELIVERY"
    : "🟢 PAYMENT SUBMITTED — PLEASE VERIFY THE UPI TRANSACTION"
}

━━━━━━━━━━━━━━━━━━━━

⚠️ *Restaurant Action*

${
  isCOD
    ? "Confirm COD order and prepare the meal."
    : "Verify the UPI transaction. If payment is received, confirm the order. If not, contact the customer."
}

Thank you for ordering from *Varahi Eat & Fit* ❤️`;

    /* ========================================
       9. WHATSAPP URL
    ======================================== */

    const whatsappUrl =
      `https://wa.me/919014863642?text=` +
      encodeURIComponent(message);

    /* ========================================
       10. SHOW SUCCESS MESSAGE
    ======================================== */

    setOrderGenerated(true);

    toast.success(
      isCOD
        ? "Order submitted successfully."
        : "Payment submitted for verification."
    );

    setPlacingOrder(false);

    /* ========================================
       11. OPEN WHATSAPP
       
       Using location.href instead of window.open
       makes this more reliable on mobile browsers.
    ======================================== */

    setTimeout(() => {
      window.location.href = whatsappUrl;
    }, 500);
  };

  /* ========================================
     AUTOMATIC UPI ORDER SUBMISSION

     When the customer presses:
     "I've Completed Payment"

     PaymentSection sets paymentDone = true.

     This automatically:
     1. Creates the Firebase order
     2. Shows verification message
     3. Opens WhatsApp
  ======================================== */

  useEffect(() => {
    if (
      !isCOD &&
      paymentDone &&
      !orderGenerated &&
      !placingOrder &&
      !submissionStarted.current
    ) {
      handlePlaceOrder();
    }
  }, [
    paymentDone,
    isCOD,
    orderGenerated,
    placingOrder,
  ]);

  return (
    <div className="w-full">

      {/* ========================================
          PAYMENT SUBMITTED SUCCESS
      ======================================== */

      {orderGenerated && !isCOD && (
        <div className="mb-5 rounded-2xl border border-green-500/30 bg-green-500/10 p-5">

          <div className="flex items-start gap-3">

            <CheckCircle2 className="w-6 h-6 text-green-400 shrink-0 mt-0.5" />

            <div>

              <h3 className="text-green-400 font-bold text-lg">
                Payment submitted for verification.
              </h3>

              <p className="text-white/60 text-sm mt-2 leading-6">
                Your payment has been submitted.
                Opening WhatsApp with your order details...
              </p>

            </div>

          </div>

        </div>
      )}

      {/* ========================================
          SENDING STATUS
      ======================================== */

      {placingOrder && !isCOD && (
        <div className="mb-5 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-5">

          <div className="flex items-center justify-center gap-3">

            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />

            <p className="text-blue-300 font-semibold">
              Submitting payment for verification...
            </p>

          </div>

        </div>
      )}

      {/* ========================================
          COD STATUS
      ======================================== */

      {isCOD && (
        <div className="mb-5 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-5">

          <div className="flex items-start gap-3">

            <span className="text-xl">
              💵
            </span>

            <div>

              <h3 className="text-blue-400 font-bold">
                Cash on Delivery
              </h3>

              <p className="text-white/60 text-sm mt-1 leading-6">
                Payment will be collected when your
                order is delivered.
              </p>

            </div>

          </div>

        </div>
      )}

      {/* ========================================
          COD BUTTON ONLY

          UPI does NOT need a button anymore.
          Pressing "I've Completed Payment" in the
          payment section automatically submits it.
      ======================================== */

      {isCOD && !orderGenerated && (
        <button
          type="button"
          onClick={handlePlaceOrder}
          disabled={placingOrder}
          className="
            w-full
            bg-[#E63946]
            hover:bg-red-600
            disabled:bg-[#7f242c]
            disabled:cursor-not-allowed
            rounded-2xl
            py-4
            text-lg
            font-bold
            text-white
            transition-all
            duration-300
            hover:scale-[1.01]
            active:scale-[0.98]
            shadow-lg
            flex
            items-center
            justify-center
            gap-3
          "
        >
          {placingOrder ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Sending Order...
            </>
          ) : (
            <>
              <MessageCircle className="w-5 h-5" />
              Place COD Order
            </>
          )}
        </button>
      )}

      {/* ========================================
          COD SUCCESS
      ======================================== */

      {isCOD && orderGenerated && (
        <div className="mb-5 rounded-2xl border border-green-500/30 bg-green-500/10 p-5">

          <div className="flex items-start gap-3">

            <CheckCircle2 className="w-6 h-6 text-green-400 shrink-0" />

            <div>

              <h3 className="text-green-400 font-bold">
                Order submitted successfully.
              </h3>

              <p className="text-white/60 text-sm mt-1 leading-6">
                Opening WhatsApp with your order details...
              </p>

            </div>

          </div>

        </div>
      )}

      {/* ========================================
          SECURITY MESSAGE
      ======================================== */

      <p className="text-center text-white/35 text-xs mt-4 leading-5">

        {isCOD
          ? "Your COD order will be sent to Varahi Eat & Fit for confirmation."
          : "Your payment is not automatically verified. The restaurant will verify the UPI transaction before confirming your order."}

      </p>

    </div>
  );
}
