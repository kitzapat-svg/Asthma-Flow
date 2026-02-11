"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { GlitchText } from "@/components/animated/glitch-text";
import { RetroButton } from "@/components/animated/retro-button";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-32 pb-20 overflow-hidden">
      {/* Retro Grid Background */}
      <div className="absolute inset-0 retro-grid opacity-50" />
      
      {/* Animated background lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-[2px] bg-primary/20 w-full"
            style={{ top: `${20 + i * 15}%` }}
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              ease: "linear",
              delay: i * 0.5,
            }}
          />
        ))}
      </div>
      
      {/* Decorative corners */}
      <motion.div 
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute top-32 left-4 w-16 h-16 border-l-4 border-t-4 border-primary" 
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6 }}
        className="absolute top-32 right-4 w-16 h-16 border-r-4 border-t-4 border-primary" 
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.7 }}
        className="absolute bottom-20 left-4 w-16 h-16 border-l-4 border-b-4 border-primary" 
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-20 right-4 w-16 h-16 border-r-4 border-b-4 border-primary" 
      />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left content */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex mb-6"
            >
              <Link href="/features">
                <span className="retro-badge bg-primary text-primary-foreground border-foreground cursor-pointer hover:opacity-90 transition-opacity">
                  NOW AVAILABLE
                </span>
              </Link>
            </motion.div>

            {/* Main heading */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-foreground uppercase leading-[0.9]"
            >
              <span className="block">Build</span>
              <GlitchText 
                text="The Future" 
                className="block text-primary"
                as="span"
              />
              <span className="block">Today</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-8 text-lg text-muted-foreground max-w-md mx-auto lg:mx-0 font-medium"
            >
              Empower your business with cutting-edge solutions. 
              Scale efficiently with our comprehensive suite of modern tools.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
            >
              <RetroButton 
                href="/contact" 
                variant="primary" 
                size="lg"
              >
                Start Building
              </RetroButton>
              
              <RetroButton 
                href="/features" 
                variant="outline" 
                size="lg"
              >
                Learn More
              </RetroButton>
            </motion.div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-12 grid grid-cols-3 gap-4 max-w-md mx-auto lg:mx-0"
            >
              {[
                { value: "50K+", label: "Users" },
                { value: "99%", label: "Uptime" },
                { value: "24/7", label: "Support" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.9 + i * 0.1, type: "spring" }}
                  whileHover={{ 
                    y: -4, 
                    boxShadow: "6px 6px 0px 0px var(--border)",
                    transition: { duration: 0.2 }
                  }}
                  className="retro-box-sm bg-background p-4 text-center cursor-pointer"
                >
                  <motion.div 
                    className="text-2xl font-black text-foreground"
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    {stat.value}
                  </motion.div>
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mt-1">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Right content - Retro Monitor */}
          <motion.div
            initial={{ opacity: 0, x: 50, rotateY: -15 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ delay: 0.4, duration: 0.8, type: "spring" }}
            className="relative order-1 lg:order-2"
          >
            {/* Monitor Frame */}
            <motion.div 
              className="relative bg-foreground p-4"
              style={{ boxShadow: "8px 8px 0px 0px var(--border)" }}
              whileHover={{ 
                y: -4,
                boxShadow: "12px 12px 0px 0px var(--border)",
              }}
              transition={{ duration: 0.2 }}
            >
              {/* Screen */}
              <div className="bg-background border-2 border-foreground relative overflow-hidden">
                {/* Screen header */}
                <div className="flex items-center gap-2 px-4 py-3 border-b-2 border-foreground bg-secondary">
                  <div className="flex gap-2">
                    <motion.div 
                      className="w-3 h-3 rounded-full bg-red-500 border border-foreground"
                      whileHover={{ scale: 1.2 }}
                    />
                    <motion.div 
                      className="w-3 h-3 rounded-full bg-yellow-500 border border-foreground"
                      whileHover={{ scale: 1.2 }}
                    />
                    <motion.div 
                      className="w-3 h-3 rounded-full bg-green-500 border border-foreground"
                      whileHover={{ scale: 1.2 }}
                    />
                  </div>
                  <div className="flex-1 text-center text-xs font-bold text-foreground uppercase">
                    Dashboard.app
                  </div>
                </div>

                {/* Screen content */}
                <div className="p-6 space-y-4">
                  {/* Chart bars */}
                  <div className="flex items-end justify-between h-40 gap-2">
                    {[60, 85, 45, 95, 70, 100, 80, 90, 65, 75].map((height, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ 
                          delay: 0.8 + i * 0.05, 
                          duration: 0.5,
                          type: "spring",
                          stiffness: 100
                        }}
                        whileHover={{ 
                          backgroundColor: "var(--primary)",
                          scale: 1.1,
                        }}
                        className="flex-1 bg-foreground/70 border-2 border-foreground cursor-pointer"
                        style={{ minWidth: '8px' }}
                      />
                    ))}
                  </div>

                  {/* Stats boxes */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Revenue", value: "$48.2K", color: "bg-green-500/20" },
                      { label: "Growth", value: "+24%", color: "bg-primary/20" },
                      { label: "Users", value: "2,420", color: "bg-amber-500/20" },
                    ].map((stat, i) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ 
                          delay: 1.2 + i * 0.1,
                          type: "spring",
                          stiffness: 200
                        }}
                        whileHover={{ 
                          scale: 1.05,
                          y: -2,
                        }}
                        className={`border-2 border-foreground p-3 ${stat.color} cursor-pointer`}
                      >
                        <div className="text-[10px] font-bold text-muted-foreground uppercase">
                          {stat.label}
                        </div>
                        <div className="text-lg font-black text-foreground">
                          {stat.value}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Monitor stand */}
              <div className="mt-4 flex justify-center">
                <div className="w-32 h-6 bg-foreground border-2 border-background" />
              </div>
              <div className="flex justify-center">
                <div className="w-48 h-4 bg-foreground border-2 border-background" />
              </div>
            </motion.div>

            {/* Floating notification cards */}
            <motion.div
              initial={{ opacity: 0, x: -50, rotate: -10 }}
              animate={{ opacity: 1, x: 0, rotate: 0 }}
              transition={{ delay: 1.2, type: "spring" }}
              whileHover={{ 
                scale: 1.05, 
                rotate: 2,
                boxShadow: "6px 6px 0px 0px var(--border)",
              }}
              className="absolute -left-8 top-1/4 retro-box bg-background p-3 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <motion.div 
                  className="h-8 w-8 bg-green-600 border-2 border-foreground flex items-center justify-center"
                  animate={{ 
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className="text-white text-xs font-black">$</span>
                </motion.div>
                <div>
                  <p className="text-[10px] font-bold text-foreground uppercase">Payment</p>
                  <p className="text-xs font-black text-primary">+$2,450</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50, rotate: 10 }}
              animate={{ opacity: 1, x: 0, rotate: 0 }}
              transition={{ delay: 1.4, type: "spring" }}
              whileHover={{ 
                scale: 1.05, 
                rotate: -2,
                boxShadow: "6px 6px 0px 0px var(--border)",
              }}
              className="absolute -right-4 bottom-1/4 retro-box bg-background p-3 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <motion.div 
                  className="h-8 w-8 bg-primary border-2 border-foreground flex items-center justify-center"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <span className="text-primary-foreground text-xs font-black">+</span>
                </motion.div>
                <div>
                  <p className="text-[10px] font-bold text-foreground uppercase">New User</p>
                  <p className="text-xs font-black text-foreground">Just now</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2 cursor-pointer group"
        >
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
            Scroll
          </span>
          <motion.div 
            className="w-6 h-10 border-2 border-foreground flex items-start justify-center p-1 group-hover:border-primary transition-colors"
            whileHover={{ scale: 1.1 }}
          >
            <motion.div
              animate={{ y: [0, 16, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-2 h-3 bg-primary"
            />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
