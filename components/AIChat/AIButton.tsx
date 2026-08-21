"use client";

import { MessageCircle } from "lucide-react";
import { motion } from "motion/react";

interface Props {
  onClick: () => void;
}

export default function AIButton({ onClick }: Props) {
  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{
        scale: 1.08,
        rotate: 5,
      }}
      whileTap={{
        scale: 0.95,
      }}
      transition={{
        type: "spring",
        stiffness: 250,
      }}
      onClick={onClick}
      className="fixed bottom-6 right-6 z-[9999] w-16 h-16 rounded-full bg-[#E63946] shadow-[0_20px_40px_rgba(230,57,70,0.4)] flex items-center justify-center text-white hover:bg-red-600"
    >
      <MessageCircle size={30} />

      {/* Online Indicator */}
      <span className="absolute top-2 right-2 w-3 h-3 rounded-full bg-green-400 border-2 border-white animate-pulse" />
    </motion.button>
  );
}