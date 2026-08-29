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

const allowedCategories = new Set([
  "Salads",
  "Rolls",
  "Protein Shakes",
  "Protein",
  "Soups",
  "Tea",
  "Herbal Tea",
  "Fruit Juices",
  "Veg Juices",
  "Leafy Juices",
]);

// Only verified nutrition supplied for this menu is displayed.
// Missing values are deliberately omitted from Firestore writes.
const nutritionByName: Record<
  string,
  { calories: number; protein: string; category?: string }
> = {
  "sprout salad": { calories: 113, protein: "6g" },
  "lean chicken salad": { calories: 185, protein: "32g" },
  "veg salad": { calories: 115, protein: "8g" },
  "corn salad": { calories: 95, protein: "7g" },
  "paneer salad": { calories: 185, protein: "12g" },
  "egg salad": { calories: 260, protein: "23g" },
  "chicken protein salad": { calories: 220, protein: "37g" },
  "veg roll": { calories: 160, protein: "11g" },
  "egg roll": { calories: 302, protein: "17g" },
  "chicken roll": { calories: 320, protein: "26g" },
  "chicken + egg roll": { calories: 392, protein: "33g" },
  "boiled egg": { calories: 70, protein: "6g" },
};

function normalizeMenuItem(item: MenuItem): MenuItem {
  const nutrition = nutritionByName[item.name.trim().toLowerCase()];
  const category = item.category === "Protein Shakes" ? "Protein Shakes" : item.category;

  return {
    ...item,
    ...(nutrition
      ? {
          calories: nutrition.calories,
          protein: nutrition.protein,
        }
      : {}),
    category: nutrition?.category ?? category,
  };
}

const proteinShakeFallbacks: MenuItem[] = [
  {
    id: "protein-gold-standard-whey",
    name: "Gold Standard Whey Protein",
    description: "Gold Standard whey protein shake",
    category: "Protein Shakes",
    price: 89,
    image: "/menu/protein-shake.svg",
    rating: 4.8,
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
    isVegetarian: true,
  },
];

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

/**
 * Firestore does not accept undefined field values.
 * Keep the existing UI/data model, but remove optional fields that are
 * undefined before sending a document to Firestore.
 */
function removeUndefinedFields<T extends Record<string, unknown>>(data: T): T {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  ) as T;
}

export async function addFood(item: Omit<MenuItem, "id">) {
  return await addDoc(menuRef, removeUndefinedFields(item as Record<string, unknown>));
}

export async function updateFood(
  id: string,
  data: Partial<MenuItem> & { available?: boolean }
) {
  return await updateDoc(
    doc(db, "menu", id),
    removeUndefinedFields(data as Record<string, unknown>)
  );
}

export async function deleteFood(id: string) {
  return await deleteDoc(doc(db, "menu", id));
}
