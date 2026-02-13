"use client";

import { motion } from "framer-motion";
import { Marquee } from "@/components/animated/marquee";

const services = [
  { icon: "🫁", label: "Asthma Care" },
  { icon: "📊", label: "PEFR Monitoring" },
  { icon: "💊", label: "Inhaler Assessment" },
  { icon: "📋", label: "Patient Records" },
  { icon: "📈", label: "Trend Analysis" },
  { icon: "🏥", label: "Visit Tracking" },
  { icon: "🔬", label: "ACT Score" },
  { icon: "👨‍⚕️", label: "Clinical Dashboard" },
];

function ServiceItem({ icon, label }: { icon: string; label: string }) {
  return (
    <motion.div className="flex items-center gap-3 px-8 py-4" whileHover={{ scale: 1.05 }}>
      <span className="text-2xl">{icon}</span>
      <span className="text-lg font-black text-foreground/40 uppercase tracking-wider">
        {label}
      </span>
    </motion.div>
  );
}

export function MarqueeSection() {
  return (
    <section className="py-6 border-y-2 border-border bg-secondary overflow-hidden">
      <Marquee speed={40} pauseOnHover>
        {services.map((s, index) => (
          <ServiceItem key={index} icon={s.icon} label={s.label} />
        ))}
      </Marquee>
    </section>
  );
}
