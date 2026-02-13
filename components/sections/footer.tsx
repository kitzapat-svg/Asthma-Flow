"use client";

import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import Link from "next/link";

const footerLinks = {
  "บริการ": [
    { name: "ติดตาม PEFR", href: "#features" },
    { name: "ประเมินยาพ่น", href: "#features" },
    { name: "ลงทะเบียนผู้ป่วย", href: "#features" },
    { name: "Dashboard", href: "#features" },
  ],
  "เกี่ยวกับ": [
    { name: "เกี่ยวกับเรา", href: "#about" },
    { name: "ทีมพัฒนา", href: "#about" },
    { name: "ติดต่อ", href: "#contact" },
  ],
  "นโยบาย": [
    { name: "ความเป็นส่วนตัว", href: "#" },
    { name: "ข้อกำหนดการใช้งาน", href: "#" },
    { name: "ความปลอดภัยข้อมูล", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t-2 border-border bg-secondary">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-16">
          <div className="grid gap-12 lg:grid-cols-5">
            {/* Brand */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ type: "spring" }} className="lg:col-span-2">
              <Link href="/" className="flex items-center gap-3 group">
                <motion.div
                  className="h-10 w-10 bg-primary border-2 border-foreground flex items-center justify-center rounded-lg"
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-primary-foreground">
                    <path d="M12 4v8" strokeLinecap="round" />
                    <path d="M8 8c-2 0-4 1-4 4s1 6 4 7c2 .7 4-1 4-3V8" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M16 8c2 0 4 1 4 4s-1 6-4 7c-2 .7-4-1-4-3V8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.div>
                <span className="text-xl font-black tracking-tight text-foreground uppercase">
                  Asthma Flow
                </span>
              </Link>
              <p className="mt-4 max-w-xs text-sm text-muted-foreground font-medium leading-relaxed">
                ระบบจัดการข้อมูลผู้ป่วยโรคหอบหืดแบบครบวงจร พัฒนาเพื่อทีมแพทย์และพยาบาล
              </p>
              <div className="mt-6 flex gap-3">
                <motion.a
                  href="mailto:contact@asthmaflow.com"
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring" }}
                  whileHover={{ scale: 1.2, rotate: 5, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  className="flex h-10 w-10 items-center justify-center retro-button bg-background text-muted-foreground hover:text-foreground"
                >
                  <Mail className="h-4 w-4" />
                </motion.a>
              </div>
            </motion.div>

            {/* Links */}
            {Object.entries(footerLinks).map(([category, links], index) => (
              <motion.div key={category} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1, type: "spring" }}>
                <h3 className="text-sm font-black text-foreground uppercase tracking-wide mb-4">{category}</h3>
                <ul className="space-y-3">
                  {links.map((link, linkIndex) => (
                    <motion.li key={link.name} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 + linkIndex * 0.05 }}>
                      <Link href={link.href} className="text-sm font-bold text-muted-foreground hover:text-foreground uppercase tracking-wide transition-colors">{link.name}</Link>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div className="border-t-2 border-border py-8" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
              &copy; {new Date().getFullYear()} Asthma Flow Clinic. All rights reserved.
            </p>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
