import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth } from "@/lib/firebaseAdmin";

const SESSION_COOKIE = "admin_session";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sessionCookie) {
    redirect("/login");
  }

  try {
    // Server-side protection: no admin page is rendered until the
    // HttpOnly Firebase session cookie has been verified.
    await adminAuth.verifySessionCookie(sessionCookie, true);
  } catch {
    redirect("/login");
  }

  return children;
}
