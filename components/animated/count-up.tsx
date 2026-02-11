"use client";

import { motion, useSpring, useTransform, useInView } from "framer-motion";
import { useRef, useEffect } from "react";

interface CountUpProps {
  target: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  duration?: number;
}

export function CountUp({ 
  target, 
  suffix = "", 
  prefix = "",
  className = "",
  duration = 2
}: CountUpProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  const spring = useSpring(0, { 
    stiffness: 50, 
    damping: 20,
    duration: duration * 1000
  });
  
  const display = useTransform(spring, (current) => 
    Math.floor(current).toLocaleString()
  );

  useEffect(() => {
    if (isInView) {
      spring.set(target);
    }
  }, [isInView, spring, target]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      <motion.span>{display}</motion.span>
      {suffix}
    </span>
  );
}

// Animated Counter with flip effect
interface FlipCounterProps {
  value: number;
  className?: string;
}

export function FlipCounter({ value, className = "" }: FlipCounterProps) {
  const digits = value.toString().split("");
  
  return (
    <div className={`flex ${className}`}>
      {digits.map((digit, index) => (
        <motion.div
          key={`${index}-${digit}`}
          initial={{ rotateX: -90, opacity: 0 }}
          animate={{ rotateX: 0, opacity: 1 }}
          transition={{ 
            duration: 0.3,
            delay: index * 0.05,
            type: "spring",
            stiffness: 200
          }}
          className="relative w-8 h-12 bg-foreground border-2 border-border flex items-center justify-center"
          style={{ perspective: 400 }}
        >
          <span className="text-xl font-black text-background">{digit}</span>
        </motion.div>
      ))}
    </div>
  );
}
