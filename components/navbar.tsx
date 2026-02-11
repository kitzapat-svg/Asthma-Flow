"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { name: "Features", href: "/features" },
  { name: "About", href: "/about" },
  { name: "Reviews", href: "/reviews" },
  { name: "Contact", href: "/contact" },
];

// Animated Nav Link Component
function NavLink({ href, children, isActive }: { href: string; children: React.ReactNode; isActive?: boolean }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ y: 0 }}
    >
      <Link
        href={href}
        className={`relative px-4 py-2 text-sm font-bold transition-colors uppercase tracking-wide group ${
          isActive ? "text-primary" : "text-foreground hover:text-primary"
        }`}
      >
        {children}
        {/* Animated underline */}
        <motion.span
          className="absolute bottom-0 left-0 w-full h-0.5 bg-primary origin-left"
          initial={{ scaleX: isActive ? 1 : 0 }}
          whileHover={{ scaleX: 1 }}
          transition={{ duration: 0.2 }}
        />
      </Link>
    </motion.div>
  );
}

// Animated Button Component
function NavButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ y: 0 }}
    >
      <Link
        href={href}
        className="relative inline-flex h-11 items-center justify-center px-6 text-sm font-bold uppercase tracking-wider overflow-hidden group"
        style={{
          backgroundColor: "var(--primary)",
          color: "var(--primary-foreground)",
          border: "2px solid var(--border)",
          boxShadow: "3px 3px 0px 0px var(--border)",
        }}
      >
        {/* Fill animation */}
        <motion.span
          className="absolute inset-0 bg-foreground"
          initial={{ y: "100%" }}
          whileHover={{ y: 0 }}
          transition={{ duration: 0.3 }}
        />
        <span className="relative z-10 group-hover:text-background transition-colors">
          {children}
        </span>
      </Link>
    </motion.div>
  );
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
      className="fixed top-0 left-0 right-0 z-50 px-4 pt-4"
    >
      <div className="mx-auto max-w-7xl">
        <motion.nav
          className="flex h-16 items-center justify-between px-6 bg-background retro-box"
        >
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link href="/" className="flex items-center gap-3 group">
              <motion.div 
                className="h-10 w-10 bg-primary border-2 border-foreground flex items-center justify-center"
                whileHover={{ 
                  rotate: 10,
                  scale: 1.1,
                }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <span className="text-primary-foreground font-black text-lg">B</span>
              </motion.div>
              <span className="text-lg font-black tracking-tight text-foreground uppercase">
                Brand
              </span>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <NavLink 
                key={link.name} 
                href={link.href}
                isActive={pathname === link.href}
              >
                {link.name}
              </NavLink>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="hidden sm:block">
              <NavButton href="/contact">
                Get Started
              </NavButton>
            </div>

            {/* Mobile menu button */}
            <motion.button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden h-11 w-11 flex items-center justify-center retro-button bg-background"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <AnimatePresence mode="wait">
                {isOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="h-5 w-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="h-5 w-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </motion.nav>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden mx-auto max-w-7xl px-4 mt-2 overflow-hidden"
          >
            <nav className="bg-background retro-box p-4 space-y-2">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    href={link.href}
                    className={`block px-4 py-3 text-sm font-bold uppercase tracking-wide border-b-2 border-border last:border-0 transition-colors ${
                      pathname === link.href 
                        ? "text-primary bg-secondary" 
                        : "text-foreground hover:bg-secondary"
                    }`}
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-3"
              >
                <Link
                  href="/contact"
                  className="block text-center py-3 text-sm font-bold uppercase tracking-wider retro-button-primary"
                >
                  Get Started
                </Link>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
