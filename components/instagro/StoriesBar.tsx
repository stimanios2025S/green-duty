"use client";
import { Plus, X } from "lucide-react";
import { InstaAvatar } from "./InstaAvatar";
import { useInsta } from "@/lib/instagro-store";
import { useAuth } from "@/lib/auth-context";
import { StoryViewer } from "./StoryViewer";
import { useState } from "react";

const STORY_EMOJIS = ["🌿", "🌾", "🌻", "🌳", "💧", "🍅", "🔬", "🧹"];
const STORY_GRADIENTS = [
  "from-amber-400 to-orange-600",
  "from-lime-400 to-green-700",
  "from-teal-400 to-cyan-700",
  "from-sky-400 to-blue-700",
  "from-emerald-500 to-teal-800",
  "from-orange-400 to-red-700",
];

export function StoriesBar() {
  const { stories, createStory, markStoryViewed } = useInsta();
  const { user } = useAuth();
  const [viewing, setViewing] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [emoji, setEmoji] = useState("🌿");
  const [gradient, setGradient] = useState(STORY_GRADIENTS[0]);
  const [caption, setCaption] = useState("");

  const open = (idx: number) => {
    const s = stories[idx];
    if (s) markStoryViewed(s.id);
    setViewing(idx);
  };

  const submitStory = async (e: React.FormEvent) => {
    e.preventDefault();
    await createStory(emoji, gradient, caption || undefined);
    setCreating(false);
    setCaption("");
  };

  return (
    <div className="mb-5 flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {/* Your story */}
      <div className="flex w-16 flex-shrink-0 cursor-pointer flex-col items-center gap-1.5" onClick={() => setCreating(true)}>
        <div className="relative">
          <InstaAvatar user={{ username: "you", name: user?.name || "You", emoji: user?.name?.charAt(0) || "🌿", gradient: "from-amber-400 to-orange-600" }} size={62} />
          <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-gd-accent-500 ring-2 ring-gd-deepest">
            <Plus className="h-3.5 w-3.5 text-gd-text-inverse" />
          </div>
        </div>
        <span className="w-full truncate text-center text-[10px] text-gd-text-secondary">Your story</span>
      </div>

      {stories.map((s, i) => (
        <div key={s.id} className="flex w-16 flex-shrink-0 cursor-pointer flex-col items-center gap-1.5" onClick={() => open(i)}>
          <div className="relative">
            <InstaAvatar user={s.user} size={62} ring={!s.viewed} />
          </div>
          <span className="w-full truncate text-center text-[10px] text-gd-text-secondary">{s.user.username}</span>
        </div>
      ))}

      {viewing !== null && <StoryViewer startIndex={viewing} onClose={() => setViewing(null)} />}

      {/* Create story modal */}
      {creating && (
        <>
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setCreating(false)} />
          <div className="fixed inset-0 z-[55] flex items-center justify-center p-4">
            <div className="w-full max-w-md overflow-hidden rounded-2xl border border-gd-border-soft bg-gd-card shadow-2xl shadow-black/50">
              <div className="flex items-center justify-between border-b border-gd-border px-5 py-3">
                <h3 className="text-base font-semibold text-gd-text-primary">Create story</h3>
                <button onClick={() => setCreating(false)} className="rounded-lg p-1.5 text-gd-text-muted hover:text-gd-text-primary transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={submitStory} className="space-y-4 p-5">
                <div>
                  <label className="text-xs font-medium text-gd-text-secondary">Moment icon</label>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {STORY_EMOJIS.map(e => (
                      <button key={e} type="button" onClick={() => setEmoji(e)} className={`flex h-9 w-9 items-center justify-center rounded-lg border text-lg transition-all ${emoji === e ? "border-gd-accent-500/60 bg-gd-accent-500/10" : "border-gd-border bg-gd-elevated hover:border-gd-border-strong"}`}>{e}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gd-text-secondary">Background</label>
                  <div className="mt-1.5 flex gap-2">
                    {STORY_GRADIENTS.map(g => (
                      <button key={g} type="button" onClick={() => setGradient(g)} className={`h-9 w-12 rounded-lg bg-gradient-to-br ${g} transition-all ${gradient === g ? "ring-2 ring-white/60 ring-offset-2 ring-offset-gd-card" : "opacity-70 hover:opacity-100"}`} />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gd-text-secondary">Caption (optional)</label>
                  <input value={caption} onChange={e => setCaption(e.target.value)} placeholder="Share a moment..." className="mt-1 w-full rounded-xl border border-gd-border bg-gd-elevated px-3.5 py-2.5 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none focus:border-gd-accent-500/40 transition-colors" />
                </div>
                <button type="submit" className="w-full rounded-xl bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 py-3 text-sm font-semibold text-gd-text-inverse shadow-lg shadow-gd-accent-500/20 transition-all hover:shadow-gd-accent-500/40 hover:brightness-110">
                  Share story
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
