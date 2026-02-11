"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface MarqueeProps {
  children: ReactNode;
  speed?: number;
  direction?: "left" | "right";
  className?: string;
  pauseOnHover?: boolean;
}

export function Marquee({
  children,
  speed = 20,
  direction = "left",
  className = "",
  pauseOnHover = true,
}: MarqueeProps) {
  return (
    <div 
      className={`overflow-hidden ${className}`}
      style={{ 
        maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)"
      }}
    >
      <motion.div
        className="flex gap-8 whitespace-nowrap"
        animate={{
          x: direction === "left" ? [0, "-50%"] : ["-50%", 0],
        }}
        transition={{
          x: {
            duration: speed,
            repeat: Infinity,
            ease: "linear",
          },
        }}
        whileHover={pauseOnHover ? { animationPlayState: "paused" } : undefined}
      >
        {/* Duplicate content for seamless loop */}
        <div className="flex gap-8 items-center">
          {children}
        </div>
        <div className="flex gap-8 items-center">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

// Retro Ticker Item
interface TickerItemProps {
  text: string;
  icon?: ReactNode;
}

export function TickerItem({ text, icon }: TickerItemProps) {
  return (
    <div className="flex items-center gap-3 px-4">
      {icon && <span className="text-primary">{icon}</span>}
      <span className="font-black text-foreground uppercase tracking-wider text-sm">
        {text}
      </span>
      <span className="text-primary text-lg">★</span>
    </div>
  );
}
