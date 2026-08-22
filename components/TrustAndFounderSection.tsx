"use client";

import Image from "next/image";

const OWNER_IMAGE = process.env.NEXT_PUBLIC_OWNER_IMAGE_URL || "/images/owner.jpg";
const FSSAI_NUMBER = process.env.NEXT_PUBLIC_FSSAI_LICENSE_NUMBER || "FSSAI License Number — Add verified number";
const FSSAI_CERTIFICATE = process.env.NEXT_PUBLIC_FSSAI_CERTIFICATE_URL || "";

export default function TrustAndFounderSection() {
  return (
    <section className="bg-[#050607] px-5 py-20 text-white sm:px-8 lg:px-10">
      <div className="mx-auto grid max-w-[1450px] gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[28px] border border-green-400/20 bg-green-400/[0.04] p-7 sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-green-400">Food Safety & Trust</p>
          <h2 className="mt-4 text-4xl font-black sm:text-5xl">FSSAI Certified Restaurant</h2>
          <p className="mt-4 max-w-2xl text-white/55">Varahi Eat & Fit is proud to display its food-safety certification. The verified licence number can be configured by the restaurant owner.</p>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <div className="grid h-20 w-20 place-items-center rounded-2xl border border-green-400/30 bg-green-400/10 text-center text-xs font-black text-green-300">FSSAI<br/>CERTIFIED</div>
            <div><p className="text-sm font-bold">Food Safety & Standards Authority of India</p><p className="mt-1 text-sm text-white/40">{FSSAI_NUMBER}</p>{FSSAI_CERTIFICATE && <a href={FSSAI_CERTIFICATE} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-bold text-green-300 hover:underline">View certificate</a>}</div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#101112] p-7 sm:p-10">
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[#E63946]/10 blur-3xl" />
          <div className="relative flex flex-col items-center gap-7 sm:flex-row sm:items-center">
            <div className="relative h-48 w-40 shrink-0 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
              <Image src={OWNER_IMAGE} alt="Varahi Eat & Fit founder" fill className="object-cover" sizes="160px" />
            </div>
            <div><p className="text-xs font-bold uppercase tracking-[0.3em] text-[#E63946]">Meet the Founder</p><h2 className="mt-3 text-3xl font-black sm:text-4xl">The person behind Varahi Eat & Fit</h2><p className="mt-4 text-sm leading-7 text-white/50">A personal introduction from the restaurant owner. His photo and verified details can be updated without changing the rest of the website.</p></div>
          </div>
        </div>
      </div>
    </section>
  );
}
