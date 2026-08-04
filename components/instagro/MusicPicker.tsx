"use client";
import { useState, useEffect, useRef } from "react";
import { Search, X, Play, Pause, Music2, Loader2 } from "lucide-react";
import { MUSIC_CATEGORIES, previewTrack, stopPreview, MusicTrack } from "@/lib/instagro-music";

interface Props {
  onSelect: (track: { id: string; name: string; artist: string; url: string } | null) => void;
  onClose: () => void;
  currentId?: string | null;
}

export function MusicPicker({ onSelect, onClose, currentId }: Props) {
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("all");
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"local" | "jamendo">("local");
  const [previewing, setPreviewing] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(currentId || null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/music?q=${encodeURIComponent(query)}&genre=${encodeURIComponent(genre)}`);
        const data = await res.json();
        setTracks(data.tracks || []);
        setSource(data.source || "local");
      } catch {
        setTracks([]);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); stopPreview(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, genre]);

  const togglePreview = (id: string) => {
    if (previewing === id) { stopPreview(); setPreviewing(null); return; }
    stopPreview();
    const t = tracks.find(x => x.id === id);
    if (t) { previewTrack(t.url); setPreviewing(id); }
  };

  const choose = (t: MusicTrack) => {
    stopPreview();
    setSelected(t.id);
    onSelect({ id: t.id, name: t.name, artist: t.artist, url: t.url });
    onClose();
  };

  const clear = () => {
    stopPreview();
    setSelected(null);
    onSelect(null);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[65] flex items-center justify-center p-4">
        <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-gd-border-soft bg-gd-card shadow-2xl shadow-black/50">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gd-border px-5 py-3">
            <h3 className="flex items-center gap-2 text-base font-semibold text-gd-text-primary">
              <Music2 className="h-5 w-5 text-gd-accent-400" /> Browse music
            </h3>
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
                placeholder="Search songs, artists, genres..."
                autoFocus
                className="flex-1 bg-transparent text-sm text-gd-text-primary placeholder-gd-text-muted outline-none"
              />
              {loading && <Loader2 className="h-4 w-4 animate-spin text-gd-text-muted" />}
            </div>
          </div>

          {/* Genre chips */}
          <div className="flex gap-2 overflow-x-auto border-b border-gd-border px-5 py-2.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {MUSIC_CATEGORIES.map(c => (
              <button
                key={c.key}
                onClick={() => setGenre(c.key)}
                className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium transition-all ${genre === c.key ? "border-gd-accent-500 bg-gd-accent-500/10 text-gd-accent-400" : "border-gd-border text-gd-text-secondary hover:border-gd-border-strong"}`}
              >
                {c.emoji} {c.label}
              </button>
            ))}
          </div>

          {/* Source badge */}
          {!loading && (
            <p className="px-5 pt-2.5 text-[11px] text-gd-text-muted">
              {source === "jamendo" ? "🌍 Searching the world's music library (Jamendo)" : "🎵 Showing built-in tracks — add a Jamendo key for the full world library"}
            </p>
          )}

          {/* Results */}
          <div className="flex-1 space-y-1 overflow-y-auto p-2">
            {loading ? (
              <div className="flex items-center justify-center py-14"><Loader2 className="h-6 w-6 animate-spin text-gd-text-muted" /></div>
            ) : tracks.length === 0 ? (
              <p className="py-14 text-center text-sm text-gd-text-muted">No tracks found for "{query}".</p>
            ) : (
              tracks.map(t => {
                const isPlaying = previewing === t.id;
                const isSelected = selected === t.id;
                return (
                  <div
                    key={t.id}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-2 transition-all ${isSelected ? "border-gd-accent-500/50 bg-gd-accent-500/5" : "border-transparent hover:bg-gd-elevated"}`}
                  >
                    {/* Play preview */}
                    <button onClick={() => togglePreview(t.id)} className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gd-elevated text-gd-text-secondary hover:text-gd-text-primary transition-colors">
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>
                    {/* Cover */}
                    <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${t.gradient} text-base`}>
                      {t.emoji}
                    </div>
                    {/* Info */}
                    <div className="min-w-0 flex-1" onClick={() => togglePreview(t.id)}>
                      <p className="truncate text-sm font-medium text-gd-text-primary">{t.name}</p>
                      <p className="truncate text-xs text-gd-text-muted">{t.artist} · {t.duration}</p>
                    </div>
                    {t.genre && <span className="hidden text-[10px] text-gd-text-muted sm:block">{t.genre}</span>}
                    {/* Choose */}
                    <button
                      onClick={() => choose(t)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${isSelected ? "text-gd-success" : "bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 text-gd-text-inverse hover:brightness-110"}`}
                    >
                      {isSelected ? "✓ Added" : "Use"}
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gd-border p-3">
            <button onClick={clear} className="w-full rounded-xl border border-gd-border py-2.5 text-sm font-medium text-gd-text-secondary hover:bg-gd-elevated transition-colors">
              Remove music
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
