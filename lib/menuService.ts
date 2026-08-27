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

// Categories that belong to the current Varahi Eat & Fit menu.
// Legacy categories (for example old biryani/rice items) are not shown.
const allowedCategories = new Set([
  "Salads",
  "Rolls",
  "Protein",
  "Protein Shakes",
  "Soups",
  "Herbal Tea",
  "Tea",
  "Fruit Juices",
  "Veg Juices",
  "Leafy Juices",
]);

// Nutrition from the supplied Varahi menu.
// Juice intentionally contributes no nutrition to subscription totals.
const nutritionByName: Record<
  string,
  { calories: number; protein: string; category?: string }
> = {
  "Sprout Salad": { calories: 113, protein: "6g" },
  "Lean Chicken Salad": { calories: 185, protein: "32g" },
  "Fruit Salad": { calories: 0, protein: "0g" },
  "Veg Salad": { calories: 115, protein: "8g" },
  "Corn Salad": { calories: 95, protein: "7g" },
  "Paneer Salad": { calories: 185, protein: "12g" },
  "Egg Salad": { calories: 260, protein: "23g" },
  "Chicken Protein Salad": { calories: 220, protein: "37g" },
  "Veg Roll": { calories: 160, protein: "11g" },
  "Egg Roll": { calories: 302, protein: "17g" },
  "Chicken Roll": { calories: 320, protein: "26g" },
  "Chicken + Egg Roll": { calories: 392, protein: "33g" },
  "Boiled Egg": { calories: 70, protein: "6g" },
  "Paneer Roll": { calories: 350, protein: "20g" },
  "Gold Standard Whey Protein": {
    calories: 1080,
    protein: "55g",
    category: "Protein Shakes",
  },
  "MB Biozyme Whey Protein": {
    calories: 1080,
    protein: "55g",
    category: "Protein Shakes",
  },
};

function normalizeMenuItem(item: MenuItem): MenuItem {
  const nutrition = nutritionByName[item.name];

  return {
    ...item,
    ...(nutrition
      ? {
          calories: nutrition.calories,
          protein: nutrition.protein,
          ...(nutrition.category
            ? { category: nutrition.category }
            : {}),
        }
      : {}),
  };
}

// Get all current menu items, excluding legacy categories and normalizing
// the items whose nutrition is defined by the supplied Varahi menu.
export async function getMenu() {
  const snapshot = await getDocs(menuRef);

  return snapshot.docs
    .map((docItem) =>
      normalizeMenuItem({
        id: docItem.id,
        ...(docItem.data() as MenuItem),
      })
    )
    .filter((item) => allowedCategories.has(item.category));
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
