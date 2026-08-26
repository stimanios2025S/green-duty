"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { MapPin, Search, TreePine, Locate, X } from "lucide-react";
import { Card } from "@/components/ui/Card";

// Fix for default marker icons in Leaflet with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom tree marker icon
const treeIcon = new L.DivIcon({
  html: `<div style="background: linear-gradient(135deg, #22c55e, #16a34a); width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid rgba(255,255,255,0.3); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(34,197,94,0.4);">
    <span style="transform: rotate(45deg); font-size: 14px;">🌳</span>
  </div>`,
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Custom planting spot marker (user-selected)
const plantingIcon = new L.DivIcon({
  html: `<div style="background: linear-gradient(135deg, #f59e0b, #d97706); width: 36px; height: 36px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid rgba(255,255,255,0.5); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(245,158,11,0.5); animation: pulse 2s infinite;">
    <span style="transform: rotate(45deg); font-size: 16px;">📍</span>
  </div>
  <style>@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }</style>`,
  className: "",
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

interface SearchResult {
  lat: string;
  lon: string;
  display_name: string;
  type: string;
}

interface PlantedTree {
  id: number;
  lat: number;
  lng: number;
  name: string;
  planted_at: string;
  species?: string;
}

function LocationSearch({ onSelect }: { onSelect: (lat: number, lng: number, name: string) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const map = useMap();
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  const search = useCallback((q: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (q.length < 3) { setResults([]); return; }
    setSearching(true);
    timeoutRef.current = setTimeout(async () => {
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=dz&limit=6`);
        const data = await r.json();
        setResults(data);
      } catch { setResults([]); }
      setSearching(false);
    }, 400);
  }, []);

  const fly = (lat: number, lon: number, name: string) => {
    map.flyTo([lat, lon], 14, { duration: 1.5 });
    setResults([]);
    setQuery("");
    onSelect(lat, lon, name);
  };

  return (
    <div className="absolute top-3 left-3 z-[500] w-80 max-w-[calc(100vw-2rem)]">
      <div className="relative">
        <div className="flex items-center rounded-xl border border-gd-border-strong bg-gd-card/95 backdrop-blur-xl shadow-xl shadow-black/20 overflow-hidden">
          <Search className="ml-3 h-4 w-4 text-gd-text-muted shrink-0" />
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); search(e.target.value); }}
            placeholder="Search location for tree planting..."
            className="flex-1 bg-transparent px-3 py-3 text-sm text-gd-text-primary outline-none placeholder-gd-text-muted"
          />
          {query && (
            <button onClick={() => { setQuery(""); setResults([]); }} className="mr-2 p-1 rounded-lg hover:bg-gd-elevated text-gd-text-muted">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          {searching && <div className="mr-3 h-4 w-4 border-2 border-gd-accent-500/30 border-t-gd-accent-500 rounded-full animate-spin" />}
        </div>
        {results.length > 0 && (
          <div className="mt-1 rounded-xl border border-gd-border-strong bg-gd-card/95 backdrop-blur-xl shadow-xl shadow-black/20 overflow-hidden max-h-56 overflow-y-auto">
            {results.map((r, i) => (
              <button key={i} onClick={() => fly(Number(r.lat), Number(r.lon), r.display_name)} className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-left hover:bg-gd-accent-500/5 border-b border-gd-border/50 last:border-b-0 transition-colors">
                <MapPin className="h-3.5 w-3.5 text-gd-accent-400 shrink-0" />
                <span className="text-xs text-gd-text-secondary leading-tight line-clamp-2">{r.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({ click(e) { onMapClick(e.latlng.lat, e.latlng.lng); } });
  return null;
}

function FlyTo({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 14, { duration: 1.5 });
  }, [center, map]);
  return null;
}

interface TreePlantingMapProps {
  onSelectLocation?: (lat: number, lng: number, name: string) => void;
}

export default function TreePlantingMap({ onSelectLocation }: TreePlantingMapProps) {
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [plantedTrees, setPlantedTrees] = useState<PlantedTree[]>([]);
  const [showReport, setShowReport] = useState(false);
  const [treeName, setTreeName] = useState("");
  const [treeSpecies, setTreeSpecies] = useState("");
  const [reporting, setReporting] = useState(false);
  const [reportDone, setReportDone] = useState(false);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);

  useEffect(() => {
    fetch("/api/tree-planting")
      .then(r => (r.ok ? r.json() : null))
      .then(d => d && Array.isArray(d) && setPlantedTrees(d.map((t: any) => ({ id: t.id, lat: t.latitude, lng: t.longitude, name: t.name, planted_at: t.planted_at, species: t.species }))))
      .catch(() => {});
  }, []);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setSelectedLocation({ lat, lng, name: `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
    setTreeName("");
    setTreeSpecies("");
    setShowReport(true);
    setReportDone(false);
  }, []);

  const handleSearchSelect = useCallback((lat: number, lng: number, name: string) => {
    setSelectedLocation({ lat, lng, name });
    setTreeName("");
    setTreeSpecies("");
    setShowReport(true);
    setReportDone(false);
    setFlyTarget([lat, lng]);
  }, []);

  const reportTree = async () => {
    if (!selectedLocation || !treeName.trim()) return;
    setReporting(true);
    try {
      const res = await fetch("/api/tree-planting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: selectedLocation.lat,
          longitude: selectedLocation.lng,
          name: treeName.trim(),
          species: treeSpecies.trim() || undefined,
        }),
      });
      if (res.ok) {
        const newTree = await res.json();
        setPlantedTrees(prev => [...prev, { id: newTree.id, lat: selectedLocation.lat, lng: selectedLocation.lng, name: treeName.trim(), species: treeSpecies.trim() || undefined, planted_at: new Date().toISOString() }]);
        setReportDone(true);
        setTimeout(() => { setShowReport(false); setSelectedLocation(null); }, 2000);
      }
    } catch {} finally { setReporting(false); }
  };

  return (
    <Card className="overflow-hidden relative !p-0 h-[600px] rounded-2xl border border-gd-border-strong">
      {/* Map */}
      <div className="relative h-full">
        <MapContainer center={[36.7538, 3.0588]} zoom={6} scrollWheelZoom={true} className="h-full w-full" zoomControl={false}>
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <LocationSearch onSelect={handleSearchSelect} />
          <MapClickHandler onMapClick={handleMapClick} />
          <FlyTo center={flyTarget} />

          {/* Planted trees */}
          {plantedTrees.map(tree => (
            <Marker key={tree.id} position={[tree.lat, tree.lng]} icon={treeIcon}>
              <Popup>
                <div className="min-w-[180px] p-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🌳</span>
                    <div>
                      <p className="font-bold text-sm text-gray-800">{tree.name}</p>
                      {tree.species && <p className="text-xs text-gray-500">{tree.species}</p>}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>📅 Planted: {new Date(tree.planted_at).toLocaleDateString("en-GB")}</p>
                    <p>📍 {tree.lat.toFixed(4)}, {tree.lng.toFixed(4)}</p>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Selected location (before reporting) */}
          {selectedLocation && !reportDone && (
            <Marker position={[selectedLocation.lat, selectedLocation.lng]} icon={plantingIcon}>
              <Popup>
                <div className="min-w-[180px] p-1">
                  <p className="font-bold text-sm text-gray-800 mb-1">🌱 New Planting Spot</p>
                  <p className="text-xs text-gray-500">{selectedLocation.name}</p>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>

        {/* Legend */}
        <div className="absolute bottom-3 right-3 z-[500] rounded-xl border border-gd-border-strong bg-gd-card/95 backdrop-blur-xl p-3 shadow-xl shadow-black/20">
          <p className="text-[10px] font-semibold text-gd-text-muted uppercase tracking-wider mb-2">Legend</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-sm">🌳</span>
              <span className="text-[10px] text-gd-text-secondary">Planted Tree</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">📍</span>
              <span className="text-[10px] text-gd-text-secondary">Your Selection</span>
            </div>
          </div>
          <p className="text-[9px] text-gd-text-muted mt-2">Click map to choose a spot</p>
        </div>

        {/* Report panel */}
        {showReport && (
          <div className="absolute top-3 right-3 z-[500] w-72 max-w-[calc(100vw-5.5rem)]">
            <Card className="!bg-gd-card/95 backdrop-blur-xl !border-gd-border-strong shadow-2xl shadow-black/20">
              {reportDone ? (
                <div className="text-center py-4">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gd-success/10 border border-gd-success/25">
                    <span className="text-xl">🌳</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-gd-text-primary">Tree Reported!</p>
                  <p className="text-[10px] text-gd-text-muted">Thank you for planting</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gd-text-primary flex items-center gap-2">
                      <TreePine className="h-4 w-4 text-gd-olive-500" /> Report Tree Planting
                    </h4>
                    <button onClick={() => { setShowReport(false); setSelectedLocation(null); }} className="text-gd-text-muted hover:text-gd-text-secondary">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="rounded-xl bg-gd-olive-500/5 border border-gd-olive-500/15 px-3 py-2 mb-3">
                    <p className="text-[10px] text-gd-olive-500 font-medium">📍 Location</p>
                    <p className="text-xs text-gd-text-secondary mt-0.5 line-clamp-1">{selectedLocation?.name}</p>
                  </div>
                  <div className="space-y-2">
                    <input value={treeName} onChange={e => setTreeName(e.target.value)} placeholder="Tree name / identifier *" className="w-full rounded-xl border border-gd-border bg-gd-elevated px-3 py-2.5 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none focus:border-gd-accent-500/40" />
                    <input value={treeSpecies} onChange={e => setTreeSpecies(e.target.value)} placeholder="Species (optional)" className="w-full rounded-xl border border-gd-border bg-gd-elevated px-3 py-2.5 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none focus:border-gd-accent-500/40" />
                    <button onClick={reportTree} disabled={!treeName.trim() || reporting} className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gd-olive-500 to-gd-olive-600 py-2.5 text-sm font-semibold text-gd-text-inverse shadow-lg shadow-gd-olive-500/20 hover:shadow-gd-olive-500/40 hover:brightness-110 transition-all disabled:opacity-50">
                      {reporting ? <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span>🌳</span>}
                      {reporting ? "Reporting..." : "Confirm Planting"}
                    </button>
                  </div>
                </>
              )}
            </Card>
          </div>
        )}
      </div>
    </Card>
  );
}
