"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { Clock, Flame, Leaf, Star } from "lucide-react";
import { useMemo } from "react";
import RestaurantStatus from "@/components/RestaurantStatus/RestaurantStatus";

export default function Hero() {
  const particles = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        top: `${8 + ((i * 13) % 82)}%`,
        left: `${5 + ((i * 17) % 90)}%`,
        delay: i * 0.25,
        duration: 4 + (i % 4),
        size: i % 3 === 0 ? 5 : 3,
      })),
    []
  );

  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-transparent pt-24 pb-14">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000_100%)] opacity-90" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_45%,rgba(255,77,87,.18),transparent_42%)]" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_45%,rgba(255,77,87,.07),transparent_40%)]" />

      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,#00000055)]" />

      <div className="relative z-10 mx-auto grid w-full max-w-[1450px] grid-cols-1 items-center gap-10 px-6 lg:grid-cols-2">

        {/* ========================================================= */}
        {/* LEFT CONTENT */}
        {/* ========================================================= */}

        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">

          {/* Michelin */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8 flex items-center gap-3"
          >
            <div className="h-px w-10 bg-gradient-to-r from-transparent to-[#FF4D57]" />

            <span className="text-[11px] font-bold tracking-[0.35em] text-[#FF4D57] uppercase">
              Michelin Star Quality
            </span>

            <div className="h-px w-10 bg-gradient-to-l from-transparent to-[#FF4D57]" />
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="mb-8 leading-[0.98]"
          >
            <span className="block font-playfair text-[58px] font-bold text-white sm:text-[72px] lg:text-[88px] xl:text-[96px]">
              It&apos;s not just
            </span>

            <span className="block font-playfair text-[58px] text-[#E6E6E6] italic sm:text-[72px] lg:text-[88px] xl:text-[96px]">
              Food,
              <span className="ml-5 font-bold text-[#FF4D57]">
                It&apos;s an
              </span>
            </span>

            <span className="block text-[58px] font-bold text-[#FF4D57] italic sm:text-[72px] lg:text-[88px] xl:text-[96px]">
              Experience.
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="max-w-[500px] text-[16px] leading-8 text-white/60"
          >
            Elevating healthy dining into a luxurious art form. Savor our
            meticulously crafted, organic high-protein meals designed to
            nourish both body and soul.
          </motion.p>

          {/* Explore Menu */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mt-10"
          >
            <a
              href="#menu"
              className="inline-flex items-center gap-3 rounded-full bg-[#FF4D57] px-10 py-5 text-[13px] font-bold tracking-[.18em] text-white uppercase transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_40px_rgba(255,77,87,.35)]"
            >
              Explore Menu

              {/* Arrow SVG */}
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </a>
          </motion.div>

          {/* Customers */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mt-12 flex items-center gap-6"
          >
            <div className="flex -space-x-4">
              {[
                "1534528741775-53994a69daeb",
                "1506794778202-cad84cf45f1d",
                "1494790108377-be9c29b29330",
              ].map((id) => (
                <div
                  key={id}
                  className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-[#050505]"
                >
                  <Image
                    src={`https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=150&q=75`}
                    alt="Customer"
                    fill
                    sizes="48px"
                    quality={75}
                    className="object-cover"
                  />
                </div>
              ))}

              <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#050505] bg-[#FF4D57] text-xs font-bold text-white">
                4k+
              </div>
            </div>

            <div>
              <div className="mb-2 flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-[#FF4D57] text-[#FF4D57]"
                  />
                ))}
              </div>

              <p className="text-sm text-white/60">
                Over 2k+ happy customers
              </p>
            </div>
          </motion.div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT HERO IMAGE */}
        {/* ========================================================= */}

        <div className="relative flex h-[520px] items-center justify-center overflow-visible lg:h-[760px]">

          {/* Glow */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">

            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.26, 0.38, 0.26],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute h-[62%] w-[62%] rounded-full bg-[#FF4D57]/25 blur-[135px]"
            />

            <motion.div
              animate={{
                scale: [1, 1.14, 1],
                opacity: [0.14, 0.23, 0.14],
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute h-full w-full rounded-full bg-[#FF4D57]/10 blur-[200px]"
            />
          </div>

          {/* Rotating Rings */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 60,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute aspect-square w-[72%] rounded-full border border-white/[0.03] border-l-[#FF4D57]/20"
          />

          <motion.div
            animate={{ rotate: -360 }}
            transition={{
              duration: 90,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute aspect-square w-[88%] rounded-full border border-white/[0.03] border-r-[#FF4D57]/15"
          />

          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 120,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute aspect-square w-[108%] rounded-full border border-white/[0.02]"
          />

          {/* Particles */}
          <div className="pointer-events-none absolute inset-0">
            {particles.map((p) => (
              <motion.div
                key={p.id}
                className="absolute rounded-full bg-[#FF4D57]"
                style={{
                  width: p.size,
                  height: p.size,
                  top: p.top,
                  left: p.left,
                  boxShadow: "0 0 18px rgba(255,77,87,.8)",
                }}
                animate={{
                  y: [-12, 12],
                  opacity: [0.3, 1, 0.3],
                  scale: [0.8, 1.3, 0.8],
                }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>

          {/* Main Bowl */}
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.85,
              rotate: -8,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              rotate: 0,
            }}
            transition={{
              duration: 1.2,
            }}
            className="relative z-20 flex aspect-square w-[165%] max-w-[1080px] items-center justify-center lg:w-[204%]"
          >
            <motion.div
              initial={{
                opacity: 0,
                y: 30,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.8,
                ease: "easeOut",
              }}
              className="relative h-full w-full"
            >
              <Image
                src="/images/hero-bowl.png"
                alt="Healthy Bowl"
                fill
                priority
                quality={75}
                sizes="(max-width: 1023px) 100vw, 50vw"
                className="object-contain drop-shadow-2xl"
              />
            </motion.div>
          </motion.div>

          {/* Shadow */}
          <motion.div
            animate={{
              scale: [0.92, 1.05, 0.92],
              opacity: [0.25, 0.55, 0.25],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute bottom-[8%] h-[80px] w-[42%] rounded-full bg-black/70 blur-[60px]"
          />

          {/* ======================================================= */}
          {/* BASIL ORBIT 1 */}
          {/* ======================================================= */}

          <motion.div
            className="pointer-events-none absolute inset-0 z-30"
            initial={{ rotate: -34 }}
            animate={{ rotate: 326 }}
            transition={{
              duration: 36,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <motion.div
              className="absolute top-1/2 left-1/2 h-20 w-20 -translate-y-1/2 sm:h-24 sm:w-24 lg:h-28 lg:w-28"
              style={{
                x: "clamp(132px, 24vw, 255px)",
              }}
              animate={{
                rotate: [-18, 14, -18],
                scale: [0.96, 1.04, 0.96],
              }}
              transition={{
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Image
                src="/images/basil.png"
                alt="Basil"
                fill
                sizes="(min-width: 1024px) 112px, (min-width: 640px) 96px, 80px"
                quality={75}
                className="object-contain drop-shadow-[0_18px_24px_rgba(0,0,0,.48)]"
              />
            </motion.div>
          </motion.div>

          {/* ======================================================= */}
          {/* BASIL ORBIT 2 */}
          {/* ======================================================= */}

          <motion.div
            className="pointer-events-none absolute inset-0 z-20 opacity-75 blur-[0.7px]"
            initial={{ rotate: 112 }}
            animate={{ rotate: -248 }}
            transition={{
              duration: 52,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <motion.div
              className="absolute top-1/2 left-1/2 h-14 w-14 -translate-y-1/2 sm:h-16 sm:w-16 lg:h-20 lg:w-20"
              style={{
                x: "clamp(150px, 28vw, 300px)",
              }}
              animate={{
                rotate: [10, -16, 10],
                scale: [0.92, 1, 0.92],
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Image
                src="/images/basil.png"
                alt="Basil"
                fill
                sizes="(min-width: 1024px) 80px, (min-width: 640px) 64px, 56px"
                quality={75}
                className="object-contain drop-shadow-[0_12px_18px_rgba(0,0,0,.38)]"
              />
            </motion.div>
          </motion.div>

          {/* ======================================================= */}
          {/* BASIL ORBIT 3 */}
          {/* ======================================================= */}

          <motion.div
            className="pointer-events-none absolute inset-0 z-40"
            initial={{ rotate: 214 }}
            animate={{ rotate: 574 }}
            transition={{
              duration: 44,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <motion.div
              className="absolute top-1/2 left-1/2 h-11 w-11 -translate-y-1/2 sm:h-14 sm:w-14 lg:h-16 lg:w-16"
              style={{
                x: "clamp(112px, 20vw, 220px)",
              }}
              animate={{
                rotate: [-22, 12, -22],
                scale: [1, 1.08, 1],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Image
                src="/images/basil.png"
                alt="Basil"
                fill
                sizes="(min-width: 1024px) 64px, (min-width: 640px) 56px, 44px"
                quality={75}
                className="object-contain drop-shadow-[0_14px_18px_rgba(0,0,0,.45)]"
              />
            </motion.div>
          </motion.div>

          {/* ======================================================= */}
          {/* TOMATO ORBIT 1 */}
          {/* ======================================================= */}

          <motion.div
            className="pointer-events-none absolute inset-0 z-40"
            initial={{ rotate: 38 }}
            animate={{ rotate: -322 }}
            transition={{
              duration: 40,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <motion.div
              className="absolute top-1/2 left-1/2 h-16 w-16 -translate-y-1/2 sm:h-20 sm:w-20 lg:h-24 lg:w-24"
              style={{
                x: "clamp(120px, 22vw, 238px)",
              }}
              animate={{
                rotate: [0, 24, 0],
                scale: [0.95, 1.05, 0.95],
              }}
              transition={{
                duration: 11,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Image
                src="/images/tomato.png"
                alt="Tomato"
                fill
                sizes="(min-width: 1024px) 96px, (min-width: 640px) 80px, 64px"
                quality={75}
                className="object-contain drop-shadow-[0_18px_24px_rgba(0,0,0,.52)]"
              />
            </motion.div>
          </motion.div>

          {/* ======================================================= */}
          {/* TOMATO ORBIT 2 */}
          {/* ======================================================= */}

          <motion.div
            className="pointer-events-none absolute inset-0 z-20 opacity-[0.82] blur-[0.45px]"
            initial={{ rotate: 286 }}
            animate={{ rotate: 646 }}
            transition={{
              duration: 58,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <motion.div
              className="absolute top-1/2 left-1/2 h-12 w-12 -translate-y-1/2 sm:h-16 sm:w-16 lg:h-[72px] lg:w-[72px]"
              style={{
                x: "clamp(142px, 26vw, 282px)",
              }}
              animate={{
                rotate: [-12, 18, -12],
                scale: [0.94, 1.02, 0.94],
              }}
              transition={{
                duration: 14,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Image
                src="/images/tomato.png"
                alt="Tomato"
                fill
                sizes="(min-width: 1024px) 72px, (min-width: 640px) 64px, 48px"
                quality={75}
                className="object-contain drop-shadow-[0_12px_18px_rgba(0,0,0,.4)]"
              />
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* BOTTOM INFO BAR */}
      {/* ========================================================= */}

      <motion.div
        initial={{
          opacity: 0,
          y: 25,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          delay: 0.5,
        }}
        className="absolute right-8 bottom-8 z-30 hidden items-center gap-8 rounded-full border border-white/10 bg-[#0A0A0A]/50 px-8 py-5 shadow-[0_20px_60px_rgba(0,0,0,.55)] backdrop-blur-xl lg:flex"
      >
        {/* Delivery */}
        <div className="flex items-center gap-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-[#FF4D57]">
            <Clock className="h-4 w-4" />
          </div>

          <div>
            <h4 className="font-bold text-white">
              30 Mins
            </h4>

            <p className="text-xs tracking-widest text-white/50 uppercase">
              Delivery
            </p>
          </div>
        </div>

        <div className="h-8 w-px bg-white/10" />

        {/* Organic */}
        <div className="flex items-center gap-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-green-400">
            <Leaf className="h-4 w-4" />
          </div>

          <div>
            <h4 className="font-bold text-white">
              100%
            </h4>

            <p className="text-xs tracking-widest text-white/50 uppercase">
              Organic
            </p>
          </div>
        </div>

        <div className="h-8 w-px bg-white/10" />

        {/* Healthy Menu */}
        <div className="flex items-center gap-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-orange-400">
            <Flame className="h-4 w-4" />
          </div>

          <div>
            <h4 className="font-bold text-white">
              500+
            </h4>

            <p className="text-xs tracking-widest text-white/50 uppercase">
              Healthy Menu
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
} 