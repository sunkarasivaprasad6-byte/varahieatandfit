"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import toast from "react-hot-toast";

import {
  ShoppingCart,
  Heart,
  Star,
  Flame,
  Leaf,
  Dumbbell,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useCart } from "@/components/cart/CartContext";
import { getMenu } from "@/lib/menuService";
import { MenuItem } from "@/types/menu";

type MenuItemWithAvailability = MenuItem & {
  available?: boolean;
};

const TEA_BENEFITS = [
  "Promotes Skin Glow",
  "Natural Detox",
  "Boosts Energy",
  "Supports Immunity",
  "Better for Metabolism & Gut Health",
  "Weight Management",
  "Rich in Antioxidants",
  "Supports Hormonal Wellness",
];

const SOUP_BENEFITS: Record<string, string[]> = {
  "Tomato Soup": ["Rich in tomato goodness", "Light and refreshing", "Contains antioxidant-rich ingredients"],
  "Classic Corn Soup": ["Comforting and nourishing", "Contains naturally occurring fiber", "Warm and satisfying"],
  "Carrot Soup": ["Rich in carrot goodness", "Naturally wholesome", "Light and comforting"],
  "Classic Mushroom Soup": ["Savory and satisfying", "Contains nutrient-rich mushrooms", "Warm and comforting"],
  "Broccoli Soup": ["Packed with broccoli goodness", "Naturally wholesome", "Light and comforting"],
  "Mix Veg Corn Soup": ["Variety of vegetables in one bowl", "Naturally wholesome", "Warm and satisfying"],
  "Broccoli Carrot Soup": ["Combines broccoli and carrot goodness", "Naturally wholesome", "Light and comforting"],
  "Mushroom Cashew Soup": ["Creamy and satisfying", "Contains mushrooms and cashews", "Rich and comforting"],
  "Mushroom Walnut Soup": ["Savory mushroom goodness", "Contains walnuts for added richness", "Warm and satisfying"],
  "Mixed Veg Soup": ["Made with a variety of vegetables", "Naturally wholesome", "Light and comforting"],
  "Chicken Soup": ["A warm, hearty chicken option", "Contains protein-rich chicken", "Comforting and satisfying"],
};

export default function MenuSection() {
  const { addToCart } = useCart();

  const [activeCategory, setActiveCategory] = useState("All");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemWithAvailability[]>([]);

  const categories = [
    "All",
    ...Array.from(
      new Set([
        ...menuItems.map((item) => item.category),
        "Fruit Juices",
        "Veg Juices",
        "Leafy Juices",
        "Tea",
        "Protein Shakes",
      ])
    ),
  ];

  useEffect(() => {
    const handleCategoryChange = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      setActiveCategory(customEvent.detail);
    };

    window.addEventListener("changeCategory", handleCategoryChange as EventListener);
    return () => {
      window.removeEventListener("changeCategory", handleCategoryChange as EventListener);
    };
  }, []);

  useEffect(() => {
    async function loadMenu() {
      try {
        const data = await getMenu();
        setMenuItems(data);
      } catch (error) {
        console.error("Failed to load menu:", error);
        toast.error("Unable to load menu");
      }
    }

    loadMenu();
  }, []);

  const filteredItems = menuItems.filter((item) => {
    if (item.available === false) return false;
    if (activeCategory === "All") return true;
    return item.category === activeCategory;
  });

  const getCartId = (item: MenuItem): number => {
    if (typeof item.id === "number" && Number.isFinite(item.id)) return item.id;

    if (typeof item.id === "string" && item.id.trim() !== "") {
      const numericId = Number(item.id);
      if (Number.isFinite(numericId)) return numericId;

      let hash = 0;
      for (let i = 0; i < item.id.length; i++) {
        hash = (hash << 5) - hash + item.id.charCodeAt(i);
        hash |= 0;
      }
      return Math.abs(hash) || 1;
    }

    let hash = 0;
    const name = item.name || "menu-item";
    for (let i = 0; i < name.length; i++) {
      hash = (hash << 5) - hash + name.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) || 1;
  };

  return (
    <section id="menu" className="py-24 bg-transparent border-t border-white/5 relative">
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[650px] h-[650px] bg-[#E63946]/5 rounded-full blur-[180px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mb-10">
          <div>
            <motion.h2
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-5xl lg:text-6xl font-extrabold text-white mb-5"
            >
              Our <span className="text-[#E63946]">Menu</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-white/60 text-lg leading-8 max-w-xl"
            >
              Discover healthy meals made with premium ingredients for fitness,
              wellness and delicious taste.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex flex-wrap gap-4 justify-center lg:justify-start"
          >
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={cn(
                  "relative overflow-hidden px-7 py-3 rounded-full text-sm font-semibold transition-all duration-300 border",
                  activeCategory === category
                    ? "bg-[#E63946] border-[#E63946] text-white shadow-[0_0_25px_rgba(230,57,70,0.45)] scale-105"
                    : "bg-[#181818] border-white/10 text-white/70 hover:text-white hover:border-[#E63946] hover:bg-[#202020]"
                )}
              >
                {category}
              </button>
            ))}
          </motion.div>
        </div>

        {activeCategory === "Tea" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-14 rounded-3xl border border-white/10 bg-[#171717]/80 p-6 sm:p-7"
          >
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">Benefits</h3>
            <p className="text-xs text-white/40 mb-5">
              Traditional/general wellness benefits associated with these teas and ingredients.
            </p>
            <div className="flex flex-wrap gap-3">
              {TEA_BENEFITS.map((benefit) => (
                <span
                  key={benefit}
                  className="rounded-full border border-green-500/20 bg-green-500/10 px-4 py-2 text-sm text-green-300"
                >
                  {benefit}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => {
              const favoriteId = item.id !== undefined && item.id !== null ? String(item.id) : "";
              const isFavorite = favoriteId !== "" && favorites.includes(favoriteId);
              const cartId = getCartId(item);
              const soupBenefits = activeCategory === "Soups" ? SOUP_BENEFITS[item.name] : undefined;

              return (
                <motion.div
                  key={item.id ?? `${item.name}-${cartId}`}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  className="relative bg-gradient-to-b from-[#1c1c1c] to-[#121212] rounded-[32px] p-3 group transition-all duration-500 hover:-translate-y-3 hover:shadow-[0_25px_60px_rgba(230,57,70,0.18)] border border-white/5 hover:border-white/10"
                >
                  <div className="absolute top-6 right-6 z-20">
                    <button
                      type="button"
                      aria-label={isFavorite ? "Remove from favourites" : "Add to favourites"}
                      onClick={() => {
                        if (!favoriteId) return;
                        if (isFavorite) {
                          setFavorites((previous) => previous.filter((id) => id !== favoriteId));
                          toast.success("Removed from favourites");
                        } else {
                          setFavorites((previous) => [...previous, favoriteId]);
                          toast.success("Added to favourites");
                        }
                      }}
                      className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center hover:bg-black/80 transition"
                    >
                      <Heart className={cn("w-5 h-5 transition", isFavorite ? "fill-red-500 text-red-500" : "text-white/70")} />
                    </button>
                  </div>

                  {item.isVegetarian && (
                    <div className="absolute top-6 left-6 z-20">
                      <div className="w-9 h-9 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                        <Leaf className="w-5 h-5 text-green-400" />
                      </div>
                    </div>
                  )}

                  <div className="relative w-full aspect-square rounded-[24px] overflow-hidden mb-6">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover group-hover:scale-110 transition duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-md px-3 py-1 rounded-xl flex items-center gap-2">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-white text-xs">{item.rating}</span>
                    </div>
                  </div>

                  <div className="px-3 pb-2">
                    <h3 className="text-2xl font-bold text-white mb-2">{item.name}</h3>
                    <p className="text-white/50 text-sm mb-5 min-h-[40px]">{item.description}</p>

                    {soupBenefits && (
                      <div className="mb-6">
                        <p className="text-sm font-semibold text-white mb-2">Benefits</p>
                        <div className="flex flex-wrap gap-2">
                          {soupBenefits.map((benefit) => (
                            <span
                              key={benefit}
                              className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1.5 text-xs text-green-300"
                            >
                              {benefit}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {!activeCategory.includes("Tea") && activeCategory !== "Soups" && (item.calories !== undefined || item.protein !== undefined) && (
                      <div className="flex gap-3 mb-6 flex-wrap">
                        {item.calories !== undefined && (
                          <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                            <Flame className="w-4 h-4 text-orange-400" />
                            <span className="text-xs text-white">{item.calories} kcal</span>
                          </div>
                        )}
                        {item.protein !== undefined && (
                          <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
                            <Dumbbell className="w-4 h-4 text-blue-400" />
                            <span className="text-xs text-white">{item.protein}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between border-t border-white/10 pt-5">
                      <div>
                        <p className="text-white/40 text-xs uppercase tracking-wider">Price</p>
                        <h4 className="text-3xl font-extrabold text-white">₹{item.price}</h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => addToCart({ id: cartId, name: item.name, price: item.price, image: item.image })}
                        className="w-14 h-14 rounded-full bg-[#E63946] hover:bg-[#cf2430] transition-all duration-300 flex items-center justify-center hover:scale-110 active:scale-95 shadow-lg cursor-pointer"
                        aria-label={`Add ${item.name} to cart`}
                      >
                        <ShoppingCart className="w-6 h-6 text-white" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
