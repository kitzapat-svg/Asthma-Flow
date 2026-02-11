"use client";

import { motion } from "framer-motion";
import { CountUp } from "@/components/animated/count-up";
import { RetroButton } from "@/components/animated/retro-button";

const stats = [
  { 
    value: 50000, 
    suffix: "+", 
    label: "Active Users",
  },
  { 
    value: 99.9, 
    suffix: "%", 
    label: "Uptime",
    isDecimal: true,
  },
  { 
    value: 150, 
    suffix: "+", 
    label: "Countries",
  },
  { 
    value: 24, 
    suffix: "/7", 
    label: "Support",
  },
];

export function Stats() {
  return (
    <section id="about" className="py-24 lg:py-32 relative overflow-hidden">
      {/* Background pattern - same as other sections */}
      <div className="absolute inset-0 retro-dots opacity-30" />
      
      {/* Animated lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-[2px] h-full bg-primary/10"
            style={{ left: `${30 + i * 20}%` }}
            initial={{ y: "-100%" }}
            animate={{ y: "100%" }}
            transition={{
              duration: 5 + i,
              repeat: Infinity,
              ease: "linear",
              delay: i * 0.5,
            }}
          />
        ))}
      </div>
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left content */}
          <div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring" }}
              className="inline-block mb-6"
            >
              <motion.span 
                className="retro-badge bg-secondary text-foreground"
                whileHover={{ scale: 1.05 }}
              >
                Our Impact
              </motion.span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground uppercase"
            >
              Trusted By Businesses Worldwide
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="mt-6 text-lg text-muted-foreground max-w-lg font-medium"
            >
              Join thousands of companies that rely on our platform to power
              their business operations and drive growth.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="mt-8"
            >
              <RetroButton
                href="#contact"
                variant="primary"
                size="lg"
              >
                Join Them Today
              </RetroButton>
            </motion.div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ 
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 100
                }}
                whileHover={{ 
                  y: -6,
                  scale: 1.02,
                  boxShadow: "8px 8px 0px 0px var(--border)",
                }}
                className="retro-box bg-background p-6 sm:p-8 text-center cursor-pointer relative overflow-hidden group"
              >
                {/* Animated background on hover */}
                <motion.div
                  className="absolute inset-0 bg-primary/10"
                  initial={{ y: "100%" }}
                  whileHover={{ y: 0 }}
                  transition={{ duration: 0.3 }}
                />
                
                <div className="relative z-10">
                  <div className="text-4xl sm:text-5xl font-black text-primary">
                    {stat.isDecimal ? (
                      <span>{stat.value}{stat.suffix}</span>
                    ) : (
                      <CountUp 
                        target={stat.value} 
                        suffix={stat.suffix}
                      />
                    )}
                  </div>
                  <div className="mt-2 text-sm font-black text-foreground uppercase tracking-wide">
                    {stat.label}
                  </div>
                </div>

                {/* Corner decoration */}
                <motion.div
                  className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary opacity-0 group-hover:opacity-100 transition-opacity"
                  initial={{ scale: 0 }}
                  whileHover={{ scale: 1 }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
