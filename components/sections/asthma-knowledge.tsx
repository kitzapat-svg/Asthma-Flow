"use client";

import { motion } from "framer-motion";
import { RetroCard } from "@/components/animated/card-3d";

const topics = [
    {
        icon: "🫁",
        title: "โรคหืดคืออะไร?",
        content: "โรคหืด (Asthma) เป็นโรคเรื้อรังของระบบทางเดินหายใจ ที่ทำให้หลอดลมอักเสบและตีบแคบ ส่งผลให้หายใจลำบาก แน่นหน้าอก ไอ และหายใจมีเสียงวี้ด อาการอาจเกิดเป็นพักๆ และรุนแรงขึ้นได้เมื่อมีสิ่งกระตุ้น เช่น ฝุ่น ควัน สารก่อภูมิแพ้ หรือการออกกำลังกาย",
        color: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
        delay: 0,
    },
    {
        icon: "🏃‍♂️",
        title: "การปฏิบัติตัวสำหรับผู้ป่วยโรคหืด",
        content: "• หลีกเลี่ยงสิ่งกระตุ้นที่ทำให้เกิดอาการ (ฝุ่น ควันบุหรี่ สัตว์เลี้ยง)\n• ออกกำลังกายสม่ำเสมอในระดับที่เหมาะสม\n• ทำความสะอาดที่พักอาศัยเป็นประจำ\n• พกยาพ่นฉุกเฉินติดตัวตลอดเวลา\n• มาพบแพทย์ตามนัดอย่างสม่ำเสมอ\n• สังเกตอาการตนเองและวัดค่า PEFR",
        color: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
        delay: 0.1,
    },
    {
        icon: "💊",
        title: "ความสำคัญของการใช้ยาอย่างต่อเนื่อง",
        content: "ยาควบคุมอาการหืด (Controller) ต้องใช้สม่ำเสมอทุกวัน แม้จะไม่มีอาการ เพราะยาช่วยลดการอักเสบของหลอดลม ลดความไวต่อสิ่งกระตุ้น และป้องกันอาการกำเริบ การหยุดยาเองโดยไม่ปรึกษาแพทย์อาจทำให้อาการแย่ลงอย่างรวดเร็ว ใช้เทคนิคพ่นยาที่ถูกต้องจะช่วยให้ยาเข้าถึงปอดได้อย่างมีประสิทธิภาพ",
        color: "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800",
        delay: 0.2,
    },
];

export function AsthmaKnowledge() {
    return (
        <section id="knowledge" className="py-24 lg:py-32 relative bg-secondary/30 dark:bg-zinc-950">
            <div className="absolute inset-0 retro-dots opacity-20" />
            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ type: "spring" }} className="inline-block mb-6">
                        <motion.span className="retro-badge bg-secondary text-foreground" whileHover={{ scale: 1.05 }}>
                            🫁 Knowledge
                        </motion.span>
                    </motion.div>
                    <motion.h2 initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground uppercase">
                        ความรู้โรคหืด
                    </motion.h2>
                    <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
                        ข้อมูลสำคัญที่ผู้ป่วยและบุคลากรทางการแพทย์ควรทราบเกี่ยวกับโรคหืด
                    </motion.p>
                </div>

                <div className="grid gap-8 lg:grid-cols-3">
                    {topics.map((topic, index) => (
                        <motion.div
                            key={topic.title}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ delay: topic.delay, type: "spring", stiffness: 100 }}
                        >
                            <RetroCard className="h-full p-6 sm:p-8 group cursor-default">
                                <div className="text-5xl mb-5">{topic.icon}</div>
                                <h3 className="text-xl font-black text-foreground uppercase tracking-wide mb-4">
                                    {topic.title}
                                </h3>
                                <div className={`rounded-lg p-4 border ${topic.color}`}>
                                    <p className="text-muted-foreground leading-relaxed font-medium text-sm whitespace-pre-line">
                                        {topic.content}
                                    </p>
                                </div>
                            </RetroCard>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
