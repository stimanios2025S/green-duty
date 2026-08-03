"use client";
import { Trees, Sprout, Droplets } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { platformStats, cleanupEvents } from "@/lib/mock-data";
import { formatNumber } from "@/lib/utils";

export function TreeCounter() {
  const total = 20000;
  const progress = (platformStats.treesPlanted / total) * 100;

  return (
    <div className="space-y-6">
      {/* Hero tree counter */}
      <Card className="text-center !bg-gradient-to-br !from-gd-accent-500/10 !to-gd-olive-500/5 !border-gd-accent-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-32 w-32 bg-gd-accent-500/10 rounded-full blur-3xl" />
        <div className="relative">
          <Trees className="mx-auto h-12 w-12 text-gd-accent-400" />
          <p className="mt-3 text-5xl font-extrabold text-gd-text-primary tracking-tight">
            {formatNumber(platformStats.treesPlanted)}
          </p>
          <p className="text-sm text-gd-accent-400 mt-1 font-medium uppercase tracking-wider">Trees Planted</p>
          <div className="mt-5 h-3 w-full rounded-full bg-gd-overlay">
            <div
              className="h-full rounded-full bg-gradient-to-r from-gd-accent-500 to-gd-olive-500 transition-all duration-1000"
              style={{ width: progress + '%' }}
            />
          </div>
          <p className="mt-2 text-xs text-gd-text-muted">
            <span className="text-gd-text-secondary font-medium">{formatNumber(total - platformStats.treesPlanted)}</span> trees to reach goal of {formatNumber(total)}
          </p>
        </div>
      </Card>

      {/* Impact sub-stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="text-center">
          <Sprout className="mx-auto h-6 w-6 text-gd-olive-400" />
          <p className="mt-2 text-xl font-bold text-gd-text-primary">{formatNumber(platformStats.co2Offset)}</p>
          <p className="text-xs text-gd-text-muted mt-0.5 uppercase tracking-wider">Tons CO₂ Offset</p>
        </Card>
        <Card className="text-center">
          <Droplets className="mx-auto h-6 w-6 text-blue-400" />
          <p className="mt-2 text-xl font-bold text-gd-text-primary">{(platformStats.waterSaved / 1000000).toFixed(1)}M</p>
          <p className="text-xs text-gd-text-muted mt-0.5 uppercase tracking-wider">Liters Water Saved</p>
        </Card>
      </div>

      {/* Upcoming events */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gd-text-primary">Upcoming Planting Events</h3>
        {cleanupEvents.filter(e => e.status === "upcoming").map(e => (
          <div key={e.id} className="rounded-xl border border-gd-border bg-gd-card p-4 hover:border-gd-border-strong transition-all">
            <p className="text-sm font-medium text-gd-text-primary">{e.title}</p>
            <p className="text-xs text-gd-text-muted mt-1">
              {e.treeCount} trees · {new Date(e.date).toLocaleDateString()} · {e.volunteerCount}/{e.maxVolunteers} joined
            </p>
            <div className="mt-3 h-1.5 w-full rounded-full bg-gd-overlay">
              <div className="h-full rounded-full bg-gradient-to-r from-gd-accent-500 to-gd-olive-500" style={{ width: (e.volunteerCount / e.maxVolunteers) * 100 + '%' }} />
            </div>
            <button className="mt-3 rounded-lg bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 px-3.5 py-1.5 text-xs font-semibold text-gd-text-inverse hover:brightness-110 transition-all">
              Sign Up
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
