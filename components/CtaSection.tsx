"use client";

import { motion } from "motion/react";
import { ArrowRight, ShoppingCart } from "lucide-react";

export default function CtaSection() {
  const scrollToMenu = () => {
    document
      .getElementById("menu")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  const openCart = () => {
    document.getElementById("cart-button")?.click();
  };

  return (
    <section className="relative py-32 bg-transparent overflow-hidden">
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] sm:w-[600px] sm:h-[600px] bg-[#d91f27]/[0.06] rounded-full blur-[140px] pointer-events-none z-0" />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{
            duration: 0.8,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="relative bg-gradient-to-b from-white/[0.08] to-transparent backdrop-blur-2xl border border-white/10 rounded-[40px] p-10 sm:p-16 md:p-24 overflow-hidden text-center shadow-[0_30px_60px_rgba(0,0,0,0.5)] group"
        >
          {/* Hover Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#d91f27]/0 to-transparent group-hover:from-[#d91f27]/5 transition-colors duration-700 pointer-events-none" />

          {/* Small Title */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-[#d91f27] text-sm font-bold tracking-[0.3em] uppercase mb-6 flex items-center justify-center gap-3"
          >
            <span className="w-8 h-[2px] bg-[#d91f27]" />
            Premium Healthy Dining
            <span className="w-8 h-[2px] bg-[#d91f27]" />
          </motion.p>

          {/* Heading */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="font-playfair text-4xl sm:text-5xl md:text-7xl font-bold text-white mb-6 leading-tight"
          >
            Order Your
            <br className="hidden sm:block" />
            <span className="italic font-light text-white/90">
              Healthy Meal
            </span>
          </motion.h2>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-white/60 text-lg sm:text-xl max-w-3xl mx-auto mb-12 leading-relaxed"
          >
            Discover freshly prepared, protein-rich meals made with premium
            ingredients. Every dish is crafted to fuel your body while
            delivering exceptional taste and freshness.
          </motion.p>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row justify-center gap-6"
          >
            {/* Explore Menu */}
            <button
              onClick={scrollToMenu}
              className="w-full sm:w-auto bg-[#d91f27] text-white px-10 py-5 rounded-full text-lg font-semibold transition-all hover:bg-[#b81820] hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3"
            >
              Explore Menu
              <ArrowRight className="w-5 h-5" />
            </button>

            {/* Order Now */}
            <button
              onClick={openCart}
              className="w-full sm:w-auto border border-white/20 text-white px-10 py-5 rounded-full text-lg font-semibold transition-all hover:bg-white/10 hover:border-white/40 active:scale-95 flex items-center justify-center gap-3"
            >
              <ShoppingCart className="w-5 h-5" />
              Order Now
            </button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
