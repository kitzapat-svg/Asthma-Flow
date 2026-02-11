"use client";

import { motion } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/sections/footer";
import { RetroCard } from "@/components/animated/card-3d";
import { RetroButton } from "@/components/animated/retro-button";

const reviews = [
  {
    content: "This platform completely transformed how we operate. The analytics alone saved us countless hours every week. I cannot imagine going back to our old workflow.",
    author: "Sarah Chen",
    role: "CEO at TechStart",
    company: "TechStart",
    rating: 5,
  },
  {
    content: "The best investment we've made. Our team's productivity increased by 40% within the first month. The ROI was immediate and substantial.",
    author: "Marcus Johnson",
    role: "CTO at InnovateCo",
    company: "InnovateCo",
    rating: 5,
  },
  {
    content: "Incredible support team and rock-solid reliability. I recommend this to every founder I meet. It is become an essential part of our stack.",
    author: "Emily Rodriguez",
    role: "Founder at GrowthLab",
    company: "GrowthLab",
    rating: 5,
  },
  {
    content: "The integration was seamless. We were up and running in hours, not weeks. The documentation is excellent and the API is intuitive.",
    author: "David Park",
    role: "VP Engineering at ScaleUp",
    company: "ScaleUp",
    rating: 5,
  },
  {
    content: "Beautiful design, intuitive interface, and powerful features. Everything we needed in one place. Our team loves using it every day.",
    author: "Lisa Thompson",
    role: "Product Lead at Designify",
    company: "Designify",
    rating: 5,
  },
  {
    content: "We have tried many solutions, but this is the only one that actually delivered on its promises. The customer success team is exceptional.",
    author: "James Wilson",
    role: "Director at Enterprise Inc",
    company: "Enterprise Inc",
    rating: 5,
  },
  {
    content: "The automation features have saved our team 20+ hours per week. We can now focus on strategic initiatives instead of manual tasks.",
    author: "Amanda Foster",
    role: "Operations Manager at CloudNine",
    company: "CloudNine",
    rating: 5,
  },
  {
    content: "Best-in-class security and compliance features. As a fintech company, this was crucial for us. Highly recommended for any regulated industry.",
    author: "Robert Kim",
    role: "Security Lead at FinFlow",
    company: "FinFlow",
    rating: 5,
  },
  {
    content: "The scalability is impressive. We went from 1,000 to 100,000 users without any hiccups. The platform just works at any scale.",
    author: "Jennifer Walsh",
    role: "CEO at RapidScale",
    company: "RapidScale",
    rating: 5,
  },
];

const stats = [
  { value: "4.9", label: "Average Rating" },
  { value: "2,000+", label: "Reviews" },
  { value: "98%", label: "Would Recommend" },
];

export default function ReviewsPage() {
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
              Reviews
            </span>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-foreground uppercase">
              Loved By Thousands
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
              Do not just take our word for it. Here is what our customers have to say about their experience.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y-2 border-border bg-secondary">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl sm:text-4xl font-black text-primary">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm font-bold text-foreground uppercase tracking-wide">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews Grid */}
      <section className="py-24 relative">
        <div className="absolute inset-0 retro-dots opacity-20" />
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {reviews.map((review, index) => (
              <motion.div
                key={review.author}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="break-inside-avoid"
              >
                <RetroCard className="p-6">
                  {/* Rating */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(review.rating)].map((_, i) => (
                      <div key={i} className="w-4 h-4 bg-primary" />
                    ))}
                  </div>
                  
                  {/* Content */}
                  <p className="text-foreground leading-relaxed mb-6 font-medium">
                    &ldquo;{review.content}&rdquo;
                  </p>
                  
                  {/* Author */}
                  <div className="flex items-center gap-4 pt-4 border-t-2 border-border">
                    <div className="h-10 w-10 bg-secondary border-2 border-foreground flex items-center justify-center">
                      <span className="text-xs font-black text-foreground">
                        {review.author.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-black text-foreground uppercase text-sm tracking-wide">
                        {review.author}
                      </p>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        {review.role}
                      </p>
                    </div>
                  </div>
                </RetroCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 border-t-2 border-border bg-secondary">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="retro-box bg-background p-12 text-center"
          >
            <h2 className="text-3xl sm:text-4xl font-black text-foreground uppercase tracking-wide mb-4">
              Join Our Happy Customers
            </h2>
            <p className="text-muted-foreground font-medium mb-8 max-w-lg mx-auto">
              Experience the difference that thousands of businesses are already enjoying.
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
