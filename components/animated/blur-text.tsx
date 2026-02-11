"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface BlurTextProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}

export function BlurText({
  children,
  className = "",
  delay = 0,
  duration = 0.5,
}: BlurTextProps) {
  return (
    <motion.div
      initial={{ filter: "blur(10px)", opacity: 0 }}
      animate={{ filter: "blur(0px)", opacity: 1 }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.4, 0.25, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
