"use client";
import { useState, useEffect } from "react";
import { cn, severityColor, statusLabel } from "@/lib/utils";
import { MapPin, AlertTriangle, CircleCheck, Circle, X, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/lib/auth-context";
import type { SeverityLevel } from "@/types";

interface ApiHotspot {
  id: string;
  title: string;
  description: string;
  pollution_type: string;
  severity: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  reporter_id: string;
  status: string;
  upvotes: number;
  created_at: string;
}

const severityIcons: Record<string, typeof CircleCheck> = { low: CircleCheck, moderate: Circle, severe: AlertTriangle, critical: AlertTriangle };

export function HotspotMap({ refreshKey }: { refreshKey?: number }) {
  const [selected, setSelected] = useState<ApiHotspot | null>(null);
  const [filter, setFilter] = useState<SeverityLevel | "all">("all");
  const [hotspots, setHotspots] = useState<ApiHotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const { user } = useAuth();

  const joinCleanup = async () => {
    if (!user || !selected) { alert("Please sign in to join a cleanup."); return; }
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          title: "Cleanup joined 🧹",
          message: `You joined the cleanup for "${selected.title}". Details coming soon!`,
          type: "event",
        }),
      });
      setJoined(true);
      setTimeout(() => setJoined(false), 2000);
      // Phase 4: open the event group chat so volunteers can coordinate
      const res = await fetch("/api/chat/group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId: user.id,
          name: `🧹 ${selected.title.slice(0, 30)}`,
          memberIds: [],
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (d.conversationId) {
        window.location.href = `/feed/messages?conv=${d.conversationId}`;
      }
    } catch {}
  };

  useEffect(() => {
    fetch("/api/hotspots")
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d) setHotspots(d.hotspots || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const filtered = filter === "all" ? hotspots : hotspots.filter(h => h.severity === filter);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Map area */}
      <div className="lg:col-span-2">
        <Card className="h-[500px] relative overflow-hidden !p-0">
          <div className="absolute inset-4">
            <div className="relative h-full w-full rounded-xl bg-gd-elevated border border-gd-border overflow-hidden bg-grid">
              <div className="absolute inset-0 p-4">
                {loading ? (
                  <div className="flex h-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-gd-text-muted" /></div>
                ) : filtered.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-gd-text-muted">No reports yet — be the first!</div>
                ) : (
                  filtered.map((h) => {
                    const lat = h.lat ?? 40.7128;
                    const lng = h.lng ?? -74.006;
                    const x = ((lng + 74.2) / 0.4) * 100;
                    const y = ((40.8 - lat) / 0.3) * 100;
                    return (
                      <button
                        key={h.id}
                        onClick={() => setSelected(h)}
                        style={{ left: Math.max(2, Math.min(98, x)) + '%', top: Math.max(2, Math.min(98, y)) + '%' }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer z-10"
                      >
                        <div className={cn(
                          "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium shadow-lg backdrop-blur-sm transition-all hover:scale-110",
                          h.severity === 'critical' ? 'bg-gd-danger text-white shadow-gd-danger/30' :
                          h.severity === 'severe' ? 'bg-gd-ember-500 text-white shadow-gd-ember-500/30' :
                          h.severity === 'moderate' ? 'bg-gd-accent-500 text-gd-text-inverse' :
                          'bg-gd-olive-500 text-gd-text-inverse'
                        )}>
                          <MapPin className="h-3 w-3" />
                          <span className="hidden group-hover:inline max-w-[120px] truncate">{h.title}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Sidebar list */}
      <div className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          {(["all", "low", "moderate", "severe", "critical"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium border transition-all",
                filter === f
                  ? "bg-gd-accent-500 text-gd-text-inverse border-gd-accent-500"
                  : "bg-gd-card text-gd-text-secondary border-gd-border hover:border-gd-accent-500/30"
              )}
            >
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
          {loading ? (
            <div className="py-10 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-gd-text-muted" /></div>
          ) : filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-gd-text-muted">No reports match.</p>
          ) : (
            filtered.map((h) => (
              <button
                key={h.id}
                onClick={() => setSelected(h)}
                className={cn(
                  "w-full text-left rounded-xl border p-3 transition-all",
                  selected?.id === h.id
                    ? "border-gd-accent-500/40 bg-gd-accent-500/5 glow-ring"
                    : "border-gd-border bg-gd-card hover:border-gd-border-strong"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: severityColor(h.severity) + '20' }}>
                    <MapPin className="h-4 w-4" style={{ color: severityColor(h.severity) }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gd-text-primary truncate">{h.title}</p>
                    <p className="text-xs text-gd-text-muted mt-0.5">{h.pollution_type.replace(/_/g, ' ')} · {h.address || "Unknown"}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: severityColor(h.severity) + '20', color: severityColor(h.severity) }}>{h.severity}</span>
                      <span className="text-[10px] text-gd-text-muted">{statusLabel(h.status)}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Detail modal */}
      {selected && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
            <div className="w-full max-w-lg rounded-2xl bg-gd-card border border-gd-border-soft p-6 shadow-2xl shadow-black/40" onClick={e => e.stopPropagation()}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gd-text-primary">{selected.title}</h3>
                  <p className="text-sm text-gd-text-muted mt-0.5">{selected.address || "Unknown location"}</p>
                </div>
                <button onClick={() => setSelected(null)} className="rounded-lg p-1.5 text-gd-text-muted hover:text-gd-text-secondary hover:bg-gd-elevated transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-gd-text-secondary mb-4 leading-relaxed">{selected.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: severityColor(selected.severity) + '20', color: severityColor(selected.severity) }}>{selected.severity.toUpperCase()}</span>
                <span className="rounded-full bg-gd-elevated px-3 py-1 text-xs font-medium text-gd-text-secondary border border-gd-border">{selected.pollution_type.replace(/_/g, ' ')}</span>
                <span className="rounded-full bg-gd-info/10 px-3 py-1 text-xs font-medium text-gd-info border border-gd-info/20">{statusLabel(selected.status)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-gd-border pt-3">
                <span className="text-xs text-gd-text-muted">{new Date(selected.created_at).toLocaleDateString()} · {selected.upvotes} upvotes</span>
                <button
                  onClick={joinCleanup}
                  disabled={joined}
                  className="rounded-xl bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 px-4 py-2 text-xs font-semibold text-gd-text-inverse hover:brightness-110 transition-all disabled:opacity-60"
                >
                  {joined ? "Joined ✓" : "Join Cleanup"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
