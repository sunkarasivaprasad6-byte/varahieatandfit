"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function AdminSessionWatcher() {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) return;

      // Keep the server-side HttpOnly session in sync with Firebase logout.
      try {
        await fetch("/api/auth/session", { method: "DELETE" });
      } catch (error) {
        console.error("Failed to clear admin server session:", error);
      }
    });

    return unsubscribe;
  }, []);

  return null;
}
