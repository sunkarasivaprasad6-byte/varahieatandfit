"use client";

import { useSearchParams } from "next/navigation";

export default function OrderPlacedContent() {
  const params = useSearchParams();
  const orderId = params.get("id");

  return (
    <main className="min-h-screen bg-transparent flex items-center justify-center px-6">

      <div className="bg-[#171717] rounded-3xl p-10 max-w-lg w-full text-center">

        <div className="text-7xl mb-6">
          🎉
        </div>

        <h1 className="text-4xl font-bold text-white">
          Order Placed Successfully
        </h1>

        <p className="text-white/60 mt-5">
          Thank you for ordering from
        </p>

        <h2 className="text-[#E63946] text-3xl font-bold mt-2">
          Varahi Eat & Fit
        </h2>

        <div className="mt-8 bg-[#252525] rounded-xl p-5">

          <p className="text-white/50">
            Order ID
          </p>

          <h3 className="text-2xl font-bold text-green-400">
            {orderId ?? "N/A"}
          </h3>

        </div>

        <p className="text-white/60 mt-8">
          Please save your Order ID.
          Our team will contact you shortly.
        </p>

        <a
          href="/"
          className="mt-10 inline-block bg-[#E63946] hover:bg-red-600 px-8 py-4 rounded-xl font-bold"
        >
          Continue Shopping
        </a>

      </div>

    </main>
  );
}
