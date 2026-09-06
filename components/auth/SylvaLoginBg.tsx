"use client";

import { useRef, useEffect, useState, Suspense } from "react";
import { SylvaHero as ThreeUISylvaHero } from "@designcodeio/threeui";
import "@designcodeio/threeui/style.css";

/* ─── Presentation CSS — hides ALL Sylva page UI, shows ONLY the Three.js canvas ─── */
/* IMPORTANT: Use visibility:hidden (NOT display:none) on .stage to preserve
   layout dimensions — the ResizeObserver on .stage and stage.getBoundingClientRect()
   are used by the Three.js resize() function to size the canvas drawing buffer. */
const PRESENTATION_CSS = `
  html, body {
    width: 100% !important; height: 100% !important;
    min-height: 100% !important; overflow: hidden !important;
    margin: 0 !important; background: #060608 !important;
  }
  #scene {
    position: fixed !important; inset: 0 !important;
    width: 100% !important; height: 100% !important;
    z-index: 9999 !important; pointer-events: none !important;
    opacity: 1 !important;
  }
  #scene canvas {
    display: block !important; width: 100% !important; height: 100% !important;
    pointer-events: none !important;
  }
  .dock-wrap { visibility: hidden !important; pointer-events: none !important; }
  .stage { visibility: hidden !important; pointer-events: none !important; }
  #hero, #hero * { pointer-events: none !important; }
`;

/* ─── Animated Particles ─── */
function AnimatedParticles() {
  const particles = Array.from({ length: 25 }).map((_, i) => ({
    id: i,
    size: 1.5 + (i % 5) * 1,
    x: (i * 4) % 100,
    y: (i * 3.7) % 100,
    duration: 6 + (i % 4) * 2,
    delay: (i * 0.3) % 3,
    color: i % 3 === 0 ? "rgba(132,204,22,0.35)" : i % 3 === 1 ? "rgba(34,197,94,0.25)" : "rgba(163,230,53,0.2)",
  }));

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ pointerEvents: "none" }}>
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            background: p.color,
            left: `${p.x}%`,
            top: `${p.y}%`,
            animation: `floatUp ${p.duration}s ease-in-out ${p.delay}s infinite`,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Fallback Background (while iframe loads) ─── */
function CSSFallbackBg() {
  return (
    <div className="absolute inset-0" style={{ background: "#060608" }}>
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at 30% 50%, rgba(132,204,22,0.06) 0%, transparent 60%)",
        }}
      />
      <AnimatedParticles />
    </div>
  );
}

/* ─── ThreeUI SylvaHero Background ─── */
function ThreeUIBackground() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const appliedRef = useRef(false);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const applyPresentation = (iframe: HTMLIFrameElement) => {
      const doc = iframe.contentDocument;
      if (!doc || appliedRef.current) return;
      appliedRef.current = true;
      const style = doc.createElement("style");
      style.id = "gd-login-presentation";
      style.textContent = PRESENTATION_CSS;
      doc.head.appendChild(style);
      iframe.contentWindow?.dispatchEvent(new Event("resize"));
    };

    const checkReady = (): boolean => {
      const iframe = wrapper.querySelector("iframe");
      if (!iframe) return false;
      const doc = iframe.contentDocument;
      if (!doc) return false;
      if (!appliedRef.current) applyPresentation(iframe);
      // The authored page adds `is-ready` to <body> after first Three.js frame (line 2140)
      // Check both body and htmlElement for maximum compatibility
      return doc.body?.classList.contains("is-ready") || doc.documentElement.classList.contains("is-ready");
    };

    const interval = setInterval(() => {
      if (checkReady()) {
        setLoaded(true);
        clearInterval(interval);
      }
    }, 200);

    const iframe = wrapper.querySelector("iframe");
    if (iframe) {
      iframe.addEventListener("load", () => {
        applyPresentation(iframe);
        if (checkReady()) {
          setLoaded(true);
          clearInterval(interval);
        }
      }, { once: true });
    }

    const fallback = window.setTimeout(() => {
      setLoaded(true);
      clearInterval(interval);
    }, 4000);

    return () => {
      clearInterval(interval);
      window.clearTimeout(fallback);
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="absolute inset-0"
      style={{
        zIndex: 0,
        opacity: loaded ? 1 : 0,
        transition: "opacity 0.6s ease",
        background: "#060608",
      }}
    >
      <ThreeUISylvaHero
        headingFont="lexend"
        bodyFont="lexend"
        headingWeight="300"
        bodyWeight="300"
        primaryColor="#ffffff"
        headingSize={63}
        bodySize={16.5}
        headingLetterSpacing={-0.006}
      />
    </div>
  );
}

/* ─── Main Component — pure background, no children wrapper ─── */
export default function SylvaLoginBg() {
  return (
    <>
      {/* ─── ThreeUI Living Green 3D Background ─── */}
      <Suspense fallback={<CSSFallbackBg />}>
        <ThreeUIBackground />
      </Suspense>

      {/* ─── Gradient overlays ─── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          zIndex: 1,
          background:
            "linear-gradient(180deg, rgba(6,6,8,0.2) 0%, rgba(6,6,8,0.15) 30%, rgba(6,6,8,0.6) 70%, #060608 100%)",
        }}
      />

      {/* ─── Float animation keyframes ─── */}
      <style>{`
        @keyframes floatUp {
          0%, 100% {
            transform: translateY(0) scale(1);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-12px) scale(1.1);
            opacity: 0.6;
          }
        }
      `}</style>
    </>
  );
}
