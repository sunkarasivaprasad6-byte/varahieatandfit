'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { X, ZoomIn } from 'lucide-react';
import { cn } from '@/lib/utils';

const galleryImages = [
  {
    src: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=600&q=70",
    span: "col-span-1 row-span-1 md:col-span-1 md:row-span-1",
    label: "Fresh Power Bowl",
  },
  {
    src: "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=600&q=70",
    span: "col-span-1 row-span-2 md:col-span-1 md:row-span-2",
    label: "Organic Greens",
  },
  {
    src: "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=700&q=70",
    span: "col-span-2 row-span-2 md:col-span-2 md:row-span-2",
    label: "Spicy Salmon",
  },
  {
    src: "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=600&q=70",
    span: "col-span-1 row-span-1 md:col-span-1 md:row-span-1",
    label: "Crisp Veggie",
  },
  {
    src: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=70",
    span: "col-span-1 row-span-1 md:col-span-2 md:row-span-1",
    label: "Pumpkin Cutlets",
  },
  {
    src: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=70",
    span: "col-span-1 row-span-2 md:col-span-1 md:row-span-2",
    label: "Vibrant Salad",
  },
  {
    src: "https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=600&q=70",
    span: "col-span-1 row-span-1 md:col-span-1 md:row-span-1",
    label: "Chef Special",
  },
];
export default function GallerySection() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <section id="gallery" className="py-32 bg-transparent relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-white/[0.02] rounded-full blur-[150px] pointer-events-none z-0" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col items-center text-center mb-16">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[#d91f27] font-jakarta text-sm font-bold tracking-widest uppercase mb-4 flex items-center gap-3"
          >
            <span className="w-8 h-[2px] bg-[#d91f27]" />
            Gallery
            <span className="w-8 h-[2px] bg-[#d91f27]" />
          </motion.p>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-playfair text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
          >
            Aesthetic of <span className="font-light italic text-white/90">Health</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-white/50 font-jakarta max-w-2xl mx-auto text-lg font-light leading-relaxed"
          >
            A glimpse into our premium culinary creations, where nutrition meets Michelin-star presentation.
          </motion.p>
        </div>

        {/* Masonry Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 auto-rows-[150px] sm:auto-rows-[250px]">
          {galleryImages.map((image, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => setSelectedImage(image.src)}
              className={cn(
                "relative rounded-[20px] sm:rounded-[32px] overflow-hidden group cursor-pointer border border-white/5 shadow-[0_15px_30px_rgba(0,0,0,0.4)]",
                image.span
              )}
            >
              {/* Image */}
             <Image
  src={image.src}
  alt={image.label}
  fill
  loading="lazy"
  quality={70}
  sizes="(max-width:768px) 100vw, (max-width:1200px) 50vw, 25vw"
  className="object-cover group-hover:scale-105 transition-transform duration-500"
  referrerPolicy="no-referrer"
/>
              
              {/* Gradients */}
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors duration-500 z-10" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/90 via-[#0a0a0a]/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500 z-10" />
              
              {/* Overlay Content */}
              <div className="absolute inset-0 z-20 p-4 sm:p-6 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center mb-2 sm:mb-3 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-75 shadow-lg border border-white/10">
                  <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <h3 className="font-playfair text-lg sm:text-xl font-bold text-white transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-100">{image.label}</h3>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/95 backdrop-blur-xl"
            onClick={() => setSelectedImage(null)}
          >
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute top-6 right-6 sm:top-10 sm:right-10 z-50 w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-5xl aspect-[3/4] sm:aspect-video rounded-[24px] sm:rounded-[40px] overflow-hidden border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.8)]"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
  src={selectedImage}
  alt="Enlarged view"
  fill
  quality={80}
  sizes="100vw"
  className="object-contain"
  referrerPolicy="no-referrer"
/>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
