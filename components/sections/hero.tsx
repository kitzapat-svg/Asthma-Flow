"use client";

import { motion } from "framer-motion";
import { GlitchText } from "@/components/animated/glitch-text";
import { signIn } from "next-auth/react";

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
      <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }} className="absolute top-32 left-4 w-16 h-16 border-l-4 border-t-4 border-primary" />
      <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }} className="absolute top-32 right-4 w-16 h-16 border-r-4 border-t-4 border-primary" />
      <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.7 }} className="absolute bottom-20 left-4 w-16 h-16 border-l-4 border-b-4 border-primary" />
      <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8 }} className="absolute bottom-20 right-4 w-16 h-16 border-r-4 border-b-4 border-primary" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left content */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            {/* Badge */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="inline-flex mb-6">
              <span className="retro-badge bg-primary text-primary-foreground border-foreground">
                🏥 ASTHMA FLOW CLINIC
              </span>
            </motion.div>

            {/* Main heading */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-foreground uppercase leading-[0.9]"
            >
              <span className="block">Breathe</span>
              <GlitchText text="Better" className="block text-primary" as="span" />
              <span className="block">Live Better</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-8 text-lg text-muted-foreground max-w-md mx-auto lg:mx-0 font-medium"
            >
              ระบบจัดการข้อมูลผู้ป่วยหอบหืดแบบครบวงจร ติดตาม PEFR, ประเมินเทคนิคการใช้ยาพ่น และวิเคราะห์แนวโน้มสุขภาพ
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
            >
              <motion.button
                onClick={() => signIn("google", { callbackUrl: "/staff/dashboard" })}
                className="relative inline-flex h-14 items-center justify-center px-10 text-base font-black uppercase tracking-wider overflow-hidden group cursor-pointer"
                style={{
                  backgroundColor: "var(--primary)",
                  color: "var(--primary-foreground)",
                  border: "3px solid var(--border)",
                  boxShadow: "4px 4px 0px 0px var(--border)",
                }}
                whileHover={{ y: -3, boxShadow: "6px 6px 0px 0px var(--border)" }}
                whileTap={{ y: 0, boxShadow: "2px 2px 0px 0px var(--border)" }}
              >
                <motion.span
                  className="absolute inset-0 bg-foreground"
                  initial={{ y: "100%" }}
                  whileHover={{ y: 0 }}
                  transition={{ duration: 0.3 }}
                />
                <span className="relative z-10 group-hover:text-background transition-colors flex items-center gap-2">
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="10 17 15 12 10 7" strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="15" y1="12" x2="3" y2="12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Login
                </span>
              </motion.button>

              <motion.a
                href="#features"
                className="relative inline-flex h-14 items-center justify-center px-8 text-base font-black uppercase tracking-wider bg-transparent text-foreground border-3 border-foreground hover:bg-foreground/5 transition-colors overflow-hidden group"
                style={{ border: "3px solid var(--border)", boxShadow: "4px 4px 0px 0px var(--border)" }}
                whileHover={{ y: -3, boxShadow: "6px 6px 0px 0px var(--border)" }}
                whileTap={{ y: 0 }}
              >
                <span className="relative z-10">เรียนรู้เพิ่มเติม</span>
              </motion.a>
            </motion.div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-12 grid grid-cols-3 gap-4 max-w-md mx-auto lg:mx-0"
            >
              {[
                { value: "500+", label: "ผู้ป่วย" },
                { value: "98%", label: "ความพึงพอใจ" },
                { value: "24/7", label: "ดูแลต่อเนื่อง" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.9 + i * 0.1, type: "spring" }}
                  whileHover={{ y: -4, boxShadow: "6px 6px 0px 0px var(--border)", transition: { duration: 0.2 } }}
                  className="retro-box-sm bg-background p-4 text-center cursor-pointer"
                >
                  <motion.div className="text-2xl font-black text-foreground" whileHover={{ scale: 1.1 }} transition={{ type: "spring", stiffness: 400 }}>
                    {stat.value}
                  </motion.div>
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mt-1">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Right content - Medical Illustration */}
          <motion.div
            initial={{ opacity: 0, x: 50, rotateY: -15 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ delay: 0.4, duration: 0.8, type: "spring" }}
            className="relative order-1 lg:order-2"
          >
            {/* Main illustration card */}
            <motion.div
              className="relative bg-foreground p-4"
              style={{ boxShadow: "8px 8px 0px 0px var(--border)" }}
              whileHover={{ y: -4, boxShadow: "12px 12px 0px 0px var(--border)" }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-background border-2 border-foreground relative overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-2 px-4 py-3 border-b-2 border-foreground bg-secondary">
                  <div className="flex gap-2">
                    <motion.div className="w-3 h-3 rounded-full bg-red-500 border border-foreground" whileHover={{ scale: 1.2 }} />
                    <motion.div className="w-3 h-3 rounded-full bg-yellow-500 border border-foreground" whileHover={{ scale: 1.2 }} />
                    <motion.div className="w-3 h-3 rounded-full bg-green-500 border border-foreground" whileHover={{ scale: 1.2 }} />
                  </div>
                  <div className="flex-1 text-center text-xs font-bold text-foreground uppercase">
                    Asthma-Flow Dashboard
                  </div>
                </div>

                {/* Content - Lungs SVG illustration */}
                <div className="p-8 flex flex-col items-center justify-center min-h-[300px] relative">
                  {/* Breathing animation circles */}
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <div className="w-48 h-48 rounded-full border-2 border-primary/30" />
                  </motion.div>
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    animate={{ scale: [1.1, 1, 1.1], opacity: [0.05, 0.15, 0.05] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  >
                    <div className="w-64 h-64 rounded-full border-2 border-primary/20" />
                  </motion.div>

                  {/* Central Lungs SVG */}
                  <motion.svg
                    viewBox="0 0 200 180"
                    className="w-48 h-48 relative z-10"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                  >
                    {/* Trachea */}
                    <motion.rect x="95" y="10" width="10" height="50" rx="5" fill="var(--primary)" opacity="0.8" />
                    {/* Left bronchus */}
                    <motion.path d="M100 50 Q80 60 65 80" stroke="var(--primary)" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.7" />
                    {/* Right bronchus */}
                    <motion.path d="M100 50 Q120 60 135 80" stroke="var(--primary)" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.7" />
                    {/* Left lung */}
                    <motion.ellipse
                      cx="60" cy="115" rx="45" ry="55"
                      fill="var(--primary)" opacity="0.15"
                      stroke="var(--primary)" strokeWidth="2"
                      animate={{ rx: [45, 48, 45], ry: [55, 58, 55] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    />
                    {/* Right lung */}
                    <motion.ellipse
                      cx="140" cy="115" rx="45" ry="55"
                      fill="var(--primary)" opacity="0.15"
                      stroke="var(--primary)" strokeWidth="2"
                      animate={{ rx: [45, 48, 45], ry: [55, 58, 55] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    />
                    {/* Left lung detail lines */}
                    <motion.path d="M40 100 Q55 105 65 95" stroke="var(--primary)" strokeWidth="1.5" fill="none" opacity="0.4" />
                    <motion.path d="M35 120 Q55 125 70 115" stroke="var(--primary)" strokeWidth="1.5" fill="none" opacity="0.4" />
                    <motion.path d="M40 140 Q55 145 65 135" stroke="var(--primary)" strokeWidth="1.5" fill="none" opacity="0.4" />
                    {/* Right lung detail lines */}
                    <motion.path d="M160 100 Q145 105 135 95" stroke="var(--primary)" strokeWidth="1.5" fill="none" opacity="0.4" />
                    <motion.path d="M165 120 Q145 125 130 115" stroke="var(--primary)" strokeWidth="1.5" fill="none" opacity="0.4" />
                    <motion.path d="M160 140 Q145 145 135 135" stroke="var(--primary)" strokeWidth="1.5" fill="none" opacity="0.4" />
                  </motion.svg>

                  {/* PEFR Graph preview */}
                  <div className="mt-4 w-full px-4">
                    <div className="flex items-end justify-between h-16 gap-1">
                      {[40, 55, 45, 65, 70, 60, 80, 75, 85, 90, 82, 88].map((height, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${height}%` }}
                          transition={{ delay: 1.0 + i * 0.05, duration: 0.5, type: "spring", stiffness: 100 }}
                          whileHover={{ backgroundColor: "var(--primary)", scale: 1.1 }}
                          className="flex-1 bg-primary/40 border border-primary/60 cursor-pointer"
                          style={{ minWidth: "6px" }}
                        />
                      ))}
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase text-center mt-2">PEFR Trend (L/min)</p>
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

            {/* Floating card - PEFR */}
            <motion.div
              initial={{ opacity: 0, x: -50, rotate: -10 }}
              animate={{ opacity: 1, x: 0, rotate: 0 }}
              transition={{ delay: 1.2, type: "spring" }}
              whileHover={{ scale: 1.05, rotate: 2, boxShadow: "6px 6px 0px 0px var(--border)" }}
              className="absolute -left-8 top-1/4 retro-box bg-background p-3 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  className="h-8 w-8 bg-green-600 border-2 border-foreground flex items-center justify-center"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className="text-white text-xs font-black">✓</span>
                </motion.div>
                <div>
                  <p className="text-[10px] font-bold text-foreground uppercase">PEFR</p>
                  <p className="text-xs font-black text-primary">420 L/min</p>
                </div>
              </div>
            </motion.div>

            {/* Floating card - Inhaler */}
            <motion.div
              initial={{ opacity: 0, x: 50, rotate: 10 }}
              animate={{ opacity: 1, x: 0, rotate: 0 }}
              transition={{ delay: 1.4, type: "spring" }}
              whileHover={{ scale: 1.05, rotate: -2, boxShadow: "6px 6px 0px 0px var(--border)" }}
              className="absolute -right-4 bottom-1/4 retro-box bg-background p-3 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  className="h-8 w-8 bg-primary border-2 border-foreground flex items-center justify-center"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <span className="text-primary-foreground text-xs font-black">💊</span>
                </motion.div>
                <div>
                  <p className="text-[10px] font-bold text-foreground uppercase">เทคนิคยาพ่น</p>
                  <p className="text-xs font-black text-foreground">ผ่านเกณฑ์</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5 }} className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="flex flex-col items-center gap-2 cursor-pointer group">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">Scroll</span>
          <motion.div className="w-6 h-10 border-2 border-foreground flex items-start justify-center p-1 group-hover:border-primary transition-colors" whileHover={{ scale: 1.1 }}>
            <motion.div animate={{ y: [0, 16, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="w-2 h-3 bg-primary" />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}
