"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  XCircle,
} from "lucide-react";

import {
  doc,
  onSnapshot,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import {
  RestaurantStatus as RestaurantStatusType,
} from "./restaurantStatusService";

interface RestaurantStatusProps {
  className?: string;
}

const statusConfig = {
  available: {
    label: "AVAILABLE",
    icon: CheckCircle2,
    className:
      "border-green-400/20 bg-green-400/10 text-green-400",
  },

  "opening-soon": {
    label: "OPENING SOON",
    icon: Clock3,
    className:
      "border-yellow-400/20 bg-yellow-400/10 text-yellow-400",
  },

  closed: {
    label: "CLOSED",
    icon: XCircle,
    className:
      "border-red-400/20 bg-red-400/10 text-red-400",
  },
};

export default function RestaurantStatus({
  className = "",
}: RestaurantStatusProps) {
  const [status, setStatus] =
    useState<RestaurantStatusType>("available");

  useEffect(() => {
    const statusRef = doc(
      db,
      "restaurantSettings",
      "status"
    );

    const unsubscribe = onSnapshot(
      statusRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setStatus("available");
          return;
        }

        const data = snapshot.data();

        if (
          data.status === "available" ||
          data.status === "opening-soon" ||
          data.status === "closed"
        ) {
          setStatus(data.status);
        }
      },
      (error) => {
        console.error(
          "Restaurant status listener error:",
          error
        );
      }
    );

    return () => unsubscribe();
  }, []);

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={`
  inline-flex
  items-center
  gap-1.5
  rounded-full
  border
  px-2.5
  py-1.5
  sm:px-3
  sm:py-2
  backdrop-blur-xl
  shadow-lg
  ${config.className}
  ${className}
`}
    >
      <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />

      <span className="text-[8px] sm:text-[10px] font-bold tracking-[0.1em] sm:tracking-[0.15em] whitespace-nowrap">
        {config.label}
      </span>
    </div>
  );
}