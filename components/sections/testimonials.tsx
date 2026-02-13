"use client";

import { motion } from "framer-motion";
import { RetroCard } from "@/components/animated/card-3d";

const testimonials = [
  {
    content: "ระบบ Asthma Flow ช่วยให้เราติดตามผู้ป่วยได้ง่ายขึ้นมาก ดูกราฟ PEFR ย้อนหลังได้ทันที ไม่ต้องเปิดแฟ้มเอกสาร",
    author: "พญ. สมศรี",
    role: "แพทย์ประจำคลินิก",
    initials: "สศ",
  },
  {
    content: "การประเมินเทคนิคยาพ่นเป็นระบบมาก ช่วยให้เห็นพัฒนาการของผู้ป่วยในแต่ละครั้งที่มาตรวจ เก็บข้อมูลเป็นระเบียบ",
    author: "พย. วิภา",
    role: "พยาบาลผู้เชี่ยวชาญ",
    initials: "วภ",
  },
  {
    content: "ลงทะเบียนผู้ป่วยใหม่ได้รวดเร็ว ระบบคำนวณค่า PEFR อัตโนมัติ ประหยัดเวลาทำงานไปเยอะมาก แนะนำเลย",
    author: "พย. มานี",
    role: "พยาบาลวิชาชีพ",
    initials: "มน",
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-24 lg:py-32 relative">
      <div className="absolute inset-0 retro-dots opacity-30" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ type: "spring" }} className="inline-block mb-6">
            <motion.span className="retro-badge bg-secondary text-foreground" whileHover={{ scale: 1.05 }}>
              รีวิว
            </motion.span>
          </motion.div>
          <motion.h2 initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground uppercase">
            เสียงจากผู้ใช้งาน
          </motion.h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 40, rotateX: -10 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
            >
              <RetroCard className="p-6 sm:p-8 group cursor-pointer">
                <div className="mb-6 text-6xl font-black text-primary/30 leading-none">&ldquo;</div>
                <p className="text-foreground leading-relaxed mb-6 font-medium">{testimonial.content}</p>
                <motion.div className="flex items-center gap-4 pt-4 border-t-2 border-border" whileHover={{ x: 4 }}>
                  <motion.div
                    className="h-12 w-12 bg-secondary border-2 border-foreground flex items-center justify-center"
                    whileHover={{ scale: 1.1, rotate: 5, backgroundColor: "var(--primary)" }}
                    transition={{ type: "spring" }}
                  >
                    <span className="text-sm font-black text-foreground">{testimonial.initials}</span>
                  </motion.div>
                  <div>
                    <p className="font-black text-foreground uppercase text-sm tracking-wide">{testimonial.author}</p>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{testimonial.role}</p>
                  </div>
                </motion.div>
              </RetroCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
