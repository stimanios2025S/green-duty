"use client";
import { Cpu, Droplets, Waves, ScanLine, LineChart, Gauge, Radio } from "lucide-react";
import { ScrollReveal } from "@/components/landing/ScrollReveal";

/**
 * High-tech / agro-tech showcase — the "engineering" face of the platform.
 * Animated radar, pipeline and sensor visuals match the moody orange↔green theme.
 */

function RadarVisual() {
  return (
    <div className="relative flex h-28 items-center justify-center">
      <div className="absolute h-24 w-24 rounded-full border border-gd-olive-500/15" />
      <div className="absolute h-16 w-16 rounded-full border border-gd-olive-500/20" />
      <div className="absolute h-8 w-8 rounded-full border border-gd-olive-500/30" />
      <div className="absolute h-24 w-24 rounded-full border border-gd-olive-500/10 pulse-ring" />
      <div className="absolute inset-0 mx-auto my-auto h-px w-28 origin-left rotate-45 bg-gradient-to-r from-gd-olive-500/50 to-transparent animate-spin-slow" style={{ transformOrigin: "center" }} />
      <div className="relative h-3 w-3 rounded-full bg-gd-olive-500 shadow-[0_0_12px_rgba(132,204,22,0.9)]" />
    </div>
  );
}

function PipelineVisual() {
  return (
    <div className="flex h-28 items-center justify-center">
      <svg viewBox="0 0 160 64" className="w-40">
        <path d="M8 32 H 152" stroke="rgba(212,160,23,0.25)" strokeWidth="2" strokeDasharray="4 6" className="dash-flow" fill="none" />
        <path d="M8 32 H 152" stroke="url(#gdPipeGrad)" strokeWidth="2.5" fill="none" />
        <defs>
          <linearGradient id="gdPipeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#d4a017" stopOpacity="0" />
            <stop offset="60%" stopColor="#d4a017" />
            <stop offset="100%" stopColor="#84cc16" />
          </linearGradient>
        </defs>
        {[24, 72, 120].map((x, i) => (
          <g key={i}>
            <circle cx={x} cy="32" r="3.5" fill="#131318" stroke="#d4a017" strokeWidth="1.5" />
            <circle cx={x} cy="32" r="1.5" fill="#facc15" />
          </g>
        ))}
        <circle cx="152" cy="32" r="4" fill="#84cc16">
          <animate attributeName="r" values="3;5;3" dur="1.8s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
}

function SoilVisual() {
  return (
    <div className="flex h-28 flex-col items-center justify-center gap-1.5">
      {[
        { w: "88%", c: "from-gd-olive-500/80 to-gd-olive-500/20" },
        { w: "62%", c: "from-gd-accent-400/80 to-gd-accent-500/20" },
        { w: "74%", c: "from-gd-olive-600/80 to-gd-olive-500/20" },
      ].map((l, i) => (
        <div key={i} className="flex w-40 items-center gap-2">
          <div className="h-3 flex-1 overflow-hidden rounded-sm bg-gd-overlay">
            <div className={`h-full rounded-sm bg-gradient-to-r ${l.c} transition-all duration-700`} style={{ width: l.w, animationDelay: `${i * 0.4}s` }} />
          </div>
        </div>
      ))}
      <p className="mt-1 text-[10px] font-medium text-gd-text-muted">NPK · pH · Moisture</p>
    </div>
  );
}

function ForecastVisual() {
  const bars = [34, 58, 42, 76, 52, 90, 64];
  return (
    <div className="flex h-28 items-end justify-center gap-1.5">
      {bars.map((h, i) => (
        <div key={i} className="w-4 overflow-hidden rounded-t-sm bg-gd-overlay">
          <div
            className="w-full rounded-t-sm bg-gradient-to-t from-gd-accent-600 to-gd-accent-400"
            style={{ height: `${h}%`, animation: `growBar 1.2s ease-out ${i * 0.12}s both` }}
          />
        </div>
      ))}
      <style>{`@keyframes growBar { from { height: 0 } }`}</style>
    </div>
  );
}

const TECH = [
  {
    icon: Droplets,
    title: "Smart Irrigation",
    desc: "Weather-aware drip control with zone scheduling, flow telemetry, and automatic drought response.",
    visual: <PipelineVisual />,
    tags: ["Flow telemetry", "Zone control", "Drought alerts"],
  },
  {
    icon: Waves,
    title: "Soil Intelligence",
    desc: "In-field NPK, pH and moisture sensors stream live readings to guide precise fertilization.",
    visual: <SoilVisual />,
    tags: ["NPK sensing", "pH mapping", "Moisture grid"],
  },
  {
    icon: ScanLine,
    title: "Drone Surveying",
    desc: "Multispectral aerial scans detect crop stress, pest pressure, and irrigation leaks early.",
    visual: <RadarVisual />,
    tags: ["Multispectral", "Stress detection", "Field mapping"],
  },
  {
    icon: LineChart,
    title: "Predictive Analytics",
    desc: "Machine-learning models forecast yields, disease risk, and market prices from real farm data.",
    visual: <ForecastVisual />,
    tags: ["Yield forecast", "Risk scoring", "Price models"],
  },
];

export function TechShowcase() {
  return (
    <section data-perch className="relative overflow-hidden bg-gd-base py-20">
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mb-14 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-gd-olive-500/15 bg-gd-olive-500/5 px-3 py-1 text-xs font-medium text-gd-olive-400 mb-4">
            <Cpu className="h-3 w-3" /> Agro-Tech Engine
          </div>
          <h2 className="text-3xl font-bold text-gd-text-primary tracking-tight sm:text-4xl">
            Built for the <span className="gradient-text">farms of tomorrow</span>
          </h2>
          <p className="mt-3 text-gd-text-secondary max-w-2xl mx-auto leading-relaxed">
            Four engineering pillars power GreenDuty&apos;s smart-farming layer — every one integrated with the marketplace, eco-map, and community network.
          </p>
        </div>

        <ScrollReveal stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TECH.map(t => (
            <div
              key={t.title}
              className="group relative overflow-hidden rounded-2xl border border-gd-border-soft bg-gd-card/80 p-6 transition-all duration-300 hover:border-gd-olive-500/30 hover:glow-green"
            >
              {/* Holographic scan line */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-gd-olive-500/6 to-transparent scan-line opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gd-olive-500/15 bg-gd-olive-500/8 text-gd-olive-400">
                <t.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-semibold text-gd-text-primary">{t.title}</h3>
              <p className="mt-2 text-sm text-gd-text-secondary leading-relaxed">{t.desc}</p>
              <div className="mt-4">{t.visual}</div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {t.tags.map(tag => (
                  <span key={tag} className="rounded-full border border-gd-border bg-gd-elevated/60 px-2.5 py-0.5 text-[10px] font-medium text-gd-text-secondary">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </ScrollReveal>

        {/* Telemetry strip */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 rounded-2xl border border-gd-border-soft bg-gd-deepest/60 px-6 py-4 backdrop-blur-sm">
          {[
            { icon: Gauge, label: "12ms sensor latency", color: "text-gd-accent-400" },
            { icon: Radio, label: "IoT mesh online", color: "text-gd-olive-500" },
            { icon: Cpu, label: "Auto-pilot v2.4", color: "text-gd-ember-500" },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-xs font-medium text-gd-text-secondary">
              <s.icon className={`h-4 w-4 ${s.color}`} /> {s.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
