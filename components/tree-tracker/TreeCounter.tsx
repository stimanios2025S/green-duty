"use client";
import { useEffect, useState } from "react";
import { Trees, Sprout, Droplets } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface StatsPayload {
  trees?: number;
  users?: number;
  hotspots?: number;
}

export function TreeCounter() {
  const [stats, setStats] = useState<StatsPayload | null>(null);
  const total = 20000;

  useEffect(() => {
    fetch("/api/stats").then(r => (r.ok ? r.json() : null)).then(d => d && setStats(d)).catch(() => {});
  }, []);

  const trees = stats?.trees || 0;
  const progress = (trees / total) * 100;

  return (
    <div className="space-y-6">
      {/* Hero tree counter */}
      <Card className="text-center !bg-gradient-to-br !from-gd-accent-500/10 !to-gd-olive-500/5 !border-gd-accent-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-32 w-32 bg-gd-accent-500/10 rounded-full blur-3xl" />
        <div className="relative">
          <Trees className="mx-auto h-12 w-12 text-gd-accent-400" />
          <p className="mt-3 text-5xl font-extrabold text-gd-text-primary tracking-tight">
            {trees.toLocaleString()}
          </p>
          <p className="text-sm text-gd-accent-400 mt-1 font-medium uppercase tracking-wider">Trees Planted</p>
          <div className="mt-5 h-3 w-full rounded-full bg-gd-overlay">
            <div
              className="h-full rounded-full bg-gradient-to-r from-gd-accent-500 to-gd-olive-500 transition-all duration-1000"
              style={{ width: Math.min(100, progress) + '%' }}
            />
          </div>
          <p className="mt-2 text-xs text-gd-text-muted">
            <span className="text-gd-text-secondary font-medium">{(total - trees).toLocaleString()}</span> trees to reach goal of {total.toLocaleString()}
          </p>
        </div>
      </Card>

      {/* Impact sub-stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="text-center">
          <Sprout className="mx-auto h-6 w-6 text-gd-olive-400" />
          <p className="mt-2 text-xl font-bold text-gd-text-primary">{stats?.users ? stats.users.toLocaleString() : "—"}</p>
          <p className="text-xs text-gd-text-muted mt-0.5 uppercase tracking-wider">Community Members</p>
        </Card>
        <Card className="text-center">
          <Droplets className="mx-auto h-6 w-6 text-blue-400" />
          <p className="mt-2 text-xl font-bold text-gd-text-primary">{stats?.hotspots ? stats.hotspots.toLocaleString() : "—"}</p>
          <p className="text-xs text-gd-text-muted mt-0.5 uppercase tracking-wider">Hotspots Reported</p>
        </Card>
      </div>
    </div>
  );
}
