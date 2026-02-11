"use client";

import { motion } from "framer-motion";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/sections/footer";
import { RetroButton } from "@/components/animated/retro-button";
import { useState } from "react";

const contactMethods = [
  {
    title: "Email",
    value: "hello@brand.com",
    description: "We reply within 24 hours",
  },
  {
    title: "Phone",
    value: "+1 (555) 123-4567",
    description: "Mon-Fri 9am-6pm EST",
  },
  {
    title: "Office",
    value: "San Francisco, CA",
    description: "Come say hello",
  },
];

const plans = [
  { value: "starter", label: "Starter - $29/month" },
  { value: "pro", label: "Pro - $99/month" },
  { value: "enterprise", label: "Enterprise - Custom" },
];

export default function ContactPage() {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    company: "",
    plan: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log(formState);
  };

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
              Contact
            </span>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-foreground uppercase">
              Get In Touch
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
              Have a question or want to learn more? We would love to hear from you.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-12 border-y-2 border-border bg-secondary">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6">
            {contactMethods.map((method, index) => (
              <motion.div
                key={method.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="retro-box bg-background p-6 text-center"
              >
                <h3 className="text-sm font-black text-muted-foreground uppercase tracking-wide mb-2">
                  {method.title}
                </h3>
                <p className="text-lg font-black text-foreground uppercase tracking-wide mb-1">
                  {method.value}
                </p>
                <p className="text-sm text-muted-foreground">
                  {method.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 retro-dots opacity-20" />
        
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-12">
            {/* Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-3"
            >
              <div className="retro-box bg-background p-8">
                <h2 className="text-2xl font-black text-foreground uppercase tracking-wide mb-6">
                  Send Us a Message
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-foreground uppercase tracking-wide mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        value={formState.name}
                        onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                        className="w-full h-12 px-4 border-2 border-foreground bg-background text-foreground focus:outline-none focus:ring-0 focus:border-primary transition-colors"
                        placeholder="Your name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-foreground uppercase tracking-wide mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formState.email}
                        onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                        className="w-full h-12 px-4 border-2 border-foreground bg-background text-foreground focus:outline-none focus:ring-0 focus:border-primary transition-colors"
                        placeholder="you@company.com"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-foreground uppercase tracking-wide mb-2">
                        Company
                      </label>
                      <input
                        type="text"
                        value={formState.company}
                        onChange={(e) => setFormState({ ...formState, company: e.target.value })}
                        className="w-full h-12 px-4 border-2 border-foreground bg-background text-foreground focus:outline-none focus:ring-0 focus:border-primary transition-colors"
                        placeholder="Company name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-foreground uppercase tracking-wide mb-2">
                        Plan Interest
                      </label>
                      <select
                        value={formState.plan}
                        onChange={(e) => setFormState({ ...formState, plan: e.target.value })}
                        className="w-full h-12 px-4 border-2 border-foreground bg-background text-foreground focus:outline-none focus:ring-0 focus:border-primary transition-colors appearance-none cursor-pointer"
                      >
                        <option value="">Select a plan</option>
                        {plans.map((plan) => (
                          <option key={plan.value} value={plan.value}>
                            {plan.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-foreground uppercase tracking-wide mb-2">
                      Message
                    </label>
                    <textarea
                      value={formState.message}
                      onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                      rows={5}
                      className="w-full px-4 py-3 border-2 border-foreground bg-background text-foreground focus:outline-none focus:ring-0 focus:border-primary transition-colors resize-none"
                      placeholder="Tell us about your project..."
                      required
                    />
                  </div>
                  
                  <RetroButton
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full"
                  >
                    Send Message
                  </RetroButton>
                </form>
              </div>
            </motion.div>
            
            {/* Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-2 space-y-6"
            >
              {/* FAQ */}
              <div className="retro-box bg-secondary p-6">
                <h3 className="text-lg font-black text-foreground uppercase tracking-wide mb-4">
                  Frequently Asked
                </h3>
                <ul className="space-y-4">
                  {[
                    "How do I get started?",
                    "What is your pricing?",
                    "Do you offer enterprise plans?",
                    "How does the trial work?",
                  ].map((question) => (
                    <li key={question}>
                      <a
                        href="#"
                        className="text-sm font-bold text-muted-foreground hover:text-primary uppercase tracking-wide transition-colors"
                      >
                        {question}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Support */}
              <div className="retro-box bg-primary p-6">
                <h3 className="text-lg font-black text-primary-foreground uppercase tracking-wide mb-2">
                  Need Help?
                </h3>
                <p className="text-sm text-primary-foreground/80 mb-4">
                  Our support team is available 24/7 to assist you.
                </p>
                <a
                  href="mailto:support@brand.com"
                  className="text-sm font-black text-primary-foreground uppercase tracking-wide underline hover:no-underline"
                >
                  Contact Support
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
