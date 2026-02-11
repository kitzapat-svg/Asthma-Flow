"use client";

import { motion } from "framer-motion";

interface GlitchTextProps {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "span" | "p";
}

export function GlitchText({ 
  text, 
  className = "",
  as: Component = "span"
}: GlitchTextProps) {
  return (
    <motion.span
      className={`relative inline-block ${className}`}
      whileHover="glitch"
      initial="initial"
    >
      <Component className="relative z-10">{text}</Component>
      
      {/* Glitch layers */}
      <motion.span
        className="absolute inset-0 text-primary opacity-0"
        variants={{
          initial: { opacity: 0, x: 0 },
          glitch: {
            opacity: [0, 1, 0, 1, 0],
            x: [-2, 2, -2, 0],
            transition: { duration: 0.3 }
          }
        }}
        aria-hidden
      >
        {text}
      </motion.span>
      
      <motion.span
        className="absolute inset-0 text-cyan-500 opacity-0"
        variants={{
          initial: { opacity: 0, x: 0 },
          glitch: {
            opacity: [0, 1, 0, 1, 0],
            x: [2, -2, 2, 0],
            transition: { duration: 0.3, delay: 0.05 }
          }
        }}
        aria-hidden
      >
        {text}
      </motion.span>
    </motion.span>
  );
}

// Typewriter Effect
interface TypewriterProps {
  text: string;
  className?: string;
  delay?: number;
  speed?: number;
}

export function Typewriter({ 
  text, 
  className = "",
  delay = 0,
  speed = 50
}: TypewriterProps) {
  const characters = text.split("");
  
  return (
    <span className={className}>
      {characters.map((char, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.1,
            delay: delay + index * (speed / 1000),
            ease: "easeOut"
          }}
        >
          {char}
        </motion.span>
      ))}
      <motion.span
        className="inline-block w-2 h-[1em] bg-primary ml-1"
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
      />
    </span>
  );
}
