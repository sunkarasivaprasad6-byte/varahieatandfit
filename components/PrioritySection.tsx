"use client";

import Image from "next/image";

const priorities = [
  {
    title: "Gym & Fitness",
    description: "Protein-focused meals for active routines.",
    image: "/images/priority-gym.png",
  },
  {
    title: "Yoga & Wellness",
    description: "Balanced meals for clean everyday wellness.",
    image: "/images/priority-yoga.png",
  },
  {
    title: "Healthy Families",
    description: "Nutritious food for healthier families.",
    image: "/images/priority-family.png",
  },
];

export default function PrioritySection() {
  return (
    <section
      id="priority"
      className="relative overflow-hidden bg-[#080304] px-5 py-24 sm:px-8 lg:px-10"
    >
      <div className="mx-auto max-w-[1450px]">

        {/* ================= HEADING ================= */}
        <div className="mb-12 text-center">
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.35em] text-[#FF4D57]">
            Made for your lifestyle
          </p>

          <h2 className="font-playfair text-4xl font-bold leading-[1.05] text-white sm:text-5xl lg:text-[58px]">
            Eat well.{" "}
            <span className="italic text-[#FF4D57]">
              Live better.
            </span>
          </h2>
        </div>

        {/* ================= CARDS ================= */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

          {priorities.map((item) => (
            <article
              key={item.title}
              className="group overflow-hidden rounded-[24px] border border-white/[0.10] bg-[#10090a] transition-all duration-500 hover:-translate-y-1 hover:border-[#FF4D57]/35"
            >

              {/* IMAGE */}
              <div className="relative h-[235px] overflow-hidden sm:h-[250px]">

                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />

                {/* Bottom fade */}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#10090a] to-transparent" />
              </div>

              {/* CONTENT */}
              <div className="px-7 pb-8 pt-0 sm:px-8">

                {/* Red accent */}
                <div className="mb-7 h-[3px] w-10 rounded-full bg-[#FF4D57]" />

                <h3 className="mb-3 text-[21px] font-bold text-white">
                  {item.title}
                </h3>

                <p className="max-w-[330px] text-[14px] leading-6 text-white/45">
                  {item.description}
                </p>

              </div>
            </article>
          ))}

        </div>
      </div>
    </section>
  );
}