"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cn, severityColor, statusLabel } from "@/lib/utils";
import { MapPin, AlertTriangle, Loader2, Navigation, Plus, X } from "lucide-react";
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

// Custom dark-styled markers (Leaflet needs explicit icons)
const severityColors: Record<string, string> = {
  low: "#22C55E", moderate: "#EAB308", severe: "#F97316", critical: "#EF4444",
};

function makeIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:2.5px solid white;box-shadow:0 4px 12px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center"><div style="width:8px;height:8px;border-radius:50%;background:white;transform:rotate(45deg)"></div></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -26],
  });
}

// Component that flies to the user's location
function LocateButton({ onLocate }: { onLocate: () => void }) {
  return (
    <button
      onClick={onLocate}
      className="absolute bottom-6 right-4 z-[500] flex h-10 w-10 items-center justify-center rounded-full border border-gd-border bg-gd-card text-gd-text-secondary shadow-lg hover:text-gd-text-primary transition-colors"
      title="My location"
    >
      <Navigation className="h-5 w-5" />
    </button>
  );
}

export function HotspotMap({ refreshKey }: { refreshKey?: number }) {
  const [selected, setSelected] = useState<ApiHotspot | null>(null);
  const [filter, setFilter] = useState<SeverityLevel | "all">("all");
  const [hotspots, setHotspots] = useState<ApiHotspot[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const { user } = useAuth();

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/hotspots");
      const d = await res.json();
      setHotspots(d.hotspots || []);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);

  // Get user location on mount (for "my location" + better default center)
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserPos([pos.coords.latitude, pos.coords.longitude]),
        () => {},
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, []);

  const center: [number, number] = userPos || [40.7128, -74.006];
  const filtered = filter === "all" ? hotspots : hotspots.filter(h => h.severity === filter);

  const goToMyLocation = () => {
    if (userPos && mapRef.current) {
      mapRef.current.flyTo(userPos, 14, { duration: 1.2 });
    }
  };

  const [joined, setJoined] = useState(false);

  // Create a REAL cleanup event from this hotspot + join it (real, persisted)
  const joinCleanup = async () => {
    if (!user || !selected) { alert("Please sign in to join a cleanup."); return; }
    try {
      let eventId: string | null = null;
      const listRes = await fetch("/api/cleanup?userId=" + encodeURIComponent(user.id));
      const listData = await listRes.json().catch(() => ({ events: [] }));
      const existing = (listData.events || []).find((e: any) => e.hotspotId === selected.id);
      if (existing) {
        eventId = existing.id;
      } else {
        const res = await fetch("/api/cleanup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hotspotId: selected.id,
            title: `🧹 ${selected.title}`,
            description: `Community cleanup for: ${selected.description}`,
            lat: selected.lat,
            lng: selected.lng,
            date: new Date(Date.now() + 7 * 86400000).toISOString(),
            maxVolunteers: 25,
            rewardPoints: 150,
            organizerId: user.id,
          }),
        });
        const d = await res.json().catch(() => ({}));
        eventId = d.id || null;
      }
      if (eventId) {
        await fetch("/api/cleanup/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId, userId: user.id, join: true }),
        });
      }
      await fetch("/api/chat/group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creatorId: user.id, name: `🧹 ${selected.title.slice(0, 30)}`, memberIds: [] }),
      });
      setJoined(true);
      setTimeout(() => setJoined(false), 2000);
      setSelected(null);
      window.dispatchEvent(new CustomEvent("gd:cleanup-updated"));
    } catch {}
  };

  // Click-handler component
  function MapClick() {
    useMapEvents({
      click(e) {
        // Open the report modal pre-filled with the clicked coordinates
        window.dispatchEvent(new CustomEvent("gd:report-at", { detail: { lat: e.latlng.lat, lng: e.latlng.lng } }));
      },
    });
    return null;
  }

  function MapController() {
    const map = useMap();
    useEffect(() => { mapRef.current = map; }, [map]);
    return null;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* ── REAL INTERACTIVE MAP ── */}
      <div className="lg:col-span-2">
        <Card className="relative h-[520px] overflow-hidden !p-0">
          <MapContainer
            center={center}
            zoom={userPos ? 12 : 11}
            scrollWheelZoom
            className="h-full w-full z-0"
            style={{ background: "#0b0b0f" }}
          >
            <MapController />
            <MapClick />
            {/* Real OpenStreetMap tiles */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {/* User location */}
            {userPos && (
              <>
                <CircleMarker center={userPos} radius={10} pathOptions={{ color: "#10B981", fillColor: "#10B981", fillOpacity: 0.25, weight: 2 }}>
                  <Popup><span className="font-medium">You are here 📍</span></Popup>
                </CircleMarker>
              </>
            )}
            {/* Hotspot markers */}
            {filtered.map(h => {
              const lat = h.lat ?? 40.7128;
              const lng = h.lng ?? -74.006;
              return (
                <Marker
                  key={h.id}
                  position={[lat, lng]}
                  icon={makeIcon(severityColors[h.severity] || "#6B7280")}
                  eventHandlers={{ click: () => setSelected(h) }}
                >
                  <Popup>
                    <div className="min-w-[180px]">
                      <p className="font-semibold text-slate-900">{h.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{h.pollution_type.replace(/_/g, " ")} · {h.address || "Unknown"}</p>
                      <span className="inline-block mt-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase" style={{ backgroundColor: severityColors[h.severity] + "22", color: severityColors[h.severity] }}>
                        {h.severity}
                      </span>
                      <button
                        onClick={() => setSelected(h)}
                        className="mt-2 w-full rounded-lg bg-emerald-600 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        View details
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
          <LocateButton onLocate={goToMyLocation} />
          {/* Hint */}
          <div className="pointer-events-none absolute bottom-6 left-4 z-[500] rounded-xl border border-gd-border bg-gd-deepest/90 px-3 py-2 text-xs text-gd-text-secondary backdrop-blur">
            🖱️ Click anywhere on the map to report a hotspot at that exact spot
          </div>
        </Card>
      </div>

      {/* ── Sidebar list ── */}
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

        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {loading ? (
            <div className="py-10 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-gd-text-muted" /></div>
          ) : filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-gd-text-muted">No reports match.</p>
          ) : (
            filtered.map((h) => (
              <button
                key={h.id}
                onClick={() => {
                  setSelected(h);
                  if (h.lat && h.lng && mapRef.current) mapRef.current.flyTo([h.lat, h.lng], 13, { duration: 0.8 });
                }}
                className={cn(
                  "w-full text-left rounded-xl border p-3 transition-all",
                  selected?.id === h.id
                    ? "border-gd-accent-500/40 bg-gd-accent-500/5 glow-ring"
                    : "border-gd-border bg-gd-card hover:border-gd-border-strong"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: severityColors[h.severity] + "22" }}>
                    <MapPin className="h-4 w-4" style={{ color: severityColors[h.severity] }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gd-text-primary truncate">{h.title}</p>
                    <p className="text-xs text-gd-text-muted mt-0.5">{h.pollution_type.replace(/_/g, " ")} · {h.address || "Unknown"}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: severityColors[h.severity] + "22", color: severityColors[h.severity] }}>{h.severity}</span>
                      <span className="text-[10px] text-gd-text-muted">{statusLabel(h.status)}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Detail modal ── */}
      {selected && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
            <div className="w-full max-w-lg rounded-2xl bg-gd-card border border-gd-border-soft p-6 shadow-2xl shadow-black/40" onClick={e => e.stopPropagation()}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gd-text-primary">{selected.title}</h3>
                  <p className="text-sm text-gd-text-muted mt-0.5">{selected.address || "Unknown location"}</p>
                  {selected.lat && selected.lng && (
                    <p className="text-xs text-gd-text-muted mt-0.5">📍 {selected.lat.toFixed(5)}, {selected.lng.toFixed(5)}</p>
                  )}
                </div>
                <button onClick={() => setSelected(null)} className="rounded-lg p-1.5 text-gd-text-muted hover:text-gd-text-secondary hover:bg-gd-elevated transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-gd-text-secondary mb-4 leading-relaxed">{selected.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: severityColors[selected.severity] + "22", color: severityColors[selected.severity] }}>{selected.severity.toUpperCase()}</span>
                <span className="rounded-full bg-gd-elevated px-3 py-1 text-xs font-medium text-gd-text-secondary border border-gd-border">{selected.pollution_type.replace(/_/g, " ")}</span>
                <span className="rounded-full bg-gd-info/10 px-3 py-1 text-xs font-medium text-gd-info border border-gd-info/20">{statusLabel(selected.status)}</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gd-border pt-3">
                <span className="text-xs text-gd-text-muted">{new Date(selected.created_at).toLocaleDateString()} · {selected.upvotes} upvotes</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (selected.lat && selected.lng && mapRef.current) {
                        mapRef.current.flyTo([selected.lat, selected.lng], 15, { duration: 1 });
                        setSelected(null);
                      }
                    }}
                    className="rounded-xl border border-gd-border px-4 py-2 text-xs font-semibold text-gd-text-secondary hover:bg-gd-elevated transition-all"
                  >
                    View on map
                  </button>
                  <button
                    onClick={joinCleanup}
                    disabled={joined}
                    className="rounded-xl bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 px-4 py-2 text-xs font-semibold text-gd-text-inverse hover:brightness-110 transition-all disabled:opacity-70"
                  >
                    {joined ? "Joined ✓" : "Join Cleanup"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
