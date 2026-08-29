import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  setDoc,
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

const nutritionByName: Record<string, { calories: number; protein: string }> = {
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
  "gold standard whey protein": { calories: 1080, protein: "55g" },
  "mb biozyme whey protein": { calories: 1080, protein: "55g" },
  "gold standard whey protein - 250 ml": { calories: 1080, protein: "55g" },
  "gold standard whey protein - 300 ml": { calories: 1080, protein: "55g" },
  "mb biozyme whey protein - 250 ml": { calories: 1080, protein: "55g" },
  "mb biozyme whey protein - 300 ml": { calories: 1080, protein: "55g" },
};

function normalizeMenuItem(item: MenuItem): MenuItem {
  const key = item.name.trim().toLowerCase();
  const nutrition = nutritionByName[key];
  const isNoNutritionCategory = item.category === "Herbal Tea" || item.category === "Tea" || item.category === "Soups";

  if (isNoNutritionCategory) {
    const { calories: _calories, protein: _protein, ...withoutNutrition } = item;
    return withoutNutrition;
  }

  return {
    ...item,
    ...(nutrition ? { calories: nutrition.calories, protein: nutrition.protein } : {}),
    category: item.category === "Protein Shakes" ? "Protein Shakes" : item.category,
  };
}

const NO_MENU_IMAGE = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxIiBoZWlnaHQ9IjEiIHZpZXdCb3g9IjAgMCAxIDEiPjwvc3ZnPg==";

const proteinShakeFallbacks: MenuItem[] = [
  {
    id: "protein-gold-standard-whey-250",
    name: "Gold Standard Whey Protein - 250 ml",
    description: "Gold Standard whey protein shake - 250 ml",
    category: "Protein Shakes",
    price: 89,
    image: NO_MENU_IMAGE,
    rating: 4.8,
    calories: 1080,
    protein: "55g",
    isVegetarian: true,
  },
  {
    id: "protein-gold-standard-whey-300",
    name: "Gold Standard Whey Protein - 300 ml",
    description: "Gold Standard whey protein shake - 300 ml",
    category: "Protein Shakes",
    price: 99,
    image: NO_MENU_IMAGE,
    rating: 4.8,
    calories: 1080,
    protein: "55g",
    isVegetarian: true,
  },
  {
    id: "protein-mb-biozyme-whey-250",
    name: "MB Biozyme Whey Protein - 250 ml",
    description: "MB Biozyme whey protein shake - 250 ml",
    category: "Protein Shakes",
    price: 89,
    image: NO_MENU_IMAGE,
    rating: 4.8,
    calories: 1080,
    protein: "55g",
    isVegetarian: true,
  },
  {
    id: "protein-mb-biozyme-whey-300",
    name: "MB Biozyme Whey Protein - 300 ml",
    description: "MB Biozyme whey protein shake - 300 ml",
    category: "Protein Shakes",
    price: 99,
    image: NO_MENU_IMAGE,
    rating: 4.8,
    calories: 1080,
    protein: "55g",
    isVegetarian: true,
  },
];

const legacyProteinNames = new Set(["Gold Standard Whey Protein", "MB Biozyme Whey Protein"]);

export async function getMenu() {
  const snapshot = await getDocs(menuRef);
  const firebaseItems = snapshot.docs
    .map((docItem) => normalizeMenuItem({ id: docItem.id, ...(docItem.data() as MenuItem) }))
    .filter((item) => allowedCategories.has(item.category))
    .filter((item) => !legacyProteinNames.has(item.name));
  const existingNames = new Set(firebaseItems.map((item) => item.name));
  const missingProteinShakes = proteinShakeFallbacks.filter((item) => !existingNames.has(item.name));
  return [...firebaseItems, ...missingProteinShakes];
}

function removeUndefinedFields<T extends Record<string, unknown>>(data: T): T {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)) as T;
}

export async function addFood(item: Omit<MenuItem, "id">) {
  return await addDoc(menuRef, removeUndefinedFields(item as Record<string, unknown>));
}

export async function updateFood(id: string, data: Partial<MenuItem> & { available?: boolean }) {
  const cleanData = removeUndefinedFields(data as Record<string, unknown>);
  const isProteinShakeFallback =
    id === "protein-gold-standard-whey" ||
    id === "protein-mb-biozyme-whey" ||
    id === "protein-gold-standard-whey-250" ||
    id === "protein-gold-standard-whey-300" ||
    id === "protein-mb-biozyme-whey-250" ||
    id === "protein-mb-biozyme-whey-300";

  if (isProteinShakeFallback) {
    return await setDoc(doc(db, "menu", id), cleanData, { merge: true });
  }

  return await updateDoc(doc(db, "menu", id), cleanData);
}

export async function deleteFood(id: string) {
  return await deleteDoc(doc(db, "menu", id));
}
