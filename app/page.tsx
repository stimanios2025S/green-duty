"use client";
import { useEffect } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { LiveTicker } from "@/components/landing/LiveTicker";
import { ServiceCards } from "@/components/landing/ServiceCards";
import { TechShowcase } from "@/components/landing/TechShowcase";
import { IoTSimulator } from "@/components/landing/IoTSimulator";
import { ImpactSection } from "@/components/landing/ImpactSection";
import { Bird } from "@/components/landing/Bird";

const SylvaHero = dynamic(
  () => import("@designcodeio/threeui/components/SylvaHero").then(m => ({ default: m.SylvaHero })),
  { ssr: false }
);

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Redirect logged-in users to their portal
  useEffect(() => {
    if (!isLoading && user) {
      const role = user.accountType || "guest";
      const target = role === "farmer" ? "/farmer" : "/dashboard";
      router.replace(target);
    }
  }, [isLoading, user, router]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-gd-deepest"><div className="h-10 w-10 animate-spin rounded-full border-2 border-gd-accent-500 border-t-transparent" /></div>;
  }

  // If logged in, don't render landing (redirect is happening)
  if (user) return null;

  // Landing page for guests / unauthenticated visitors
  return (
    <div className="h-full overflow-x-hidden">
      <Bird />
      <SylvaHero
        headingFont="lexend"
        bodyFont="lexend"
        headingWeight="300"
        bodyWeight="300"
        primaryColor="#ffffff"
        headingSize={63}
        bodySize={16.5}
        headingLetterSpacing={-0.006}
        style={{ width: "100%", height: "100vh" }}
      />
      <LiveTicker />
      <ServiceCards />
      <TechShowcase />
      <IoTSimulator />
      <ImpactSection />
      <footer data-perch className="relative overflow-hidden bg-gd-card border-t border-gd-border py-14 text-center text-sm text-gd-text-muted">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gd-accent-500/30 to-transparent" />
        <div className="relative mx-auto mb-4 h-12 w-12 overflow-hidden rounded-xl bg-gd-deepest ring-1 ring-gd-border-strong">
          <Image src="/logo.png" alt="GreenDuty logo" fill sizes="48px" className="object-contain p-1" />
        </div>
        <p className="font-semibold text-gd-text-primary text-lg mb-1">
          <span className="gradient-text">GreenDuty</span>
        </p>
        <p>Uniting Agriculture, Technology & Environmental Action</p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs">
          <span className="text-gd-text-secondary">Eco Map</span>
          <span className="text-gd-text-secondary">InstaGro</span>
          <span className="text-gd-text-secondary">Marketplace</span>
          <span className="text-gd-text-secondary">Agri-Tech B2B</span>
          <span className="text-gd-text-secondary">Tree Tracker</span>
        </div>
        <p className="mt-5 text-gd-text-muted">© 2026 GreenDuty Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}
