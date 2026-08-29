"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

function getSafeRedirect() {
  if (typeof window === "undefined") return "/admin";
  const value = new URLSearchParams(window.location.search).get("redirect");
  return value && value.startsWith("/admin/") || value === "/admin" ? value : "/admin";
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function login() {
    try {
      setLoading(true);
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await credential.user.getIdToken(true);

      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        await auth.signOut();
        throw new Error("Unable to create admin session");
      }

      // The server may have just assigned the admin custom claim. Force a
      // fresh ID token so Firestore Security Rules see admin == true now.
      await credential.user.getIdToken(true);

      router.replace(getSafeRedirect());
      router.refresh();
    } catch (error) {
      alert(error instanceof Error && error.message.includes("Admin access")
        ? "This account is not authorized for admin access."
        : "Invalid Email or Password");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0F0F10]">
      <div className="bg-[#171717] p-10 rounded-3xl w-[420px]">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">Admin Login</h1>
        <input type="email" placeholder="Email" className="w-full p-4 rounded-xl bg-[#252525] text-white mb-5" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" className="w-full p-4 rounded-xl bg-[#252525] text-white mb-8" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button onClick={login} disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white p-4 rounded-xl font-bold">
          {loading ? "Logging in..." : "Login"}
        </button>
      </div>
    </main>
  );
}
