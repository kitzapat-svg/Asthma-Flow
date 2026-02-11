"use client";

import { motion } from "framer-motion";
import { Marquee } from "@/components/animated/marquee";

// Company logos as SVG components with warm colors
const logos = [
  { name: "Vercel", svg: <VercelLogo /> },
  { name: "Stripe", svg: <StripeLogo /> },
  { name: "Notion", svg: <NotionLogo /> },
  { name: "Figma", svg: <FigmaLogo /> },
  { name: "Linear", svg: <LinearLogo /> },
  { name: "Supabase", svg: <SupabaseLogo /> },
  { name: "Tailwind", svg: <TailwindLogo /> },
  { name: "Framer", svg: <FramerLogo /> },
];

// Logo Components with warm theme colors
function VercelLogo() {
  return (
    <svg viewBox="0 0 76 65" className="h-6 w-auto fill-current">
      <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
    </svg>
  );
}

function StripeLogo() {
  return (
    <svg viewBox="0 0 60 25" className="h-6 w-auto fill-current">
      <path d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a12.7 12.7 0 0 1-4.56.76c-4.01 0-6.83-2.5-6.83-7.28 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.28 0 .57-.05 1.2-.06 1.84zm-6.3-5.63c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.05-2.58-2.08-2.58zM40.95 20l.03-1.03h.08c.86.97 2.03 1.27 3.23 1.27 2.28 0 3.8-1.4 3.8-3.8 0-2.58-1.75-3.55-3.9-3.55-.8 0-1.93.08-2.65.89h-.08V6.5h-4.31V20h3.8zm1.82-6.27c1.28 0 2.05.84 2.05 2.05 0 1.26-.77 2.05-2.05 2.05-1.24 0-2.05-.79-2.05-2.05 0-1.2.77-2.05 2.05-2.05zM28.24 6.5v7.56h.08c.67-.92 1.8-1.05 2.65-1.05 2.22 0 3.69 1.43 3.69 3.77V20h-4.31v-3.24c0-1.27-.46-1.93-1.37-1.93-.88 0-1.55.66-1.55 1.93V20h-4.31V6.5h4.12zm-8.17 13.5h4.31V6.5h-4.31v13.5zm0-15.28h4.31V0h-4.31v4.72zM12.2 20.3c-2.88 0-4.92-1.38-4.92-3.9V6.5H4.17v-3.3h3.11V0h4.31v3.2h2.86v3.3h-2.86v9.4c0 .86.6 1.34 1.45 1.34.6 0 1.13-.16 1.6-.4v3.34c-.64.28-1.57.42-2.44.42z"/>
    </svg>
  );
}

function NotionLogo() {
  return (
    <svg viewBox="0 0 100 100" className="h-6 w-auto fill-current">
      <path d="M6.017 4.313l55.333-4.087c6.797-.583 8.543-.19 12.817 2.917l17.663 12.443c2.913 2.14 3.883 2.723 3.883 5.053v68.243c0 4.277-1.553 6.807-6.99 7.193L24.467 99.967c-4.08.193-6.023-.39-8.16-3.113L3.3 79.94c-2.333-3.113-3.3-5.443-3.3-8.167V11.113c0-3.497 1.553-6.413 6.017-6.8z"/>
      <path fill="var(--background)" d="M61.35 1.227l-55.333 4.087C1.553 5.7 0 8.617 0 12.113v60.66c0 2.723.967 5.053 3.3 8.167l13.007 16.913c2.137 2.723 4.08 3.307 8.16 3.113l64.257-3.89c5.433-.387 6.99-2.917 6.99-7.193V20.64c0-2.21-.873-2.847-3.443-4.733L74.167 3.143c-4.273-3.107-6.02-3.5-12.817-2.917zM25.92 19.523c-5.247.353-6.437.433-9.417-1.99L8.927 11.507c-.77-.78-.383-1.753 1.557-1.947l53.193-3.887c4.467-.393 6.793 1.167 8.54 2.527l9.123 6.61c.39.197 1.36 1.36.193 1.36l-54.933 3.307-.68.047zM19.803 88.3V30.367c0-2.53.78-3.697 3.1-3.893L81 22.78c2.14-.193 3.107 1.167 3.107 3.693v57.547c0 2.53-.39 4.67-3.883 4.863l-60.377 3.5c-3.493.193-5.043-.97-5.043-4.083zm59.6-54.827c.387 1.75 0 3.5-1.75 3.7l-2.91.577v42.773c-2.527 1.36-4.853 2.137-6.797 2.137-3.107 0-3.883-.973-6.21-3.887l-19.03-29.94v28.967l6.02 1.363s0 3.5-4.857 3.5l-13.39.777c-.39-.777 0-2.723 1.357-3.11l3.497-.97v-38.3L30.48 40.667c-.39-1.75.58-4.277 3.3-4.473l14.367-.967 19.8 30.327v-26.83l-5.047-.58c-.39-2.143 1.163-3.7 3.103-3.89l13.4-.78z"/>
    </svg>
  );
}

function FigmaLogo() {
  return (
    <svg viewBox="0 0 38 57" className="h-6 w-auto" fill="none">
      <path fill="currentColor" d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z"/>
      <path fill="currentColor" d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z"/>
      <path fill="currentColor" d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19z"/>
      <path fill="currentColor" d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z"/>
      <path fill="currentColor" d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z"/>
    </svg>
  );
}

function LinearLogo() {
  return (
    <svg viewBox="0 0 100 100" className="h-6 w-auto fill-current">
      <path d="M1.22 61.52 38.48 98.8c-5.26-.42-10.56-1.68-15.42-4.2L5.42 76.96a31.8 31.8 0 0 1-4.2-15.44zm47.26 38.26c-1.68 0-3.36 0-5.04-.42l53.36-53.36a31.8 31.8 0 0 1 3.78 14.7c0 17.64-14.28 39.08-51.26 39.08h-.84zM23.38 23.38 62.72 62.72 89.14 36.3a31.8 31.8 0 0 1-14.28 51.68L35.98 49.1 23.38 23.38zM39.08.56A31.8 31.8 0 0 1 88.72 26.74L62.72 52.74 24.22 14.24A31.3 31.3 0 0 1 39.08.56z"/>
    </svg>
  );
}

function SupabaseLogo() {
  return (
    <svg viewBox="0 0 109 113" className="h-6 w-auto" fill="none">
      <path d="M63.707 110.284c-2.061 2.6-5.683 3.16-8.283 1.099a6.003 6.003 0 0 1-1.773-7.865l.063-.1L80.45 66.31 42.803 79.13c-2.841.858-5.848-.667-6.785-3.467a5.99 5.99 0 0 1 0-3.39l.06-.161L52.36 18.19 10.783 33.53a6.053 6.053 0 0 1-7.855-3.43 5.997 5.997 0 0 1 3.28-7.82l.15-.067L59.233.35a6.052 6.052 0 0 1 7.865 3.43 6 6 0 0 1-.19 4.64l-.072.151L52.6 57.75l37.65-12.82c2.841-.859 5.848.667 6.785 3.467a6.006 6.006 0 0 1 0 3.39l-.06.161-27.308 87.336z" fill="currentColor"/>
    </svg>
  );
}

function TailwindLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-auto fill-current">
      <path d="M12.001,4.8c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624 C13.666,10.618,15.027,12,18.001,12c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624 C16.337,6.182,14.976,4.8,12.001,4.8z M6.001,12c-3.2,0-5.2,1.6-6,4.8c1.2-1.6,2.6-2.2,4.2-1.8c0.913,0.228,1.565,0.89,2.288,1.624 c1.177,1.194,2.538,2.576,5.512,2.576c3.2,0,5.2-1.6,6-4.8c-1.2,1.6-2.6,2.2-4.2,1.8c-0.913-0.228-1.565-0.89-2.288-1.624 C10.337,13.382,8.976,12,6.001,12z"/>
    </svg>
  );
}

function FramerLogo() {
  return (
    <svg viewBox="0 0 14 21" className="h-6 w-auto fill-current">
      <path d="M0 0h14v7H7V7h7v7H7v7H0V0z"/>
    </svg>
  );
}

// Logo Item Component
function LogoItem({ name, svg }: { name: string; svg: React.ReactNode }) {
  return (
    <motion.div
      className="flex items-center gap-3 px-8 py-4"
      whileHover={{ scale: 1.05 }}
    >
      <div className="text-foreground/60 hover:text-primary transition-colors">
        {svg}
      </div>
      <span className="text-lg font-black text-foreground/40 uppercase tracking-wider">
        {name}
      </span>
    </motion.div>
  );
}

export function MarqueeSection() {
  return (
    <section className="py-6 border-y-2 border-border bg-secondary overflow-hidden">
      <Marquee speed={40} pauseOnHover>
        {logos.map((logo, index) => (
          <LogoItem key={index} name={logo.name} svg={logo.svg} />
        ))}
      </Marquee>
    </section>
  );
}
