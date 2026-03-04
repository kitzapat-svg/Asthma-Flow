import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/sections/hero";
import { Features } from "@/components/sections/features";
import { AsthmaKnowledge } from "@/components/sections/asthma-knowledge";
import { PefrCalculator } from "@/components/sections/pefr-calculator";
import { Stats } from "@/components/sections/stats";
import { MarqueeSection } from "@/components/sections/marquee-section";
import { Testimonials } from "@/components/sections/testimonials";
import { CTA } from "@/components/sections/cta";
import { Footer } from "@/components/sections/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <MarqueeSection />
        <Features />
        <AsthmaKnowledge />
        <PefrCalculator />
        <Stats />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
