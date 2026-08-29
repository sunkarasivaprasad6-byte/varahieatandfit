import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebaseAdmin";
import { confirmSubscriptionFromAdmin } from "@/lib/subscriptionAdminService";

const SESSION_COOKIE = "admin_session";

function configuredAdminEmails() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

async function requireAdmin() {
  const sessionCookie = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!sessionCookie) throw new Error("Unauthorized");
  const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
  const email = typeof decoded.email === "string" ? decoded.email.toLowerCase() : "";
  const allowedAdmins = configuredAdminEmails();
  if (decoded.admin !== true || !email || allowedAdmins.length === 0 || !allowedAdmins.includes(email)) {
    throw new Error("Forbidden");
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json().catch(() => ({}));
    const subscriptionId = typeof body?.subscriptionId === "string" ? body.subscriptionId.trim() : "";
    if (!subscriptionId) return NextResponse.json({ error: "Subscription ID is required" }, { status: 400 });

    const result = await confirmSubscriptionFromAdmin(subscriptionId);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to confirm subscription";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
