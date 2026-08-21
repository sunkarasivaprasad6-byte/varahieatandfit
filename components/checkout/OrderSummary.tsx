"use client";

import Image from "next/image";
import {
  Plus,
  Minus,
  Heart,
  Tag,
  Clock,
  Truck,
} from "lucide-react";

interface CartItem {
  id: number;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

interface Props {
  cart: CartItem[];

  totalPrice: number;
  deliveryCharge: number;
  gst: number;
  discount: number;
  grandTotal: number;

  coupon: string;
  setCoupon: (value: string) => void;
  applyCoupon: () => void;

  increaseQuantity: (id: number) => void;
  decreaseQuantity: (id: number) => void;
}

export default function OrderSummary({
  cart,
  totalPrice,
  deliveryCharge,
  gst,
  discount,
  grandTotal,
  coupon,
  setCoupon,
  applyCoupon,
  increaseQuantity,
  decreaseQuantity,
}: Props) {
  return (
    <div className="sticky top-28">

      <div className="bg-[#171717] rounded-[36px] border border-white/10 overflow-hidden shadow-[0_20px_70px_rgba(0,0,0,.45)]">

        {/* Header */}

        <div className="px-8 py-8 border-b border-white/10">

          <h2 className="text-4xl font-bold text-white">
            Your Order
          </h2>

          <p className="text-white/50 mt-3">
            Review your delicious meals
          </p>

        </div>

        <div className="p-8 space-y-6">

          {cart.map((item) => (

            <div
              key={item.id}
              className="bg-[#202020] rounded-3xl p-5 hover:border-[#E63946] border border-transparent transition"
            >

              {/* MOBILE: stack image and details
                  DESKTOP: keep original horizontal layout */}

              <div className="flex flex-col sm:flex-row gap-5">

                {/* Image */}

                <div className="relative w-full h-56 sm:w-32 sm:h-32 rounded-3xl overflow-hidden flex-shrink-0">

                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(max-width:768px) 100vw, (max-width:1200px) 50vw, 33vw"
                    className="object-cover"
                  />

                  <button
                    className="absolute top-3 right-3 bg-black/50 backdrop-blur rounded-full p-2"
                  >
                    <Heart
                      size={16}
                      className="text-white"
                    />
                  </button>

                </div>

                {/* Details */}

                <div className="flex-1 min-w-0">

                  <h3 className="text-2xl font-bold text-white">
                    {item.name}
                  </h3>

                  <p className="text-[#E63946] text-xl font-bold mt-2">
                    ₹{item.price}
                  </p>

                  <p className="text-white/40 mt-3">
                    Healthy • Fresh • Protein Rich
                  </p>

                  {/* QUANTITY + ITEM TOTAL */}

                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-5 mt-8">

                    {/* Quantity */}

                    <div className="flex items-center justify-start gap-5">

                      <div className="flex items-center gap-4">

                        <button
                          onClick={() =>
                            decreaseQuantity(item.id)
                          }
                          className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex-shrink-0"
                        >
                          <Minus className="mx-auto" />
                        </button>

                        <span className="text-white text-xl font-bold min-w-[24px] text-center">
                          {item.quantity}
                        </span>

                        <button
                          onClick={() =>
                            increaseQuantity(item.id)
                          }
                          className="w-11 h-11 rounded-full bg-[#E63946] flex-shrink-0"
                        >
                          <Plus className="mx-auto text-white" />
                        </button>

                      </div>

                    </div>

                    {/* Item Total */}

                    <div className="sm:text-right">

                      <p className="text-white/40 text-sm">
                        Item Total
                      </p>

                      <h3 className="text-3xl font-bold text-white">
                        ₹{item.quantity * item.price}
                      </h3>

                    </div>

                  </div>

                </div>

              </div>

            </div>

          ))}

          {/* Coupon Card */}

          <div className="bg-gradient-to-r from-[#E63946]/10 to-[#ff8a00]/10 rounded-3xl border border-[#E63946]/20 p-6">

            <div className="flex items-center gap-3 mb-5">

              <div className="w-12 h-12 rounded-2xl bg-[#E63946]/20 flex items-center justify-center flex-shrink-0">

                <Tag className="text-[#E63946]" />

              </div>

              <div className="min-w-0">

                <h3 className="text-white font-bold text-xl">
                  Apply Coupon
                </h3>

                <p className="text-white/50 text-sm">
                  Save more on every healthy meal
                </p>

              </div>

            </div>

            {/* MOBILE: vertical
                DESKTOP: horizontal */}

            <div className="flex flex-col sm:flex-row gap-3">

              <input
                value={coupon}
                onChange={(e) =>
                  setCoupon(e.target.value)
                }
                placeholder="WELCOME100"
                className="w-full sm:flex-1 h-14 rounded-2xl bg-[#111] border border-white/10 px-5 text-white outline-none focus:border-[#E63946]"
              />

              <button
                onClick={applyCoupon}
                className="w-full sm:w-auto bg-[#E63946] hover:bg-red-600 px-8 h-14 rounded-2xl text-white font-bold transition-all hover:scale-105"
              >
                Apply
              </button>

            </div>

          </div>

          {/* Delivery Card */}

          <div className="bg-[#202020] rounded-3xl p-6 border border-white/10">

            <div className="flex items-center gap-4">

              <div className="w-14 h-14 rounded-2xl bg-green-500/20 flex items-center justify-center flex-shrink-0">

                <Truck className="text-green-400" />

              </div>

              <div className="min-w-0">

                <h3 className="text-xl font-bold text-white">
                  Delivery Information
                </h3>

                <p className="text-white/50">
                  Fresh food delivered to your doorstep
                </p>

              </div>

            </div>

            <div className="mt-6 flex items-center gap-3 text-green-400">

              <Clock />

              <span className="font-semibold">
                Estimated Delivery :
                30 - 40 Minutes
              </span>

            </div>

          </div>

          {/* Bill Details */}

          <div className="bg-[#202020] rounded-3xl border border-white/10 p-7">

            <h3 className="text-2xl font-bold text-white mb-6">
              Bill Details
            </h3>

            <div className="space-y-5">

              <div className="flex justify-between text-white/70">
                <span>Subtotal</span>
                <span>₹{totalPrice}</span>
              </div>

              <div className="flex justify-between text-white/70">
                <span>Delivery Charges</span>
                <span>₹{deliveryCharge}</span>
              </div>

              <div className="flex justify-between text-white/70">
                <span>GST (5%)</span>
                <span>₹{gst}</span>
              </div>

              <div className="flex justify-between text-green-400 font-semibold">
                <span>Discount</span>
                <span>- ₹{discount}</span>
              </div>

              <div className="border-t border-white/10 pt-5 flex justify-between items-center gap-4">

                <div>

                  <p className="text-white/40">
                    Grand Total
                  </p>

                  <h2 className="text-4xl font-bold text-white mt-1">
                    ₹{grandTotal}
                  </h2>

                </div>

                <div className="bg-[#E63946]/10 border border-[#E63946]/20 rounded-2xl px-5 py-3 flex-shrink-0">

                  <p className="text-[#E63946] font-bold">
                    Ready to Pay
                  </p>

                </div>

              </div>

            </div>

          </div>

          {/* Savings Card */}

          <div className="rounded-3xl bg-gradient-to-r from-green-500/20 via-green-400/10 to-transparent border border-green-500/20 p-6">

            <h3 className="text-green-400 text-xl font-bold">
              🎉 Congratulations!
            </h3>

            <p className="text-white/60 mt-3 leading-7">
              You're choosing healthy food today.

              Using premium coupons can help you save even more on your future orders.
            </p>

          </div>

          {/* Footer */}

          <div className="rounded-3xl bg-[#181818] border border-white/10 p-6 text-center">

            <p className="text-white/60">
              🍽️ Freshly prepared after your order
            </p>

            <p className="text-white/40 mt-2">
              Made with premium ingredients • Served with care
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}