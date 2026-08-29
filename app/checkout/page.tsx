"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ChevronRight } from "lucide-react";

import { useCart } from "@/components/cart/CartContext";

import CheckoutNavbar from "@/components/checkout/CheckoutNavbar";
import CustomerForm from "@/components/checkout/CustomerForm";
import OrderSummary from "@/components/checkout/OrderSummary";
import PaymentSection from "@/components/checkout/PaymentSection";
import PlaceOrderButton from "@/components/checkout/PlaceOrderButton";

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutContent />
    </Suspense>
  );
}

function CheckoutContent() {
  const { cart, totalPrice, increaseQuantity, decreaseQuantity } = useCart();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [paymentDone, setPaymentDone] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [location, setLocation] = useState("");

  const deliveryCharge = 40;
  const gst = Math.round(totalPrice * 0.05);
  const grandTotal = totalPrice + deliveryCharge + gst - discount;

  const phoneValid = /^[6-9]\d{9}$/.test(phone);
  const nameValid = name.trim().length >= 3;
  const addressValid = address.trim().length >= 20;

  function applyCoupon() {
    if (coupon.toUpperCase() === "hello123") {
      setDiscount(100);
      toast.success("Coupon Applied Successfully");
    } else {
      toast.error("Invalid Coupon");
    }
  }

  function getCurrentLocation() {
    if (!navigator.geolocation) {
      toast.error("Location Not Supported");
      return;
    }

    setLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(
          `https://maps.google.com/?q=${position.coords.latitude},${position.coords.longitude}`
        );
        setLoadingLocation(false);
        toast.success("Location Captured");
      },
      () => {
        setLoadingLocation(false);
        toast.error("Permission Denied");
      }
    );
  }

  const upiLink =
    `upi://pay?pa=rajasekar.bukke@oksbi&pn=${encodeURIComponent("Varahi Eat & Fit")}&am=${grandTotal}&cu=INR`;

  return (
    <>
      <CheckoutNavbar />

      <main className="relative min-h-screen bg-transparent overflow-hidden">
        <div className="pointer-events-none absolute top-20 left-[-150px] w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-[#E63946]/10 rounded-full blur-[120px] sm:blur-[180px]" />
        <div className="pointer-events-none absolute bottom-0 right-[-150px] w-[300px] h-[300px] sm:w-[450px] sm:h-[450px] bg-red-600/10 rounded-full blur-[120px] sm:blur-[180px]" />

        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 pt-8 sm:pt-12 lg:pt-14 pb-10 sm:pb-14">
          <div className="flex items-center gap-2 text-white/40 text-sm sm:text-base mb-4 sm:mb-6">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight size={15} />
            <span>Checkout</span>
          </div>

          <div className="max-w-3xl">
            <h1 className="text-[42px] leading-[0.98] sm:text-5xl sm:leading-tight lg:text-6xl font-bold text-white">
              Secure Checkout
            </h1>
            <p className="text-white/50 text-base sm:text-lg lg:text-xl mt-4 sm:mt-5 leading-relaxed max-w-2xl">
              Review your order, complete your payment, and enjoy healthy meals delivered fresh to your doorstep.
            </p>
          </div>

          <div className="mt-8 sm:mt-10 lg:mt-14 grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6 lg:gap-8 xl:gap-10 items-start">
            <div className="space-y-6 sm:space-y-8">
              <Link href="/" className="inline-flex items-center gap-2 text-[#E63946] text-sm sm:text-base font-medium hover:text-red-400 transition-colors">
                ← Back to Cart
              </Link>

              <div className="rounded-[24px] sm:rounded-[30px] overflow-hidden">
                <CustomerForm
                  name={name}
                  phone={phone}
                  address={address}
                  setName={setName}
                  setPhone={setPhone}
                  setAddress={setAddress}
                  phoneValid={phoneValid}
                  nameValid={nameValid}
                  addressValid={addressValid}
                  loadingLocation={loadingLocation}
                  location={location}
                  getCurrentLocation={getCurrentLocation}
                />
              </div>

              <div className="rounded-[24px] sm:rounded-[30px] overflow-hidden">
                <PaymentSection
                  paymentMethod={paymentMethod}
                  setPaymentMethod={setPaymentMethod}
                  paymentDone={paymentDone}
                  setPaymentDone={setPaymentDone}
                  grandTotal={grandTotal}
                  upiLink={upiLink}
                />
              </div>

              <div className="w-full">
                <PlaceOrderButton
                  cart={cart}
                  name={name}
                  phone={phone}
                  address={address}
                  location={location}
                  phoneValid={phoneValid}
                  nameValid={nameValid}
                  addressValid={addressValid}
                  paymentMethod={paymentMethod}
                  paymentDone={paymentDone}
                  grandTotal={grandTotal}
                  placingOrder={placingOrder}
                  setPlacingOrder={setPlacingOrder}
                />
              </div>
            </div>

            <div className="order-last xl:order-none w-full">
              <OrderSummary
                cart={cart}
                totalPrice={totalPrice}
                deliveryCharge={deliveryCharge}
                gst={gst}
                discount={discount}
                grandTotal={grandTotal}
                coupon={coupon}
                setCoupon={setCoupon}
                applyCoupon={applyCoupon}
                increaseQuantity={increaseQuantity}
                decreaseQuantity={decreaseQuantity}
              />
            </div>
          </div>

          <div className="mt-14 sm:mt-20 lg:mt-24 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            <div className="bg-[#151515] border border-white/10 rounded-[24px] sm:rounded-3xl p-6 sm:p-8 text-center">
              <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">🚚</div>
              <h3 className="text-white text-xl sm:text-2xl font-bold">Fast Delivery</h3>
              <p className="text-white/50 mt-3 sm:mt-4 leading-6 sm:leading-7 text-sm sm:text-base">Fresh food delivered within 30–40 minutes.</p>
            </div>

            <div className="bg-[#151515] border border-white/10 rounded-[24px] sm:rounded-3xl p-6 sm:p-8 text-center">
              <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">🥗</div>
              <h3 className="text-white text-xl sm:text-2xl font-bold">Healthy Ingredients</h3>
              <p className="text-white/50 mt-3 sm:mt-4 leading-6 sm:leading-7 text-sm sm:text-base">Prepared using fresh, nutritious and premium ingredients.</p>
            </div>

            <div className="bg-[#151515] border border-white/10 rounded-[24px] sm:rounded-3xl p-6 sm:p-8 text-center">
              <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">🔒</div>
              <h3 className="text-white text-xl sm:text-2xl font-bold">Secure Payment</h3>
              <p className="text-white/50 mt-3 sm:mt-4 leading-6 sm:leading-7 text-sm sm:text-base">Safe UPI, COD and digital payment methods.</p>
            </div>
          </div>

          <div className="mt-14 sm:mt-20 lg:mt-28 rounded-[24px] sm:rounded-[32px] lg:rounded-[40px] bg-gradient-to-r from-[#171717] to-[#101010] border border-white/10 p-6 sm:p-8 lg:p-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
              <div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">Varahi Eat & Fit</h2>
                <p className="text-white/50 mt-4 sm:mt-5 leading-7 sm:leading-8 text-sm sm:text-base">
                  We prepare every meal with fresh ingredients, balanced nutrition and premium quality to help you live a healthier lifestyle.
                </p>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-5">Customer Care</h3>
                <div className="space-y-3 sm:space-y-4 text-white/60 text-sm sm:text-base">
                  <p>📞 +91 63020 94687</p>
                  <p>📧 support@varahieatfit.com</p>
                  <p>🕒 Open Everyday</p>
                  <p>⏰ 8:00 AM – 10:00 PM</p>
                </div>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-5">Why Choose Us</h3>
                <div className="space-y-3 sm:space-y-4 text-white/60 text-sm sm:text-base">
                  <p>🥗 Fresh Ingredients</p>
                  <p>🚚 Fast Delivery</p>
                  <p>💳 Secure Payments</p>
                  <p>⭐ Premium Quality</p>
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 mt-8 sm:mt-12 pt-6 sm:pt-8 flex flex-col md:flex-row justify-between items-center text-center md:text-left">
              <p className="text-white/40 text-sm">© {new Date().getFullYear()} Varahi Eat & Fit. All Rights Reserved.</p>
              <p className="text-[#E63946] font-semibold mt-3 md:mt-0 text-sm">Made with ❤️ for Healthy Living</p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
