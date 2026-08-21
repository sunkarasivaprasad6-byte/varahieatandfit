import { Suspense } from "react";
import OrderPlacedContent from "./OrderPlacedContent";

export default function OrderPlacedPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-transparent flex items-center justify-center text-white">
          Loading...
        </main>
      }
    >
      <OrderPlacedContent />
    </Suspense>
  );
}
