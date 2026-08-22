"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import anime from "animejs";
import { ArrowRight, Play, Satellite, Radar } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Stats {
  trees?: number; hotspots?: number; users?: number; posts?: number;
  cleanups?: number; volunteers?: number; verifiedUsers?: number;
}

/** Count-up number driven by anime.js */
function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const anim = anime({
      targets: { v: 0 },
      v: value,
      duration: 1400,
      easing: "easeOutExpo",
      round: 1,
      update: (animation: { animations: Array<{ currentValue: number }> }) => {
        const v = Math.round(animation.animations[0].currentValue);
        el.textContent = v.toLocaleString();
      },
    });
    return () => anim.pause();
  }, [value]);
  return <span ref={ref} className={className}>0</span>;
}

export function HeroSection() {
  const [stats, setStats] = useState<Stats | null>(null);
  const mediaQuery = typeof window !== "undefined" ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  const [reduced, setReduced] = useState(() => mediaQuery?.matches ?? false);
  const headlineRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!mediaQuery) return;
    const handleChange = () => setReduced(mediaQuery.matches);
    handleChange();
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [mediaQuery]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/stats")
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (!cancelled && d) setStats(d as Stats);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Staggered word reveal for the headline
  useEffect(() => {
    if (!headlineRef.current || reduced) return;
    const words = headlineRef.current.querySelectorAll("[data-w]");
    anime({ targets: words, opacity: [0, 1], translateY: [22, 0], rotateX: [40, 0], duration: 700, delay: anime.stagger(90, { start: 250 }), easing: "easeOutCubic" });
  }, [reduced]);

  const rows = stats
    ? [
        { label: "Trees Planted", value: stats.trees || 0 },
        { label: "Hotspots Reported", value: stats.hotspots || 0 },
        { label: "Cleanups Organized", value: stats.cleanups || 0 },
        { label: "Community Members", value: stats.users || 0 },
      ]
    : [
        { label: "Trees Planted", value: 0 },
        { label: "Hotspots Reported", value: 0 },
        { label: "Cleanups Organized", value: 0 },
        { label: "Community Members", value: 0 },
      ];

  return (
    <section data-perch className="relative overflow-hidden bg-gd-deepest pt-24 pb-28">
      {/* Panning blueprint grid floor */}
      <div className="absolute inset-0 bg-grid-pan opacity-40" />
      {/* Perspective fade at the bottom */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-gd-deepest to-transparent" />
      {/* Radial glows */}
      <div className="absolute -top-32 left-1/2 h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-b from-gd-accent-500/8 via-gd-olive-500/4 to-transparent blur-3xl" />
      <div className="absolute bottom-0 left-[-120px] h-72 w-72 rounded-full bg-gd-olive-500/6 blur-3xl float-slower" />
      <div className="absolute bottom-24 right-[-100px] h-72 w-72 rounded-full bg-gd-ember-500/5 blur-3xl float-slow" />

      {/* Floating particles */}
      {!reduced && (
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {[
            { l: "12%", t: "22%", s: 4, d: "0s" }, { l: "22%", t: "64%", s: 3, d: "1.4s" },
            { l: "38%", t: "14%", s: 5, d: "0.6s" }, { l: "55%", t: "70%", s: 3, d: "2.1s" },
            { l: "70%", t: "20%", s: 4, d: "1s" }, { l: "84%", t: "58%", s: 5, d: "0.3s" },
            { l: "92%", t: "30%", s: 3, d: "1.8s" }, { l: "46%", t: "38%", s: 3, d: "2.6s" },
          ].map((p, i) => (
            <span
              key={i}
              className={cn("absolute rounded-full", i % 2 ? "bg-gd-accent-400/50 float-slow" : "bg-gd-olive-500/40 float-slower")}
              style={{ left: p.l, top: p.t, width: p.s, height: p.s, animationDelay: p.d, boxShadow: "0 0 8px rgba(250,204,21,0.35)" }}
            />
          ))}
        </div>
      )}

      <div className="relative mx-auto max-w-7xl px-6 text-center">
        {/* Brand logo with radar orbit */}
        <div className="relative mx-auto mb-8 h-24 w-24">
          {/* Radar sweep */}
          <div className="absolute -inset-4 rounded-full border border-gd-accent-500/10" />
          <div className="absolute -inset-4 rounded-full border border-gd-accent-500/10 pulse-ring" />
          <div className="absolute -inset-4 rounded-full border border-gd-olive-500/10 pulse-ring" style={{ animationDelay: "1.3s" }} />
          <div className="relative h-24 w-24 overflow-hidden rounded-3xl bg-gd-card ring-1 ring-gd-border-strong shadow-2xl shadow-black/40 glow-ring-strong">
            <Image src="/logo.png" alt="GreenDuty logo" fill sizes="96px" className="object-contain p-2" priority />
          </div>
        </div>

        {/* Live badge */}
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-gd-accent-500/20 bg-gd-accent-500/5 px-4 py-1.5 text-sm text-gd-accent-300 backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-gd-accent-400 animate-pulse shadow-[0_0_8px_rgba(212,160,23,0.6)]" />
          Platform v2.0 Now Live · Real-time eco intelligence
        </div>

        {/* Headline — staggered word reveal */}
        <h1 ref={headlineRef} className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-gd-text-primary sm:text-5xl lg:text-6xl [perspective:800px]">
          <span data-w className="inline-block">Uniting</span>{" "}
          <span data-w className="inline-block gradient-text">Agriculture</span>
          <span data-w className="inline-block">,</span>{" "}
          <span data-w className="inline-block gradient-text">Technology</span>{" "}
          <span data-w className="inline-block">&amp;</span>{" "}
          <span data-w className="inline-block shimmer">Environmental Action</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-gd-text-secondary leading-relaxed">
          GreenDuty connects farmers, citizens, and corporations to build a
          sustainable future through smart farming, pollution reporting, and
          community-driven environmental action.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/eco-map"
            className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 px-6 py-3 text-sm font-semibold text-gd-text-inverse shadow-lg shadow-gd-accent-500/20 hover:shadow-gd-accent-500/40 hover:brightness-110 transition-all"
          >
            <Radar className="h-4 w-4 group-hover:animate-spin-slow" /> Explore Eco Map
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
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

        {/* High-tech telemetry strip */}
        <div className="mx-auto mt-10 flex max-w-xl items-center justify-center gap-3 rounded-2xl border border-gd-border-soft bg-gd-card/60 px-5 py-3 backdrop-blur-sm">
          <Satellite className="h-4 w-4 text-gd-olive-500" />
          <span className="text-xs text-gd-text-muted">Satellite uplink</span>
          <span className="h-1 w-1 rounded-full bg-gd-border-strong" />
          <span className="flex items-center gap-1.5 text-xs font-medium text-gd-success">
            <span className="h-1.5 w-1.5 rounded-full bg-gd-success glow-breathe" /> Systems operational
          </span>
          <span className="h-1 w-1 rounded-full bg-gd-border-strong" />
          <span className="text-xs text-gd-text-muted">v2.0</span>
        </div>

        {/* Stats row — real numbers, count-up */}
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {rows.map((s, i) => (
            <div
              key={i}
              className="relative overflow-hidden rounded-2xl bg-gd-accent-500/3 border border-gd-accent-500/8 px-4 py-5 text-center backdrop-blur-sm hover:border-gd-accent-500/15 transition-all"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gd-accent-500/30 to-transparent" />
              <p className="text-2xl font-bold text-gd-text-primary tracking-tight tabular-nums">
                <AnimatedNumber value={s.value} />
              </p>
              <p className="text-xs font-medium text-gd-accent-400 mt-1.5 uppercase tracking-wider">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
