"use client";
import { useState, useRef, FormEvent, useCallback } from "react";
import { X, FileText, PlayCircle, ImagePlus, Loader2, CheckCircle2, MapPin, ChevronLeft } from "lucide-react";
import { useInsta } from "@/lib/instagro-store";
import { useAuth } from "@/lib/auth-context";
import { InstaAvatar } from "./InstaAvatar";
import { SAMPLE_VIDEOS } from "@/lib/instagro-data";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const EMOJIS = ["🌾", "🌱", "🌻", "🌳", "🪱", "📡", "💧", "🧑‍🔬", "🗺️", "🐝"];
const GRADIENTS = [
  "from-amber-400 to-orange-700",
  "from-lime-400 to-green-700",
  "from-teal-400 to-cyan-700",
  "from-emerald-500 to-teal-800",
  "from-orange-400 to-red-700",
  "from-yellow-400 to-amber-700",
];
const MAX_IMAGE_PX = 1200;
const MAX_VIDEO_MB = 4;

type Tab = "photo" | "video" | "article";

/** Compress an image file to a small JPEG data URL (canvas) */
function fileToImageDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, MAX_IMAGE_PX / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = reject;
      img.src = String(reader.result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function fileToVideoDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      reject(new Error(`Video is too large (max ${MAX_VIDEO_MB}MB for now). Try a shorter clip.`));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function CreatePostModal({ isOpen, onClose }: Props) {
  const { createPost } = useInsta();
  const { user } = useAuth();

  const [tab, setTab] = useState<Tab>("photo");
  const [step, setStep] = useState<"select" | "edit">("select");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [dragging, setDragging] = useState(false);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // article fields
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [emoji, setEmoji] = useState("🌾");
  const [gradient, setGradient] = useState(GRADIENTS[0]);
  const [videoIdx, setVideoIdx] = useState(0);

  if (!isOpen) return null;

  const myUsername = user?.name?.toLowerCase().replace(/\s+/g, ".") || "you";

  const reset = () => {
    setStep("select"); setMediaUrl(null); setMediaType(null); setCaption("");
    setLocation(""); setError(""); setDone(false);
    setTitle(""); setContent(""); setTags(""); setEmoji("🌾"); setGradient(GRADIENTS[0]); setVideoIdx(0);
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    try {
      if (file.type.startsWith("image/")) {
        const url = await fileToImageDataUrl(file);
        setMediaUrl(url); setMediaType("image"); setStep("edit");
      } else if (file.type.startsWith("video/")) {
        const url = await fileToVideoDataUrl(file);
        setMediaUrl(url); setMediaType("video"); setStep("edit");
      } else {
        setError("Unsupported file type. Choose a photo or video.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read that file.");
    }
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const publish = async () => {
    setError("");
    if (tab === "article") {
      if (title.trim().length < 5) { setError("Title must be at least 5 characters."); return; }
      if (content.trim().length < 20) { setError("Write a bit more content (min 20 characters)."); return; }
    } else {
      if (!mediaUrl) { setError("Add a photo or video first."); return; }
    }
    setPublishing(true);
    const ok = tab === "article"
      ? await createPost({
          type: "article",
          title: title.trim(),
          excerpt: content.trim().slice(0, 140) + (content.trim().length > 140 ? "…" : ""),
          content: content.trim(),
          tags: tags.split(",").map(t => t.trim()).filter(Boolean).slice(0, 5),
          coverEmoji: emoji,
          coverGradient: gradient,
          caption: caption.trim() || undefined,
        })
      : tab === "video"
      ? await createPost({
          type: "video",
          mediaUrl: mediaUrl!,
          duration: undefined,
          caption: caption.trim() || undefined,
          location: location.trim() || undefined,
        })
      : await createPost({
          type: "image",
          mediaUrl: mediaUrl!,
          caption: caption.trim() || undefined,
          location: location.trim() || undefined,
        });

    setPublishing(false);
    if (!ok) { setError("Failed to publish. Are you signed in?"); return; }
    setDone(true);
    setTimeout(() => { reset(); onClose(); }, 1400);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[55] flex items-center justify-center p-4">
        <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-gd-border-soft bg-gd-card shadow-2xl shadow-black/50">
          {/* ── IG top bar ── */}
          <div className="flex h-12 items-center justify-between border-b border-gd-border px-4">
            {step === "edit" && tab !== "article" ? (
              <button onClick={() => setStep("select")} className="rounded-lg p-1.5 text-gd-text-secondary hover:text-gd-text-primary transition-colors">
                <ChevronLeft className="h-5 w-5" />
              </button>
            ) : <div className="w-8" />}
            <h3 className="text-base font-semibold text-gd-text-primary">Create new post</h3>
            <div className="flex items-center gap-2">
              {step === "edit" && tab !== "article" && (
                <button
                  onClick={publish}
                  disabled={publishing}
                  className="text-sm font-semibold text-gd-accent-400 hover:text-gd-accent-300 transition-colors disabled:opacity-50"
                >
                  {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Share"}
                </button>
              )}
              <button onClick={onClose} className="rounded-lg p-1.5 text-gd-text-muted hover:text-gd-text-primary transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* ── Tabs (select step) ── */}
          {step === "select" && (
            <div className="flex border-b border-gd-border">
              {([
                { key: "photo", label: "Photo", icon: ImagePlus },
                { key: "video", label: "Video", icon: PlayCircle },
                { key: "article", label: "Article", icon: FileText },
              ] as const).map(t => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex flex-1 items-center justify-center gap-2 border-b-2 py-3 text-sm font-semibold transition-colors ${
                    tab === t.key ? "border-gd-accent-500 text-gd-accent-400" : "border-transparent text-gd-text-muted hover:text-gd-text-secondary"
                  }`}
                >
                  <t.icon className="h-4 w-4" /> {t.label}
                </button>
              ))}
            </div>
          )}

          {/* ── Body ── */}
          {done ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CheckCircle2 className="h-14 w-14 text-gd-success" />
              <p className="mt-4 text-lg font-semibold text-gd-text-primary">Shared to InstaGro!</p>
            </div>
          ) : step === "edit" && tab !== "article" && mediaUrl ? (
            /* ── IG caption editor: media left, caption right ── */
            <div className="flex flex-col sm:flex-row">
              <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden bg-black sm:w-1/2">
                {mediaType === "image" ? (
                  <img src={mediaUrl} alt="Post preview" className="h-full w-full object-cover" />
                ) : (
                  <video src={mediaUrl} controls playsInline className="h-full w-full object-contain" />
                )}
              </div>
              <div className="flex w-full flex-col p-4 sm:w-1/2">
                {/* user row */}
                <div className="mb-4 flex items-center gap-3">
                  <InstaAvatar user={{ username: myUsername, name: user?.name || "You", emoji: user?.name?.charAt(0) || "🌿", gradient: "from-amber-400 to-orange-600" }} size={36} />
                  <span className="text-sm font-semibold text-gd-text-primary">{myUsername}</span>
                </div>
                <div className="mb-4">
                  <label className="text-xs font-medium text-gd-text-secondary">Caption</label>
                  <textarea
                    value={caption}
                    onChange={e => setCaption(e.target.value)}
                    rows={5}
                    placeholder="Write a caption..."
                    className="mt-1 w-full resize-none rounded-xl border border-gd-border bg-gd-elevated px-3.5 py-2.5 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none focus:border-gd-accent-500/40 transition-colors"
                  />
                  <p className="mt-1 text-right text-[11px] text-gd-text-muted">{caption.length}/2200</p>
                </div>
                <div className="mb-4">
                  <label className="text-xs font-medium text-gd-text-secondary">Location</label>
                  <div className="relative mt-1">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gd-text-muted" />
                    <input
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      placeholder="Add location"
                      className="w-full rounded-xl border border-gd-border bg-gd-elevated py-2.5 pl-9 pr-3.5 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none focus:border-gd-accent-500/40 transition-colors"
                    />
                  </div>
                </div>
                {error && <p className="rounded-xl border border-gd-danger/20 bg-gd-danger/5 px-4 py-2.5 text-xs text-gd-danger">{error}</p>}
              </div>
            </div>
          ) : tab === "article" ? (
            /* ── Article editor ── */
            <form
              onSubmit={e => { e.preventDefault(); publish(); }}
              className="space-y-4 overflow-y-auto px-5 py-4"
            >
              <div>
                <label className="text-xs font-medium text-gd-text-secondary">Title</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Soil Health Guide" className="mt-1 w-full rounded-xl border border-gd-border bg-gd-elevated px-3.5 py-2.5 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none focus:border-gd-accent-500/40 transition-colors" />
              </div>
              <div>
                <label className="text-xs font-medium text-gd-text-secondary">Content</label>
                <textarea value={content} onChange={e => setContent(e.target.value)} rows={5} placeholder="Write your article..." className="mt-1 w-full resize-none rounded-xl border border-gd-border bg-gd-elevated px-3.5 py-2.5 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none focus:border-gd-accent-500/40 transition-colors" />
              </div>
              <div>
                <label className="text-xs font-medium text-gd-text-secondary">Tags (comma separated)</label>
                <input value={tags} onChange={e => setTags(e.target.value)} placeholder="soil, farming, organic" className="mt-1 w-full rounded-xl border border-gd-border bg-gd-elevated px-3.5 py-2.5 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none focus:border-gd-accent-500/40 transition-colors" />
              </div>
              <div>
                <label className="text-xs font-medium text-gd-text-secondary">Cover icon</label>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {EMOJIS.map(e => (
                    <button key={e} type="button" onClick={() => setEmoji(e)} className={`flex h-9 w-9 items-center justify-center rounded-lg border text-lg transition-all ${emoji === e ? "border-gd-accent-500/60 bg-gd-accent-500/10" : "border-gd-border bg-gd-elevated hover:border-gd-border-strong"}`}>{e}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gd-text-secondary">Cover color</label>
                <div className="mt-1.5 flex gap-2">
                  {GRADIENTS.map(g => (
                    <button key={g} type="button" onClick={() => setGradient(g)} className={`h-9 w-12 rounded-lg bg-gradient-to-br ${g} transition-all ${gradient === g ? "ring-2 ring-white/60 ring-offset-2 ring-offset-gd-card" : "opacity-70 hover:opacity-100"}`} />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gd-text-secondary">Caption (optional)</label>
                <textarea value={caption} onChange={e => setCaption(e.target.value)} rows={2} placeholder="Add a caption..." className="mt-1 w-full resize-none rounded-xl border border-gd-border bg-gd-elevated px-3.5 py-2.5 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none focus:border-gd-accent-500/40 transition-colors" />
              </div>
              {error && <p className="rounded-xl border border-gd-danger/20 bg-gd-danger/5 px-4 py-2.5 text-xs text-gd-danger">{error}</p>}
              <button
                type="submit"
                disabled={publishing}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 py-3 text-sm font-semibold text-gd-text-inverse shadow-lg shadow-gd-accent-500/20 transition-all hover:shadow-gd-accent-500/40 hover:brightness-110 disabled:opacity-50"
              >
                {publishing ? <><Loader2 className="h-4 w-4 animate-spin" /> Publishing...</> : "Share"}
              </button>
            </form>
          ) : (
            /* ── IG media select screen ── */
            <div className="flex flex-col items-center justify-center px-6 py-14">
              {tab === "video" && (
                <div className="mb-5 w-full max-w-sm">
                  <label className="text-xs font-medium text-gd-text-secondary">…or pick a sample video</label>
                  <select
                    value={videoIdx}
                    onChange={e => {
                      const v = SAMPLE_VIDEOS[Number(e.target.value)];
                      setVideoIdx(Number(e.target.value));
                      setMediaUrl(v.url); setMediaType("video"); setStep("edit");
                    }}
                    className="mt-1 w-full rounded-xl border border-gd-border bg-gd-elevated px-3.5 py-2.5 text-sm text-gd-text-primary outline-none focus:border-gd-accent-500/40 transition-colors"
                  >
                    {SAMPLE_VIDEOS.map((v, i) => (
                      <option key={v.url} value={i} className="bg-gd-card">{v.label} ({v.duration})</option>
                    ))}
                  </select>
                </div>
              )}

              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className={`flex w-full max-w-sm flex-col items-center justify-center rounded-2xl border-2 border-dashed px-8 py-12 text-center transition-all ${
                  dragging ? "border-gd-accent-500 bg-gd-accent-500/5" : "border-gd-border-strong hover:border-gd-accent-500/40"
                }`}
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-gd-border-strong bg-gd-elevated">
                  <ImagePlus className="h-9 w-9 text-gd-text-secondary" />
                </div>
                <p className="mt-5 text-lg font-semibold text-gd-text-primary">
                  Drag {tab === "photo" ? "photos" : "videos"} here
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-5 rounded-lg bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 px-5 py-2.5 text-sm font-semibold text-gd-text-inverse shadow-lg shadow-gd-accent-500/20 hover:brightness-110 transition-all"
                >
                  Select from computer
                </button>
                <p className="mt-3 text-xs text-gd-text-muted">
                  {tab === "photo" ? "JPG, PNG — compressed automatically" : `MP4, WebM — max ${MAX_VIDEO_MB}MB`}
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept={tab === "photo" ? "image/*" : "video/*"}
                className="hidden"
                onChange={e => handleFile(e.target.files?.[0])}
              />

              {error && <p className="mt-4 max-w-sm rounded-xl border border-gd-danger/20 bg-gd-danger/5 px-4 py-2.5 text-xs text-gd-danger">{error}</p>}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
