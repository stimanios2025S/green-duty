"use client";
import { useEffect, useState } from "react";
import { Trees, MapPin, Users, BadgeCheck, Target, Leaf } from "lucide-react";
import { ScrollReveal } from "@/components/landing/ScrollReveal";
import { Card } from "@/components/ui/Card";

/**
 * Community Impact — real, live progress toward public goals.
 * Every number comes from /api/stats (the actual database).
 */
export function ImpactSection() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch("/api/stats").then(r => (r.ok ? r.json() : null)).then(d => d && setStats(d)).catch(() => {});
  }, []);

  const goals = stats
    ? [
        { label: "Trees Planted", icon: <Trees className="h-4 w-4" />, value: stats.trees || 0, goal: 20000, unit: "trees", color: "from-gd-olive-600 to-gd-olive-500" },
        { label: "Hotspots Reported", icon: <MapPin className="h-4 w-4" />, value: stats.hotspots || 0, goal: 1000, unit: "reports", color: "from-gd-ember-600 to-gd-ember-500" },
        { label: "Cleanup Volunteers", icon: <Users className="h-4 w-4" />, value: stats.volunteers || 0, goal: 5000, unit: "volunteers", color: "from-gd-info to-cyan-400" },
        { label: "Verified Accounts", icon: <BadgeCheck className="h-4 w-4" />, value: stats.verifiedUsers || 0, goal: 2500, unit: "members", color: "from-gd-accent-600 to-gd-accent-400" },
      ]
    : [];

  return (
    <section data-perch className="relative overflow-hidden bg-gd-deepest py-20">
      <div className="absolute -right-40 top-0 h-96 w-96 rounded-full bg-gd-olive-500/5 blur-3xl" />
      <div className="absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-gd-accent-500/5 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mb-14 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-gd-accent-500/15 bg-gd-accent-500/5 px-3 py-1 text-xs font-medium text-gd-accent-400 mb-4">
            <Target className="h-3 w-3" /> Community Goals · Live Progress
          </div>
          <h2 className="text-3xl font-bold text-gd-text-primary tracking-tight sm:text-4xl">
            Every action moves the <span className="gradient-text">planet forward</span>
          </h2>
          <p className="mt-3 text-gd-text-secondary max-w-2xl mx-auto leading-relaxed">
            Report a hotspot, join a cleanup, plant a tree — watch the community goals climb in real time.
          </p>
        </div>

        {goals.length === 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="h-44 animate-pulse rounded-2xl border border-gd-border-soft bg-gd-card/60" />
            ))}
          </div>
        )}
        {goals.length > 0 && <ScrollReveal stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {goals.map(g => {
            const pct = Math.min(100, (g.value / g.goal) * 100);
            return (
              <Card key={g.label} className="relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-gd-border-soft bg-gd-elevated/60 text-gd-accent-400">
                    {g.icon}
                  </div>
                  <span className="rounded-full bg-gd-elevated/70 px-2.5 py-1 text-[10px] font-semibold text-gd-text-muted">
                    {Math.round(pct)}%
                  </span>
                </div>
                <p className="mt-4 text-2xl font-bold text-gd-text-primary tracking-tight tabular-nums">
                  {g.value.toLocaleString()}
                  <span className="ml-1 text-sm font-medium text-gd-text-muted">/ {g.goal.toLocaleString()}</span>
                </p>
                <p className="mt-1 text-xs font-medium text-gd-text-muted uppercase tracking-wider">{g.label}</p>
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gd-overlay">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${g.color} transition-all duration-1000`}
                    style={{ width: pct + "%" }}
                  />
                </div>
                <p className="mt-2 text-[10px] text-gd-text-muted">{g.unit} · live from the database</p>
              </Card>
            );
          })}
        </ScrollReveal>}

        {/* Live data readout */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          {[
            { icon: <Leaf className="h-3.5 w-3.5" />, text: `${stats ? (stats.trees * 48).toLocaleString() : "—"} lbs CO₂ absorbed / year` },
            { icon: <MapPin className="h-3.5 w-3.5" />, text: `${stats?.hotspotsResolved || 0} hotspots resolved` },
            { icon: <Users className="h-3.5 w-3.5" />, text: `${stats?.users || 0} community members` },
          ].map((b, i) => (
            <div key={i} className="flex items-center gap-2 rounded-full border border-gd-border-soft bg-gd-card/70 px-4 py-2 text-xs font-medium text-gd-text-secondary backdrop-blur-sm">
              <span className="text-gd-accent-400">{b.icon}</span> {b.text}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
