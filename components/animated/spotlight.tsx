"use client";

import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { ReactNode, useRef } from "react";

interface SpotlightProps {
  children: ReactNode;
  className?: string;
  spotlightColor?: string;
}

export function Spotlight({ 
  children, 
  className = "",
  spotlightColor = "rgba(217, 119, 6, 0.15)"
}: SpotlightProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      className={`relative overflow-hidden ${className}`}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              400px circle at ${mouseX}px ${mouseY}px,
              ${spotlightColor},
              transparent 80%
            )
          `,
        }}
      />
      {children}
    </motion.div>
  );
}

// Retro Grid Spotlight
interface GridSpotlightProps {
  children: ReactNode;
  className?: string;
}

export function GridSpotlight({ children, className = "" }: GridSpotlightProps) {
  return (
    <div className={`relative group ${className}`}>
      {/* Animated border */}
      <motion.div
        className="absolute -inset-[1px] bg-gradient-to-r from-primary via-transparent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ zIndex: -1 }}
      />
      
      {/* Corner accents */}
      <motion.div
        className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-primary opacity-0 group-hover:opacity-100"
        initial={{ scale: 0 }}
        whileHover={{ scale: 1 }}
      />
      <motion.div
        className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-primary opacity-0 group-hover:opacity-100"
        initial={{ scale: 0 }}
        whileHover={{ scale: 1 }}
      />
      <motion.div
        className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-primary opacity-0 group-hover:opacity-100"
        initial={{ scale: 0 }}
        whileHover={{ scale: 1 }}
      />
      <motion.div
        className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-primary opacity-0 group-hover:opacity-100"
        initial={{ scale: 0 }}
        whileHover={{ scale: 1 }}
      />
      
      {children}
    </div>
  );
}
