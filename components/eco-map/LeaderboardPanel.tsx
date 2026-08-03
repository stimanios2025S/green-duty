"use client";
import { Card } from "@/components/ui/Card";
import { leaderboard } from "@/lib/mock-data";
import { Trophy, Medal } from "lucide-react";

export function LeaderboardPanel() {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="h-5 w-5 text-gd-accent-400" />
        <h3 className="font-semibold text-gd-text-primary">Top Volunteers</h3>
      </div>
      <div className="space-y-2">
        {leaderboard.map((e) => (
          <div key={e.userId} className="flex items-center gap-3 rounded-xl border border-gd-border bg-gd-elevated/50 p-3 hover:bg-gd-elevated transition-colors">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-gd-accent-500 to-gd-olive-600 text-gd-text-inverse text-xs font-bold shadow-sm">
              {e.rank}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gd-text-primary">{e.userName}</p>
              <p className="text-xs text-gd-text-muted">{e.points.toLocaleString()} pts</p>
            </div>
            <Medal className="h-4 w-4 text-gd-accent-400" />
          </div>
        ))}
      </div>
    </Card>
  );
}
