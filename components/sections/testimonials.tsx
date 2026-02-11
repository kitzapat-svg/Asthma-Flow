"use client";

import { motion } from "framer-motion";
import { RetroCard } from "@/components/animated/card-3d";

const testimonials = [
  {
    content: "This platform completely transformed how we operate. The analytics alone saved us countless hours every week.",
    author: "Sarah Chen",
    role: "CEO at TechStart",
    initials: "SC",
  },
  {
    content: "The best investment we've made. Our team's productivity increased by 40% within the first month.",
    author: "Marcus Johnson",
    role: "CTO at InnovateCo",
    initials: "MJ",
  },
  {
    content: "Incredible support team and rock-solid reliability. I recommend this to every founder I meet.",
    author: "Emily Rodriguez",
    role: "Founder at GrowthLab",
    initials: "ER",
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-24 lg:py-32 relative">
      {/* Background */}
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
              Testimonials
            </motion.span>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground uppercase"
          >
            Loved By Thousands
          </motion.h2>
        </div>

        {/* Testimonials Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 40, rotateX: -10 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ 
                delay: index * 0.1,
                type: "spring",
                stiffness: 100
              }}
            >
              <RetroCard className="p-6 sm:p-8 group cursor-pointer">
                {/* Quote mark */}
                <div className="mb-6 text-6xl font-black text-primary/30 leading-none">
                  "
                </div>

                {/* Content */}
                <p className="text-foreground leading-relaxed mb-6 font-medium">
                  {testimonial.content}
                </p>

                {/* Author */}
                <motion.div 
                  className="flex items-center gap-4 pt-4 border-t-2 border-border"
                  whileHover={{ x: 4 }}
                >
                  <motion.div 
                    className="h-12 w-12 bg-secondary border-2 border-foreground flex items-center justify-center"
                    whileHover={{ 
                      scale: 1.1,
                      rotate: 5,
                      backgroundColor: "var(--primary)",
                    }}
                    transition={{ type: "spring" }}
                  >
                    <span className="text-sm font-black text-foreground">
                      {testimonial.initials}
                    </span>
                  </motion.div>
                  <div>
                    <p className="font-black text-foreground uppercase text-sm tracking-wide">
                      {testimonial.author}
                    </p>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                      {testimonial.role}
                    </p>
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
