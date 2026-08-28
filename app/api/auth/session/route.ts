import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";

const SESSION_COOKIE = "admin_session";
const EXPIRES_IN = 1000 * 60 * 60 * 24 * 5; // 5 days

function configuredAdminEmails() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const idToken = typeof body?.idToken === "string" ? body.idToken : "";
    if (!idToken) return NextResponse.json({ error: "Missing ID token" }, { status: 400 });

    const decoded = await adminAuth.verifyIdToken(idToken);
    const authTime = Number(decoded.auth_time ?? 0);
    const now = Math.floor(Date.now() / 1000);
    const email = typeof decoded.email === "string" ? decoded.email.toLowerCase() : "";
    const allowedAdmins = configuredAdminEmails();

    if (!email || allowedAdmins.length === 0 || !allowedAdmins.includes(email)) {
      return NextResponse.json({ error: "Admin access is not enabled for this account" }, { status: 403 });
    }
    if (!authTime || now - authTime > 5 * 60) {
      return NextResponse.json({ error: "Recent sign-in required" }, { status: 401 });
    }

    if (decoded.admin !== true) {
      const user = await adminAuth.getUser(decoded.uid);
      await adminAuth.setCustomUserClaims(decoded.uid, { ...(user.customClaims || {}), admin: true });
    }

    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn: EXPIRES_IN });
    const response = NextResponse.json({ ok: true });
    response.cookies.set({
      name: SESSION_COOKIE,
      value: sessionCookie,
      maxAge: EXPIRES_IN / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("Failed to create admin session:", error);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  return response;
}
