"use client";
import { useState } from "react";
import { MapPin, Search, X, Navigation } from "lucide-react";
import { LOCATIONS } from "@/lib/instagro-editor";

interface Props {
  value: string;
  onSelect: (loc: string) => void;
  onClose: () => void;
}

export function LocationPicker({ value, onSelect, onClose }: Props) {
  const [query, setQuery] = useState("");
  const filtered = LOCATIONS.filter(l =>
    (l.name + " " + l.city).toLowerCase().includes(query.toLowerCase())
  );

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
                placeholder="Search locations..."
                autoFocus
                className="flex-1 bg-transparent text-sm text-gd-text-primary placeholder-gd-text-muted outline-none"
              />
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto p-2">
            <button
              onClick={() => { onSelect(""); onClose(); }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-gd-elevated transition-colors"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gd-elevated">
                <X className="h-4 w-4 text-gd-text-muted" />
              </div>
              <span className="text-sm text-gd-text-secondary">Remove location</span>
            </button>

            {filtered.map(l => (
              <button
                key={l.name}
                onClick={() => { onSelect(l.name + ", " + l.city); onClose(); }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-gd-elevated transition-colors"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gd-accent-500/10">
                  <MapPin className="h-4 w-4 text-gd-accent-400" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gd-text-primary">{l.name}</p>
                  <p className="truncate text-xs text-gd-text-muted">{l.city}</p>
                </div>
              </button>
            ))}

            {query.trim() && (
              <button
                onClick={() => { onSelect(query.trim()); onClose(); }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-gd-elevated transition-colors"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gd-olive-500/10">
                  <Navigation className="h-4 w-4 text-gd-olive-400" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gd-text-primary">Use "{query.trim()}"</p>
                  <p className="text-xs text-gd-text-muted">Custom location</p>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
