"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  XCircle,
} from "lucide-react";

import {
  getRestaurantStatus,
  updateRestaurantStatus,
  RestaurantStatus,
} from "@/components/RestaurantStatus/restaurantStatusService";

export default function RestaurantStatusAdminPage() {
  const [status, setStatus] =
    useState<RestaurantStatus>("available");

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      const currentStatus =
        await getRestaurantStatus();

      setStatus(currentStatus);
      setLoading(false);
    };

    load();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage("");

      await updateRestaurantStatus(status);

      setMessage("Restaurant status updated successfully.");
    } catch (error) {
      console.error(error);

      setMessage(
        "Failed to update restaurant status."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        Loading restaurant status...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-10">
      <div className="mx-auto max-w-3xl">

        <h1 className="text-3xl font-bold">
          Restaurant Status
        </h1>

        <p className="mt-2 text-white/50">
          Control the status displayed on the customer
          website.
        </p>

        <div className="mt-8 grid gap-4">

          {/* AVAILABLE */}
          <button
            type="button"
            onClick={() => setStatus("available")}
            className={`flex items-center gap-4 rounded-2xl border p-5 text-left transition ${
              status === "available"
                ? "border-green-400/50 bg-green-400/10"
                : "border-white/10 bg-white/5 hover:bg-white/10"
            }`}
          >
            <CheckCircle2 className="h-7 w-7 text-green-400" />

            <div>
              <h2 className="font-bold text-green-400">
                Available
              </h2>

              <p className="mt-1 text-sm text-white/50">
                Restaurant is currently accepting orders.
              </p>
            </div>
          </button>

          {/* OPENING SOON */}
          <button
            type="button"
            onClick={() =>
              setStatus("opening-soon")
            }
            className={`flex items-center gap-4 rounded-2xl border p-5 text-left transition ${
              status === "opening-soon"
                ? "border-yellow-400/50 bg-yellow-400/10"
                : "border-white/10 bg-white/5 hover:bg-white/10"
            }`}
          >
            <Clock3 className="h-7 w-7 text-yellow-400" />

            <div>
              <h2 className="font-bold text-yellow-400">
                Opening Soon
              </h2>

              <p className="mt-1 text-sm text-white/50">
                Restaurant will be available soon.
              </p>
            </div>
          </button>

          {/* CLOSED */}
          <button
            type="button"
            onClick={() => setStatus("closed")}
            className={`flex items-center gap-4 rounded-2xl border p-5 text-left transition ${
              status === "closed"
                ? "border-red-400/50 bg-red-400/10"
                : "border-white/10 bg-white/5 hover:bg-white/10"
            }`}
          >
            <XCircle className="h-7 w-7 text-red-400" />

            <div>
              <h2 className="font-bold text-red-400">
                Closed
              </h2>

              <p className="mt-1 text-sm text-white/50">
                Restaurant is currently closed.
              </p>
            </div>
          </button>

        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="mt-8 w-full rounded-2xl bg-[#E63946] px-6 py-4 font-bold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Status"}
        </button>

        {message && (
          <p className="mt-4 text-center text-sm text-white/60">
            {message}
          </p>
        )}

      </div>
    </div>
  );
}