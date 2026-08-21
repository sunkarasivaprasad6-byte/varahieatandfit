import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

import { db } from "./firebase";
import { MenuItem } from "@/types/menu";

const menuRef = collection(db, "menu");

// Get all menu items
export async function getMenu() {
  const snapshot = await getDocs(menuRef);

  return snapshot.docs.map((docItem) => ({
    id: docItem.id,
    ...(docItem.data() as MenuItem),
  }));
}

// Add a new food item
export async function addFood(
  item: Omit<MenuItem, "id">
) {
  return await addDoc(menuRef, item);
}

// Update a food item
export async function updateFood(
  id: string,
  data: Partial<MenuItem> & {
    available?: boolean;
  }
) {
  return await updateDoc(
    doc(db, "menu", id),
    data
  );
}

// Delete a food item
export async function deleteFood(
  id: string
) {
  return await deleteDoc(
    doc(db, "menu", id)
  );
}