"use client";

import { useEffect, useState } from "react";
import { getRestaurantStatus, type RestaurantStatus } from "./restaurantStatusService";

export default function RestaurantAvailabilityBanner() {
  const [status, setStatus] = useState<RestaurantStatus>("available");
  useEffect(() => { getRestaurantStatus().then(setStatus); }, []);
  if (status === "available") return null;
  const opening = status === "opening-soon";
  return <div className={`mx-auto max-w-7xl px-5 pt-5 sm:px-8 ${opening ? "text-yellow-300" : "text-red-300"}`}><div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-center text-sm"><b>{opening ? "Restaurant Opening Soon" : "Restaurant Currently Closed"}</b><span className="ml-2 text-white/50">Normal menu ordering is unavailable right now. Subscription plans are still available.</span></div></div>;
}
