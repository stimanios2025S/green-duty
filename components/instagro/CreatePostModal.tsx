"use client";
import { useState, useRef, useCallback } from "react";
import { X, FileText, PlayCircle, ImagePlus, Loader2, CheckCircle2, MapPin, ChevronLeft, Music2 } from "lucide-react";
import { useInsta } from "@/lib/instagro-store";
import { useAuth } from "@/lib/auth-context";
import { InstaAvatar } from "./InstaAvatar";
import { MediaEditor } from "./MediaEditor";
import { LocationPicker } from "./LocationPicker";
import { MusicPicker } from "./MusicPicker";
import { SAMPLE_VIDEOS } from "@/lib/instagro-data";
import { stopPreview } from "@/lib/instagro-music";

const SUGGESTED_HASHTAGS = ["sustainable", "organic", "farming", "eco", "trees", "soil", "harvest", "greenhouse", "reforestation", "agritech"];

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
const MAX_VIDEO_MB = 2.5; // keep base64 under Vercel's 4.5MB body limit

type Tab = "photo" | "video" | "article";
type Step = "select" | "edit" | "caption";

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
      reject(new Error(`Video is too large (max ${MAX_VIDEO_MB}MB). Try a shorter clip.`));
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
  const [step, setStep] = useState<Step>("select");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [dragging, setDragging] = useState(false);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [showLocation, setShowLocation] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [hashtagOpen, setHashtagOpen] = useState(false);
  const [showMusic, setShowMusic] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState<{ id: string; name: string; artist: string; url: string } | null>(null);
  const [likesHidden, setLikesHidden] = useState(false);
  const [commentsDisabled, setCommentsDisabled] = useState(false);
  // Editor output (media + texts + music) — MUST be kept so music picked in
  // the edit step actually carries through to the caption step and publish.
  const [editResult, setEditResult] = useState<{
    mediaUrl: string; texts: any[]; musicId: string | null; musicUrl?: string | null; musicName?: string | null;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // article fields
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [emoji, setEmoji] = useState("🌾");
  const [gradient, setGradient] = useState(GRADIENTS[0]);
  const [videoIdx, setVideoIdx] = useState(0);

  // NOTE: all hooks MUST be above the early return (React rule — no conditional hooks)
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isOpen) return null;

  const myUsername = user?.name?.toLowerCase().replace(/\s+/g, ".") || "you";

  const reset = () => {
    setStep("select"); setMediaUrl(null); setMediaType(null); setCaption("");
    setLocation(""); setError(""); setDone(false);
    setTitle(""); setContent(""); setTags(""); setEmoji("🌾"); setGradient(GRADIENTS[0]); setVideoIdx(0);
    setHashtagOpen(false); setShowMusic(false);
    setSelectedMusic(null); setEditResult(null); stopPreview();
    setLikesHidden(false); setCommentsDisabled(false);
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

  const publish = async () => {
    setError("");
    if (tab === "article") {
      if (title.trim().length < 5) { setError("Title must be at least 5 characters."); return; }
      if (content.trim().length < 20) { setError("Write a bit more content (min 20 characters)."); return; }
    } else {
      if (!mediaUrl) { setError("Add a photo or video first."); return; }
    }
    if (!user) { setError("Please sign in to share. Create an account first."); return; }
    setPublishing(true);
    // Extract real hashtags from the caption (#word)
    const hashtags = Array.from(caption.matchAll(/#([a-zA-Z0-9_]+)/g)).map(m => m[1]).slice(0, 5);
    // Music may come from the edit step (editResult) or the caption step (selectedMusic)
    const music = selectedMusic || (editResult?.musicId ? { id: editResult.musicId, name: editResult.musicName || "", artist: "", url: editResult.musicUrl || "" } : null);
    const baseOptions = {
      caption: caption.trim() || undefined,
      location: location.trim() || undefined,
      likesHidden,
      commentsDisabled,
      musicId: music ? music.id : null,
      musicUrl: music ? music.url : null,
      musicName: music ? music.name : null,
      tags: hashtags.length ? hashtags : undefined,
    };
    const result = tab === "article"
      ? await createPost({
          type: "article",
          title: title.trim(),
          excerpt: content.trim().slice(0, 140) + (content.trim().length > 140 ? "…" : ""),
          content: content.trim(),
          coverEmoji: emoji,
          coverGradient: gradient,
          ...baseOptions,
        })
      : tab === "video"
      ? await createPost({ type: "video", mediaUrl: mediaUrl!, ...baseOptions })
      : await createPost({ type: "image", mediaUrl: mediaUrl!, ...baseOptions });

    setPublishing(false);
    if (!result.ok) { setError(result.error || "Failed to publish. Check your connection or sign-in."); return; }
    setDone(true);
    setTimeout(() => { reset(); onClose(); }, 1400);
  };

  const close = () => { stopPreview(); reset(); onClose(); };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={close} />
      <div className="fixed inset-0 z-[55] flex items-center justify-center p-4">
        <div className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-gd-border-soft bg-gd-card shadow-2xl shadow-black/50">
          {/* ── Top bar ── */}
          <div className="flex h-12 items-center justify-between border-b border-gd-border px-4">
            {step === "caption" && tab !== "article" ? (
              <button onClick={() => setStep("edit")} className="rounded-lg p-1.5 text-gd-text-secondary hover:text-gd-text-primary transition-colors">
                <ChevronLeft className="h-5 w-5" />
              </button>
            ) : step === "edit" && tab !== "article" ? (
              <button onClick={() => setStep("select")} className="rounded-lg p-1.5 text-gd-text-secondary hover:text-gd-text-primary transition-colors">
                <ChevronLeft className="h-5 w-5" />
              </button>
            ) : <div className="w-8" />}
            <h3 className="text-base font-semibold text-gd-text-primary">Create new post</h3>
            <div className="flex items-center gap-2">
              {step === "caption" && tab !== "article" && (
                <button
                  onClick={publish}
                  disabled={publishing}
                  className="text-sm font-semibold text-gd-accent-400 hover:text-gd-accent-300 transition-colors disabled:opacity-50"
                >
                  {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Share"}
                </button>
              )}
              <button onClick={close} className="rounded-lg p-1.5 text-gd-text-muted hover:text-gd-text-primary transition-colors">
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
          ) : step === "edit" && tab !== "article" && mediaUrl && mediaType ? (
            <MediaEditor
              mediaUrl={mediaUrl}
              mediaType={mediaType}
              onBack={() => setStep("select")}
              onNext={result => {
                // STORE the editor output (edited media, texts, music) so it
                // carries through to the caption step and publish.
                setEditResult(result);
                if (result.mediaUrl) setMediaUrl(result.mediaUrl);
                setStep("caption");
              }}
              nextLabel="Next"
              allowMusic
            />
          ) : step === "caption" && tab !== "article" && mediaUrl ? (
            /* ── IG caption editor ── */
            <div className="flex flex-col overflow-y-auto sm:flex-row">
              <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden bg-black sm:w-1/2">
                {mediaType === "image" ? (
                  <img src={mediaUrl} alt="Post preview" className="h-full w-full object-cover" />
                ) : (
                  <video src={mediaUrl} controls playsInline className="h-full w-full object-contain" />
                )}
              </div>
              <div className="flex w-full flex-col p-4 sm:w-1/2">
                <div className="mb-4 flex items-center gap-3">
                  <InstaAvatar user={{ username: myUsername, name: user?.name || "You", emoji: user?.name?.charAt(0) || "🌿", gradient: "from-amber-400 to-orange-600", avatarUrl: user?.avatarUrl && user.avatarUrl !== "/logo.png" ? user.avatarUrl : undefined }} size={36} />
                  <span className="text-sm font-semibold text-gd-text-primary">{myUsername}</span>
                </div>
                {/* Caption + hashtag suggestions */}
                <div className="mb-3">
                  <label className="text-xs font-medium text-gd-text-secondary">Caption</label>
                  <textarea
                    value={caption}
                    onChange={e => { setCaption(e.target.value); setHashtagOpen(false); }}
                    onKeyUp={e => {
                      // Show hashtag suggestions when typing #
                      if (e.key === "#") setHashtagOpen(true);
                    }}
                    rows={4}
                    placeholder="Write a caption... #hashtag"
                    className="mt-1 w-full resize-none rounded-xl border border-gd-border bg-gd-elevated px-3.5 py-2.5 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none focus:border-gd-accent-500/40 transition-colors"
                  />
                  <p className="mt-1 text-right text-[11px] text-gd-text-muted">{caption.length}/2200</p>
                  {hashtagOpen && (
                    <div className="mt-1 rounded-xl border border-gd-border bg-gd-card p-2">
                      <p className="px-2 pb-1 text-[10px] font-medium uppercase tracking-wide text-gd-text-muted">Suggested hashtags</p>
                      <div className="flex flex-wrap gap-1.5">
                        {SUGGESTED_HASHTAGS.map(tag => (
                          <button
                            key={tag}
                            onClick={() => { setCaption(c => (c.endsWith(" ") || c === "" ? c + "#" + tag + " " : c + " #" + tag + " ")); setHashtagOpen(false); }}
                            className="rounded-full border border-gd-accent-500/20 bg-gd-accent-500/5 px-2.5 py-1 text-xs text-gd-accent-400 hover:bg-gd-accent-500/10 transition-colors"
                          >
                            #{tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Location */}
                <div className="mb-3">
                  <button
                    onClick={() => setShowLocation(true)}
                    className="flex w-full items-center gap-2 rounded-xl border border-gd-border bg-gd-elevated px-3.5 py-2.5 text-sm text-gd-text-secondary hover:border-gd-accent-500/40 transition-colors"
                  >
                    <MapPin className="h-4 w-4 text-gd-text-muted" />
                    <span className={location ? "text-gd-text-primary" : "text-gd-text-muted"}>{location || "Add location"}</span>
                  </button>
                </div>

                {/* Music — browse the whole world (IG-style picker) */}
                <div className="mb-3">
                  <button
                    onClick={() => setShowMusic(true)}
                    className="flex w-full items-center gap-2 rounded-xl border border-gd-border bg-gd-elevated px-3.5 py-2.5 text-sm text-gd-text-secondary hover:border-gd-accent-500/40 transition-colors"
                  >
                    <Music2 className="h-4 w-4 text-gd-text-muted" />
                    <span className="flex-1 text-left truncate">
                      {selectedMusic
                        ? `${selectedMusic.name} — ${selectedMusic.artist}`
                        : editResult?.musicId && editResult.musicName
                        ? `${editResult.musicName}`
                        : "Add music"}
                    </span>
                    {(selectedMusic || editResult?.musicId) && <span className="text-xs text-gd-accent-400">✓</span>}
                  </button>
                </div>

                {/* Advanced: hide likes / disable comments */}
                <div className="mb-3 space-y-2 rounded-xl border border-gd-border bg-gd-elevated/50 p-3">
                  <label className="flex cursor-pointer items-center justify-between">
                    <span className="text-sm text-gd-text-secondary">Hide like and view counts</span>
                    <input type="checkbox" checked={likesHidden} onChange={e => setLikesHidden(e.target.checked)} className="h-4 w-4 accent-gd-accent-400" />
                  </label>
                  <label className="flex cursor-pointer items-center justify-between">
                    <span className="text-sm text-gd-text-secondary">Turn off commenting</span>
                    <input type="checkbox" checked={commentsDisabled} onChange={e => setCommentsDisabled(e.target.checked)} className="h-4 w-4 accent-gd-accent-400" />
                  </label>
                </div>

                {error && <p className="rounded-xl border border-gd-danger/20 bg-gd-danger/5 px-4 py-2.5 text-xs text-gd-danger">{error}</p>}
                <button
                  onClick={publish}
                  disabled={publishing}
                  className="mt-auto rounded-xl bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 py-2.5 text-sm font-semibold text-gd-text-inverse shadow-lg shadow-gd-accent-500/20 hover:brightness-110 transition-all disabled:opacity-50 sm:hidden"
                >
                  {publishing ? "Sharing..." : "Share"}
                </button>
              </div>
            </div>
          ) : tab === "article" ? (
            /* ── Article editor ── */
            <form onSubmit={e => { e.preventDefault(); publish(); }} className="space-y-4 overflow-y-auto px-5 py-4">
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
              <div>
                <button type="button" onClick={() => setShowLocation(true)} className="flex w-full items-center gap-2 rounded-xl border border-gd-border bg-gd-elevated px-3.5 py-2.5 text-sm text-gd-text-secondary hover:border-gd-accent-500/40 transition-colors">
                  <MapPin className="h-4 w-4 text-gd-text-muted" />
                  <span className={location ? "text-gd-text-primary" : "text-gd-text-muted"}>{location || "Add location"}</span>
                </button>
              </div>
              {error && <p className="rounded-xl border border-gd-danger/20 bg-gd-danger/5 px-4 py-2.5 text-xs text-gd-danger">{error}</p>}
              <button type="submit" disabled={publishing} className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 py-3 text-sm font-semibold text-gd-text-inverse shadow-lg shadow-gd-accent-500/20 transition-all hover:shadow-gd-accent-500/40 hover:brightness-110 disabled:opacity-50">
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

      {showLocation && (
        <LocationPicker
          value={location}
          onSelect={setLocation}
          onClose={() => setShowLocation(false)}
        />
      )}

      {showMusic && (
        <MusicPicker
          currentId={selectedMusic?.id || editResult?.musicId || undefined}
          onSelect={t => { setSelectedMusic(t); if (!t) setEditResult(e => e ? { ...e, musicId: null, musicUrl: null, musicName: null } : e); }}
          onClose={() => setShowMusic(false)}
        />
      )}
    </>
  );
}
