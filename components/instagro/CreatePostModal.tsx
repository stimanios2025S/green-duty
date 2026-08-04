"use client";
import { useState, FormEvent } from "react";
import { X, Image as ImageIcon, PlayCircle, FileText } from "lucide-react";
import { useInsta } from "@/lib/instagro-store";
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

export function CreatePostModal({ isOpen, onClose }: Props) {
  const { createPost } = useInsta();
  const [tab, setTab] = useState<"article" | "video">("article");
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [emoji, setEmoji] = useState("🌾");
  const [gradient, setGradient] = useState(GRADIENTS[0]);
  const [caption, setCaption] = useState("");
  const [videoIdx, setVideoIdx] = useState(0);
  const [error, setError] = useState("");
  const [publishing, setPublishing] = useState(false);

  if (!isOpen) return null;

  const handlePublish = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (tab === "article") {
      if (title.trim().length < 5) { setError("Title must be at least 5 characters."); return; }
      if (content.trim().length < 20) { setError("Write a bit more content (min 20 characters)."); return; }
    } else {
      if (caption.trim().length < 3) { setError("Add a caption for your video."); return; }
    }

    setPublishing(true);
    const ok = tab === "article"
      ? await createPost({
          type: "article",
          title: title.trim(),
          excerpt: excerpt.trim() || content.trim().slice(0, 120) + (content.trim().length > 120 ? "…" : ""),
          content: content.trim(),
          tags: tags.split(",").map(t => t.trim()).filter(Boolean).slice(0, 5),
          coverEmoji: emoji,
          coverGradient: gradient,
          caption: caption.trim() || undefined,
        })
      : await createPost({
          type: "video",
          videoUrl: SAMPLE_VIDEOS[videoIdx].url,
          duration: SAMPLE_VIDEOS[videoIdx].duration,
          caption: caption.trim(),
        });

    setPublishing(false);
    if (!ok) { setError("Failed to publish. Are you signed in?"); return; }
    onClose();
    setTab("article"); setTitle(""); setExcerpt(""); setContent(""); setTags("");
    setEmoji("🌾"); setGradient(GRADIENTS[0]); setCaption(""); setVideoIdx(0); setError("");
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[55] flex items-center justify-center p-4">
        <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-gd-border-soft bg-gd-card shadow-2xl shadow-black/50">
          <div className="flex items-center justify-between border-b border-gd-border px-5 py-3">
            <h3 className="text-base font-semibold text-gd-text-primary">Create new post</h3>
            <button onClick={onClose} className="rounded-lg p-1.5 text-gd-text-muted hover:text-gd-text-primary hover:bg-gd-elevated transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex border-b border-gd-border">
            {([
              { key: "article", label: "Article", icon: FileText },
              { key: "video", label: "Video", icon: PlayCircle },
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

          <form onSubmit={handlePublish} className="max-h-[65vh] space-y-4 overflow-y-auto px-5 py-4">
            {tab === "article" ? (
              <>
                <div>
                  <label className="text-xs font-medium text-gd-text-secondary">Title</label>
                  <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Soil Health Guide" className="mt-1 w-full rounded-xl border border-gd-border bg-gd-elevated px-3.5 py-2.5 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none focus:border-gd-accent-500/40 transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gd-text-secondary">Content</label>
                  <textarea value={content} onChange={e => setContent(e.target.value)} rows={4} placeholder="Write your article..." className="mt-1 w-full resize-none rounded-xl border border-gd-border bg-gd-elevated px-3.5 py-2.5 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none focus:border-gd-accent-500/40 transition-colors" />
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
              </>
            ) : (
              <>
                <div>
                  <label className="text-xs font-medium text-gd-text-secondary">Choose video</label>
                  <select value={videoIdx} onChange={e => setVideoIdx(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-gd-border bg-gd-elevated px-3.5 py-2.5 text-sm text-gd-text-primary outline-none focus:border-gd-accent-500/40 transition-colors">
                    {SAMPLE_VIDEOS.map((v, i) => (
                      <option key={v.url} value={i} className="bg-gd-card">{v.label} ({v.duration})</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-dashed border-gd-border-strong p-3 text-xs text-gd-text-muted">
                  <ImageIcon className="h-4 w-4 flex-shrink-0" /> Demo mode — picks from a sample library. Connect storage to upload your own.
                </div>
                <div>
                  <label className="text-xs font-medium text-gd-text-secondary">Caption</label>
                  <textarea value={caption} onChange={e => setCaption(e.target.value)} rows={3} placeholder="Describe your video..." className="mt-1 w-full resize-none rounded-xl border border-gd-border bg-gd-elevated px-3.5 py-2.5 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none focus:border-gd-accent-500/40 transition-colors" />
                </div>
              </>
            )}

            {error && <p className="rounded-xl border border-gd-danger/20 bg-gd-danger/5 px-4 py-2.5 text-xs text-gd-danger">{error}</p>}

            <button
              type="submit"
              disabled={publishing}
              className="w-full rounded-xl bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 py-3 text-sm font-semibold text-gd-text-inverse shadow-lg shadow-gd-accent-500/20 transition-all hover:shadow-gd-accent-500/40 hover:brightness-110 disabled:opacity-50"
            >
              {publishing ? "Publishing..." : "Share"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
