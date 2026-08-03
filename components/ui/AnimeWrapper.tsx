"use client";
import { useEffect, useRef, ReactNode } from "react";
import anime from "animejs";

interface AnimeWrapperProps { children: ReactNode; className?: string; animate?: "fadeIn" | "slideUp" | "scaleIn" | "stagger"; delay?: number; }
export function AnimeWrapper({ children, className = "", animate = "fadeIn", delay = 0 }: AnimeWrapperProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const targets = animate === "stagger" ? ref.current.children : ref.current;
    let animation: anime.AnimeInstance;
    switch (animate) {
      case "fadeIn": animation = anime({ targets, opacity: [0, 1], translateY: [20, 0], duration: 600, delay: anime.stagger(100, { start: delay }), easing: "easeOutCubic" }); break;
      case "slideUp": animation = anime({ targets, opacity: [0, 1], translateY: [40, 0], duration: 500, delay: delay, easing: "easeOutCubic" }); break;
      case "scaleIn": animation = anime({ targets, opacity: [0, 1], scale: [0.8, 1], duration: 400, delay: delay, easing: "easeOutBack" }); break;
      case "stagger": animation = anime({ targets, opacity: [0, 1], translateY: [30, 0], duration: 500, delay: anime.stagger(80, { start: delay }), easing: "easeOutCubic" }); break;
      default: animation = anime({ targets, opacity: [0, 1], duration: 400, delay: delay });
    }
    return () => { animation.pause(); };
  }, [animate, delay]);
  return <div ref={ref} className={className}>{children}</div>;
}
