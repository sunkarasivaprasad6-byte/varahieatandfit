import {
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export type RestaurantStatus =
  | "available"
  | "opening-soon"
  | "closed";

export interface RestaurantStatusData {
  status: RestaurantStatus;
  updatedAt?: number;
}

const STATUS_DOC = doc(
  db,
  "restaurantSettings",
  "status"
);

export const DEFAULT_RESTAURANT_STATUS: RestaurantStatus =
  "available";

export async function getRestaurantStatus(): Promise<RestaurantStatus> {
  try {
    const snapshot = await getDoc(STATUS_DOC);

    if (!snapshot.exists()) {
      return DEFAULT_RESTAURANT_STATUS;
    }

    const data = snapshot.data() as Partial<RestaurantStatusData>;

    if (
      data.status === "available" ||
      data.status === "opening-soon" ||
      data.status === "closed"
    ) {
      return data.status;
    }

    return DEFAULT_RESTAURANT_STATUS;
  } catch (error) {
    console.error(
      "Failed to load restaurant status:",
      error
    );

    return DEFAULT_RESTAURANT_STATUS;
  }
}

export async function updateRestaurantStatus(
  status: RestaurantStatus
) {
  await setDoc(
    STATUS_DOC,
    {
      status,
      updatedAt: Date.now(),
    },
    {
      merge: true,
    }
  );
}