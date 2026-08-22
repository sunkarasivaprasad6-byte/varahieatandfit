import { addDoc, collection, getDocs, orderBy, query, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type AppNotification = {
  id?: string;
  userId: string;
  title: string;
  message: string;
  type?: "PAYMENT" | "SUBSCRIPTION" | "DELIVERY" | "MEAL" | "SYSTEM";
  read?: boolean;
  createdAt?: unknown;
};

export async function createNotification(data: Omit<AppNotification, "id" | "createdAt">) {
  return addDoc(collection(db, "notifications"), { ...data, read: data.read ?? false, createdAt: serverTimestamp() });
}

export async function getUserNotifications(userId: string) {
  const snap = await getDocs(query(collection(db, "notifications"), orderBy("createdAt", "desc")));
  return snap.docs
    .map((item) => ({ id: item.id, ...(item.data() as Omit<AppNotification, "id">) }))
    .filter((item) => item.userId === userId) as AppNotification[];
}

export async function markNotificationRead(id: string) {
  await updateDoc(doc(db, "notifications", id), { read: true });
}
