"use client";

import { useState } from "react";
import Image from "next/image";
import QRCode from "react-qr-code";
import { CreditCard, ShieldCheck, CheckCircle2, Banknote } from "lucide-react";
import toast from "react-hot-toast";

interface Props { paymentMethod: string; setPaymentMethod: (value: string) => void; paymentDone: boolean; setPaymentDone: (value: boolean) => void; upiTransactionId: string; setUpiTransactionId: (value: string) => void; grandTotal: number; upiLink: string; }

export default function PaymentSection({ paymentMethod, setPaymentMethod, paymentDone, setPaymentDone, upiTransactionId, setUpiTransactionId, grandTotal, upiLink }: Props) {
  const [transactionTouched, setTransactionTouched] = useState(false);
  const methods = [
    { id: "COD", title: "Cash", subtitle: "Pay on Delivery", icon: <div className="w-12 h-12 flex items-center justify-center"><Banknote size={42} strokeWidth={1.8} className="text-green-400" /></div> },
    { id: "PHONEPE", title: "PhonePe", subtitle: "Fast Payment", icon: <Image src="/payment-logos/phonepe.png" alt="PhonePe" width={52} height={52} className="w-12 h-12 object-contain" /> },
    { id: "GPAY", title: "Google Pay", subtitle: "Secure", icon: <Image src="/payment-logos/googlepay.png" alt="Google Pay" width={52} height={52} className="w-12 h-12 object-contain" /> },
    { id: "PAYTM", title: "Paytm", subtitle: "UPI & Wallet", icon: <Image src="/payment-logos/paytm.png" alt="Paytm" width={52} height={52} className="w-12 h-12 object-contain" /> },
    { id: "UPI", title: "UPI", subtitle: "Any App", icon: <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center"><span className="text-[#555] text-xl font-black">UPI</span></div> },
  ];

  function openUPI() {
    if (!upiLink) return;
    window.location.href = upiLink;
  }

  const onlinePayment = paymentMethod !== "COD";
  const normalizedTransactionId = upiTransactionId.trim();
  const transactionIdValid = /^[A-Za-z0-9][A-Za-z0-9._-]{5,63}$/.test(normalizedTransactionId);

  function submitPayment() {
    setTransactionTouched(true);
    if (!normalizedTransactionId) {
      toast.error("Please enter your UPI Transaction ID / UTR");
      return;
    }
    if (!transactionIdValid) {
      toast.error("Please enter a valid UPI Transaction ID / UTR");
      return;
    }
    setUpiTransactionId(normalizedTransactionId);
    setPaymentDone(true);
  }

  return <div className="bg-[#171717] rounded-3xl border border-white/10 p-8 mt-10">
    <div className="flex items-center gap-3 mb-8"><CreditCard className="text-[#E63946]" /><h2 className="text-2xl font-bold text-white">Payment Method</h2></div>
    <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">{methods.map((item) => <button type="button" key={item.id} onClick={() => { setPaymentMethod(item.id); setPaymentDone(false); if (item.id === "COD") setUpiTransactionId(""); }} className={`rounded-2xl border p-5 transition-all duration-300 hover:scale-105 ${paymentMethod === item.id ? "border-[#E63946] bg-[#E63946]/15" : "border-white/10 bg-[#222]"}`}><div className="h-14 mb-3 flex items-center justify-center">{item.icon}</div><h3 className="text-white font-bold">{item.title}</h3><p className="text-white/50 text-sm mt-1">{item.subtitle}</p></button>)}</div>
    {onlinePayment && <div className="mt-10 bg-[#111] rounded-3xl p-8 border border-white/10 text-center"><div className="w-full flex justify-center items-center min-h-[240px]">{upiLink ? <div className="bg-white p-5 rounded-2xl flex items-center justify-center"><QRCode value={upiLink} size={200} /></div> : <p className="text-white/40">Preparing secure UPI payment…</p>}</div><h3 className="text-2xl font-bold text-white mt-6">Scan & Pay</h3><p className="text-white/60 mt-3">PhonePe • Google Pay • Paytm • BHIM • Any UPI App</p><div className="mt-6 rounded-2xl border border-white/10 bg-[#171717] px-5 py-4 text-left"><p className="text-white/40 text-xs uppercase tracking-wide">Pay to</p><p className="text-white font-semibold mt-1">rajasekar.bukke@oksbi <span className="text-white/50 font-normal">• +91 9704949192</span></p></div><div className="text-[#E63946] text-4xl font-bold mt-6">₹{grandTotal}</div><button type="button" onClick={openUPI} disabled={!upiLink} className="inline-block mt-8 bg-green-600 hover:bg-green-700 disabled:bg-green-800/50 disabled:cursor-not-allowed transition rounded-2xl px-10 py-4 text-white font-bold">Open UPI App</button><p className="text-white/40 text-xs mt-3">Your UPI app will open using the standard UPI payment link. After payment, return here and enter the UTR.</p><div className="mt-8 text-left"><label htmlFor="upi-transaction-id" className="block text-white font-semibold mb-2">UPI Transaction ID / UTR <span className="text-[#E63946]">*</span></label><input id="upi-transaction-id" type="text" value={upiTransactionId} onChange={(event) => { setUpiTransactionId(event.target.value); setPaymentDone(false); }} onBlur={() => setTransactionTouched(true)} placeholder="Enter your UPI transaction ID / UTR" autoComplete="off" maxLength={64} className="w-full rounded-2xl border border-white/10 bg-[#202020] px-4 py-4 text-white placeholder:text-white/30 outline-none focus:border-[#E63946]" />{transactionTouched && upiTransactionId.trim() !== "" && !transactionIdValid && <p className="text-red-400 text-sm mt-2">Please enter a valid UPI Transaction ID / UTR.</p>}<p className="text-white/40 text-xs mt-2">Enter the payment reference shown by your UPI app after payment.</p></div><button type="button" onClick={submitPayment} disabled={paymentDone} className="block w-full mt-5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800/60 disabled:cursor-not-allowed rounded-2xl py-4 text-white font-bold transition">{paymentDone ? "✔ Payment Submitted" : "✔ I Have Paid"}</button>{paymentDone && <div className="mt-5 flex items-center justify-center gap-3 text-green-400 text-sm leading-6"><CheckCircle2 className="shrink-0" />Payment submitted for verification. Your order will now be sent to Varahi Eat & Fit.</div>}</div>}
    {paymentMethod === "COD" && <div className="mt-10 bg-green-500/10 border border-green-500/20 rounded-3xl p-6"><div className="flex items-center gap-3"><ShieldCheck className="text-green-400" /><div><h3 className="text-green-400 font-bold text-lg">Cash on Delivery</h3><p className="text-white/60 mt-1">Pay safely after receiving your delicious meal.</p></div></div></div>}
  </div>;
}
