"use client";

import { useState } from "react";
import { CreditCard, ShieldCheck, Loader2, Banknote } from "lucide-react";
import toast from "react-hot-toast";

interface Props { paymentMethod: string; setPaymentMethod: (value: string) => void; paymentDone: boolean; setPaymentDone: (value: boolean) => void; grandTotal: number; upiLink: string; }

export default function PaymentSection({ paymentMethod, setPaymentMethod, paymentDone, setPaymentDone, grandTotal }: Props) {
  const [loading, setLoading] = useState(false);
  async function payOnline() {
    setLoading(true);
    try {
      const r = await fetch("/api/cashfree/create-order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: grandTotal, customerId: "guest", customerName: "Customer", customerPhone: "9999999999", referenceId: `normal-${Date.now()}` }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Unable to start payment");
      if (d.demo) { toast.error("Cashfree is not configured yet. Add the merchant keys to .env.local."); return; }
      const script = document.createElement("script"); script.src = "https://sdk.cashfree.com/js/v3/cashfree.js"; script.onload = () => {
        // @ts-ignore Cashfree global SDK
        const cashfree = window.Cashfree({ mode: d.mode || "sandbox" });
        cashfree.checkout({ paymentSessionId: d.paymentSessionId, redirectTarget: "_self" });
      }; document.body.appendChild(script);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Payment failed"); } finally { setLoading(false); }
  }
  return <div className="mt-10 rounded-3xl border border-white/10 bg-[#171717] p-8">
    <div className="mb-8 flex items-center gap-3"><CreditCard className="text-[#E63946]"/><h2 className="text-2xl font-bold text-white">Payment Method</h2></div>
    <div className="grid gap-4 sm:grid-cols-2">
      <button onClick={()=>setPaymentMethod("CASHFREE")} className={`rounded-2xl border p-5 text-left ${paymentMethod==="CASHFREE"?"border-[#E63946] bg-[#E63946]/10":"border-white/10 bg-[#222]"}`}><CreditCard className="mb-4 text-[#E63946]"/><h3 className="font-bold">Online Payment</h3><p className="mt-1 text-sm text-white/45">UPI, cards & net banking via Cashfree</p></button>
      <button onClick={()=>setPaymentMethod("COD")} className={`rounded-2xl border p-5 text-left ${paymentMethod==="COD"?"border-[#E63946] bg-[#E63946]/10":"border-white/10 bg-[#222]"}`}><Banknote className="mb-4 text-green-400"/><h3 className="font-bold">Cash on Delivery</h3><p className="mt-1 text-sm text-white/45">Pay after receiving your food</p></button>
    </div>
    {paymentMethod==="CASHFREE"&&<div className="mt-7 rounded-2xl bg-black/20 p-6"><div className="text-3xl font-bold">₹{grandTotal}</div><p className="mt-2 text-sm text-white/40">Secure one-time payment powered by Cashfree.</p><button disabled={loading||paymentDone} onClick={payOnline} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#E63946] py-4 font-bold">{loading?<><Loader2 className="h-5 w-5 animate-spin"/>Preparing payment…</>:paymentDone?"Payment confirmed":"Pay securely"}</button>{paymentDone&&<p className="mt-4 text-center text-sm text-green-400">Payment confirmed. Your order can now be submitted.</p>}</div>}
    {paymentMethod==="COD"&&<div className="mt-7 rounded-2xl border border-green-500/20 bg-green-500/10 p-6"><div className="flex items-center gap-3"><ShieldCheck className="text-green-400"/><div><h3 className="font-bold text-green-400">Cash on Delivery</h3><p className="mt-1 text-sm text-white/50">Pay after receiving your meal.</p></div></div></div>}
  </div>;
}
