"use client";
import { useEffect, useRef } from "react";
import anime from "animejs";

/**
 * Scroll-companion bird for the landing page.
 *
 * Each landing section (`[data-perch]`) has a viewport-relative perch spot.
 * When the user scrolls so a new section crosses the viewport middle, the
 * bird arcs across the screen to that section's perch, lands with a ripple,
 * and idles there until the user scrolls again.
 *
 * Notes:
 * - anime.js v3 animates SVG `rotate` through CSS transforms, so the wings
 *   use `transform-box: view-box` + pixel `transform-origin` to pivot at
 *   their shoulders (the svg viewBox coordinate system is known).
 * - The app scrolls inside <main>, so the scroll listener attaches there
 *   (with window as a fallback).
 */
const PERCHES = [
  { x: 0.10, y: 0.74 }, // Hero
  { x: 0.84, y: 0.50 }, // B2B Services
  { x: 0.12, y: 0.60 }, // IoT Simulator
  { x: 0.50, y: 0.82 }, // Footer
];

type Pos = { x: number; y: number };

export function Bird() {
  const outerRef = useRef<HTMLDivElement>(null);   // flight (translate / bank / scale)
  const innerRef = useRef<HTMLDivElement>(null);   // idle bob
  const shadowRef = useRef<HTMLDivElement>(null);  // perched shadow
  const rippleRef = useRef<HTMLDivElement>(null);  // landing ripple
  const wingFrontRef = useRef<SVGGElement>(null);
  const wingBackRef = useRef<SVGGElement>(null);

  const posRef = useRef<Pos>({ x: 0, y: 0 });
  const perchRef = useRef(0);
  const flightRef = useRef<anime.AnimeInstance | null>(null);
  const flapRef = useRef<anime.AnimeInstance | null>(null);
  const flapBackRef = useRef<anime.AnimeInstance | null>(null);
  const idleRef = useRef<anime.AnimeInstance | null>(null);
  const reduced = useRef(false);

  useEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;

    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const stopLoops = () => {
      [idleRef, flapRef, flapBackRef].forEach(r => { if (r.current) { r.current.pause(); r.current = null; } });
    };

    const resetWings = () => {
      if (wingFrontRef.current) wingFrontRef.current.style.transform = "rotate(0deg)";
      if (wingBackRef.current) wingBackRef.current.style.transform = "rotate(0deg)";
    };

    const startIdle = () => {
      stopLoops();
      resetWings();
      if (reduced.current || !innerRef.current) return;
      idleRef.current = anime({
        targets: innerRef.current,
        translateY: [0, -5],
        duration: 1500,
        direction: "alternate",
        easing: "easeInOutSine",
        loop: true,
      });
    };

    const startFlap = () => {
      if (reduced.current) return;
      stopLoops();
      if (wingFrontRef.current) {
        flapRef.current = anime({
          targets: wingFrontRef.current,
          rotate: [-34, 14, -34],
          duration: 300,
          easing: "easeInOutSine",
          loop: true,
        });
      }
      if (wingBackRef.current) {
        flapBackRef.current = anime({
          targets: wingBackRef.current,
          rotate: [26, -20, 26],
          duration: 300,
          easing: "easeInOutSine",
          loop: true,
        });
      }
    };

    const landRipple = (x: number, y: number) => {
      const r = rippleRef.current;
      if (!r || reduced.current) return;
      r.style.left = (x - 16) + "px";
      r.style.top = (y - 16) + "px";
      r.style.opacity = "0.7";
      anime({
        targets: r,
        scale: [0.4, 2.4],
        opacity: [0.7, 0],
        duration: 750,
        easing: "easeOutQuad",
        complete: () => { r.style.opacity = "0"; },
      });
    };

    const flyTo = (perch: number, initial = false) => {
      if (!outer) return;
      const from = posRef.current;
      const target: Pos = {
        x: PERCHES[perch].x * window.innerWidth - outer.offsetWidth / 2,
        y: PERCHES[perch].y * window.innerHeight - outer.offsetHeight / 2,
      };

      // Reduced motion → snap instantly
      if (reduced.current) {
        outer.style.transform = `translate(${target.x}px, ${target.y}px)`;
        posRef.current = target;
        startIdle();
        return;
      }

      if (flightRef.current) flightRef.current.pause();

      const midX = (from.x + target.x) / 2;
      const midY = Math.min(from.y, target.y) - 90; // arc upward
      const dir = target.x >= from.x ? 1 : -1;

      flightRef.current = anime({
        targets: outer,
        duration: initial ? 1800 : 1150,
        easing: "easeInOutSine",
        keyframes: [
          { translateX: midX, translateY: midY, rotate: -16 * dir, scale: 1.05 },
          { translateX: target.x, translateY: target.y, rotate: 0, scale: 1 },
        ],
        begin: () => {
          stopLoops();
          startFlap();
          if (shadowRef.current) anime({ targets: shadowRef.current, opacity: 0, duration: 250, easing: "easeOutQuad" });
        },
        update: () => {
          const r = outer.getBoundingClientRect();
          posRef.current = { x: r.left, y: r.top };
        },
        complete: () => {
          const r = outer.getBoundingClientRect();
          posRef.current = { x: r.left, y: r.top };
          stopLoops();
          landRipple(target.x + outer.offsetWidth / 2, target.y + outer.offsetHeight / 2);
          startIdle();
          if (shadowRef.current) anime({ targets: shadowRef.current, opacity: 0.55, duration: 400, easing: "easeOutQuad" });
          flightRef.current = null;
        },
      });
    };

    // Initial placement — off-screen right, then fly to the hero perch
    const start: Pos = { x: window.innerWidth + 140, y: window.innerHeight * 0.35 };
    outer.style.transform = `translate(${start.x}px, ${start.y}px)`;
    posRef.current = start;
    flyTo(0, true);

    // Scroll → detect active section → fly to its perch
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-perch]"));
        if (!sections.length) return;
        const mid = window.innerHeight * 0.5;
        let active = 0;
        for (let i = 0; i < sections.length; i++) {
          const r = sections[i].getBoundingClientRect();
          if (r.top <= mid && r.bottom >= mid) { active = i; break; }
        }
        if (active !== perchRef.current) {
          perchRef.current = active;
          flyTo(active);
        }
      });
    };

    // The app scrolls inside <main> (Providers.tsx), not the window
    const scroller: Element | Window = document.querySelector("main") || window;
    scroller.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      scroller.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      [flightRef, idleRef, flapRef, flapBackRef].forEach(r => { if (r.current) r.current.pause(); });
    };
  }, []);

  return (
    <div
      ref={outerRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-30 w-20 sm:w-24"
      style={{ transform: "translateX(110vw) translateY(35vh)" }}
    >
      {/* Landing ripple */}
      <div
        ref={rippleRef}
        className="absolute h-8 w-8 rounded-full border-2 border-gd-accent-400/60 opacity-0"
      />
      {/* Perched shadow */}
      <div
        ref={shadowRef}
        className="absolute -bottom-1 left-1/2 h-2 w-12 -translate-x-1/2 rounded-full bg-black/40 blur-[3px] opacity-0"
      />

      <div ref={innerRef} className="w-full">
        <svg viewBox="0 0 140 100" className="w-full drop-shadow-[0_10px_18px_rgba(0,0,0,0.5)]" fill="none">
          <defs>
            <linearGradient id="gdBirdBody" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#facc15" />
              <stop offset="100%" stopColor="#c78a0e" />
            </linearGradient>
            <linearGradient id="gdBirdWing" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
          </defs>

          {/* Back wing — pivots at shoulder (80,40) in viewBox coords */}
          <g
            ref={wingBackRef}
            style={{ transformBox: "view-box", transformOrigin: "80px 40px", transform: "rotate(0deg)" }}
          >
            <path d="M80 40 C 66 18, 50 8, 28 6 C 46 20, 62 34, 70 48 Z" fill="url(#gdBirdWing)" opacity="0.5" />
          </g>

          {/* Forked tail */}
          <path d="M46 46 C 34 42, 24 36, 14 30 C 22 42, 22 52, 14 62 C 24 56, 34 52, 46 50 Z" fill="url(#gdBirdBody)" />

          {/* Body */}
          <path d="M50 40 C 68 30, 96 30, 114 40 C 124 45, 128 49, 124 53 C 116 59, 92 62, 68 60 C 54 59, 44 54, 50 40 Z" fill="url(#gdBirdBody)" />

          {/* Head */}
          <circle cx="118" cy="40" r="8" fill="url(#gdBirdBody)" />
          {/* Beak */}
          <path d="M124 38 L139 43 L124 47 Z" fill="#b45309" />
          {/* Eye */}
          <circle cx="119" cy="37.5" r="1.7" fill="#0b0b0f" />

          {/* Front wing — pivots at shoulder (82,42) in viewBox coords */}
          <g
            ref={wingFrontRef}
            style={{ transformBox: "view-box", transformOrigin: "82px 42px", transform: "rotate(0deg)" }}
          >
            <path d="M82 42 C 74 16, 56 2, 32 0 C 50 14, 66 30, 72 48 Z" fill="url(#gdBirdWing)" />
          </g>
        </svg>
      </div>
    </div>
  );
}
