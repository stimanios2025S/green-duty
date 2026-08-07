"use client";
import { useEffect, useRef, useState } from "react";
import anime from "animejs";
import { MapPin, CalendarCheck, Users, Trees, BadgeCheck, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Real-time eco statistics strip for the Eco Action Map.
 * Every value is fetched live from /api/stats (computed from real DB records)
 * and animated with a count-up when it first appears.
 */

interface EcoStat {
  key: string;
  label: string;
  icon: React.ReactNode;
  accent: "amber" | "green" | "blue" | "red";
  format?: (v: number) => string;
}

const STATS: EcoStat[] = [
  { key: "hotspots", label: "Hotspots Reported", icon: <MapPin className="h-5 w-5" />, accent: "red" },
  { key: "hotspotsResolved", label: "Hotspots Resolved", icon: <BadgeCheck className="h-5 w-5" />, accent: "green" },
  { key: "cleanups", label: "Cleanups Organized", icon: <CalendarCheck className="h-5 w-5" />, accent: "amber" },
  { key: "volunteers", label: "Volunteers Joined", icon: <Users className="h-5 w-5" />, accent: "blue" },
  { key: "trees", label: "Trees Planted", icon: <Trees className="h-5 w-5" />, accent: "green" },
  { key: "users", label: "Community Members", icon: <Users className="h-5 w-5" />, accent: "amber" },
];

const ACCENT = {
  amber: { icon: "text-gd-accent-400", chip: "bg-gd-accent-500/10 border-gd-accent-500/15", glow: "hover:border-gd-accent-500/30" },
  green: { icon: "text-gd-olive-500", chip: "bg-gd-olive-500/10 border-gd-olive-500/15", glow: "hover:border-gd-olive-500/30" },
  blue: { icon: "text-gd-info", chip: "bg-gd-info/10 border-gd-info/15", glow: "hover:border-gd-info/30" },
  red: { icon: "text-gd-danger", chip: "bg-gd-danger/10 border-gd-danger/15", glow: "hover:border-gd-danger/30" },
};

function CountUp({ value, format }: { value: number; format?: (v: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const from = prev.current;
    prev.current = value;
    const anim = anime({
      targets: { v: from },
      v: value,
      duration: 900,
      easing: "easeOutCubic",
      update: (a: any) => {
        const v = a.animations[0].currentValue;
        el.textContent = format ? format(Math.round(v)) : Math.round(v).toLocaleString();
      },
      complete: () => { el.textContent = format ? format(value) : value.toLocaleString(); },
    });
    return () => anim.pause();
  }, [value, format]);

  return <span ref={ref}>{format ? format(value) : value.toLocaleString()}</span>;
}

export function EcoStatsStrip({ refreshKey }: { refreshKey?: number }) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/stats")
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (alive && d) setStats(d); })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [refreshKey]);

  // Entrance animation
  useEffect(() => {
    if (!rootRef.current || loading) return;
    const items = rootRef.current.querySelectorAll("[data-stat-card]");
    anime({ targets: items, opacity: [0, 1], translateY: [24, 0], duration: 550, delay: anime.stagger(70), easing: "easeOutCubic" });
  }, [loading]);

  const money = stats ? `$${(stats.revenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "$0";

  return (
    <div ref={rootRef} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {STATS.map(s => {
        const a = ACCENT[s.accent];
        return (
          <div
            key={s.key}
            data-stat-card
            className={cn(
              "rounded-2xl border border-gd-border-soft bg-gd-card/80 p-4 transition-all duration-300 hover:glow-ring",
              a.glow
            )}
          >
            <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl border", a.chip, a.icon)}>
              {s.icon}
            </div>
            <p className="mt-3 text-xl font-bold text-gd-text-primary tracking-tight tabular-nums">
              {loading ? "—" : <CountUp value={stats?.[s.key] || 0} />}
            </p>
            <p className="mt-0.5 text-[11px] font-medium text-gd-text-muted uppercase tracking-wider">{s.label}</p>
          </div>
        );
      })}
      {/* Revenue card — real marketplace value moved through GreenDuty */}
      <div
        data-stat-card
        className="rounded-2xl border border-gd-accent-500/15 bg-gradient-to-br from-gd-accent-500/10 to-transparent p-4 transition-all duration-300 hover:glow-ring-strong"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-gd-accent-500/20 bg-gd-accent-500/10 text-gd-accent-400">
          <DollarSign className="h-5 w-5" />
        </div>
        <p className="mt-3 text-xl font-bold text-gd-text-primary tracking-tight tabular-nums">{loading ? "—" : money}</p>
        <p className="mt-0.5 text-[11px] font-medium text-gd-text-muted uppercase tracking-wider">Verified Commerce</p>
      </div>
    </div>
  );
}
