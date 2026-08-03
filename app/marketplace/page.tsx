"use client";
import { useEffect, useRef } from "react";
import anime from "animejs";
import { MarketplaceFilters } from "@/components/marketplace/MarketplaceFilters";
import { AnimeWrapper } from "@/components/ui/AnimeWrapper";
import { ShieldCheck } from "lucide-react";

export default function MarketplacePage() {
  const titleRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (titleRef.current) anime({ targets: titleRef.current, opacity: [0, 1], translateY: [20, 0], duration: 600, easing: "easeOutCubic" }); }, []);
  return (
    <div className="space-y-6">
      <AnimeWrapper animate="fadeIn">
        <div ref={titleRef} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gd-text-primary tracking-tight">Agri-Tech Marketplace</h1>
            <p className="text-sm text-gd-text-secondary mt-1">Quality-assured products for farmers, growers, and agri-businesses</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 rounded-xl bg-gd-accent-500/5 border border-gd-accent-500/10 px-4 py-2">
            <ShieldCheck className="h-4 w-4 text-gd-accent-400" />
            <span className="text-xs font-medium text-gd-accent-400">All purchases quality-checked</span>
          </div>
        </div>
      </AnimeWrapper>
      <MarketplaceFilters />
    </div>
  );
}
