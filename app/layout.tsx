import "./globals.css";
import type { Metadata } from "next";
import { CartProvider } from "@/components/cart/CartContext";
import { Toaster } from "react-hot-toast";
export const metadata: Metadata = {
  title: "Varahi Eat & Fit",
  description: "Premium Healthy Restaurant",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="premium-page-bg text-white">

        <CartProvider>

          {children}

          <Toaster
            position="top-center"
            reverseOrder={false}
            gutter={10}
            toastOptions={{
              duration: 2500,
              style: {
                background: "#171717",
                color: "#ffffff",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "14px",
                padding: "16px",
                fontWeight: "600",
                boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
              },

              success: {
                iconTheme: {
                  primary: "#22c55e",
                  secondary: "#ffffff",
                },
              },

              error: {
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "#ffffff",
                },
              },
            }}
          />

        </CartProvider>

      </body>
    </html>
  );
}
