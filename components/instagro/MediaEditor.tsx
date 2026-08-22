"use client";
import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Sliders, Crop, Type, Music2, Wand2, RotateCw, Plus, X, type LucideIcon } from "lucide-react";
import { FILTERS, ASPECTS, Adjustments, DEFAULT_ADJUST, buildFilterCss, exportFilteredImage } from "@/lib/instagro-editor";
import { previewTrack, stopPreview } from "@/lib/instagro-music";
import { MusicPicker } from "./MusicPicker";
import { cn } from "@/lib/utils";

export interface TextOverlay {
  id: string;
  text: string;
  x: number; // % position
  y: number;
  size: number;
  color: string;
}

interface Props {
  mediaUrl: string;
  mediaType: "image" | "video";
  onNext: (result: { mediaUrl: string; filterCss: string; aspect: number; texts: TextOverlay[]; musicId: string | null; musicUrl?: string | null; musicName?: string | null }) => void;
  onBack: () => void;
  nextLabel?: string;
  allowText?: boolean;
  allowMusic?: boolean;
  initialMusic?: { id: string | null; url?: string | null; name?: string | null };
}

type Tab = "filters" | "adjust" | "crop" | "text" | "music";

const TEXT_COLORS = ["#ffffff", "#0b0b0f", "#facc15", "#22c55e", "#ef4444", "#3b82f6", "#f97316", "#a855f7"];

export function MediaEditor({ mediaUrl, mediaType, onNext, onBack, nextLabel = "Next", allowText = true, allowMusic = true, initialMusic }: Props) {
  const [tab, setTab] = useState<Tab>("filters");
  const [filter, setFilter] = useState("none");
  const [adj, setAdj] = useState<Adjustments>(DEFAULT_ADJUST);
  const [aspect, setAspect] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [texts, setTexts] = useState<TextOverlay[]>([]);
  const [draftText, setDraftText] = useState("");
  const [addingText, setAddingText] = useState(false);
  const [musicId, setMusicId] = useState<string | null>(initialMusic?.id || null);
  const [musicUrl, setMusicUrl] = useState<string | null>(initialMusic?.url || null);
  const [musicName, setMusicName] = useState(initialMusic?.name || "");
  const [musicPickerOpen, setMusicPickerOpen] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Cleanup music preview on unmount
  useEffect(() => () => stopPreview(), []);

  const filterCss = buildFilterCss(filter, adj);

  const toggleMusic = (id: string) => {
    if (musicId === id || id === "") {
      stopPreview();
      setMusicId(null);
      setMusicUrl(null);
      setMusicName("");
    }
  };

  const handleNext = () => {
    stopPreview();
    if (mediaType === "image" && imgRef.current) {
      // Bake filter + adjustments + REAL crop + rotation into a new JPEG
      const baked = exportFilteredImage(imgRef.current, filter, adj, aspect, rotation);
      onNext({ mediaUrl: baked, filterCss: "none", aspect, texts, musicId, musicUrl, musicName });
    } else {
      // Video: keep the original, store the CSS filter for re-application
      onNext({ mediaUrl, filterCss, aspect, texts, musicId, musicUrl, musicName });
    }
  };

  const addText = () => {
    if (!draftText.trim()) return;
    setTexts(t => [...t, { id: Math.random().toString(36).slice(2, 8), text: draftText.trim(), x: 50, y: 50, size: 28, color: "#ffffff" }]);
    setDraftText("");
    setAddingText(false);
  };

  const aspectDisplay = ASPECTS.find(a => a.value === aspect);

  const tabs: { key: Tab; icon: LucideIcon; label: string }[] = [
    { key: "filters", icon: Wand2, label: "Filters" },
    { key: "adjust", icon: Sliders, label: "Adjust" },
    ...(mediaType === "image" ? [{ key: "crop" as Tab, icon: Crop, label: "Crop" }] : []),
    ...(allowText ? [{ key: "text" as Tab, icon: Type, label: "Text" }] : []),
    ...(allowMusic ? [{ key: "music" as Tab, icon: Music2, label: "Music" }] : []),
  ];

  return (
    <div className="flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex h-12 items-center justify-between border-b border-gd-border px-4">
        <button onClick={() => { stopPreview(); onBack(); }} className="rounded-lg p-1.5 text-gd-text-secondary hover:text-gd-text-primary transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h3 className="text-base font-semibold text-gd-text-primary">Edit</h3>
        <button onClick={handleNext} className="text-sm font-semibold text-gd-accent-400 hover:text-gd-accent-300 transition-colors">
          {nextLabel} <ChevronRight className="inline h-4 w-4" />
        </button>
      </div>

      {/* Preview — reflects the real crop via aspect container + cover */}
      <div
        className="relative mx-auto flex items-center justify-center overflow-hidden bg-black"
        style={{
          aspectRatio: aspect > 0 ? String(aspect) : undefined,
          maxHeight: "46vh",
          width: aspect > 0 ? "min(46vh, 100%)" : "100%",
        }}
      >
        {mediaType === "image" ? (
          <img
            ref={imgRef}
            src={mediaUrl}
            alt="Edit preview"
            className="h-full w-full"
            style={{ filter: filterCss, transform: `rotate(${rotation}deg)`, objectFit: aspect > 0 ? "cover" : "contain" }}
            draggable={false}
          />
        ) : (
          <video src={mediaUrl} muted loop autoPlay playsInline className="h-full w-full" style={{ filter: filterCss, objectFit: aspect > 0 ? "cover" : "contain" }} />
        )}
        {/* Text overlays */}
        {texts.map(t => (
          <div
            key={t.id}
            className="absolute cursor-move select-none"
            style={{ left: t.x + "%", top: t.y + "%", fontSize: t.size, color: t.color, textShadow: "0 1px 3px rgba(0,0,0,0.6)", transform: "translate(-50%,-50%)" }}
            onPointerDown={e => {
              const el = e.currentTarget;
              const startX = e.clientX, startY = e.clientY;
              const ox = t.x, oy = t.y;
              const move = (ev: PointerEvent) => {
                const rect = el.parentElement!.getBoundingClientRect();
                const nx = ox + ((ev.clientX - startX) / rect.width) * 100;
                const ny = oy + ((ev.clientY - startY) / rect.height) * 100;
                setTexts(ts => ts.map(x => x.id === t.id ? { ...x, x: Math.max(0, Math.min(100, nx)), y: Math.max(0, Math.min(100, ny)) } : x));
              };
              const up = () => {
                window.removeEventListener("pointermove", move);
                window.removeEventListener("pointerup", up);
              };
              window.addEventListener("pointermove", move);
              window.addEventListener("pointerup", up);
            }}
          >
            {t.text}
            <button
              className="absolute -right-3 -top-3 rounded-full bg-black/60 p-0.5 text-white"
              onClick={e => { e.stopPropagation(); setTexts(ts => ts.filter(x => x.id !== t.id)); }}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Editor tabs */}
      <div className="flex border-y border-gd-border bg-gd-card">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors ${tab === t.key ? "text-gd-accent-400" : "text-gd-text-muted hover:text-gd-text-secondary"}`}
          >
            <t.icon className="h-5 w-5" /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="max-h-44 overflow-y-auto bg-gd-card px-4 py-3">
        {tab === "filters" && (
          <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {FILTERS.map(f => (
              <button key={f.name} onClick={() => setFilter(f.css)} className="flex w-16 flex-shrink-0 flex-col items-center gap-1">
                <div className={cn("h-14 w-14 overflow-hidden rounded-lg border-2 transition-all", filter === f.css ? "border-gd-accent-400" : "border-transparent")}>
                  {mediaType === "image" ? (
                    <img src={mediaUrl} alt={f.name} className="h-full w-full object-cover" style={{ filter: f.css }} draggable={false} />
                  ) : (
                    <video src={mediaUrl} muted className="h-full w-full object-cover" style={{ filter: f.css }} />
                  )}
                </div>
                <span className={cn("text-[10px]", filter === f.css ? "text-gd-accent-400 font-semibold" : "text-gd-text-muted")}>{f.name}</span>
              </button>
            ))}
          </div>
        )}

        {tab === "adjust" && (
          <div className="space-y-3">
            {([
              { label: "Brightness", key: "brightness", min: 0.5, max: 1.5, step: 0.01 },
              { label: "Contrast", key: "contrast", min: 0.5, max: 1.5, step: 0.01 },
              { label: "Saturation", key: "saturation", min: 0, max: 2, step: 0.01 },
              { label: "Warmth", key: "warmth", min: -0.5, max: 0.5, step: 0.01 },
            ] as const).map(s => (
              <div key={s.key} className="flex items-center gap-3">
                <span className="w-20 text-xs text-gd-text-secondary">{s.label}</span>
                <input
                  type="range"
                  min={s.min} max={s.max} step={s.step}
                  value={adj[s.key]}
                  onChange={e => setAdj(a => ({ ...a, [s.key]: Number(e.target.value) }))}
                  className="flex-1 accent-gd-accent-400"
                />
              </div>
            ))}
            <button onClick={() => setAdj(DEFAULT_ADJUST)} className="text-xs font-medium text-gd-accent-400 hover:text-gd-accent-300">
              Reset
            </button>
          </div>
        )}

        {tab === "crop" && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {ASPECTS.map(a => (
                <button
                  key={a.name}
                  onClick={() => setAspect(a.value)}
                  className={cn("rounded-full border px-3 py-1.5 text-xs font-medium transition-all", aspect === a.value ? "border-gd-accent-500 bg-gd-accent-500/10 text-gd-accent-400" : "border-gd-border text-gd-text-secondary hover:border-gd-border-strong")}
                >
                  {a.name}
                </button>
              ))}
            </div>
            <button
              onClick={() => setRotation(r => (r + 90) % 360)}
              className="inline-flex items-center gap-2 rounded-xl border border-gd-border px-4 py-2 text-xs font-medium text-gd-text-secondary hover:border-gd-border-strong transition-colors"
            >
              <RotateCw className="h-4 w-4" /> Rotate 90°
            </button>
            <p className="text-[11px] text-gd-text-muted">Aspect: {aspect === 0 ? "Original" : `${aspectDisplay?.name}`} · Rotation {rotation}°</p>
          </div>
        )}

        {tab === "text" && (
          <div className="space-y-3">
            {addingText ? (
              <div className="space-y-2">
                <input
                  value={draftText}
                  onChange={e => setDraftText(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") addText(); }}
                  placeholder="Type something..."
                  autoFocus
                  className="w-full rounded-xl border border-gd-border bg-gd-elevated px-3.5 py-2.5 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none focus:border-gd-accent-500/40"
                />
                <div className="flex gap-1.5">
                  {TEXT_COLORS.map(c => (
                    <button key={c} onClick={() => setTexts(ts => { const last = ts[ts.length - 1]; return last ? ts.map(x => x.id === last.id ? { ...x, color: c } : x) : ts; })} className="h-7 w-7 rounded-full border border-gd-border" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={addText} className="rounded-xl bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 px-4 py-1.5 text-xs font-semibold text-gd-text-inverse">Add</button>
                  <button onClick={() => { setAddingText(false); setDraftText(""); }} className="rounded-xl border border-gd-border px-4 py-1.5 text-xs font-medium text-gd-text-secondary">Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setAddingText(true)} className="inline-flex items-center gap-2 rounded-xl border border-gd-border px-4 py-2 text-xs font-medium text-gd-text-secondary hover:border-gd-border-strong transition-colors">
                <Plus className="h-4 w-4" /> Add text
              </button>
            )}
            {texts.length > 0 && (
              <div className="space-y-1">
                {texts.map(t => (
                  <div key={t.id} className="flex items-center justify-between rounded-lg border border-gd-border bg-gd-elevated/50 px-3 py-1.5">
                    <span className="truncate text-xs text-gd-text-primary">{t.text}</span>
                    <div className="flex items-center gap-1.5">
                      {[18, 24, 32, 42].map(s => (
                        <button key={s} onClick={() => setTexts(ts => ts.map(x => x.id === t.id ? { ...x, size: s } : x))} className={cn("text-xs text-gd-text-secondary", t.size === s && "text-gd-accent-400")}>{s}</button>
                      ))}
                    </div>
                    <button onClick={() => setTexts(ts => ts.filter(x => x.id !== t.id))} className="text-gd-text-muted hover:text-red-400"><X className="h-3.5 w-3.5" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "music" && (
          <div className="space-y-2">
            <p className="text-[11px] text-gd-text-muted">Pick a track — plays in preview, loops in the story</p>
            {musicId ? (
              <div className="flex items-center gap-3 rounded-xl border border-gd-accent-500/40 bg-gd-accent-500/5 p-2.5">
                <Music2 className="h-5 w-5 text-gd-accent-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gd-text-primary">{musicName || "Selected track"}</p>
                  <p className="truncate text-xs text-gd-text-muted">Added to your {allowText ? "story" : "post"}</p>
                </div>
                <button onClick={() => toggleMusic("")} className="rounded-lg border border-gd-border px-3 py-1.5 text-xs font-medium text-gd-text-secondary hover:bg-gd-elevated transition-colors">
                  Remove
                </button>
              </div>
            ) : (
              <button
                onClick={() => setMusicPickerOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 py-3 text-sm font-semibold text-gd-text-inverse shadow-lg shadow-gd-accent-500/20 hover:brightness-110 transition-all"
              >
                <Music2 className="h-4 w-4" /> Browse all music
              </button>
            )}
          </div>
        )}
      </div>

      {/* World-music picker */}
      {musicPickerOpen && (
        <MusicPicker
          currentId={musicId || undefined}
          onSelect={t => {
            if (t) { setMusicId(t.id); setMusicUrl(t.url); setMusicName(t.name); previewTrack(t.url); setPlaying(true); }
            else { setMusicId(null); setMusicUrl(null); setMusicName(""); stopPreview(); setPlaying(false); }
            setMusicPickerOpen(false);
          }}
          onClose={() => setMusicPickerOpen(false)}
        />
      )}
    </div>
  );
}
