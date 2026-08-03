"use client";
import { useState } from "react";
import { PostCard } from "@/components/feed/PostCard";
import { CreatePostModal } from "@/components/feed/CreatePostModal";
import { educationalPosts } from "@/lib/mock-data";
import { Plus } from "lucide-react";
import type { PostStatus } from "@/types";

const STORIES = [
  { name: "Dr. Chen", emoji: "🧑‍🔬" },
  { name: "Maria", emoji: "👩‍🌾" },
  { name: "EcoWatch", emoji: "🌍" },
  { name: "GreenEarth", emoji: "🏢" },
  { name: "Alex", emoji: "🌱" },
  { name: "SoilHub", emoji: "🪱" },
];

export default function FeedPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<PostStatus | "all">("all");

  const filtered = filter === "all" ? educationalPosts : educationalPosts.filter(p => p.status === filter);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gd-text-primary tracking-tight">Discover</h1>
          <p className="text-xs text-gd-text-muted mt-0.5">Verified agronomy knowledge</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 px-3.5 py-2 text-xs font-semibold text-gd-text-inverse shadow-lg shadow-gd-accent-500/20 hover:brightness-110 transition-all"
        >
          <Plus className="h-3.5 w-3.5" /> Share
        </button>
      </div>

      {/* Stories row */}
      <div className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {STORIES.map((s, i) => (
          <div key={i} className="flex w-16 flex-shrink-0 flex-col items-center gap-1.5">
            <div className="rounded-full bg-gradient-to-tr from-gd-accent-500 via-gd-ember-500 to-gd-olive-500 p-[2.5px]">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gd-deepest text-2xl">
                {s.emoji}
              </div>
            </div>
            <span className="w-full truncate text-center text-[10px] text-gd-text-secondary">{s.name}</span>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["all", "certified", "pending"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium border transition-all ${
              filter === f
                ? "bg-gd-accent-500 text-gd-text-inverse border-gd-accent-500"
                : "bg-gd-card text-gd-text-secondary border-gd-border hover:border-gd-accent-500/30"
            }`}
          >
            {f === "all" ? "All" : f === "certified" ? "Certified" : "Pending"}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="space-y-5">
        {filtered.map(p => <PostCard key={p.id} post={p} />)}
        {filtered.length === 0 && (
          <div className="py-16 text-center text-sm text-gd-text-muted">No posts yet.</div>
        )}
      </div>

      <CreatePostModal isOpen={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
