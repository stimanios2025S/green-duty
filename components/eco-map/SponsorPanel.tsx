"use client";
import { Card } from "@/components/ui/Card";
import { sponsors } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Award } from "lucide-react";

const tierColors: Record<string, string> = {
  platinum: "bg-gd-accent-500/10 text-gd-accent-400 border-gd-accent-500/20",
  gold: "bg-gd-accent-500/10 text-gd-accent-400 border-gd-accent-500/20",
  silver: "bg-gd-elevated text-gd-text-secondary border-gd-border",
  bronze: "bg-gd-ember-500/10 text-gd-ember-400 border-gd-ember-500/20",
};

export function SponsorPanel() {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Award className="h-5 w-5 text-gd-accent-400" />
        <h3 className="font-semibold text-gd-text-primary">Corporate Sponsors</h3>
      </div>
      <div className="space-y-3">
        {sponsors.map((s) => (
          <div key={s.id} className="flex items-center gap-3 rounded-xl border border-gd-border bg-gd-elevated/50 p-3 hover:bg-gd-elevated transition-colors">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gd-accent-500/10 text-sm font-bold text-gd-accent-400 border border-gd-accent-500/10">
              {s.name[0]}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gd-text-primary">{s.name}</p>
              <p className="text-xs text-gd-text-muted">{s.treesPlanted.toLocaleString()} trees sponsored</p>
            </div>
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase border", tierColors[s.tier])}>
              {s.tier}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
