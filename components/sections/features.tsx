"use client";

import { motion } from "framer-motion";
import { RetroCard } from "@/components/animated/card-3d";

const features = [
  {
    title: "ติดตาม PEFR",
    description: "บันทึกและติดตามค่า Peak Expiratory Flow Rate ของผู้ป่วยทุกครั้งที่มาตรวจ พร้อมกราฟแนวโน้มแบบ Real-time",
    icon: "📊",
    delay: 0,
  },
  {
    title: "ประเมินเทคนิคยาพ่น",
    description: "ประเมินเทคนิคการใช้ยา Inhaler แบบทีละขั้นตอน พร้อมคะแนนและคำแนะนำเพื่อปรับปรุง",
    icon: "💊",
    delay: 0.1,
  },
  {
    title: "ลงทะเบียนผู้ป่วย",
    description: "ระบบลงทะเบียนผู้ป่วยรายใหม่พร้อมข้อมูลประจำตัว ประวัติโรค และข้อมูล Baseline",
    icon: "📋",
    delay: 0.2,
  },
  {
    title: "บันทึกการมาตรวจ",
    description: "บันทึกข้อมูลทุกครั้งที่ผู้ป่วยมา Visit ได้ง่ายและรวดเร็ว พร้อมระบบคำนวณอัตโนมัติ",
    icon: "🏥",
    delay: 0.3,
  },
  {
    title: "Dashboard วิเคราะห์",
    description: "แดชบอร์ดสรุปภาพรวมคลินิก สถิติผู้ป่วย กราฟวิเคราะห์ และรายงานแบบ Interactive",
    icon: "📈",
    delay: 0.4,
  },
  {
    title: "ระบบ Login ปลอดภัย",
    description: "เข้าสู่ระบบด้วย Google Account ของโรงพยาบาล พร้อมระบบจัดการสิทธิ์การเข้าถึงข้อมูล",
    icon: "🔐",
    delay: 0.5,
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 lg:py-32 relative">
      <div className="absolute inset-0 retro-dots opacity-30" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ type: "spring" }} className="inline-block mb-6">
            <motion.span className="retro-badge bg-secondary text-foreground" whileHover={{ scale: 1.05 }}>
              Features
            </motion.span>
          </motion.div>
          <motion.h2 initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground uppercase">
            ฟีเจอร์ครบครัน
          </motion.h2>
          <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
            เครื่องมือที่จำเป็นทั้งหมดสำหรับการจัดการคลินิกโรคหอบหืดอย่างมีประสิทธิภาพ
          </motion.p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: feature.delay, type: "spring", stiffness: 100 }}
            >
              <RetroCard className="h-full p-6 sm:p-8 group cursor-pointer">
                <div className="mb-4 text-4xl">{feature.icon}</div>
                <h3 className="text-lg font-black text-foreground uppercase tracking-wide mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed font-medium">{feature.description}</p>
                <motion.div className="absolute top-0 right-0 w-0 h-0 border-t-[40px] border-t-primary border-l-[40px] border-l-transparent opacity-0 group-hover:opacity-100 transition-opacity" initial={{ scale: 0 }} whileHover={{ scale: 1 }} />
              </RetroCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
