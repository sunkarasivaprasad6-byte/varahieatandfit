'use client';

import { motion } from 'motion/react';
import Image from 'next/image';
import { Users, ChefHat, Star, Clock, CheckCircle2 } from 'lucide-react';

const stats = [
  { value: '15k+', label: 'Happy Customers', icon: <Users className="w-5 h-5" /> },
  { value: '50+', label: 'Expert Chefs', icon: <ChefHat className="w-5 h-5" /> },
  { value: '4.9', label: 'Overall Rating', icon: <Star className="w-5 h-5" /> },
  { value: '25+', label: 'Signature Dishes', icon: <Star className="w-5 h-5" /> },
];

const highlights = [
  '100% Organic & Fresh Ingredients',
  'World-Class Chef Quality',
  'Unforgettable Dining Experience',
  'Exclusive Signature Dishes'
];

export default function WhyChooseUs() {
  return (
    <section id="about" className="py-24 bg-transparent relative overflow-hidden">
      {/* Soft background gradients */}
      <div className="absolute top-1/4 -left-[10%] w-[40vw] h-[40vw] bg-[#d91f27]/5 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-1/4 -right-[10%] w-[30vw] h-[30vw] bg-white/5 rounded-full blur-[100px] pointer-events-none z-0" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left: Large Restaurant Image */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="relative w-full aspect-[4/5] sm:aspect-[3/4] rounded-[40px] overflow-hidden border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.6)]">
              <div className="absolute inset-0 bg-black/20 z-10 pointer-events-none" />
              <Image 
                src="https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=1200&q=80"
                alt="Our Restaurant Experience"
                fill
                sizes="(max-width:768px) 100vw, (max-width:1200px) 50vw, 33vw"
                className="object-cover transition-transform duration-1000 hover:scale-105"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Floating Glass Card */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="absolute -bottom-8 -right-4 sm:-right-8 bg-gradient-to-br from-[#1a1a1a]/90 to-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 p-6 rounded-[24px] shadow-[0_20px_40px_rgba(0,0,0,0.5)] flex items-center gap-4 z-20"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#d91f27] to-[#ba151c] flex items-center justify-center shadow-lg">
                <span className="font-playfair text-3xl font-bold text-white">15</span>
              </div>
              <div>
                <p className="font-jakarta text-white font-bold text-lg leading-tight">Years of</p>
                <p className="font-jakarta text-white/60 text-sm uppercase tracking-wider">Experience</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right: Premium Content */}
          <div className="flex flex-col">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-[#d91f27] font-jakarta text-sm font-bold tracking-widest uppercase mb-4 flex items-center gap-3">
                <span className="w-8 h-[2px] bg-[#d91f27]" />
                Our Story
              </p>
              <h2 className="font-playfair text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Where Passion <br />
                <span className="font-light italic text-white/90">Meets Perfection</span>
              </h2>
              <p className="text-white/60 font-jakarta text-lg leading-relaxed mb-8">
                Since our inception, we have been committed to providing an extraordinary culinary journey. We blend traditional techniques with modern innovation, ensuring every dish tells a story of passion, uncompromising chef quality, and unparalleled taste. 
              </p>
            </motion.div>

            {/* Highlights */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="grid sm:grid-cols-2 gap-y-4 gap-x-6 mb-10"
            >
              {highlights.map((item, i) => (
                <div key={i} className="flex items-center gap-3 group">
                  <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-[#d91f27]/20 group-hover:border-[#d91f27]/30 transition-colors">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#d91f27]" />
                  </div>
                  <span className="text-white/80 font-jakarta text-sm font-medium">{item}</span>
                </div>
              ))}
            </motion.div>

            {/* Stats Glass Cards */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="grid grid-cols-2 gap-4"
            >
              {stats.map((stat, index) => (
                <div 
                  key={index}
                  className="relative group bg-gradient-to-b from-white/[0.05] to-transparent backdrop-blur-md border border-white/10 rounded-[24px] p-5 hover:bg-white/[0.08] transition-all duration-300 hover:-translate-y-1 shadow-lg"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#d91f27]/0 to-transparent group-hover:from-[#d91f27]/5 transition-colors duration-500 rounded-[24px] pointer-events-none" />
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-[#141414] border border-white/5 flex items-center justify-center text-[#d91f27] group-hover:scale-110 transition-transform duration-300 shadow-md">
                      {stat.icon}
                    </div>
                    <div className="flex flex-col">
                      <h4 className="text-2xl font-playfair font-bold text-white mb-0.5">{stat.value}</h4>
                      <p className="text-white/50 font-jakarta text-[10px] uppercase tracking-wider font-semibold">{stat.label}</p>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>

          </div>
        </div>
      </div>
    </section>
  );
}
