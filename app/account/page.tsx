"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function Account() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(auth.currentUser);
  const [returnTo, setReturnTo] = useState("/my-subscription");
  const [subscriptionId, setSubscriptionId] = useState("");
  const [claimError, setClaimError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const value = params.get("returnTo");
    const pendingId = params.get("subscriptionId") || localStorage.getItem("varahi-pending-subscription-id") || "";
    const pendingPhone = params.get("phone") || localStorage.getItem("varahi-pending-subscription-phone") || "";
    if (value) setReturnTo(value);
    if (pendingId) {
      setSubscriptionId(pendingId);
      setMode("signup");
      if (pendingPhone) setPhone(pendingPhone);
      localStorage.setItem("varahi-pending-subscription-id", pendingId);
      if (pendingPhone) localStorage.setItem("varahi-pending-subscription-phone", pendingPhone);
    }
    return onAuthStateChanged(auth, setUser);
  }, []);

  function safeReturnPath(value: string) {
    return value.startsWith("/") && !value.startsWith("//")
      ? value
      : "/my-subscription";
  }

  async function claimPendingSubscription(currentUser = auth.currentUser) {
    if (!subscriptionId || !currentUser) return;
    const idToken = await currentUser.getIdToken(true);
    const response = await fetch("/api/subscriptions/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ subscriptionId, phone }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error || "Unable to link your subscription to this account.");
    localStorage.removeItem("varahi-pending-subscription-id");
    localStorage.removeItem("varahi-pending-subscription-phone");
  }

  async function submit() {
    setLoading(true);
    setClaimError("");
    try {
      if (mode === "login") {
        const credential = await signInWithEmailAndPassword(auth, email, password);
        await claimPendingSubscription(credential.user);
      } else {
        if (!/^[6-9]\d{9}$/.test(phone)) throw new Error("Enter the same 10-digit phone number used for your subscription.");
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await claimPendingSubscription(credential.user);
      }
      router.push(safeReturnPath(returnTo));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to authenticate";
      setClaimError(message);
    } finally {
      setLoading(false);
    }
  }

  async function continueExistingAccount() {
    setLoading(true);
    setClaimError("");
    try {
      await claimPendingSubscription();
      router.push(safeReturnPath(returnTo));
    } catch (error) {
      setClaimError(error instanceof Error ? error.message : "Unable to link your subscription.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white grid place-items-center p-6">
      <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-white/[0.035] p-8">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#E63946]">Varahi Eat & Fit</p>
        <h1 className="mt-3 text-3xl font-bold">{subscriptionId ? "Create your account" : user ? "Your account" : "Welcome back"}</h1>

        {subscriptionId && <p className="mt-3 text-sm leading-6 text-white/50">Create an account to keep your subscription connected to you and view it after payment verification.</p>}
        {claimError && <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">{claimError}</div>}

        {user && !subscriptionId ? (
          <>
            <p className="mt-3 text-white/45">{user.email}</p>
            <div className="mt-8 grid gap-3">
              <button onClick={() => router.push(safeReturnPath(returnTo))} className="rounded-full bg-[#E63946] py-3 font-bold">Continue</button>
              <button onClick={() => signOut(auth)} className="rounded-full border border-white/10 py-3">Sign out</button>
            </div>
          </>
        ) : (
          <>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="mt-8 w-full rounded-xl border border-white/10 bg-black/25 p-4" />
            {mode === "signup" && <input value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="Mobile number" className="mt-3 w-full rounded-xl border border-white/10 bg-black/25 p-4" />}
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" className="mt-3 w-full rounded-xl border border-white/10 bg-black/25 p-4" />
            <button disabled={loading} onClick={submit} className="mt-5 w-full rounded-full bg-[#E63946] py-3 font-bold">{loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</button>
            <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="mt-5 w-full text-sm text-white/45">{mode === "login" ? "New here? Create an account" : "Already have an account? Sign in"}</button>
            {subscriptionId && user && <button disabled={loading} onClick={continueExistingAccount} className="mt-4 w-full rounded-full border border-white/10 py-3 text-sm font-semibold">Link this subscription</button>}
          </>
        )}
      </div>
    </main>
  );
}
