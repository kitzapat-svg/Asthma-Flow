"use client";

import { motion } from "framer-motion";
import { RetroButton } from "@/components/animated/retro-button";

const benefits = [
  "14-day free trial",
  "No credit card required",
  "Cancel anytime",
];

export function CTA() {
  return (
    <section id="contact" className="py-24 lg:py-32 relative overflow-hidden">
      {/* Background pattern - same as other sections */}
      <div className="absolute inset-0 retro-dots opacity-30" />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-32 h-32 border-2 border-primary/10"
            style={{
              top: `${20 + i * 20}%`,
              left: `${10 + i * 25}%`,
            }}
            animate={{
              rotate: [0, 90, 180, 270, 360],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 20 + i * 5,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 100 }}
          className="relative"
        >
          {/* Main CTA Box - using secondary background instead of black */}
          <motion.div 
            className="retro-box bg-secondary p-8 sm:p-12 lg:p-16 relative"
            whileHover={{ 
              y: -4,
              boxShadow: "10px 10px 0px 0px var(--border)",
            }}
            transition={{ duration: 0.2 }}
          >
            {/* Animated decorative corners */}
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="absolute w-6 h-6 bg-primary border-2 border-foreground"
                style={{
                  top: i < 2 ? -12 : "auto",
                  bottom: i >= 2 ? -12 : "auto",
                  left: i % 2 === 0 ? -12 : "auto",
                  right: i % 2 === 1 ? -12 : "auto",
                }}
                initial={{ scale: 0, rotate: -180 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ 
                  delay: 0.5 + i * 0.1,
                  type: "spring",
                  stiffness: 200
                }}
                whileHover={{ 
                  scale: 1.2,
                  rotate: 90,
                }}
              />
            ))}

            <div className="text-center">
              <motion.h2
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground uppercase"
              >
                Ready To Transform
                <br />
                Your Business?
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto font-medium"
              >
                Join thousands of companies already using our platform to
                streamline operations and accelerate growth.
              </motion.p>

              {/* Benefits list without icons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6"
              >
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    className="text-sm font-bold text-muted-foreground uppercase tracking-wide"
                  >
                    {benefit}
                  </motion.div>
                ))}
              </motion.div>

              {/* CTA Buttons without icons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <RetroButton
                  href="#"
                  variant="primary"
                  size="lg"
                >
                  Start Free Trial
                </RetroButton>
                
                <motion.a
                  href="#"
                  className="inline-flex h-14 items-center justify-center px-8 text-base font-black uppercase tracking-wider bg-transparent text-foreground border-2 border-foreground hover:bg-foreground/5 transition-colors relative overflow-hidden group"
                  whileHover={{ 
                    y: -2,
                    boxShadow: "4px 4px 0px 0px var(--border)",
                  }}
                  whileTap={{ y: 0 }}
                >
                  <motion.span
                    className="absolute inset-0 bg-foreground/5"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                  <span className="relative z-10">Contact Sales</span>
                </motion.a>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
