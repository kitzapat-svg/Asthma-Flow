"use client";

import { motion } from "framer-motion";
import { RetroCard } from "@/components/animated/card-3d";

const features = [
  {
    title: "Lightning Fast",
    description: "Optimized for speed with cutting-edge technology. Experience blazing fast performance that keeps up with your demands.",
    delay: 0,
  },
  {
    title: "Enterprise Security",
    description: "Bank-grade encryption and security protocols. Your data is protected with industry-leading measures 24/7.",
    delay: 0.1,
  },
  {
    title: "Global Scale",
    description: "Deploy worldwide with our distributed infrastructure. Reach customers anywhere with low-latency performance.",
    delay: 0.2,
  },
  {
    title: "Advanced Analytics",
    description: "Deep insights into your business metrics. Make data-driven decisions with comprehensive dashboards.",
    delay: 0.3,
  },
  {
    title: "Team Collaboration",
    description: "Work together seamlessly with real-time collaboration tools. Keep your team aligned and productive.",
    delay: 0.4,
  },
  {
    title: "24/7 Support",
    description: "Round-the-clock expert support. Our dedicated team is always ready to help you succeed.",
    delay: 0.5,
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 lg:py-32 relative">
      {/* Background pattern */}
      <div className="absolute inset-0 retro-dots opacity-30" />
      
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
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
              Features
            </motion.span>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground uppercase"
          >
            Everything You Need
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto font-medium"
          >
            Powerful features designed to help you build, launch, and scale your
            business with confidence.
          </motion.p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ 
                delay: feature.delay,
                type: "spring",
                stiffness: 100
              }}
            >
              <RetroCard className="h-full p-6 sm:p-8 group cursor-pointer">
                {/* Number indicator */}
                <div className="mb-4 text-4xl font-black text-primary/20">
                  {String(index + 1).padStart(2, '0')}
                </div>

                {/* Title */}
                <h3 className="text-lg font-black text-foreground uppercase tracking-wide mb-3">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-muted-foreground leading-relaxed font-medium">
                  {feature.description}
                </p>

                {/* Learn more link without icon */}
                <motion.div 
                  className="mt-6 pt-4 border-t-2 border-border"
                  initial={{ opacity: 0.7 }}
                  whileHover={{ opacity: 1 }}
                >
                  <motion.a
                    href="#"
                    className="inline-flex items-center gap-2 text-sm font-black text-foreground hover:text-primary uppercase tracking-wide transition-colors"
                    whileHover={{ x: 4 }}
                  >
                    Learn More
                  </motion.a>
                </motion.div>

                {/* Corner accent on hover */}
                <motion.div
                  className="absolute top-0 right-0 w-0 h-0 border-t-[40px] border-t-primary border-l-[40px] border-l-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                  initial={{ scale: 0 }}
                  whileHover={{ scale: 1 }}
                />
              </RetroCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
