"use client";

import { motion } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/sections/footer";
import { RetroCard } from "@/components/animated/card-3d";
import { RetroButton } from "@/components/animated/retro-button";

const allFeatures = [
  {
    title: "Lightning Fast",
    description: "Optimized for speed with cutting-edge technology. Experience blazing fast performance that keeps up with your demands.",
    details: ["Sub-second load times", "Global CDN", "Edge caching", "Auto-scaling"],
  },
  {
    title: "Enterprise Security",
    description: "Bank-grade encryption and security protocols. Your data is protected with industry-leading measures 24/7.",
    details: ["AES-256 encryption", "SOC 2 compliant", "GDPR ready", "Regular audits"],
  },
  {
    title: "Global Scale",
    description: "Deploy worldwide with our distributed infrastructure. Reach customers anywhere with low-latency performance.",
    details: ["50+ regions", "Multi-cloud", "Auto-failover", "99.99% uptime"],
  },
  {
    title: "Advanced Analytics",
    description: "Deep insights into your business metrics. Make data-driven decisions with comprehensive dashboards.",
    details: ["Real-time data", "Custom reports", "Predictive insights", "Export tools"],
  },
  {
    title: "Team Collaboration",
    description: "Work together seamlessly with real-time collaboration tools. Keep your team aligned and productive.",
    details: ["Real-time sync", "Comments", "Version history", "Role permissions"],
  },
  {
    title: "24/7 Support",
    description: "Round-the-clock expert support. Our dedicated team is always ready to help you succeed.",
    details: ["Live chat", "Email support", "Phone support", "Knowledge base"],
  },
];

const integrations = [
  "Slack", "Discord", "GitHub", "GitLab", "Figma", "Notion", 
  "Zapier", "Stripe", "AWS", "Google Cloud", "Vercel", "Netlify"
];

export default function FeaturesPage() {
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
              Features
            </span>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-foreground uppercase">
              Everything You Need
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
              Powerful features designed to help you build, launch, and scale your business with confidence.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 relative">
        <div className="absolute inset-0 retro-dots opacity-20" />
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-2">
            {allFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, type: "spring" }}
              >
                <RetroCard className="h-full p-8">
                  <div className="text-5xl font-black text-primary/20 mb-4">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <h2 className="text-2xl font-black text-foreground uppercase tracking-wide mb-4">
                    {feature.title}
                  </h2>
                  <p className="text-muted-foreground leading-relaxed mb-6 font-medium">
                    {feature.description}
                  </p>
                  <ul className="grid grid-cols-2 gap-3">
                    {feature.details.map((detail) => (
                      <li 
                        key={detail}
                        className="flex items-center gap-2 text-sm font-bold text-foreground uppercase tracking-wide"
                      >
                        <span className="w-2 h-2 bg-primary" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </RetroCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section className="py-16 border-y-2 border-border bg-secondary">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-black text-foreground uppercase tracking-wide">
              Integrations
            </h2>
            <p className="mt-4 text-muted-foreground font-medium">
              Connect with your favorite tools
            </p>
          </motion.div>
          
          <div className="flex flex-wrap justify-center gap-4">
            {integrations.map((integration, index) => (
              <motion.div
                key={integration}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -2, boxShadow: "4px 4px 0px 0px var(--border)" }}
                className="retro-box bg-background px-6 py-3 cursor-pointer"
              >
                <span className="font-bold text-foreground uppercase tracking-wide text-sm">
                  {integration}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 retro-dots opacity-20" />
        
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="retro-box bg-secondary p-12"
          >
            <h2 className="text-3xl sm:text-4xl font-black text-foreground uppercase tracking-wide mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-muted-foreground font-medium mb-8 max-w-lg mx-auto">
              Join thousands of companies already using our platform to streamline their operations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <RetroButton href="/contact" variant="primary" size="lg">
                Start Free Trial
              </RetroButton>
              <RetroButton href="/contact" variant="outline" size="lg">
                Contact Sales
              </RetroButton>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
