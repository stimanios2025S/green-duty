"use client";
import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { HeroSection } from "@/components/landing/HeroSection";
import { ServiceCards } from "@/components/landing/ServiceCards";
import { IoTSimulator } from "@/components/landing/IoTSimulator";
import { Bird } from "@/components/landing/Bird";

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Landing page is the "home" for logged-in users; otherwise send to login
  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return <div className="flex min-h-screen items-center justify-center bg-gd-deepest"><div className="h-10 w-10 animate-spin rounded-full border-2 border-gd-accent-500 border-t-transparent" /></div>;
  }

  return (
    <div className="-m-6 overflow-x-hidden">
      <Bird />
      <HeroSection />
      <ServiceCards />
      <IoTSimulator />
      <footer data-perch className="bg-gd-card border-t border-gd-border py-12 text-center text-sm text-gd-text-muted">
        <div className="relative mx-auto mb-4 h-12 w-12 overflow-hidden rounded-xl bg-gd-deepest ring-1 ring-gd-border-strong">
          <Image src="/logo.png" alt="GreenDuty logo" fill sizes="48px" className="object-contain p-1" />
        </div>
        <p className="font-semibold text-gd-text-primary text-lg mb-1">
          <span className="gradient-text">GreenDuty</span>
        </p>
        <p>Uniting Agriculture, Technology & Environmental Action</p>
        <p className="mt-4 text-gd-text-muted">© 2025 GreenDuty Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}
