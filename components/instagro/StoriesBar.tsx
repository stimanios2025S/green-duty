"use client";
import { Plus } from "lucide-react";
import { InstaAvatar } from "./InstaAvatar";
import { useInsta } from "@/lib/instagro-store";
import { useAuth } from "@/lib/auth-context";
import { instaUsers } from "@/lib/instagro-data";
import { StoryViewer } from "./StoryViewer";
import { useState } from "react";

export function StoriesBar() {
  const { stories, addStory, markStoryViewed } = useInsta();
  const { user } = useAuth();
  const [viewing, setViewing] = useState<number | null>(null); // index into stories

  const me: InstaUserLike = {
    username: user?.name?.toLowerCase().replace(/\s+/g, ".") || "you",
    name: user?.name || "You",
    emoji: "📸",
    gradient: "from-amber-400 to-orange-600",
    followers: 0,
    following: 0,
  } as any;

  const open = (idx: number) => {
    const s = stories[idx];
    if (s) markStoryViewed(s.id);
    setViewing(idx);
  };

  return (
    <div className="mb-5 flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {/* Your story */}
      <div className="flex w-16 flex-shrink-0 cursor-pointer flex-col items-center gap-1.5" onClick={() => open(-1)}>
        <div className="relative">
          <InstaAvatar user={{ ...instaUsers.alex, emoji: user?.name?.charAt(0) || "🌿", username: me.username, name: me.name } as any} size={62} />
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
            {s.live && (
              <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 rounded bg-red-500 px-1 text-[7px] font-bold uppercase tracking-wide text-white">
                Live
              </span>
            )}
          </div>
          <span className="w-full truncate text-center text-[10px] text-gd-text-secondary">{s.user.username}</span>
        </div>
      ))}

      {viewing !== null && <StoryViewer startIndex={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}

type InstaUserLike = typeof instaUsers.alex;
