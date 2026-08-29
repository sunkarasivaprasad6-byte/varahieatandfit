export type SubscriptionMeal = {
  name: string;
  image: string;
  calories: number;
  protein: number;
};

export type SubscriptionPlan = {
  id: string;
  name: string;
  price: number;
  tagline: string;
  accent: string;
  meals: Record<string, SubscriptionMeal>;
};

const NO_SUBSCRIPTION_IMAGE = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxIiBoZWlnaHQ9IjEiIHZpZXdCb3g9IjAgMCAxIDEiPjwvc3ZnPg==";

/*
  MENU FROM THE SUPPLIED VARAHI EAT & FIT WEEKLY MENU

  Nutrition rules:
  - Juice contributes 0 calories and 0 protein.
  - Paneer Roll contributes 350 kcal and 20g protein.
  - Fruit Salad has no nutrition value shown on the supplied menu, so it contributes 0.
  - Dry Fruit Nut Salad has no nutrition value shown on the supplied plan, so no nutrition is added for it.
  - All other nutrition values below are taken from the supplied menu image.
  - The protein-shake values are 55g protein and 1080 kcal, matching the supplied menu.

  The subscription menu uses the same food items as the normal menu wherever
  the poster names the component explicitly.
*/

const silverMeals: Record<string, SubscriptionMeal> = {
  mon: { name: "Veg Roll", image: "https://images.unsplash.com/photo-1719282431565-3b30bb7d2658?auto=format&fit=crop&w=900&q=80", calories: 160, protein: 11 },
  tue: { name: "Egg Roll", image: "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=900&auto=format&fit=crop&q=80", calories: 302, protein: 17 },
  wed: { name: "Chicken Roll", image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=900&q=80", calories: 320, protein: 26 },
  thu: { name: "Egg Roll", image: "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=900&auto=format&fit=crop&q=80", calories: 302, protein: 17 },
  fri: { name: "Chicken Roll", image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=900&q=80", calories: 320, protein: 26 },
  sat: { name: "Veg Roll", image: "https://images.unsplash.com/photo-1719282431565-3b30bb7d2658?auto=format&fit=crop&w=900&q=80", calories: 160, protein: 11 },
};

const goldenMeals: Record<string, SubscriptionMeal> = {
  mon: { name: "Veg Roll", image: "https://images.unsplash.com/photo-1719282431565-3b30bb7d2658?auto=format&fit=crop&w=900&q=80", calories: 160, protein: 11 },
  tue: { name: "Egg Roll + Sprout Salad + Juice", image: "/images/golden-tuesday.jpg", calories: 415, protein: 23 },
  wed: { name: "Chicken Roll + Juice", image: "/images/cjuice.jpg", calories: 320, protein: 26 },
  thu: { name: "Boiled Egg + Chicken Roll + Juice", image: "/images/cejuice.jpg", calories: 390, protein: 32 },
  fri: { name: "Paneer Roll + Boiled Egg + Sprout Salad", image: "/images/pesa.jpg", calories: 533, protein: 32 },
  sat: { name: "Veg Roll + Sprout Salad + Juice", image: "/images/veg_roll_sprout_salad_juice_web.jpg", calories: 273, protein: 17 },
};

const diamondMeals: Record<string, SubscriptionMeal> = {
  mon: { name: "Veg Roll + Chicken Protein Salad + Juice + Boiled Egg", image: "/images/first.jpg", calories: 450, protein: 54 },
  tue: { name: "Egg Roll + Egg Salad + Gold Standard Whey Protein", image: "/images/second.jpg", calories: 1642, protein: 95 },
  wed: { name: "Chicken Roll + Fruit Salad + Juice + Boiled Egg", image: "/images/third.jpg", calories: 390, protein: 32 },
  thu: { name: "Boiled Egg + Chicken Roll + Paneer Salad + Corn Salad + Juice", image: "/images/fourth.jpg", calories: 670, protein: 51 },
  fri: { name: "Paneer Roll + Lean Chicken Salad + Juice + Boiled Egg", image: "/images/fifth.jpg", calories: 605, protein: 58 },
  sat: { name: "Veg Roll + Veg Salad + Gold Standard Whey Protein", image: "/images/sixth.jpg", calories: 1355, protein: 74 },
};

const babyVipMeals: Record<string, SubscriptionMeal> = {
  mon: { name: "Fruit Salad + Dry Fruit Nut Salad + ABC Juice + Veg Roll + Boiled Egg + Sprout Salad", image:/images/fsd.jpeg , calories: 343, protein: 23 },
  tue: { name: "Veg Salad + Dry Fruit Nut Salad + Cucumber Juice + Egg Roll + Boiled Egg + Sprout Salad", image: NO_SUBSCRIPTION_IMAGE, calories: 600, protein: 37 },
  wed: { name: "Corn Salad + Dry Fruit Nut Salad + Guava Juice + Chicken Roll + Boiled Egg + Sprout Salad", image: NO_SUBSCRIPTION_IMAGE, calories: 598, protein: 45 },
  thu: { name: "Egg Salad + Dry Fruit Nut Salad + Curry Leaves Juice + Chicken + Egg Roll + Boiled Egg + Sprout Salad", image: NO_SUBSCRIPTION_IMAGE, calories: 835, protein: 68 },
  fri: { name: "Chicken Protein Salad + Dry Fruit Nut Salad + Green Juice + Paneer Roll + Boiled Egg + Sprout Salad", image: NO_SUBSCRIPTION_IMAGE, calories: 753, protein: 69 },
  sat: { name: "Paneer Salad + Dry Fruit Nut Salad + Amla Juice + Veg Roll + Boiled Egg + Sprout Salad", image: NO_SUBSCRIPTION_IMAGE, calories: 528, protein: 35 },
};

const vipMeals: Record<string, SubscriptionMeal> = {
  mon: { name: "Fruit Salad + Dry Fruit Nut Salad + ABC Juice + Veg Roll + Boiled Egg + Sprout Salad", image: NO_SUBSCRIPTION_IMAGE, calories: 343, protein: 23 },
  tue: { name: "Veg Salad + Dry Fruit Nut Salad + Cucumber Juice + Egg Roll + Boiled Egg + Sprout Salad", image: NO_SUBSCRIPTION_IMAGE, calories: 600, protein: 37 },
  wed: { name: "Corn Salad + Dry Fruit Nut Salad + Guava Juice + Chicken Roll + Boiled Egg + Sprout Salad", image: NO_SUBSCRIPTION_IMAGE, calories: 598, protein: 45 },
  thu: { name: "Egg Salad + Dry Fruit Nut Salad + Curry Leaves Juice + Chicken + Egg Roll + Boiled Egg + Sprout Salad", image: NO_SUBSCRIPTION_IMAGE, calories: 835, protein: 68 },
  fri: { name: "Chicken Protein Salad + Dry Fruit Nut Salad + Green Juice + Paneer Roll + Boiled Egg + Sprout Salad", image: NO_SUBSCRIPTION_IMAGE, calories: 753, protein: 69 },
  sat: { name: "Paneer Salad + Dry Fruit Nut Salad + Amla Juice + Veg Roll + Boiled Egg + Sprout Salad", image: NO_SUBSCRIPTION_IMAGE, calories: 528, protein: 35 },
};

export const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

export const subscriptionPlans: SubscriptionPlan[] = [
  { id: "silver", name: "Silver", price: 700, tagline: "Perfect start for a healthier you", accent: "#C8C8C8", meals: silverMeals },
  { id: "golden", name: "Golden", price: 1100, tagline: "Best balance of taste & nutrition", accent: "#D8A93A", meals: goldenMeals },
  { id: "diamond", name: "Diamond", price: 1600, tagline: "Ultimate nutrition experience", accent: "#E6E6E6", meals: diamondMeals },
  { id: "baby-vip-kit", name: "Baby VIP Kit", price: 1499, tagline: "Balanced weekly meals for your fitness goals", accent: "#0F6B4D", meals: babyVipMeals },
  { id: "vip-kit", name: "VIP Kit", price: 2499, tagline: "Premium weekly meals for your fitness goals", accent: "#D88700", meals: vipMeals },
];

export function getPlan(id: string) {
  return subscriptionPlans.find((plan) => plan.id === id);
}
