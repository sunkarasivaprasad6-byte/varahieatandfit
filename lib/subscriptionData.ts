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

/*
  MENU FROM THE ACTUAL VARAHI EAT & FIT WEEKLY MENU

  Silver:
  MON - Veg Roll
  TUE - Egg Roll
  WED - Chicken Roll
  THU - Egg Roll
  FRI - Chicken Roll
  SAT - Veg Roll

  Golden:
  MON - Veg Roll
  TUE - Egg Roll + Sprouts + Juice
  WED - Chicken Roll + Juice
  THU - Egg + Chicken Roll + Juice
  FRI - Paneer Roll + Egg + Sprouts
  SAT - Veg Roll + Sprouts + Juice

  Diamond:
  MON - Veg Roll + Chicken Protein Salad + Juice + Egg
  TUE - Egg Roll + Egg Salad + Protein Shake
  WED - Chicken Roll + Fruit Salad + Juice + Egg
  THU - Egg + Chicken Roll + Paneer Salad + Corn Salad + Juice
  FRI - Paneer Roll + Lean Chicken Salad + Juice + Egg
  SAT - Veg Roll + Veg Salad + Protein Shake
*/

const silverMeals: Record<string, SubscriptionMeal> = {
  mon: {
    name: "Veg Roll",
    image:
      "https://images.unsplash.com/photo-1719282431565-3b30bb7d2658?auto=format&fit=crop&w=900&q=80",
    calories: 320,
    protein: 18,
  },

  tue: {
    name: "Egg Roll",
    image:
      "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=900&auto=format&fit=crop&q=80",
    calories: 360,
    protein: 24,
  },

  wed: {
    name: "Chicken Roll",
    image:
      "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=900&q=80",
    calories: 410,
    protein: 32,
  },

  thu: {
    name: "Egg Roll",
    image:
      "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=900&auto=format&fit=crop&q=80",
    calories: 360,
    protein: 24,
  },

  fri: {
    name: "Chicken Roll",
    image:
      "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=900&q=80",
    calories: 410,
    protein: 32,
  },

  sat: {
    name: "Veg Roll",
    image:
      "https://images.unsplash.com/photo-1719282431565-3b30bb7d2658?auto=format&fit=crop&w=900&q=80",
    calories: 320,
    protein: 18,
  },
};

const goldenMeals: Record<string, SubscriptionMeal> = {
  mon: {
    name: "Veg Roll",
    image:
      "https://images.unsplash.com/photo-1719282431565-3b30bb7d2658?auto=format&fit=crop&w=900&q=80",
    calories: 320,
    protein: 18,
  },

  tue: {
    name: "Egg Roll + Sprouts + Juice",
    image: "/images/golden-tuesday.jpg",
    calories: 420,
    protein: 26,
  },

  wed: {
    name: "Chicken Roll + Juice",
    image:
      "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=900&q=80",
    calories: 450,
    protein: 32,
  },

  thu: {
    name: "Egg + Chicken Roll + Juice",
    image:
      "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=900&q=80",
    calories: 500,
    protein: 38,
  },

  fri: {
    name: "Paneer Roll + Egg + Sprouts",
    image:
      "https://images.unsplash.com/photo-1572449043416-55f4685c9bb7?q=80&w=900&auto=format&fit=crop",
    calories: 480,
    protein: 30,
  },

  sat: {
    name: "Veg Roll + Sprouts + Juice",
    image:
      "https://images.unsplash.com/photo-1719282431565-3b30bb7d2658?auto=format&fit=crop&w=900&q=80",
    calories: 400,
    protein: 20,
  },
};

const diamondMeals: Record<string, SubscriptionMeal> = {
  mon: {
    name: "Veg Roll + Chicken Protein Salad + Juice + Egg",
    image:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=900&auto=format&fit=crop&q=80",
    calories: 560,
    protein: 42,
  },

  tue: {
    name: "Egg Roll + Egg Salad + Protein Shake",
    image:
      "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=900&auto=format&fit=crop&q=80",
    calories: 580,
    protein: 38,
  },

  wed: {
    name: "Chicken Roll + Fruit Salad + Juice + Egg",
    image:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=900&auto=format&fit=crop&q=80",
    calories: 590,
    protein: 44,
  },

  thu: {
    name: "Egg + Chicken Roll + Paneer Salad + Corn Salad + Juice",
    image:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=900&auto=format&fit=crop&q=80",
    calories: 650,
    protein: 48,
  },

  fri: {
    name: "Paneer Roll + Lean Chicken Salad + Juice + Egg",
    image:
      "https://plus.unsplash.com/premium_photo-1664640733581-a9175477cd11?w=900&auto=format&fit=crop&q=80",
    calories: 620,
    protein: 46,
  },

  sat: {
    name: "Veg Roll + Veg Salad + Protein Shake",
    image:
      "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=900&auto=format&fit=crop&q=80",
    calories: 520,
    protein: 28,
  },
};

/*
  The actual poster contains Monday-Saturday.
  There is NO Sunday item in the provided menu.
*/
export const DAYS = [
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
  "SAT",
] as const;

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: "silver",
    name: "Silver",
    price: 700,
    tagline: "Perfect start for a healthier you",
    accent: "#C8C8C8",
    meals: silverMeals,
  },

  {
    id: "golden",
    name: "Golden",
    price: 1100,
    tagline: "Best balance of taste & nutrition",
    accent: "#D8A93A",
    meals: goldenMeals,
  },

  {
    id: "diamond",
    name: "Diamond",
    price: 1600,
    tagline: "Ultimate nutrition experience",
    accent: "#E6E6E6",
    meals: diamondMeals,
  },
];

export function getPlan(id: string) {
  return subscriptionPlans.find((plan) => plan.id === id);
}
