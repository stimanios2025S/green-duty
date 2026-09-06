"use client";

import { useEffect, useRef, useState } from "react";
import { SylvaHero as ThreeUISylvaHero } from "@designcodeio/threeui";
import "@designcodeio/threeui/style.css";

/* ─── Presentation CSS — hides ALL Sylva page UI, shows ONLY the Three.js canvas ─── */
const PRESENTATION_CSS = `
  html, body { width: 100% !important; height: 100% !important; min-height: 100% !important; overflow: hidden !important; margin: 0 !important; background: #060608 !important; }
  /* Nuke all children of body */
  body > * { display: none !important; }
  /* Bring back the hero container */
  .hero { display: block !important; position: fixed !important; inset: 0 !important; width: 100% !important; height: 100% !important; }
  /* Nuke everything inside hero */
  .hero > * { display: none !important; }
  /* Show ONLY the Three.js canvas */
  #scene { display: block !important; position: fixed !important; inset: 0 !important; width: 100% !important; height: 100% !important; z-index: 9999 !important; pointer-events: none !important; }
  #scene canvas { display: block !important; width: 100% !important; height: 100% !important; pointer-events: none !important; }
`;

/**
 * Loads the complete SylvaHero Living Green scene via the @designcodeio/threeui
 * package component, same as the landing page but used as a pure background.
 * Falls back to CSS particles if WebGL is unavailable.
 */
export default function SylvaLoginBg() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const applyPresentation = (iframe: HTMLIFrameElement) => {
      const doc = iframe.contentDocument;
      if (!doc) return;
      const style = doc.createElement("style");
      style.id = "gd-login-presentation";
      style.textContent = PRESENTATION_CSS;
      doc.head.appendChild(style);
      iframe.contentWindow?.dispatchEvent(new Event("resize"));
    };

    const markReady = () => {
      const iframe = wrapper.querySelector("iframe");
      if (!iframe) return false;
      const doc = iframe.contentDocument;
      const root = doc?.documentElement;
      const scene = doc?.querySelector("#scene canvas");
      if (root?.classList.contains("is-ready") && scene) {
        setLoaded(true);
        return true;
      }
      return false;
    };

    let attempts = 0;
    const maxAttempts = 40;
    const interval = setInterval(() => {
      attempts++;
      const iframe = wrapper.querySelector("iframe");
      if (iframe) {
        if (iframe.contentDocument?.readyState === "complete") {
          applyPresentation(iframe);
          if (markReady()) { clearInterval(interval); return; }
        } else {
          iframe.addEventListener("load", () => {
            applyPresentation(iframe);
            markReady();
            setTimeout(markReady, 500);
            setTimeout(markReady, 1500);
          }, { once: true });
        }
        if (attempts >= 2) { clearInterval(interval); return; }
      }
      if (attempts >= maxAttempts) clearInterval(interval);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Primary: real Sylva Three.js scene via package component */}
      <div
        ref={wrapperRef}
        style={{
          position: "absolute", inset: 0, zIndex: 0,
          background: "#060608",
          opacity: loaded ? 1 : 0,
          transition: "opacity 0.6s ease",
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

      {/* Fallback: CSS particles while the iframe loads or if WebGL fails */}
      {!loaded && <CSSFallbackBg />}
    </>
  );
}

/**
 * Pure CSS fallback — animated particles + gradient — visible while the
 * real Three.js scene loads, and provides a graceful fallback on devices
 * where WebGL doesn't work inside a sandboxed iframe.
 */
function CSSFallbackBg() {
  return (
    <div style={{
      position: "absolute", inset: 0, zIndex: 0,
      background: "#060608", overflow: "hidden",
    }}>
      {/* Radial gradient */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at 30% 40%, rgba(132,204,22,0.08) 0%, transparent 55%)",
      }} />

      {/* Floating dots */}
      {Array.from({ length: 24 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: `${3 + (i % 4) * 2}px`,
            height: `${3 + (i % 4) * 2}px`,
            borderRadius: "50%",
            background: i % 3 === 0 ? "#65a30d" : i % 3 === 1 ? "#84cc16" : "#4d7c0f",
            opacity: 0.25 + (i % 5) * 0.08,
            left: `${(i * 4.17) % 100}%`,
            top: `${(i * 7.3) % 100}%`,
            animation: `float-${i % 3} ${8 + (i % 5) * 2}s ease-in-out infinite`,
            animationDelay: `${(i * 0.7) % 4}s`,
          }}
        />
      ))}

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
    </div>
  );
}
