"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import Image from "next/image";

import { Offer } from "@/types/offer";
import { getOffers } from "@/lib/offerService";

export default function OfferBanner() {
  const [offer, setOffer] = useState<Offer | null>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    async function loadOffer() {
      try {
        const offers = await getOffers();

        const activeOffer = offers.find(
          (item) => item.active === true
        );

        if (activeOffer) {
          setOffer(activeOffer);
        }
      } catch (error) {
        console.error("Failed to load offer:", error);
      }
    }

    loadOffer();
  }, []);

  if (!offer || !visible || !offer.image) {
    return null;
  }

  return (
    <section className="relative z-20 w-full px-4 sm:px-6 lg:px-8 pt-[130px] mb-[-100px]">
      <div className="relative mx-auto w-full max-w-[1400px] overflow-hidden rounded-[24px]">
        <Image
          src={offer.image}
          alt={offer.title || "Offer"}
          width={1400}
          height={135}
          className="block w-full h-auto object-contain"
          priority
          referrerPolicy="no-referrer"
        />

        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label="Close offer"
          className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white/90 transition hover:bg-black/70 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}