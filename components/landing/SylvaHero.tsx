"use client";

import { useRef, useMemo, Suspense, useEffect, useState } from "react";
import Image from "next/image";

/* ─── Configurable Props ─── */

export interface HeroStat {
  label: string;
  value: string;
}

export interface HeroCard {
  tagline: string;
  title: string;
  image: string;
  href: string;
}

export interface SylvaHeroProps {
  title?: string;
  subtitle?: string;
  card1?: HeroCard;
  stats?: [HeroStat, HeroStat];
  card2?: HeroCard;
}

/* ─── Default agricultural copy ─── */

const DEFAULTS: Required<SylvaHeroProps> = {
  title: "Digitalizing Algeria's Agricultural Frontier",
  subtitle:
    "Connecting Algerian farmers directly to transparent wholesale markets, smart daily CRM tools, and real-time harvest analytics.",
  card1: {
    tagline: "Agri-CRM",
    title: "Digital Farm Operations",
    image: "/images/hero-farm-crm.svg",
    href: "/farmer",
  },
  stats: [
    { label: "Wilayas Covered", value: "58" },
    { label: "Tracked Harvests", value: "50,000+ Qtl" },
  ],
  card2: {
    tagline: "Agro Market",
    title: "Direct Wholesale Access",
    image: "/images/hero-market.svg",
    href: "/marketplace",
  },
};

/* ─── ThreeUI SylvaHero Background (real Living Green 3D scene via iframe) ─── */

function ThreeUIBackground() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const applyPresentation = () => {
      const doc = frame.contentDocument;
      if (!doc) return;
      // Hide everything except the 3D canvas
      const style = doc.createElement("style");
      style.id = "gd-hero-presentation";
      style.textContent = `
        html, body { width: 100% !important; height: 100% !important; min-height: 100% !important; overflow: hidden !important; margin: 0 !important; }
        body * { visibility: hidden !important; pointer-events: none !important; }
        canvas, #scene, #gl, .hero { visibility: visible !important; pointer-events: auto !important; }
        canvas, #scene, #gl, .hero {
          position: fixed !important; inset: 0 !important;
          width: 100vw !important; height: 100vh !important;
          max-width: none !important; max-height: none !important;
        }
      `;
      doc.head.appendChild(style);
      frame.contentWindow?.dispatchEvent(new Event("resize"));
    };

    const onLoad = () => {
      applyPresentation();
      const markReady = () => {
        const root = frame.contentDocument?.documentElement;
        const scene = frame.contentDocument?.querySelector("#scene canvas");
        if (root?.classList.contains("is-ready") && scene) setLoaded(true);
      };
      markReady();
      window.setTimeout(markReady, 800);
      window.setTimeout(markReady, 2_000);
    };

    frame.addEventListener("load", onLoad);
    if (frame.contentDocument?.readyState === "complete") onLoad();

    return () => frame.removeEventListener("load", onLoad);
  }, []);

  return (
    <div className="absolute inset-0" style={{ opacity: loaded ? 1 : 0, transition: "opacity 0.6s ease" }}>
      <iframe
        ref={frameRef}
        title="Sylva Living Green"
        src="/landing-pages/inner-green-3d.html"
        sandbox="allow-scripts allow-same-origin"
        loading="eager"
        style={{
          position: "absolute", inset: 0,
          display: "block", width: "100%", height: "100%",
          border: 0, background: "#060608",
        }}
      />
    </div>
  );
}

/* ─── CSS Fallback (visible while iframe loads) ─── */
function CSSFallbackBg() {
  return (
    <div className="absolute inset-0" style={{ background: "#060608", overflow: "hidden" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 30% 50%, rgba(132,204,22,0.08) 0%, transparent 55%)" }} />
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          width: `${3 + (i % 4) * 2}px`, height: `${3 + (i % 4) * 2}px`,
          borderRadius: "50%",
          background: i % 3 === 0 ? "#65a30d" : i % 3 === 1 ? "#84cc16" : "#4d7c0f",
          opacity: 0.25 + (i % 5) * 0.08,
          left: `${(i * 4.17) % 100}%`, top: `${(i * 7.3) % 100}%`,
          animation: `float-${i % 3} ${8 + (i % 5) * 2}s ease-in-out infinite`,
          animationDelay: `${(i * 0.7) % 4}s`,
        }} />
      ))}
    </div>
  );
}

/* ─── Glassmorphic Card ─── */
function GlassCard({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl backdrop-blur-xl ${className}`}
      style={{
        background: "rgba(19, 19, 24, 0.6)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
      {...props}
    >
      {children}
    </div>
  );
}

/* ─── Main SylvaHero Component ─── */

export default function SylvaHero(props: SylvaHeroProps) {
  const cfg = { ...DEFAULTS, ...props };
  if (props.stats) cfg.stats = props.stats;
  if (props.card1) cfg.card1 = { ...DEFAULTS.card1, ...props.card1 };
  if (props.card2) cfg.card2 = { ...DEFAULTS.card2, ...props.card2 };

  return (
    <section className="relative w-full overflow-hidden" style={{ background: "#060608", minHeight: "100vh" }}>
      {/* ─── ThreeUI Living Green 3D Background (iframe) ─── */}
      <Suspense fallback={<CSSFallbackBg />}>
        <ThreeUIBackground />
      </Suspense>

      {/* ─── Gradient overlays for depth ─── */}
      <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(6,6,8,0.3) 0%, rgba(6,6,8,0.1) 40%, rgba(6,6,8,0.5) 80%, #060608 100%)" }} />
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse at 30% 50%, rgba(132,204,22,0.06) 0%, transparent 60%)" }} />

      {/* ─── HTML Overlay ─── */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col justify-between px-6 py-12 lg:flex-row lg:items-center lg:py-0">

        {/* ─── Left Column: Title + Subtitle ─── */}
        <div className="flex flex-1 flex-col justify-center lg:max-w-xl lg:pr-8">
          {/* Live badge */}
          <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full px-4 py-1.5 text-sm" style={{ background: "rgba(132,204,22,0.08)", border: "1px solid rgba(132,204,22,0.2)", color: "#84cc16" }}>
            <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "#84cc16", boxShadow: "0 0 8px rgba(132,204,22,0.6)" }} />
            Platform v2.0 — Agri-Tech & Environmental Intelligence
          </div>

          {/* Section 1: Title */}
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl" style={{ color: "#f4f4f5" }}>
            {cfg.title.split(" ").map((word, i) => (
              <span key={i} className="inline-block" style={{
                background: i % 3 === 1 ? "linear-gradient(135deg, #84cc16, #65a30d)" : "none",
                WebkitBackgroundClip: i % 3 === 1 ? "text" : "unset",
                WebkitTextFillColor: i % 3 === 1 ? "transparent" : "unset",
              }}>
                {word}{" "}
              </span>
            ))}
          </h1>

          {/* Section 2: Subtitle */}
          <p className="mt-6 max-w-lg text-lg leading-relaxed" style={{ color: "#a1a1aa" }}>
            {cfg.subtitle}
          </p>

          {/* CTA buttons */}
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a
              href="/farmer"
              className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold transition-all"
              style={{ background: "linear-gradient(135deg, #84cc16, #65a30d)", color: "#060608", boxShadow: "0 4px 20px rgba(132,204,22,0.25)" }}
            >
              🌱 Enter Farmer Portal
            </a>
            <a
              href="/marketplace"
              className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold transition-all backdrop-blur-sm"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#f4f4f5" }}
            >
              🏪 Browse Marketplace
            </a>
          </div>
        </div>

        {/* ─── Right Column: Stats + Cards ─── */}
        <div className="mt-12 flex flex-col gap-4 lg:mt-0 lg:w-[420px] lg:flex-shrink-0">

          {/* Section 4: Stats Widget (top-right) */}
          <GlassCard className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-2 w-2 rounded-full animate-pulse" style={{ background: "#22c55e" }} />
              <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "#71717a" }}>Live Metrics</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {cfg.stats!.map((stat, i) => (
                <div key={i}>
                  <p className="text-2xl font-bold" style={{ color: i === 0 ? "#84cc16" : "#f59e0b" }}>{stat.value}</p>
                  <p className="text-[11px] mt-1" style={{ color: "#71717a" }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Section 3: Feature Card 1 (Agri-CRM) */}
          <GlassCard className="p-4 group cursor-pointer hover:border-green-500/20 transition-all">
            <a href={cfg.card1.href} className="flex gap-4">
              <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl" style={{ background: "#1e1e27" }}>
                <Image src={cfg.card1.image} alt={cfg.card1.title} fill className="object-cover" sizes="80px" />
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#84cc16" }}>{cfg.card1.tagline}</span>
                <p className="text-sm font-semibold mt-0.5 truncate" style={{ color: "#f4f4f5" }}>{cfg.card1.title}</p>
                <span className="text-[11px] mt-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#84cc16" }}>Explore →</span>
              </div>
            </a>
          </GlassCard>

          {/* Section 5: Feature Card 2 (Market) */}
          <GlassCard className="p-4 group cursor-pointer hover:border-amber-500/20 transition-all">
            <a href={cfg.card2.href} className="flex gap-4">
              <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl" style={{ background: "#1e1e27" }}>
                <Image src={cfg.card2.image} alt={cfg.card2.title} fill className="object-cover" sizes="80px" />
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#f59e0b" }}>{cfg.card2.tagline}</span>
                <p className="text-sm font-semibold mt-0.5 truncate" style={{ color: "#f4f4f5" }}>{cfg.card2.title}</p>
                <span className="text-[11px] mt-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#f59e0b" }}>Explore →</span>
              </div>
            </a>
          </GlassCard>
        </div>
      </div>

      {/* ─── Bottom scroll indicator ─── */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
        <span className="text-[10px] uppercase tracking-widest" style={{ color: "#71717a" }}>Scroll</span>
        <div className="h-8 w-[1px] animate-pulse" style={{ background: "linear-gradient(180deg, #71717a, transparent)" }} />
      </div>

      {/* ─── Float keyframes for CSS fallback ─── */}
      <style>{`
        @keyframes float-0 {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-20px) translateX(10px); }
        }
        @keyframes float-1 {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-30px) translateX(-8px); }
        }
        @keyframes float-2 {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-15px) translateX(15px); }
        }
      `}</style>
    </section>
  );
}
