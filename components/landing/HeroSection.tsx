"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowRight, Play } from "lucide-react";
import { AnimeWrapper } from "@/components/ui/AnimeWrapper";
import { formatNumber } from "@/lib/utils";
import Link from "next/link";

export function HeroSection() {
  const [stats, setStats] = useState<any>(null);
  useEffect(() => {
    fetch("/api/stats").then(r => (r.ok ? r.json() : null)).then(d => d && setStats(d)).catch(() => {});
  }, []);

  return (
    <section data-perch className="relative overflow-hidden bg-gd-deepest pt-20 pb-24">
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-grid opacity-30" />
      {/* Radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[600px] w-[800px] rounded-full bg-gradient-to-b from-gd-accent-500/5 via-gd-olive-500/3 to-transparent blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 text-center">
        <AnimeWrapper animate="fadeIn">
          {/* Brand logo */}
          <div className="relative mx-auto mb-8 h-24 w-24 overflow-hidden rounded-3xl bg-gd-card ring-1 ring-gd-border-strong shadow-2xl shadow-black/40 glow-ring-strong">
            <Image src="/logo.png" alt="GreenDuty logo" fill sizes="96px" className="object-contain p-2" priority />
          </div>

          {/* Live badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gd-accent-500/20 bg-gd-accent-500/5 px-4 py-1.5 text-sm text-gd-accent-300 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-gd-accent-400 animate-pulse shadow-[0_0_8px_rgba(212,160,23,0.6)]" />
            Platform v2.0 Now Live
          </div>

          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-gd-text-primary sm:text-5xl lg:text-6xl">
            Uniting <span className="gradient-text">Agriculture</span>,{" "}
            <span className="gradient-text">Technology</span> &amp;{" "}
            Environmental Action
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-gd-text-secondary leading-relaxed">
            GreenDuty connects farmers, citizens, and corporations to build a
            sustainable future through smart farming, pollution reporting, and
            community-driven environmental action.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/eco-map"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 px-6 py-3 text-sm font-semibold text-gd-text-inverse shadow-lg shadow-gd-accent-500/20 hover:shadow-gd-accent-500/40 hover:brightness-110 transition-all"
            >
              Report Pollution <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 rounded-xl border border-gd-border-strong bg-gd-elevated/50 px-6 py-3 text-sm font-semibold text-gd-text-primary hover:bg-gd-overlay hover:border-gd-accent-500/30 transition-all backdrop-blur-sm"
            >
              Shop Marketplace
            </Link>
            <button className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-gd-text-muted hover:text-gd-accent-300 transition-colors">
              <Play className="h-4 w-4" /> Watch Demo
            </button>
          </div>

          {/* Stats row */}
          <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Trees Planted", value: stats?.trees ?? 0 },
              { label: "Hotspots Reported", value: stats?.hotspots ?? 0 },
              { label: "Community Members", value: stats?.users ?? 0 },
              { label: "InstaGro Posts", value: stats?.posts ?? 0 },
            ].map((s, i) => (
              <div
                key={i}
                className="rounded-2xl bg-gd-accent-500/3 border border-gd-accent-500/8 px-4 py-5 text-center backdrop-blur-sm hover:border-gd-accent-500/15 transition-all"
              >
                <p className="text-2xl font-bold text-gd-text-primary tracking-tight">
                  {formatNumber(s.value)}
                </p>
                <p className="text-xs font-medium text-gd-accent-400 mt-1.5 uppercase tracking-wider">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </AnimeWrapper>
      </div>
    </section>
  );
}
