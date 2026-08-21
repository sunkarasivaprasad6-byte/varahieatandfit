"use client";

export const dynamic = "force-dynamic";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  MessageSquare,
  ShieldCheck,
  LocateFixed,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { DAYS, getPlan } from "@/lib/subscriptionData";
import { createSubscriptionDraft } from "@/lib/subscriptionService";
import { toast } from "react-hot-toast";

const steps = [
  "Delivery time",
  "Customize meal",
  "Instructions",
  "Address",
  "Review",
  "Payment",
];

export default function SubscriptionCheckoutPage() {
  return (
    <Suspense fallback={null}>
      <SubscriptionCheckoutContent />
    </Suspense>
  );
}

function SubscriptionCheckoutContent() {
  const params = useSearchParams();

  const plan = getPlan(params.get("plan") || "silver");

  const [step, setStep] = useState(0);
  const [day, setDay] = useState<(typeof DAYS)[number]>("MON");

  const [userId, setUserId] = useState<string | null>(null);

  const [deliveryTime, setDeliveryTime] = useState(
    "5:00 PM – 6:00 PM"
  );

  const [protein, setProtein] = useState(30);
  const [calories, setCalories] = useState(400);

  const [instructions, setInstructions] = useState("");

  /*
   * This stores either:
   *
   * 1. A manually entered address
   *
   * OR
   *
   * 2. A Google Maps URL generated from the customer's
   *    browser location.
   */
  const [address, setAddress] = useState("");

  const [locationDetected, setLocationDetected] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const [loading, setLoading] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUserId(u?.uid || null);
    });
  }, []);

  const meal = useMemo(() => {
    if (!plan) return null;

    return plan.meals[
      day.toLowerCase() as keyof typeof plan.meals
    ];
  }, [plan, day]);

  if (!plan || !meal) return null;

  /*
   * ---------------------------------------------------------
   * DETECT CUSTOMER LOCATION
   * ---------------------------------------------------------
   *
   * No Google Maps API is required here.
   *
   * Browser GPS:
   *
   * navigator.geolocation
   *
   * gives us:
   *
   * latitude
   * longitude
   *
   * Then we create:
   *
   * https://www.google.com/maps?q=LATITUDE,LONGITUDE
   *
   * Example:
   *
   * https://www.google.com/maps?q=13.6288,79.4192
   *
   * That link is saved in the address field.
   */
  function detectLocation() {
    if (!navigator.geolocation) {
      toast.error(
        "Location detection is not supported by your browser."
      );
      return;
    }

    setDetectingLocation(true);

    toast.loading("Detecting your location...", {
      id: "detect-location",
    });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        const googleMapsLink =
          `https://www.google.com/maps?q=${latitude},${longitude}`;

        setAddress(googleMapsLink);
        setLocationDetected(true);
        setDetectingLocation(false);

        toast.success("Your location has been detected!", {
          id: "detect-location",
        });
      },

      (error) => {
        console.error("Location error:", error);

        setDetectingLocation(false);

        let message =
          "Unable to detect your location.";

        if (error.code === 1) {
          message =
            "Location permission was denied. Please allow location access.";
        }

        if (error.code === 2) {
          message =
            "Your location could not be determined. Please try again.";
        }

        if (error.code === 3) {
          message =
            "Location detection timed out. Please try again.";
        }

        toast.error(message, {
          id: "detect-location",
        });
      },

      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  /*
   * ---------------------------------------------------------
   * CHECK WHETHER ADDRESS IS A GOOGLE MAPS LOCATION LINK
   * ---------------------------------------------------------
   */
  const isGoogleMapsLocation =
    address.startsWith("https://www.google.com/maps?q=");

  /*
   * ---------------------------------------------------------
   * CONTINUE
   * ---------------------------------------------------------
   */
  async function continueStep() {
    if (step === 0 && !deliveryTime) {
      toast.error("Choose a delivery time");
      return;
    }

    if (step === 3 && address.trim().length < 10) {
      toast.error("Enter your delivery address or detect your location");
      return;
    }

    if (step < 4) {
      setStep(step + 1);
      return;
    }

    if (step === 4) {
      setStep(5);
      return;
    }

    if (step === 5) {
      startPayment();
    }
  }

  /*
   * ---------------------------------------------------------
   * PAYMENT
   * ---------------------------------------------------------
   */
  async function startPayment() {
    if (!userId) {
      toast.error("Please sign in before payment");
      return;
    }

    if (!plan) {
      toast.error("Please choose a valid subscription plan");
      return;
    }

    setLoading(true);

    try {
      const start = new Date();
      const end = new Date();

      end.setDate(start.getDate() + 6);

      const id = await createSubscriptionDraft({
        userId,
        planId: plan.id,
        planName: plan.name,
        amount: plan.price,
        status: "PENDING_PAYMENT",
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        deliveryTime,
        address,
        proteinPerMeal: protein,
        caloriesPerMeal: calories,
        instructions,
        skippedMeals: 0,
      });

      setDraftId(id);

      const res = await fetch(
        "/api/cashfree/create-order",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: plan.price,
            customerId: userId,
            customerName:
              auth.currentUser?.displayName ||
              "Customer",
            customerPhone:
              auth.currentUser?.phoneNumber ||
              "9999999999",
            subscriptionId: id,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "Unable to create payment"
        );
      }

      /*
       * Demo mode
       */
      if (data.demo) {
        toast.success(
          "Subscription draft created. Add Cashfree keys to enable payment."
        );

        window.location.href =
          `/my-subscription?pending=${id}`;

        return;
      }

      /*
       * Cashfree SDK
       */
      const script = document.createElement("script");

      script.src =
        "https://sdk.cashfree.com/js/v3/cashfree.js";

      script.onload = () => {
        // @ts-ignore Cashfree global SDK
        const cashfree = window.Cashfree({
          mode: data.mode || "sandbox",
        });

        cashfree.checkout({
          paymentSessionId: data.paymentSessionId,
          redirectTarget: "_self",
        });
      };

      document.body.appendChild(script);
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : "Payment setup failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050505] px-5 pb-20 pt-28 text-white">
      <div className="mx-auto max-w-6xl">

        {/* BACK TO PLANS */}
        <Link
          href="/subscriptions"
          className="mb-8 inline-flex items-center gap-2 text-sm text-white/45 transition hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
          Plans
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">

          {/* =====================================================
              LEFT SIDE
          ===================================================== */}
          <section>

            {/* STEPS */}
            <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-2">
              {steps.map((s, i) => (
                <div
                  key={s}
                  className="flex min-w-max items-center gap-2 text-xs"
                >
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full ${
                      i < step
                        ? "bg-[#E63946] text-white"
                        : i === step
                        ? "border border-[#E63946] text-[#E63946]"
                        : "border border-white/10 text-white/30"
                    }`}
                  >
                    {i < step ? "✓" : i + 1}
                  </span>

                  <span
                    className={
                      i === step
                        ? "text-white"
                        : "text-white/30"
                    }
                  >
                    {s}
                  </span>

                  {i < steps.length - 1 && (
                    <span className="mx-1 text-white/15">
                      —
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* CHECKOUT CARD */}
            <div className="rounded-[32px] border border-white/10 bg-white/[0.035] p-6 sm:p-9">

              {/* STEP LABEL */}
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#E63946]">
                {steps[step]}
              </p>

              {/* =================================================
                  STEP 0 — DELIVERY TIME
              ================================================= */}
              {step === 0 && (
                <>
                  <h1 className="mt-3 text-3xl font-bold">
                    When should we deliver?
                  </h1>

                  <div className="mt-8 grid gap-3 sm:grid-cols-3">
                    {[
                      "5:00 PM – 6:00 PM",
                      "6:00 PM – 7:00 PM",
                      "7:00 PM – 8:00 PM",
                    ].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() =>
                          setDeliveryTime(t)
                        }
                        className={`rounded-2xl border p-5 text-left transition ${
                          deliveryTime === t
                            ? "border-[#E63946] bg-[#E63946]/10"
                            : "border-white/10 bg-black/20 hover:border-white/20"
                        }`}
                      >
                        <Clock className="mb-3 h-5 w-5 text-[#E63946]" />

                        <span className="text-sm">
                          {t}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* =================================================
                  STEP 1 — CUSTOMIZE MEAL
              ================================================= */}
              {step === 1 && (
                <>
                  <h1 className="mt-3 text-3xl font-bold">
                    Customize each meal
                  </h1>

                  <div className="mt-7 flex gap-2 overflow-x-auto">
                    {DAYS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDay(d)}
                        className={`rounded-full px-5 py-2 text-xs font-bold transition ${
                          day === d
                            ? "bg-[#E63946] text-white"
                            : "bg-white/5 text-white/50 hover:bg-white/10"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>

                  <div className="mt-6 grid gap-6 sm:grid-cols-[180px_1fr]">

                    <div className="relative h-44 overflow-hidden rounded-2xl">
                      <Image
                        src={meal.image}
                        alt={meal.name}
                        fill
                        className="object-cover"
                        sizes="180px"
                      />
                    </div>

                    <div>
                      <h2 className="text-xl font-bold">
                        {meal.name}
                      </h2>

                      <p className="mt-2 text-sm text-white/45">
                        Default: {meal.protein}g
                        protein · {meal.calories} kcal
                      </p>

                      <div className="mt-5 grid grid-cols-2 gap-3">

                        <label className="text-xs text-white/45">
                          Protein / meal

                          <input
                            type="number"
                            min="10"
                            max="100"
                            value={protein}
                            onChange={(e) =>
                              setProtein(
                                Number(e.target.value)
                              )
                            }
                            className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 p-3 text-white outline-none focus:border-[#E63946]"
                          />
                        </label>

                        <label className="text-xs text-white/45">
                          Calories / meal

                          <input
                            type="number"
                            min="150"
                            max="1200"
                            value={calories}
                            onChange={(e) =>
                              setCalories(
                                Number(e.target.value)
                              )
                            }
                            className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 p-3 text-white outline-none focus:border-[#E63946]"
                          />
                        </label>

                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* =================================================
                  STEP 2 — INSTRUCTIONS
              ================================================= */}
              {step === 2 && (
                <>
                  <h1 className="mt-3 text-3xl font-bold">
                    Any special instructions?
                  </h1>

                  <div className="mt-8">
                    <MessageSquare className="mb-3 h-5 w-5 text-[#E63946]" />

                    <textarea
                      value={instructions}
                      onChange={(e) =>
                        setInstructions(e.target.value)
                      }
                      placeholder="Less spicy, no onion, etc."
                      className="min-h-40 w-full rounded-2xl border border-white/10 bg-black/25 p-5 text-white outline-none placeholder:text-white/25 focus:border-[#E63946]"
                    />
                  </div>
                </>
              )}

              {/* =================================================
                  STEP 3 — LOCATION
              ================================================= */}
              {step === 3 && (
                <>
                  <h1 className="mt-3 text-3xl font-bold">
                    Where should we deliver?
                  </h1>

                  <p className="mt-2 text-sm text-white/40">
                    Enter your address manually or use your
                    current location.
                  </p>

                  <div className="mt-8">

                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-[#E63946]" />

                        <span className="text-sm font-medium text-white/70">
                          Delivery location
                        </span>
                      </div>

                      {locationDetected && (
                        <div className="flex items-center gap-1 text-xs text-green-400">
                          <CheckCircle2 className="h-4 w-4" />
                          Location detected
                        </div>
                      )}
                    </div>

                    {/* LOCATION BOX */}
                    <div
                      className={`rounded-2xl border bg-black/25 transition ${
                        locationDetected
                          ? "border-green-500/30"
                          : "border-white/10 focus-within:border-[#E63946]"
                      }`}
                    >
                      <textarea
                        value={address}
                        onChange={(e) => {
                          setAddress(e.target.value);
                          setLocationDetected(false);
                        }}
                        placeholder="Enter your full delivery address..."
                        className="min-h-36 w-full resize-none bg-transparent p-5 text-white outline-none placeholder:text-white/25"
                      />

                      {/* GOOGLE MAP LINK PREVIEW */}
                      {isGoogleMapsLocation && (
                        <div className="mx-4 mb-4 rounded-xl border border-white/10 bg-white/[0.035] p-4">

                          <div className="flex items-start gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E63946]/10">
                              <MapPin className="h-5 w-5 text-[#E63946]" />
                            </div>

                            <div className="min-w-0 flex-1">

                              <p className="text-sm font-semibold text-white">
                                Current location detected
                              </p>

                              <p className="mt-1 break-all text-xs text-white/35">
                                Your Google Maps location link has been saved.
                              </p>

                              <a
                                href={address}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-[#E63946] hover:underline"
                              >
                                View location in Google Maps
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>

                            </div>

                          </div>
                        </div>
                      )}
                    </div>

                    {/* DETECT BUTTON */}
                    <button
                      type="button"
                      onClick={detectLocation}
                      disabled={detectingLocation}
                      className="mt-4 flex w-full items-center justify-center gap-3 rounded-2xl border border-[#E63946]/40 bg-[#E63946]/10 px-5 py-4 text-sm font-bold text-[#E63946] transition hover:bg-[#E63946]/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <LocateFixed className="h-5 w-5" />

                      {detectingLocation
                        ? "Detecting your location..."
                        : locationDetected
                        ? "Detect My Location Again"
                        : "Detect My Location"}
                    </button>

                    <p className="mt-3 text-center text-xs leading-5 text-white/30">
                      Your browser will ask for permission to
                      access your current location.
                    </p>

                  </div>
                </>
              )}

              {/* =================================================
                  STEP 4 — REVIEW
              ================================================= */}
              {step === 4 && (
                <>
                  <h1 className="mt-3 text-3xl font-bold">
                    Review your subscription
                  </h1>

                  <div className="mt-8 space-y-4 text-sm text-white/60">

                    <p>
                      <b className="text-white">
                        Plan:
                      </b>{" "}
                      {plan.name} · ₹{plan.price}/week
                    </p>

                    <p>
                      <b className="text-white">
                        Delivery:
                      </b>{" "}
                      {deliveryTime}
                    </p>

                    <p>
                      <b className="text-white">
                        Nutrition:
                      </b>{" "}
                      {protein}g protein ·{" "}
                      {calories} kcal per meal
                    </p>

                    <div>
                      <b className="text-white">
                        Address:
                      </b>

                      {isGoogleMapsLocation ? (
                        <div className="mt-2 rounded-xl border border-green-500/20 bg-green-500/5 p-4">

                          <div className="flex items-center gap-2 text-green-400">
                            <CheckCircle2 className="h-4 w-4" />

                            <span>
                              Current location detected
                            </span>
                          </div>

                          <a
                            href={address}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-2 text-xs text-[#E63946] hover:underline"
                          >
                            Open Google Maps location
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>

                        </div>
                      ) : (
                        <p className="mt-2 text-white/50">
                          {address}
                        </p>
                      )}
                    </div>

                    <p>
                      <b className="text-white">
                        Instructions:
                      </b>{" "}
                      {instructions || "None"}
                    </p>

                  </div>
                </>
              )}

              {/* =================================================
                  STEP 5 — PAYMENT
              ================================================= */}
              {step === 5 && (
                <>
                  <h1 className="mt-3 text-3xl font-bold">
                    Secure payment
                  </h1>

                  <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-6">

                    <div className="flex items-center gap-3 text-sm text-white/65">
                      <ShieldCheck className="h-5 w-5 text-green-400" />

                      One-time payment · ₹{plan.price}
                    </div>

                    <p className="mt-4 text-sm leading-6 text-white/35">
                      You'll be securely redirected to
                      Cashfree Checkout. Your subscription
                      activates only after confirmed payment.
                    </p>

                  </div>
                </>
              )}

              {/* =================================================
                  NAVIGATION
              ================================================= */}
              <div className="mt-10 flex justify-between gap-3">

                <button
                  type="button"
                  disabled={step === 0}
                  onClick={() =>
                    setStep(Math.max(0, step - 1))
                  }
                  className="rounded-full border border-white/10 px-6 py-3 text-sm transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-20"
                >
                  Back
                </button>

                <button
                  type="button"
                  disabled={loading || detectingLocation}
                  onClick={continueStep}
                  className="inline-flex items-center gap-2 rounded-full bg-[#E63946] px-7 py-3 text-sm font-bold transition hover:bg-[#ef4654] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? "Preparing..."
                    : step === 5
                    ? `Pay ₹${plan.price}`
                    : "Continue"}

                  {step < 5 && (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>

              </div>

            </div>
          </section>

          {/* =====================================================
              RIGHT SIDE — SUMMARY
          ===================================================== */}
          <aside className="h-fit rounded-[28px] border border-white/10 bg-[#0D0B0B] p-6">

            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#E63946]">
              Summary
            </p>

            <h2 className="mt-3 text-2xl font-bold">
              {plan.name} Plan
            </h2>

            <p className="mt-1 text-sm text-white/40">
              7-day nutrition plan
            </p>

            <div className="my-7 border-y border-white/10 py-5">

              <div className="flex justify-between text-sm">
                <span className="text-white/45">
                  Weekly total
                </span>

                <b>
                  ₹{plan.price}
                </b>
              </div>

              <div className="mt-3 flex justify-between text-sm">
                <span className="text-white/45">
                  Delivery
                </span>

                <span>
                  {deliveryTime}
                </span>
              </div>

              {locationDetected && (
                <div className="mt-4 flex items-center gap-2 text-xs text-green-400">
                  <CheckCircle2 className="h-4 w-4" />

                  Location detected
                </div>
              )}

            </div>

            <p className="text-xs leading-5 text-white/35">
              Your selections are saved with the subscription
              draft and finalized after payment confirmation.
            </p>

          </aside>

        </div>
      </div>
    </main>
  );
}
