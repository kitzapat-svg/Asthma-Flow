"use client";

import { motion } from "framer-motion";
import { Github, Twitter, Linkedin, Mail } from "lucide-react";
import Link from "next/link";

const footerLinks = {
  Product: [
    { name: "Features", href: "/features" },
    { name: "Pricing", href: "/contact" },
    { name: "Integrations", href: "/features" },
    { name: "Changelog", href: "#" },
  ],
  Company: [
    { name: "About", href: "/about" },
    { name: "Blog", href: "#" },
    { name: "Careers", href: "/contact" },
    { name: "Press", href: "#" },
  ],
  Resources: [
    { name: "Documentation", href: "#" },
    { name: "Help Center", href: "#" },
    { name: "Community", href: "#" },
    { name: "Contact", href: "/contact" },
  ],
  Legal: [
    { name: "Privacy", href: "#" },
    { name: "Terms", href: "#" },
    { name: "Security", href: "#" },
    { name: "Cookies", href: "#" },
  ],
};

const socialLinks = [
  { name: "Twitter", icon: Twitter, href: "#" },
  { name: "GitHub", icon: Github, href: "#" },
  { name: "LinkedIn", icon: Linkedin, href: "#" },
  { name: "Email", icon: Mail, href: "/contact" },
];

export function Footer() {
  return (
    <footer className="border-t-2 border-border bg-secondary">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main footer */}
        <div className="py-16">
          <div className="grid gap-12 lg:grid-cols-6">
            {/* Brand column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ type: "spring" }}
              className="lg:col-span-2"
            >
              <Link href="/" className="flex items-center gap-3 group">
                <motion.div 
                  className="h-10 w-10 bg-primary border-2 border-foreground flex items-center justify-center"
                  whileHover={{ 
                    rotate: 360,
                    scale: 1.1,
                  }}
                  transition={{ duration: 0.5 }}
                >
                  <span className="text-primary-foreground font-black text-lg">B</span>
                </motion.div>
                <span className="text-xl font-black tracking-tight text-foreground uppercase">
                  Brand
                </span>
              </Link>
              
              <p className="mt-4 max-w-xs text-sm text-muted-foreground font-medium leading-relaxed">
                Empowering businesses with modern tools and solutions. Build
                faster, scale smarter, grow bigger.
              </p>
              
              <div className="mt-6 flex gap-3">
                {socialLinks.map((social, index) => (
                  <motion.a
                    key={social.name}
                    href={social.href}
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, type: "spring" }}
                    whileHover={{ 
                      scale: 1.2,
                      rotate: 5,
                      y: -2,
                    }}
                    whileTap={{ scale: 0.9 }}
                    className="flex h-10 w-10 items-center justify-center retro-button bg-background text-muted-foreground hover:text-foreground"
                  >
                    <social.icon className="h-4 w-4" />
                  </motion.a>
                ))}
              </div>
            </motion.div>

            {/* Links columns */}
            {Object.entries(footerLinks).map(([category, links], index) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, type: "spring" }}
              >
                <h3 className="text-sm font-black text-foreground uppercase tracking-wide mb-4">
                  {category}
                </h3>
                <ul className="space-y-3">
                  {links.map((link, linkIndex) => (
                    <motion.li 
                      key={link.name}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + linkIndex * 0.05 }}
                    >
                      <Link
                        href={link.href}
                        className="text-sm font-bold text-muted-foreground hover:text-foreground uppercase tracking-wide transition-colors"
                      >
                        {link.name}
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <motion.div 
          className="border-t-2 border-border py-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
              &copy; {new Date().getFullYear()} Brand, Inc. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              {["Privacy", "Terms", "Cookies"].map((item) => (
                <Link
                  key={item}
                  href="#"
                  className="text-sm font-bold text-muted-foreground hover:text-foreground uppercase tracking-wide transition-colors relative"
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
