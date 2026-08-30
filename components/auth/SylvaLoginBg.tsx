"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Loads the complete Sylva inner-green-3d.html authored page in a full-viewport
 * iframe, same as the landing page's SylvaHero but used as a pure background.
 * Falls back to CSS particles if WebGL is unavailable.
 */
export default function SylvaLoginBg() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const applyPresentation = () => {
      const doc = frame.contentDocument;
      if (!doc) return;

      // Make the page fill the viewport and hide everything except the 3D scene
      const style = doc.createElement("style");
      style.id = "gd-login-presentation";
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

      // Trigger a resize so Three.js recalculates
      frame.contentWindow?.dispatchEvent(new Event("resize"));
    };

    const onLoad = () => {
      applyPresentation();
      // The iframe `load` event also fires for an error document. Wait until the
      // authored Three.js scene says it is ready before hiding the CSS fallback.
      const markReady = () => {
        const root = frame.contentDocument?.documentElement;
        const scene = frame.contentDocument?.querySelector("#scene canvas");
        if (root?.classList.contains("is-ready") && scene) setLoaded(true);
      };
      markReady();
      window.setTimeout(markReady, 800);
      window.setTimeout(markReady, 2_000);
    };

    const onError = () => setLoaded(false);
    frame.addEventListener("load", onLoad);
    frame.addEventListener("error", onError);

    // If already loaded (cached), apply immediately
    if (frame.contentDocument?.readyState === "complete") {
      onLoad();
    }

    return () => {
      frame.removeEventListener("load", onLoad);
      frame.removeEventListener("error", onError);
    };
  }, []);

  return (
    <>
      {/* Primary: real Sylva Three.js scene via iframe */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0,
        background: "#060608",
        opacity: loaded ? 1 : 0,
        transition: "opacity 0.6s ease",
      }}>
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
