"use client";

import Image from "next/image";
import Link from "next/link";
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
} from "lucide-react";

import { useCart } from "./CartContext";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CartDrawer({
  open,
  onClose,
}: Props) {
  const {
    cart,
    totalItems,
    totalPrice,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
  } = useCart();

  if (!open) {
    return null;
  }

  return (
    <>
      {/* BACKDROP */}

      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9998]"
        onClick={onClose}
      />

      {/* DRAWER */}

      <div className="fixed right-0 top-0 h-screen w-full sm:w-[430px] bg-[#111111] border-l border-white/10 z-[9999] flex flex-col shadow-2xl">

        {/* HEADER */}

        <div className="flex-shrink-0 bg-[#111111] border-b border-white/10 px-6 py-5 flex items-center justify-between">

          <div>
            <h2 className="text-2xl font-bold text-white">
              Shopping Cart
            </h2>

            <p className="text-white/50 text-sm mt-1">
              {totalItems} Item
              {totalItems !== 1 ? "s" : ""} in your cart
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close cart"
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-red-500 transition flex items-center justify-center"
          >
            <X
              className="text-white"
              size={20}
            />
          </button>

        </div>

        {/* CONTENT */}

        <div className="flex-1 overflow-y-auto p-6">

          {/* EMPTY CART */}

          {cart.length === 0 ? (
            <div className="min-h-[70vh] flex flex-col items-center justify-center text-center">

              <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center">

                <ShoppingBag
                  size={50}
                  className="text-white/40"
                />

              </div>

              <h3 className="text-white text-xl font-bold mt-6">
                Your Cart is Empty
              </h3>

              <p className="text-white/50 mt-3 max-w-xs">
                Looks like you haven't added
                any healthy meals yet.
              </p>

              <button
                type="button"
                onClick={onClose}
                className="mt-8 bg-[#E63946] hover:bg-red-600 px-8 py-3 rounded-xl font-semibold text-white transition"
              >
                Browse Menu
              </button>

            </div>
          ) : (

            <div className="space-y-5">

              {cart.map((item) => (

                <div
                  key={String(item.id)}
                  className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 hover:border-[#E63946]/40 transition"
                >

                  <div className="flex gap-4">

                    {/* IMAGE */}

                    <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-[#222]">

                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="96px"
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />

                    </div>

                    {/* DETAILS */}

                    <div className="flex-1 min-w-0">

                      <h3 className="text-white text-lg font-bold truncate">
                        {item.name}
                      </h3>

                      <p className="text-[#E63946] font-bold mt-1">
                        ₹{item.price}
                      </p>

                      {/* QUANTITY */}

                      <div className="flex items-center justify-start gap-5 mt-5">

  <div className="flex items-center gap-4">

                          {/* MINUS */}

                          <button
                            type="button"
                            aria-label={`Decrease ${item.name}`}
                            onClick={() =>
                              decreaseQuantity(
                                item.id
                              )
                            }
                            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 transition flex items-center justify-center text-white"
                          >
                            <Minus size={16} />
                          </button>

                          {/* QUANTITY */}

                          <span className="text-white text-lg font-bold min-w-[24px] text-center">
                            {item.quantity}
                          </span>

                          {/* PLUS */}

                          <button
                            type="button"
                            aria-label={`Increase ${item.name}`}
                            onClick={() =>
                              increaseQuantity(
                                item.id
                              )
                            }
                            className="w-9 h-9 rounded-full bg-[#E63946] hover:bg-red-600 active:scale-90 transition flex items-center justify-center"
                          >
                            <Plus
                              size={16}
                              className="text-white"
                            />
                          </button>

                        </div>

                        {/* DELETE */}

                        <button
                          type="button"
                          aria-label={`Remove ${item.name}`}
                          onClick={() =>
                            removeFromCart(
                              item.id
                            )
                          }
                          className="w-10 h-10 rounded-full bg-red-500/10 hover:bg-red-500 active:scale-90 transition flex items-center justify-center"
                        >
                          <Trash2
                            size={18}
                            className="text-red-400"
                          />
                        </button>

                      </div>

                      {/* ITEM TOTAL */}

                      <div className="flex justify-between mt-5 border-t border-white/10 pt-4">

                        <span className="text-white/50">
                          Item Total
                        </span>

                        <span className="text-xl font-bold text-white">
                          ₹
                          {item.price *
                            item.quantity}
                        </span>

                      </div>

                    </div>

                  </div>

                </div>

              ))}

            </div>
          )}

        </div>

        {/* FOOTER */}

        {cart.length > 0 && (

          <div className="flex-shrink-0 bg-[#111111] border-t border-white/10 p-6">

            <div className="flex items-center justify-between mb-5">

              <div>
                <p className="text-white/50 text-sm">
                  Grand Total
                </p>

                <h3 className="text-3xl font-bold text-white">
                  ₹{totalPrice}
                </h3>
              </div>

              <div className="text-right">
                <p className="text-green-400 text-sm font-medium">
                  Ready to Checkout
                </p>
              </div>

            </div>

            <Link
              href="/checkout"
              onClick={onClose}
              className="block"
            >
              <button
                type="button"
                className="w-full bg-[#E63946] hover:bg-red-600 transition-all duration-300 rounded-2xl py-4 text-lg font-bold text-white shadow-lg hover:scale-[1.02] active:scale-95"
              >
                Proceed to Checkout →
              </button>
            </Link>

          </div>

        )}

      </div>
    </>
  );
}