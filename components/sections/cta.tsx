"use client";

import { motion } from "framer-motion";
import { signIn } from "next-auth/react";

export function CTA() {
  return (
    <section id="contact" className="py-24 lg:py-32 relative overflow-hidden">
      <div className="absolute inset-0 retro-dots opacity-30" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-32 h-32 border-2 border-primary/10"
            style={{ top: `${20 + i * 20}%`, left: `${10 + i * 25}%` }}
            animate={{ rotate: [0, 90, 180, 270, 360], scale: [1, 1.1, 1] }}
            transition={{ duration: 20 + i * 5, repeat: Infinity, ease: "linear" }}
          />
        ))}
      </div>

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true }} transition={{ type: "spring", stiffness: 100 }} className="relative">
          <motion.div
            className="retro-box bg-secondary p-8 sm:p-12 lg:p-16 relative"
            whileHover={{ y: -4, boxShadow: "10px 10px 0px 0px var(--border)" }}
            transition={{ duration: 0.2 }}
          >
            {/* Corners */}
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="absolute w-6 h-6 bg-primary border-2 border-foreground"
                style={{ top: i < 2 ? -12 : "auto", bottom: i >= 2 ? -12 : "auto", left: i % 2 === 0 ? -12 : "auto", right: i % 2 === 1 ? -12 : "auto" }}
                initial={{ scale: 0, rotate: -180 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 + i * 0.1, type: "spring", stiffness: 200 }}
                whileHover={{ scale: 1.2, rotate: 90 }}
              />
            ))}

            <div className="text-center">
              <motion.h2 initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground uppercase">
                พร้อมเริ่มใช้งาน
                <br />
                Asthma Flow?
              </motion.h2>

              <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto font-medium">
                เข้าสู่ระบบด้วย Google Account ของโรงพยาบาลเพื่อเริ่มจัดการข้อมูลผู้ป่วยหอบหืดได้ทันที
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
                {["ใช้งานฟรี", "ไม่ต้องติดตั้ง", "ปลอดภัย 100%"].map((benefit, index) => (
                  <motion.div key={benefit} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 + index * 0.1 }} whileHover={{ scale: 1.05 }} className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
                    ✓ {benefit}
                  </motion.div>
                ))}
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 }} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <motion.button
                  onClick={() => signIn("google", { callbackUrl: "/staff/dashboard" })}
                  className="inline-flex h-14 items-center justify-center px-10 text-base font-black uppercase tracking-wider overflow-hidden group cursor-pointer"
                  style={{
                    backgroundColor: "var(--primary)",
                    color: "var(--primary-foreground)",
                    border: "3px solid var(--border)",
                    boxShadow: "4px 4px 0px 0px var(--border)",
                  }}
                  whileHover={{ y: -3, boxShadow: "6px 6px 0px 0px var(--border)" }}
                  whileTap={{ y: 0, boxShadow: "2px 2px 0px 0px var(--border)" }}
                >
                  <span className="flex items-center gap-2">
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" strokeLinecap="round" strokeLinejoin="round" />
                      <polyline points="10 17 15 12 10 7" strokeLinecap="round" strokeLinejoin="round" />
                      <line x1="15" y1="12" x2="3" y2="12" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Login เข้าสู่ระบบ
                  </span>
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
