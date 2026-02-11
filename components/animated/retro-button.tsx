"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import Link from "next/link";

interface RetroButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  href?: string;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit" | "reset";
}

export function RetroButton({
  children,
  variant = "primary",
  size = "md",
  href,
  onClick,
  className = "",
  type = "button",
}: RetroButtonProps) {
  const baseStyles = "relative inline-flex items-center justify-center gap-2 font-black uppercase tracking-wider transition-all overflow-hidden group";
  
  const sizes = {
    sm: "h-10 px-4 text-xs",
    md: "h-12 px-6 text-sm",
    lg: "h-14 px-8 text-base",
  };

  const content = (
    <>
      {/* Background fill animation */}
      <motion.span
        className="absolute inset-0 bg-foreground"
        initial={{ y: "100%" }}
        whileHover={{ y: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      />
      
      {/* Content */}
      <span className="relative z-10">
        {children}
      </span>
    </>
  );

  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return {
          backgroundColor: "var(--primary)",
          color: "var(--primary-foreground)",
          border: "2px solid var(--border)",
          boxShadow: "3px 3px 0px 0px var(--border)",
        };
      case "secondary":
        return {
          backgroundColor: "var(--secondary)",
          color: "var(--secondary-foreground)",
          border: "2px solid var(--border)",
          boxShadow: "3px 3px 0px 0px var(--border)",
        };
      case "outline":
        return {
          backgroundColor: "transparent",
          color: "var(--foreground)",
          border: "2px solid var(--border)",
          boxShadow: "3px 3px 0px 0px var(--border)",
        };
    }
  };

  const buttonClass = `${baseStyles} ${sizes[size]} ${className}`;
  const variantStyles = getVariantStyles();

  if (href) {
    return (
      <motion.div
        whileHover={{ 
          y: -2,
          boxShadow: "5px 5px 0px 0px var(--border)",
        }}
        whileTap={{ 
          y: 0,
          boxShadow: "1px 1px 0px 0px var(--border)",
        }}
        transition={{ duration: 0.1 }}
      >
        <Link
          href={href}
          className={buttonClass}
          style={variantStyles}
        >
          {content}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.button
      type={type}
      onClick={onClick}
      className={buttonClass}
      style={variantStyles}
      whileHover={{ 
        y: -2,
        boxShadow: "5px 5px 0px 0px var(--border)",
      }}
      whileTap={{ 
        y: 0,
        boxShadow: "1px 1px 0px 0px var(--border)",
      }}
      transition={{ duration: 0.1 }}
    >
      {content}
    </motion.button>
  );
}
