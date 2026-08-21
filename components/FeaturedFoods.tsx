"use client";

import Image from "next/image";

const categories = [
  {
    id: "Salads",
    title: "Fresh Salads",
    items: "8 Items",
    image:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "Rolls",
    title: "Healthy Rolls",
    items: "5 Items",
    image:
      "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "Soups",
    title: "Healthy Soups",
    items: "11 Items",
    image:
      "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "Protein",
    title: "Protein Picks",
    items: "2 Items",
    image:
      "https://images.unsplash.com/photo-1622484212850-eb596d769edc?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "Tea",
    title: "Tea",
    items: "18 Items",
    image:
      "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "Fruit Juices",
    title: "Fruit Juices",
    items: "6 Items",
    image:
      "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "Veg Juices",
    title: "Veg Juices",
    items: "8 Items",
    image:
      "https://images.unsplash.com/photo-1610970881699-44a5587cabec?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "Leafy Juices",
    title: "Leafy Juices",
    items: "6 Items",
    image:
      "https://media.istockphoto.com/id/485131020/photo/green-vegetable-juice-on-rustic-wood-table.webp?a=1&b=1&s=612x612&w=0&k=20&c=cdAcj93roABaOLpzVAyZ0LQ9Zut0FxjcHL4u3un0Ru4=",
  },
];

export default function FeaturedCategories() {
  return (
    <section className="py-24 bg-transparent">

      <div className="max-w-7xl mx-auto px-6">

        <h2 className="text-5xl font-bold text-white mb-4">
          Featured <span className="text-[#E63946]">Categories</span>
        </h2>

        <p className="text-white/60 mb-12">
          Choose your favourite category
        </p>

        <div className="grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-8">

          {categories.map((cat) => (

            <button
              key={cat.id}
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent("changeCategory", {
                    detail: cat.id,
                  })
                );

                document
                  .getElementById("menu")
                  ?.scrollIntoView({
                    behavior: "smooth",
                  });
              }}
              className="group rounded-3xl overflow-hidden bg-[#171717] border border-white/10 hover:border-[#E63946] transition"
            >

              <div className="relative h-56">

                <Image
                  src={cat.image}
                  alt={cat.title}
                  fill
                  className="object-cover group-hover:scale-110 transition duration-500"
                />

              </div>

              <div className="p-6 text-left">

                <h3 className="text-2xl text-white font-bold">
                  {cat.title}
                </h3>

                <p className="text-white/60 mt-2">
                  {cat.items}
                </p>

              </div>

            </button>

          ))}

        </div>

      </div>

    </section>
  );
}
