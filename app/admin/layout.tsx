"use client";

import { ReactNode, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { usePathname, useRouter } from "next/navigation";

const DEFAULT_ADMIN_EMAILS = ["sunkarasivaprasad6@gmail.com"];

function getAdminEmails() {
  const configured = process.env.NEXT_PUBLIC_ADMIN_EMAILS
    ?.split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return configured?.length ? configured : DEFAULT_ADMIN_EMAILS;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<"checking" | "allowed" | "denied">("checking");

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      if (!user) {
        setState("denied");
        router.replace(`/account?returnTo=${encodeURIComponent(pathname)}`);
        return;
      }

      const email = user.email?.toLowerCase() || "";
      const allowed = getAdminEmails().includes(email);

      if (!allowed) {
        setState("denied");
        router.replace("/");
        return;
      }

      setState("allowed");
    });
  }, [pathname, router]);

  if (state !== "allowed") {
    return (
      <main className="min-h-screen bg-[#050505] grid place-items-center p-6 text-white">
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] px-7 py-6 text-center">
          <p className="text-sm text-white/50">Checking admin access…</p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
