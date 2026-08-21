import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

import { db } from "./firebase";
import { Offer } from "@/types/offer";

const offersRef = collection(db, "offers");

// Get all offers
export async function getOffers(): Promise<Offer[]> {
  const snapshot = await getDocs(offersRef);

  const offers = snapshot.docs.map((offerDoc) => ({
    id: offerDoc.id,
    ...(offerDoc.data() as Omit<Offer, "id">),
  }));

  // Sort safely by createdAt
  return offers.sort(
    (a, b) =>
      (b.createdAt ?? 0) -
      (a.createdAt ?? 0)
  );
}

// Add a new offer
export async function addOffer(
  offer: Omit<Offer, "id" | "createdAt">
) {
  return await addDoc(offersRef, {
    ...offer,
    createdAt: Date.now(),
  });
}

// Update an offer
export async function updateOffer(
  id: string,
  data: Partial<Offer>
) {
  return await updateDoc(
    doc(db, "offers", id),
    data
  );
}

// Delete an offer
export async function deleteOffer(
  id: string
) {
  return await deleteDoc(
    doc(db, "offers", id)
  );
}