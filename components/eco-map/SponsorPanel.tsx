"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Award, Loader2 } from "lucide-react";

export function SponsorPanel() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch("/api/stats").then(r => (r.ok ? r.json() : null)).then(d => d && setStats(d)).catch(() => {});
  }, []);

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Award className="h-5 w-5 text-gd-accent-400" />
        <h3 className="font-semibold text-gd-text-primary">Community Impact</h3>
      </div>
      {!stats ? (
        <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-gd-text-muted" /></div>
      ) : (
        <div className="space-y-3">
          {[
            { label: "Trees Planted via Donations", value: stats.trees || 0, icon: "🌳" },
            { label: "Hotspots Reported", value: stats.hotspots || 0, icon: "📢" },
            { label: "B2B Inquiries Received", value: stats.inquiries || 0, icon: "🏢" },
            { label: "Community Members", value: stats.users || 0, icon: "👥" },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-gd-border bg-gd-elevated/50 p-3 hover:bg-gd-elevated transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gd-accent-500/10 border border-gd-accent-500/10 text-lg">
                {s.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gd-text-primary">{s.value.toLocaleString()}</p>
                <p className="text-xs text-gd-text-muted">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
