"use client";
import { HeroSection } from "@/components/landing/HeroSection";
import { LiveTicker } from "@/components/landing/LiveTicker";
import { ServiceCards } from "@/components/landing/ServiceCards";
import { TechShowcase } from "@/components/landing/TechShowcase";
import { ImpactSection } from "@/components/landing/ImpactSection";
import { PersonalizedErpBand } from "@/components/landing/PersonalizedErpBand";
import { Bird } from "@/components/landing/Bird";
import { PublicNav, SiteFooter } from "@/components/layout/PublicChrome";

/**
 * The client-facing landing page.
 *
 * Public on purpose — a visitor must be able to read this without an account.
 * "/" is registered as an exactly-matched public route in Providers.tsx.
 */
export default function HomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-gd-deepest">
      <Bird />
      <PublicNav />
      <HeroSection />
      <LiveTicker />
      <ServiceCards />
      <TechShowcase />
      <PersonalizedErpBand />
      <ImpactSection />
      <SiteFooter />
    </div>
  );
}
