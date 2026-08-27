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

// Only categories represented in the current Varahi Eat & Fit menu are
// exposed to customers. Legacy categories are intentionally hidden.
const allowedCategories = new Set([
  "Salads",
  "Rolls",
  "Protein Shakes",
  "Soups",
  "Tea",
  "Fruit Juices",
  "Veg Juices",
  "Leafy Juices",
]);

// Nutrition from the supplied Varahi menu. Where the supplied menu did not
// provide a value, the estimate below is intentionally approximate.
// Juice intentionally contributes no nutrition to subscription totals.
const nutritionByName: Record<
  string,
  { calories: number; protein: string; category?: string }
> = {
  "Sprout Salad": { calories: 113, protein: "6g" },
  "Lean Chicken Salad": { calories: 185, protein: "32g" },
  "Fruit Salad": { calories: 120, protein: "2g" },
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

// Approximate values for menu items not individually listed in the supplied
// nutrition image. These are display estimates only.
function estimateNutrition(item: MenuItem): { calories: number; protein: string } {
  const name = item.name.toLowerCase();
  const category = item.category.toLowerCase();

  if (category.includes("juice")) return { calories: 0, protein: "0g" };
  if (category === "tea" || name.includes("tea")) return { calories: 60, protein: "2g" };
  if (category === "soups" || name.includes("soup")) return { calories: 150, protein: "7g" };
  if (category === "salads" || name.includes("salad")) return { calories: 150, protein: "8g" };
  if (category === "rolls" || name.includes("roll")) return { calories: 280, protein: "15g" };
  if (category === "protein shakes" || name.includes("whey") || name.includes("protein shake")) {
    return { calories: 1080, protein: "55g" };
  }

  return { calories: 200, protein: "8g" };
}

// These two products are part of the supplied menu's final Protein section.
// They are provided as customer-facing fallbacks so they still appear when
// the Firebase menu collection has not yet been seeded with those records.
const proteinShakeFallbacks: MenuItem[] = [
  {
    id: "protein-gold-standard-whey",
    name: "Gold Standard Whey Protein",
    description: "Gold Standard whey protein shake",
    category: "Protein Shakes",
    price: 89,
    image: "/menu/protein-shake.svg",
    rating: 4.8,
    calories: 1080,
    protein: "55g",
    isVegetarian: true,
  },
  {
    id: "protein-mb-biozyme-whey",
    name: "MB Biozyme Whey Protein",
    description: "MB Biozyme whey protein shake",
    category: "Protein Shakes",
    price: 99,
    image: "/menu/protein-shake.svg",
    rating: 4.8,
    calories: 1080,
    protein: "55g",
    isVegetarian: true,
  },
];

function normalizeMenuItem(item: MenuItem): MenuItem {
  const nutrition = nutritionByName[item.name];
  const estimated = nutrition ?? estimateNutrition(item);

  return {
    ...item,
    calories: estimated.calories,
    protein: estimated.protein,
    ...(nutrition?.category ? { category: nutrition.category } : {}),
  };
}

// Get current customer-facing menu items, excluding legacy categories and
// normalizing nutrition/category values defined by the supplied menu.
export async function getMenu() {
  const snapshot = await getDocs(menuRef);

  const firebaseItems = snapshot.docs
    .map((docItem) =>
      normalizeMenuItem({
        id: docItem.id,
        ...(docItem.data() as MenuItem),
      })
    )
    .filter((item) => allowedCategories.has(item.category));

  const existingNames = new Set(firebaseItems.map((item) => item.name));
  const missingProteinShakes = proteinShakeFallbacks.filter(
    (item) => !existingNames.has(item.name)
  );

  return [...firebaseItems, ...missingProteinShakes];
}

// Add a new food item
export async function addFood(item: Omit<MenuItem, "id">) {
  return await addDoc(menuRef, item);
}

// Update a food item
export async function updateFood(
  id: string,
  data: Partial<MenuItem> & { available?: boolean }
) {
  return await updateDoc(doc(db, "menu", id), data);
}

// Delete a food item
export async function deleteFood(id: string) {
  return await deleteDoc(doc(db, "menu", id));
}
