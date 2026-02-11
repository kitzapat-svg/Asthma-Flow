"use client";

import { motion } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/sections/footer";
import { RetroCard } from "@/components/animated/card-3d";
import { RetroButton } from "@/components/animated/retro-button";
import { CountUp } from "@/components/animated/count-up";

const stats = [
  { value: 2019, label: "Founded", prefix: "" },
  { value: 150, suffix: "+", label: "Team Members" },
  { value: 50, suffix: "K+", label: "Customers" },
  { value: 12, suffix: "M+", label: "Requests/Day" },
];

const values = [
  {
    title: "Customer First",
    description: "We put our customers at the center of everything we do. Their success is our success.",
  },
  {
    title: "Innovation",
    description: "We constantly push boundaries to deliver cutting-edge solutions that drive real results.",
  },
  {
    title: "Transparency",
    description: "We believe in open communication and honest relationships with our customers and team.",
  },
  {
    title: "Excellence",
    description: "We strive for excellence in every aspect of our product, service, and support.",
  },
];

const timeline = [
  { year: "2019", event: "Company founded" },
  { year: "2020", event: "First 1,000 customers" },
  { year: "2021", event: "Series A funding" },
  { year: "2022", event: "Global expansion" },
  { year: "2023", event: "50K+ active users" },
  { year: "2024", event: "Enterprise launch" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 retro-grid opacity-30" />
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <span className="retro-badge bg-secondary text-foreground mb-6 inline-block">
              About Us
            </span>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-foreground uppercase">
              Building The Future
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
              We are a team of passionate individuals dedicated to helping businesses 
              scale and succeed in the digital age.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y-2 border-border bg-secondary">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="retro-box bg-background p-6 text-center"
              >
                <div className="text-3xl sm:text-4xl font-black text-primary">
                  {stat.prefix}
                  <CountUp target={stat.value} suffix={stat.suffix || ""} />
                </div>
                <div className="mt-2 text-sm font-black text-foreground uppercase tracking-wide">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 retro-dots opacity-20" />
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl sm:text-5xl font-black text-foreground uppercase tracking-wide mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed font-medium mb-6">
                We believe that every business deserves access to powerful tools that can help them 
                compete in today&apos;s fast-paced digital landscape. Our mission is to democratize 
                enterprise-grade technology and make it accessible to businesses of all sizes.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed font-medium">
                Since our founding in 2019, we have helped over 50,000 businesses streamline their 
                operations, increase productivity, and drive growth. We are just getting started.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="retro-box bg-secondary p-8">
                <div className="text-6xl font-black text-primary/20 mb-4">"</div>
                <p className="text-xl font-black text-foreground uppercase tracking-wide leading-relaxed">
                  Technology should empower, not complicate. We build tools that just work.
                </p>
                <div className="mt-6 pt-6 border-t-2 border-border">
                  <p className="font-black text-foreground uppercase">Alex Chen</p>
                  <p className="text-sm text-muted-foreground uppercase tracking-wide">Founder & CEO</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 border-y-2 border-border bg-secondary">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-black text-foreground uppercase tracking-wide">
              Our Values
            </h2>
          </motion.div>
          
          <div className="grid sm:grid-cols-2 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <RetroCard className="p-8 h-full">
                  <h3 className="text-xl font-black text-foreground uppercase tracking-wide mb-4">
                    {value.title}
                  </h3>
                  <p className="text-muted-foreground font-medium leading-relaxed">
                    {value.description}
                  </p>
                </RetroCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 retro-dots opacity-20" />
        
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-black text-foreground uppercase tracking-wide">
              Our Journey
            </h2>
          </motion.div>
          
          <div className="space-y-0">
            {timeline.map((item, index) => (
              <motion.div
                key={item.year}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-8 py-6 border-b-2 border-border last:border-0"
              >
                <div className="w-24 text-right">
                  <span className="text-2xl font-black text-primary">{item.year}</span>
                </div>
                <div className="w-4 h-4 bg-primary border-2 border-foreground flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-lg font-bold text-foreground uppercase tracking-wide">
                    {item.event}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 border-t-2 border-border bg-secondary">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-black text-foreground uppercase tracking-wide mb-4">
              Want to Join Our Team?
            </h2>
            <p className="text-muted-foreground font-medium mb-8 max-w-lg mx-auto">
              We are always looking for talented individuals who are passionate about building great products.
            </p>
            <RetroButton href="/contact" variant="primary" size="lg">
              View Open Positions
            </RetroButton>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
