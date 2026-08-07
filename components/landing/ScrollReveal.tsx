"use client";
import { useEffect, useRef, ReactNode } from "react";
import anime from "animejs";

/**
 * Scroll-triggered reveal wrapper.
 * Children animate in (fade + rise) the first time the element enters the
 * viewport — the professional "reveal as you scroll" feel.
 */
interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  /** Direction the content rises from */
  from?: "up" | "left" | "right" | "scale";
  delay?: number;
  /** Stagger each direct child (for grids/lists) */
  stagger?: boolean;
  threshold?: number;
}

export function ScrollReveal({ children, className = "", from = "up", delay = 0, stagger = false, threshold = 0.18 }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { el.style.opacity = "1"; return; }

    const targets = stagger ? Array.from(el.children) : el;
    // Start hidden (instant, no easing → static initial state)
    anime({ targets, opacity: 0, translateY: from === "up" ? 36 : from === "left" ? -36 : from === "right" ? 36 : 0, scale: from === "scale" ? 0.92 : 1, duration: 0 });

    const io = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          io.disconnect();
          // Make the wrapper visible before animating its children
          el.style.opacity = "1";
          anime({
            targets,
            opacity: [0, 1],
            translateY: [from === "up" ? 36 : from === "left" ? -36 : from === "right" ? 36 : 0, 0],
            scale: [from === "scale" ? 0.92 : 1, 1],
            duration: 700,
            delay: stagger ? anime.stagger(90, { start: delay }) : delay,
            easing: "easeOutCubic",
          });
          break;
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [from, delay, stagger, threshold]);

  return <div ref={ref} className={className} style={{ opacity: 0 }}>{children}</div>;
}
