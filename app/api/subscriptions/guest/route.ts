import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { getPlan, DAYS } from "@/lib/subscriptionData";
import { DELIVERY_SLOTS } from "@/lib/deliverySlotService";
import { isSlotEligibleForNewSubscription } from "@/lib/deliverySlotRules";

export const runtime = "nodejs";

function isDeliverySlot(value: unknown): value is (typeof DELIVERY_SLOTS)[number] {
  return typeof value === "string" && DELIVERY_SLOTS.includes(value as (typeof DELIVERY_SLOTS)[number]);
}
function isDay(value: unknown): value is (typeof DAYS)[number] {
  return typeof value === "string" && DAYS.includes(value as (typeof DAYS)[number]);
}
function isValidUpiTransactionId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{6,50}$/.test(value.trim());
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { name?: string; phone?: string; address?: string; location?: string; slot?: string; protein?: number; instructions?: string; planId?: string; day?: string; upiTransactionId?: string; startDate?: string; mealCustomizations?: Record<string, { protein: number }> };
    const name = String(body.name || "").trim();
    const phone = String(body.phone || "").trim();
    const address = String(body.address || "").trim();
    const location = String(body.location || "").trim();
    const instructions = String(body.instructions || "").trim();
    const upiTransactionId = String(body.upiTransactionId || "").trim();
    const startDate = String(body.startDate || "").trim();
    const mealCustomizations = body.mealCustomizations && typeof body.mealCustomizations === "object" ? body.mealCustomizations : {};
    const plan = getPlan(String(body.planId || ""));

    if (name.length < 3) return NextResponse.json({ error: "Enter your full name." }, { status: 400 });
    if (!/^[6-9]\d{9}$/.test(phone)) return NextResponse.json({ error: "Enter a valid 10-digit phone number." }, { status: 400 });
    if (address.length < 10) return NextResponse.json({ error: "Enter your delivery address or detect your location." }, { status: 400 });
    if (!isDeliverySlot(body.slot)) return NextResponse.json({ error: "Please select a delivery slot." }, { status: 400 });
    if (!plan) return NextResponse.json({ error: "Invalid subscription plan." }, { status: 400 });
    if (!isDay(body.day)) return NextResponse.json({ error: "Invalid meal day." }, { status: 400 });
    if (!isValidUpiTransactionId(upiTransactionId)) return NextResponse.json({ error: "Please enter a valid UPI Transaction ID / UTR." }, { status: 400 });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return NextResponse.json({ error: "Please select a valid subscription start date." }, { status: 400 });

    const selectedDate = new Date(`${startDate}T00:00:00`);
    if (Number.isNaN(selectedDate.getTime()) || selectedDate.getDay() === 0) return NextResponse.json({ error: "Subscriptions cannot start on Sunday." }, { status: 400 });
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (selectedDate < today) return NextResponse.json({ error: "Subscription start date cannot be in the past." }, { status: 400 });
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    if (startDate === todayString && !isSlotEligibleForNewSubscription(String(body.slot), new Date(), 30)) return NextResponse.json({ error: "That slot is no longer available for a new subscription today. Please choose another available slot or start tomorrow." }, { status: 400 });

    const meal = plan.meals[body.day.toLowerCase()];
    if (!meal) return NextResponse.json({ error: "Invalid meal selection." }, { status: 400 });
    const protein = Number(body.protein);
    const minProtein = Math.max(0, meal.protein - 2);
    const maxProtein = meal.protein + 6;
    if (!Number.isFinite(protein) || protein < minProtein || protein > maxProtein) return NextResponse.json({ error: `Protein must be between ${minProtein}g and ${maxProtein}g.` }, { status: 400 });

    let userId = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    let guest = true;
    const authorization = request.headers.get("authorization") || "";
    if (authorization.startsWith("Bearer ")) {
      try { const decoded = await adminAuth.verifyIdToken(authorization.slice("Bearer ".length).trim()); userId = decoded.uid; guest = false; } catch {}
    }

    const subscriptionRef = adminDb.collection("subscriptions").doc();
    await subscriptionRef.set({ userId, guest, customerName: name, phone, planId: plan.id, planName: plan.name, amount: plan.price, status: "PENDING_PAYMENT", startDate: selectedDate.toISOString(), endDate: "", deliverySlot: body.slot, deliveryTime: body.slot, address, location, proteinPerMeal: protein, caloriesPerMeal: meal.calories, mealCustomizations, instructions, upiTransactionId, skippedMeals: 0, paymentStatus: "PENDING", createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
    return NextResponse.json({ subscriptionId: subscriptionRef.id, guestId: guest ? userId : null, linkedToAccount: !guest });
  } catch (error) {
    console.error("Failed to create guest subscription:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to submit subscription" }, { status: 500 });
  }
}
