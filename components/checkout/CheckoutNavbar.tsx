"use client";

import Link from "next/link";
import {
  ShieldCheck,
  Lock,
} from "lucide-react";

export default function CheckoutNavbar() {
  return (
    <header className="sticky top-0 z-50 bg-[#0d0d0d]/95 backdrop-blur-xl border-b border-[#E63946]/30">

      <div className="max-w-7xl mx-auto px-8 h-24 flex items-center justify-between">

        {/* Logo */}

        <Link
  href="/"
  className="flex items-center gap-3"
>
  <div className="h-10 w-10 rounded-full bg-[#E63946] flex items-center justify-center font-bold text-white text-xl">
    V
  </div>

  <div>
    <h1 className="text-white font-bold text-lg">
      Varahi Eat & Fit
    </h1>

    <p className="text-xs text-white/50">
      Healthy Restaurant
    </p>
  </div>
</Link>

        {/* Navigation */}

        <nav className="hidden md:flex items-center gap-12">

          <Link
            href="/"
            className="text-white/80 hover:text-[#E63946] transition"
          >
            Home
          </Link>

          <Link
            href="/#menu"
            className="text-white/80 hover:text-[#E63946] transition"
          >
            Menu
          </Link>

          <Link
            href="/#about"
            className="text-white/80 hover:text-[#E63946] transition"
          >
            About
          </Link>

          <Link
            href="/#contact"
            className="text-white/80 hover:text-[#E63946] transition"
          >
            Contact
          </Link>

        </nav>

        {/* Right */}

        <div className="flex items-center gap-3">

          <Lock
            className="text-white/70"
            size={18}
          />

          <span className="text-white/80">

            100% Secure Checkout

          </span>

          <ShieldCheck
            className="text-green-400"
          />

        </div>

      </div>

      <div className="h-[1px] bg-gradient-to-r from-transparent via-[#E63946] to-transparent" />

    </header>
  );
}