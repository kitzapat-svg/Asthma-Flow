"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-11 w-11 border-2 border-foreground bg-background" />
    );
  }

  const isDark = theme === "dark";

  return (
    <motion.button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="h-11 w-11 retro-button bg-background flex items-center justify-center relative overflow-hidden"
      aria-label="Toggle theme"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Animated background fill */}
      <motion.div
        className="absolute inset-0 bg-primary"
        initial={{ y: isDark ? "100%" : "-100%" }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Icon container */}
      <div className="relative z-10">
        <motion.div
          key={isDark ? "sun" : "moon"}
          initial={{ rotate: -90, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          exit={{ rotate: 90, scale: 0 }}
          transition={{ duration: 0.2 }}
        >
          {isDark ? (
            <Sun className="h-4 w-4 text-primary-foreground" />
          ) : (
            <Moon className="h-4 w-4 text-foreground" />
          )}
        </motion.div>
      </div>
    </motion.button>
  );
}
