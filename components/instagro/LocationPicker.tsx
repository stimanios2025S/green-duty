"use client";
import { useState, useEffect, useRef } from "react";
import { MapPin, Search, X, Navigation, Loader2 } from "lucide-react";

interface Props {
  value: string;
  onSelect: (loc: string) => void;
  onClose: () => void;
}

interface GeoResult {
  name: string;
  fullName: string;
  lat: number;
  lng: number;
}

export function LocationPicker({ value, onSelect, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [geoState, setGeoState] = useState<"idle" | "locating" | "done" | "denied">("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced real search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        setResults(data.results || []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const useMyLocation = () => {
    if (!navigator.geolocation) { setGeoState("denied"); return; }
    setGeoState("locating");
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude, longitude } = pos.coords;
        try {
          // Reverse geocode to get the real place name
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            { headers: { "User-Agent": "GreenDuty/1.0" } }
          );
          const data = await res.json();
          const place = data.display_name?.split(",").slice(0, 3).join(", ") || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          onSelect(place);
        } catch {
          onSelect(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
        setGeoState("done");
        onClose();
      },
      () => setGeoState("denied"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[65] flex items-center justify-center p-4">
        <div className="w-full max-w-md overflow-hidden rounded-2xl border border-gd-border-soft bg-gd-card shadow-2xl shadow-black/50">
          <div className="flex items-center justify-between border-b border-gd-border px-5 py-3">
            <h3 className="text-base font-semibold text-gd-text-primary">Add location</h3>
            <button onClick={onClose} className="rounded-lg p-1.5 text-gd-text-muted hover:text-gd-text-primary transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Search */}
          <div className="border-b border-gd-border px-5 py-3">
            <div className="flex items-center gap-2 rounded-xl border border-gd-border bg-gd-elevated px-3.5 py-2.5">
              <Search className="h-4 w-4 text-gd-text-muted" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search any city or place..."
                autoFocus
                className="flex-1 bg-transparent text-sm text-gd-text-primary placeholder-gd-text-muted outline-none"
              />
              {searching && <Loader2 className="h-4 w-4 animate-spin text-gd-text-muted" />}
            </div>
          </div>

          {/* Body */}
          <div className="max-h-80 overflow-y-auto p-2">
            {/* Current location */}
            <button
              onClick={useMyLocation}
              disabled={geoState === "locating"}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-gd-elevated transition-colors disabled:opacity-60"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gd-olive-500/10">
                {geoState === "locating" ? <Loader2 className="h-4 w-4 animate-spin text-gd-olive-400" /> : <Navigation className="h-4 w-4 text-gd-olive-400" />}
              </div>
              <div>
                <p className="text-sm font-medium text-gd-text-primary">Use my current location</p>
                <p className="text-xs text-gd-text-muted">{geoState === "denied" ? "Location access denied — allow it in browser settings" : "Get your real position"}</p>
              </div>
            </button>

            {value && (
              <button
                onClick={() => { onSelect(""); onClose(); }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-gd-elevated transition-colors"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gd-elevated">
                  <X className="h-4 w-4 text-gd-text-muted" />
                </div>
                <span className="text-sm text-gd-text-secondary">Remove location</span>
              </button>
            )}

            {/* Search results (real places) */}
            {results.length > 0 && (
              <>
                <p className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-gd-text-muted">Search results</p>
                {results.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => { onSelect(r.name); onClose(); }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-gd-elevated transition-colors"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gd-accent-500/10">
                      <MapPin className="h-4 w-4 text-gd-accent-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gd-text-primary">{r.name}</p>
                      <p className="truncate text-xs text-gd-text-muted">{r.lat.toFixed(4)}, {r.lng.toFixed(4)}</p>
                    </div>
                  </button>
                ))}
              </>
            )}

            {query.trim().length >= 2 && !searching && results.length === 0 && (
              <p className="px-3 py-4 text-center text-sm text-gd-text-muted">No places found for "{query}".</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
