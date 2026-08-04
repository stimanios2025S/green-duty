"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Trophy, Medal, Loader2 } from "lucide-react";

export function LeaderboardPanel() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/stats").then(r => r.json()),
      fetch("/api/instagro/feed").then(r => r.json()),
    ])
      .then(([stats, feed]) => {
        // Build a leaderboard from real engagement: post counts + likes per user
        const counts = new Map<string, { posts: number; likes: number }>();
        (feed.posts || []).forEach((p: any) => {
          const c = counts.get(p.user.id) || { posts: 0, likes: 0 };
          c.posts += 1;
          c.likes += p.likes;
          counts.set(p.user.id, c);
        });
        const ranked = Array.from(counts.entries())
          .map(([id, c]) => ({ id, ...c }))
          .sort((a, b) => (b.likes + b.posts * 10) - (a.likes + a.posts * 10))
          .slice(0, 5);
        setUsers(ranked);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="h-5 w-5 text-gd-accent-400" />
        <h3 className="font-semibold text-gd-text-primary">Top Contributors</h3>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-gd-text-muted" /></div>
      ) : users.length === 0 ? (
        <p className="py-8 text-center text-sm text-gd-text-muted">No contributors yet.</p>
      ) : (
        <div className="space-y-2">
          {users.map((e, i) => (
            <div key={e.id} className="flex items-center gap-3 rounded-xl border border-gd-border bg-gd-elevated/50 p-3 hover:bg-gd-elevated transition-colors">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-gd-accent-500 to-gd-olive-600 text-gd-text-inverse text-xs font-bold shadow-sm">
                {i + 1}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gd-text-primary">@{e.username || "member"}</p>
                <p className="text-xs text-gd-text-muted">{e.posts} posts · {e.likes.toLocaleString()} likes</p>
              </div>
              <Medal className="h-4 w-4 text-gd-accent-400" />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
