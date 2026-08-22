"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function Account() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(auth.currentUser);

  const returnTo = searchParams.get("returnTo") || "/my-subscription";

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  function safeReturnPath(value: string) {
    return value.startsWith("/") && !value.startsWith("//")
      ? value
      : "/my-subscription";
  }

  async function submit() {
    setLoading(true);
    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      router.push(safeReturnPath(returnTo));
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to authenticate");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white grid place-items-center p-6">
      <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-white/[0.035] p-8">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#E63946]">Varahi Eat & Fit</p>
        <h1 className="mt-3 text-3xl font-bold">{user ? "Your account" : "Welcome back"}</h1>

        {user ? (
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
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" className="mt-3 w-full rounded-xl border border-white/10 bg-black/25 p-4" />
            <button disabled={loading} onClick={submit} className="mt-5 w-full rounded-full bg-[#E63946] py-3 font-bold">{loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</button>
            <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="mt-5 w-full text-sm text-white/45">{mode === "login" ? "New here? Create an account" : "Already have an account? Sign in"}</button>
          </>
        )}
      </div>
    </main>
  );
}
