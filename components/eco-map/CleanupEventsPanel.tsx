"use client";
import { useState, useEffect, useCallback } from "react";
import { CalendarCheck, Loader2, Users, MapPin, Check, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/lib/auth-context";

interface CleanupEvent {
  id: string;
  hotspotId: string | null;
  title: string;
  description: string;
  lat: number | null;
  lng: number | null;
  date: string;
  maxVolunteers: number;
  rewardPoints: number;
  volunteerCount: number;
  joined: boolean;
}

export function CleanupEventsPanel({ refreshKey }: { refreshKey?: number }) {
  const { user } = useAuth();
  const [events, setEvents] = useState<CleanupEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const q = user?.id ? `?userId=${encodeURIComponent(user.id)}` : "";
      const res = await fetch(`/api/cleanup${q}`);
      const d = await res.json();
      setEvents(d.events || []);
    } catch {} finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load, refreshKey]);

  // Refresh when a hotspot "Join Cleanup" creates/joins an event
  useEffect(() => {
    const onUpdate = () => load();
    window.addEventListener("gd:cleanup-updated", onUpdate);
    return () => window.removeEventListener("gd:cleanup-updated", onUpdate);
  }, [load]);

  const toggleJoin = async (e: CleanupEvent) => {
    if (!user) { alert("Please sign in to join a cleanup."); return; }
    const join = !e.joined;
    // optimistic
    setEvents(es => es.map(x => x.id === e.id ? { ...x, joined: join, volunteerCount: x.volunteerCount + (join ? 1 : -1) } : x));
    try {
      await fetch("/api/cleanup/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: e.id, userId: user.id, join }),
      });
    } catch {
      load(); // rollback
    }
  };

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <CalendarCheck className="h-5 w-5 text-gd-accent-400" />
        <h3 className="font-semibold text-gd-text-primary">Upcoming Cleanups</h3>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-gd-text-muted" /></div>
      ) : events.length === 0 ? (
        <p className="py-8 text-center text-sm text-gd-text-muted">
          No cleanups yet. Report a hotspot → "Join Cleanup" to start one!
        </p>
      ) : (
        <div className="space-y-3">
          {events.map(e => {
            const full = e.volunteerCount >= e.maxVolunteers;
            const pct = Math.min(100, (e.volunteerCount / e.maxVolunteers) * 100);
            return (
              <div key={e.id} className="rounded-xl border border-gd-border bg-gd-elevated/50 p-3.5 hover:bg-gd-elevated transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-gd-text-primary">{e.title}</p>
                  {e.joined && <span className="flex-shrink-0 rounded-full bg-gd-success/10 px-2 py-0.5 text-[10px] font-semibold text-gd-success">Joined ✓</span>}
                </div>
                <p className="mt-1 text-xs text-gd-text-secondary line-clamp-2">{e.description}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-gd-text-muted">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {e.lat && e.lng ? `${e.lat.toFixed(4)}, ${e.lng.toFixed(4)}` : "Map location"}</span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {e.volunteerCount}/{e.maxVolunteers}</span>
                  <span>🎁 {e.rewardPoints} pts</span>
                  <span>📅 {new Date(e.date).toLocaleDateString()}</span>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-gd-overlay">
                  <div className="h-full rounded-full bg-gradient-to-r from-gd-accent-500 to-gd-olive-500" style={{ width: pct + "%" }} />
                </div>
                <button
                  onClick={() => toggleJoin(e)}
                  disabled={full && !e.joined}
                  className={`mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-all ${
                    e.joined
                      ? "border border-gd-border text-gd-text-secondary hover:bg-gd-elevated"
                      : full
                      ? "bg-gd-overlay text-gd-text-muted cursor-not-allowed"
                      : "bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 text-gd-text-inverse hover:brightness-110"
                  }`}
                >
                  {e.joined ? <><X className="h-3.5 w-3.5" /> Leave cleanup</> : full ? "Full" : <><Check className="h-3.5 w-3.5" /> Join cleanup</>}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
