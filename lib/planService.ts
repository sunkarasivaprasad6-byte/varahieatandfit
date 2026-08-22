import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { subscriptionPlans, type SubscriptionPlan } from "@/lib/subscriptionData";

export type PlanOverride = {
  id: string;
  name?: string;
  price?: number;
  tagline?: string;
  accent?: string;
  active?: boolean;
  updatedAt?: unknown;
};

export type DisplayPlan = SubscriptionPlan & { active: boolean };

export async function getPlanOverrides(): Promise<Record<string, PlanOverride>> {
  const snap = await getDocs(collection(db, "planOverrides"));
  return snap.docs.reduce<Record<string, PlanOverride>>((map, item) => {
    map[item.id] = { id: item.id, ...(item.data() as Omit<PlanOverride, "id">) };
    return map;
  }, {});
}

export async function getDisplayPlans(): Promise<DisplayPlan[]> {
  const overrides = await getPlanOverrides();
  return subscriptionPlans.map((plan) => {
    const override = overrides[plan.id];
    return {
      ...plan,
      name: override?.name?.trim() || plan.name,
      price: Number.isFinite(override?.price) && Number(override?.price) > 0 ? Number(override?.price) : plan.price,
      tagline: override?.tagline?.trim() || plan.tagline,
      accent: override?.accent || plan.accent,
      active: override?.active !== false,
    };
  });
}

export async function getDisplayPlan(id: string): Promise<DisplayPlan | null> {
  const base = subscriptionPlans.find((plan) => plan.id === id);
  if (!base) return null;

  const snap = await getDoc(doc(db, "planOverrides", id));
  const override = snap.exists() ? ({ id, ...snap.data() } as PlanOverride) : undefined;

  return {
    ...base,
    name: override?.name?.trim() || base.name,
    price: Number.isFinite(override?.price) && Number(override?.price) > 0 ? Number(override?.price) : base.price,
    tagline: override?.tagline?.trim() || base.tagline,
    accent: override?.accent || base.accent,
    active: override?.active !== false,
  };
}

export async function savePlanOverride(id: string, data: Omit<PlanOverride, "id" | "updatedAt">) {
  await setDoc(doc(db, "planOverrides", id), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}
