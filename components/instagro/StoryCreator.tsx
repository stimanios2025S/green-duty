"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { X, Camera, Image as ImageIcon, ChevronLeft, Check, Star, UserPlus2, Loader2 } from "lucide-react";
import { useInsta } from "@/lib/instagro-store";
import { useAuth } from "@/lib/auth-context";
import { InstaAvatar } from "./InstaAvatar";
import { MediaEditor } from "./MediaEditor";
import { stopPreview } from "@/lib/instagro-music";

interface Props {
  onClose: () => void;
}

type Step = "capture" | "edit" | "share";
type Mode = "camera" | "gallery";

/** Quick gradient "suggested" story cards (in-app content, no device needed) */
const SUGGESTED = [
  { emoji: "🌅", gradient: "from-amber-400 to-orange-600", caption: "Good morning" },
  { emoji: "🌱", gradient: "from-lime-400 to-green-700", caption: "New growth" },
  { emoji: "🌊", gradient: "from-sky-400 to-blue-700", caption: "Beach cleanup" },
  { emoji: "🍅", gradient: "from-red-400 to-rose-700", caption: "Harvest" },
  { emoji: "💧", gradient: "from-cyan-400 to-teal-700", caption: "Irrigation" },
  { emoji: "🌳", gradient: "from-emerald-500 to-teal-800", caption: "Planting day" },
];

function suggestedToDataUrl(emoji: string, gradient: string): string {
  // Render a gradient card to canvas → data URL (real image)
  const canvas = document.createElement("canvas");
  canvas.width = 600; canvas.height = 800;
  const ctx = canvas.getContext("2d")!;
  const colors: Record<string, [string, string]> = {
    "from-amber-400 to-orange-600": ["#fbbf24", "#ea580c"],
    "from-lime-400 to-green-700": ["#a3e635", "#15803d"],
    "from-sky-400 to-blue-700": ["#38bdf8", "#1d4ed8"],
    "from-red-400 to-rose-700": ["#f87171", "#be123c"],
    "from-cyan-400 to-teal-700": ["#22d3ee", "#0f766e"],
    "from-emerald-500 to-teal-800": ["#10b981", "#115e59"],
  };
  const [c1, c2] = colors[gradient] || ["#fbbf24", "#ea580c"];
  const g = ctx.createLinearGradient(0, 0, 600, 800);
  g.addColorStop(0, c1); g.addColorStop(1, c2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 600, 800);
  ctx.font = "160px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(emoji, 300, 380);
  return canvas.toDataURL("image/jpeg", 0.9);
}

export function StoryCreator({ onClose }: Props) {
  const { createStory, suggestions } = useInsta();
  const { user } = useAuth();

  const [step, setStep] = useState<Step>("capture");
  const [mode, setMode] = useState<Mode>("gallery");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [editing, setEditing] = useState<{ mediaUrl: string; texts: any[]; musicId: string | null } | null>(null);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());

  // camera
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraDenied, setCameraDenied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  };

  useEffect(() => () => { stopCamera(); stopPreview(); }, []);

  const startCamera = async () => {
    setCameraDenied(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = stream;
      setCameraOn(true);
      setTimeout(() => {
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play().catch(() => {}); }
      }, 50);
    } catch {
      setCameraDenied(true);
    }
  };

  const capturePhoto = () => {
    const v = videoRef.current;
    if (!v) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth || 600;
    canvas.height = v.videoHeight || 800;
    canvas.getContext("2d")!.drawImage(v, 0, 0);
    const url = canvas.toDataURL("image/jpeg", 0.9);
    setMediaUrl(url); setMediaType("image"); setStep("edit");
    stopCamera();
  };

  /** Permission-gated in-app device photo browser (Chrome/Edge File System Access API) */
  const browseDevicePhotos = async () => {
    const w = window as any;
    if (w.showDirectoryPicker) {
      try {
        const dir = await w.showDirectoryPicker({ mode: "read" });
        // "Accepting to use the peripheral" — the OS permission prompt appears here
        const files: File[] = [];
        for await (const entry of dir.values()) {
          if (entry.kind === "file" && /\.(png|jpe?g|gif|webp)$/i.test(entry.name)) {
            try { files.push(await entry.getFile()); } catch {}
            if (files.length >= 12) break;
          }
        }
        if (files.length > 0) {
          // Show a quick device-photo grid (in-app, like IG's library)
          const thumbs = await Promise.all(files.slice(0, 12).map(async f => {
            const url = URL.createObjectURL(f);
            return { url, file: f };
          }));
          setDevicePhotos(thumbs);
          return;
        }
        setError("No photos found in that folder.");
      } catch (e: any) {
        if (e?.name === "AbortError") return; // user cancelled the permission
        setError("Couldn't access that folder. Try 'Select from device' instead.");
      }
      return;
    }
    // Fallback: OS picker
    fileInputRef.current?.click();
  };

  const [devicePhotos, setDevicePhotos] = useState<{ url: string; file: File }[]>([]);

  /** Convert to a PERSISTENT data URL (blob URLs die on refresh and can't be seen by others) */
  const toPersistentUrl = async (file: File): Promise<{ url: string; type: "image" | "video" } | { error: string }> => {
    if (file.type.startsWith("image/")) {
      return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            const scale = Math.min(1, 1200 / Math.max(img.width, img.height));
            const w = Math.round(img.width * scale);
            const h = Math.round(img.height * scale);
            const canvas = document.createElement("canvas");
            canvas.width = w; canvas.height = h;
            canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
            resolve({ url: canvas.toDataURL("image/jpeg", 0.85), type: "image" });
          };
          img.onerror = () => resolve({ error: "Couldn't read that image." });
          img.src = String(reader.result);
        };
        reader.onerror = () => resolve({ error: "Couldn't read that file." });
        reader.readAsDataURL(file);
      });
    }
    if (file.type.startsWith("video/")) {
      if (file.size > 2.5 * 1024 * 1024) return { error: "Video is too large (max 2.5MB for stories)." };
      return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve({ url: String(reader.result), type: "video" });
        reader.onerror = () => resolve({ error: "Couldn't read that file." });
        reader.readAsDataURL(file);
      });
    }
    return { error: "Unsupported file type." };
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    const result = await toPersistentUrl(file);
    if ("error" in result) { setError(result.error); return; }
    setMediaUrl(result.url); setMediaType(result.type); setStep("edit");
  };

  const pickDevicePhoto = async (url: string) => {
    // blob URL from the device browser → fetch + convert to data URL
    setError("");
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const file = new File([blob], "device-photo.jpg", { type: blob.type || "image/jpeg" });
      const result = await toPersistentUrl(file);
      if ("error" in result) { setError(result.error); return; }
      setMediaUrl(result.url); setMediaType("image"); setStep("edit");
    } catch {
      setError("Couldn't load that photo.");
    }
  };

  const pickSuggested = (s: typeof SUGGESTED[number]) => {
    setMediaUrl(suggestedToDataUrl(s.emoji, s.gradient));
    setMediaType("image");
    setCaption(s.caption);
    setStep("edit");
  };

  const handleEditNext = useCallback((result: { mediaUrl: string; texts: any[]; musicId: string | null }) => {
    setEditing(result);
    setStep("share");
  }, []);

  const toggleSend = (id: string) => {
    setSentTo(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const publishStory = async (target: "story" | "close" | "send") => {
    if (!editing) return;
    setPublishing(true);
    setError("");
    const ok = await createStory({
      mediaUrl: editing.mediaUrl,
      musicId: editing.musicId,
      texts: editing.texts.length ? editing.texts : undefined,
      caption: caption.trim() || undefined,
      gradient: "from-amber-400 to-orange-600",
    });
    setPublishing(false);
    if (!ok) { setError("Failed to share. Are you signed in?"); return; }
    stopPreview();
    onClose();
  };

  const myUsername = user?.name?.toLowerCase().replace(/\s+/g, ".") || "you";
  const close = () => { stopCamera(); stopPreview(); onClose(); };

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center bg-black/85" onClick={close}>
      <div className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-gd-border-soft bg-gd-deepest shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Top bar */}
        <div className="flex h-12 items-center justify-between border-b border-gd-border px-4">
          {step === "edit" ? (
            <button onClick={() => setStep("capture")} className="rounded-lg p-1.5 text-gd-text-secondary hover:text-gd-text-primary transition-colors"><ChevronLeft className="h-5 w-5" /></button>
          ) : step === "share" ? (
            <button onClick={() => setStep("edit")} className="rounded-lg p-1.5 text-gd-text-secondary hover:text-gd-text-primary transition-colors"><ChevronLeft className="h-5 w-5" /></button>
          ) : <div className="w-8" />}
          <h3 className="text-base font-semibold text-gd-text-primary">
            {step === "capture" ? "Create story" : step === "edit" ? "Edit" : "Share"}
          </h3>
          <button onClick={close} className="rounded-lg p-1.5 text-gd-text-muted hover:text-gd-text-primary transition-colors"><X className="h-5 w-5" /></button>
        </div>

        {/* STEP: CAPTURE */}
        {step === "capture" && (
          <div className="flex flex-col items-center overflow-y-auto p-5">
            {/* Mode toggle */}
            <div className="mb-4 flex rounded-xl border border-gd-border bg-gd-card p-1">
              {([{ key: "camera", label: "Camera", icon: Camera }, { key: "gallery", label: "Gallery", icon: ImageIcon }] as const).map(m => (
                <button
                  key={m.key}
                  onClick={() => { setMode(m.key); if (m.key === "camera") startCamera(); else stopCamera(); }}
                  className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${mode === m.key ? "bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 text-gd-text-inverse" : "text-gd-text-secondary"}`}
                >
                  <m.icon className="h-4 w-4" /> {m.label}
                </button>
              ))}
            </div>

            {mode === "camera" ? (
              <div className="w-full max-w-sm">
                {cameraOn ? (
                  <div className="relative overflow-hidden rounded-2xl border border-gd-border">
                    <video ref={videoRef} muted playsInline className="aspect-[4/5] w-full object-cover" />
                    <button
                      onClick={capturePhoto}
                      className="absolute bottom-4 left-1/2 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full border-4 border-white bg-white/20 transition-transform hover:scale-105"
                    >
                      <div className="h-10 w-10 rounded-full bg-white" />
                    </button>
                    <p className="absolute left-3 top-3 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white">📷 Tap to capture</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-gd-border-strong py-12 text-center">
                    <Camera className="h-10 w-10 text-gd-text-muted" />
                    <p className="mt-3 text-sm text-gd-text-secondary">
                      {cameraDenied ? "Camera access was denied. Allow it in your browser settings, or use Gallery." : "Allow camera access to take a photo"}
                    </p>
                    {!cameraDenied && (
                      <button
                        onClick={startCamera}
                        className="mt-4 rounded-lg bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 px-5 py-2.5 text-sm font-semibold text-gd-text-inverse shadow-lg shadow-gd-accent-500/20 hover:brightness-110 transition-all"
                      >
                        Enable camera
                      </button>
                    )}
                  </div>
                )}
                <p className="mt-3 text-center text-[11px] text-gd-text-muted">Your camera stays on this device — nothing is uploaded until you share.</p>
              </div>
            ) : (
              <div className="w-full max-w-lg">
                {/* Suggested in-app */}
                <p className="mb-2 text-xs font-medium text-gd-text-secondary">Suggested for you</p>
                <div className="mb-5 flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {SUGGESTED.map((s, i) => (
                    <button key={i} onClick={() => pickSuggested(s)} className="flex w-20 flex-shrink-0 flex-col items-center gap-1">
                      <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${s.gradient} text-2xl shadow-lg transition-transform hover:scale-105`}>{s.emoji}</div>
                      <span className="w-full truncate text-center text-[10px] text-gd-text-muted">{s.caption}</span>
                    </button>
                  ))}
                </div>

                {/* Device photos (after permission) */}
                {devicePhotos.length > 0 && (
                  <>
                    <p className="mb-2 text-xs font-medium text-gd-text-secondary">From your device</p>
                    <div className="mb-5 grid grid-cols-4 gap-2">
                      {devicePhotos.map((p, i) => (
                        <button key={i} onClick={() => pickDevicePhoto(p.url)} className="aspect-square overflow-hidden rounded-lg border border-gd-border hover:border-gd-accent-500/50 transition-colors">
                          <img src={p.url} alt="device photo" className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* Actions */}
                <div className="space-y-2">
                  <button
                    onClick={browseDevicePhotos}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 py-3 text-sm font-semibold text-gd-text-inverse shadow-lg shadow-gd-accent-500/20 hover:brightness-110 transition-all"
                  >
                    <ImageIcon className="h-4 w-4" /> Select from device
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-gd-border bg-gd-card py-3 text-sm font-medium text-gd-text-secondary hover:border-gd-border-strong transition-colors"
                  >
                    Open file picker
                  </button>
                  <p className="text-center text-[11px] text-gd-text-muted">
                    On Chrome/Edge, "Select from device" asks permission to browse your photos inside the app.
                  </p>
                </div>
              </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
            {error && <p className="mt-3 max-w-sm rounded-xl border border-gd-danger/20 bg-gd-danger/5 px-4 py-2.5 text-xs text-gd-danger">{error}</p>}
          </div>
        )}

        {/* STEP: EDIT */}
        {step === "edit" && mediaUrl && mediaType && (
          <MediaEditor
            mediaUrl={mediaUrl}
            mediaType={mediaType}
            onBack={() => setStep("capture")}
            onNext={handleEditNext}
            nextLabel="Next"
            allowText
            allowMusic
          />
        )}

        {/* STEP: SHARE */}
        {step === "share" && editing && (
          <div className="flex flex-col sm:flex-row">
            {/* Preview */}
            <div className="relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden bg-black sm:w-1/2">
              {editing.mediaUrl.startsWith("data:video") ? (
                <video src={editing.mediaUrl} muted autoPlay loop playsInline className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <img src={editing.mediaUrl} alt="Story preview" className="absolute inset-0 h-full w-full object-cover" />
              )}
              {editing.texts.map(t => (
                <div key={t.id} className="absolute font-bold" style={{ left: t.x + "%", top: t.y + "%", fontSize: t.size, color: t.color, transform: "translate(-50%,-50%)", textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}>{t.text}</div>
              ))}
            </div>

            {/* Share panel */}
            <div className="flex w-full flex-col p-4 sm:w-1/2">
              <div className="mb-4 flex items-center gap-3">
                <InstaAvatar user={{ username: myUsername, name: user?.name || "You", emoji: user?.name?.charAt(0) || "🌿", gradient: "from-amber-400 to-orange-600" }} size={36} />
                <span className="text-sm font-semibold text-gd-text-primary">{myUsername}</span>
              </div>

              <div className="mb-4">
                <label className="text-xs font-medium text-gd-text-secondary">Say something...</label>
                <textarea value={caption} onChange={e => setCaption(e.target.value)} rows={2} placeholder="Add a caption..." className="mt-1 w-full resize-none rounded-xl border border-gd-border bg-gd-elevated px-3.5 py-2.5 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none focus:border-gd-accent-500/40 transition-colors" />
              </div>

              {/* Send to */}
              <p className="mb-2 text-xs font-medium text-gd-text-secondary">Send to</p>
              <div className="mb-4 max-h-36 space-y-1 overflow-y-auto">
                {suggestions.slice(0, 6).map(s => (
                  <button key={s.id} onClick={() => toggleSend(s.id)} className="flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left hover:bg-gd-elevated transition-colors">
                    <InstaAvatar user={s} size={30} />
                    <span className="min-w-0 flex-1 truncate text-sm text-gd-text-primary">{s.username}</span>
                    {sentTo.has(s.id) && <Check className="h-4 w-4 text-gd-accent-400" />}
                  </button>
                ))}
              </div>

              {error && <p className="mb-3 rounded-xl border border-gd-danger/20 bg-gd-danger/5 px-4 py-2.5 text-xs text-gd-danger">{error}</p>}

              <button
                onClick={() => publishStory("story")}
                disabled={publishing}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 py-3 text-sm font-semibold text-gd-text-inverse shadow-lg shadow-gd-accent-500/20 hover:brightness-110 transition-all disabled:opacity-50"
              >
                {publishing ? <><Loader2 className="h-4 w-4 animate-spin" /> Sharing...</> : <><Star className="h-4 w-4" /> Share to your story</>}
              </button>
              <button
                onClick={() => publishStory("send")}
                disabled={publishing}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-gd-border py-2.5 text-sm font-medium text-gd-text-secondary hover:border-gd-border-strong transition-colors"
              >
                <UserPlus2 className="h-4 w-4" /> Send to {sentTo.size > 0 ? `${sentTo.size} recipient(s)` : "recipients"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
