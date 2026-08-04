"use client";
import Link from "next/link";
import { useState } from "react";
import { InstaAvatar } from "./InstaAvatar";
import { suggestions } from "@/lib/instagro-data";
import { useAuth } from "@/lib/auth-context";

export function RightPanel() {
  const { user } = useAuth();
  const [following, setFollowing] = useState<Set<string>>(new Set());

  const toggleFollow = (id: string) => {
    setFollowing(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const myUsername = user?.name?.toLowerCase().replace(/\s+/g, ".") || "you";

  return (
    <div className="sticky top-6 hidden w-[319px] flex-col gap-5 lg:flex">
      {/* Current user */}
      <div className="flex items-center gap-3">
        <InstaAvatar user={{ id: "me", username: myUsername, name: user?.name || "You", role: "", bio: "", emoji: user?.name?.charAt(0) || "🌿", gradient: "from-amber-400 to-orange-600", followers: 0, following: 0 }} size={56} />
        <div className="min-w-0 flex-1">
          <Link href={`/feed/${myUsername}`} className="block truncate text-sm font-semibold text-gd-text-primary hover:opacity-80">
            {myUsername}
          </Link>
          <p className="truncate text-xs text-gd-text-muted">{user?.name || "You"}</p>
        </div>
        <button className="text-xs font-semibold text-gd-accent-400 hover:text-gd-accent-300 transition-colors">Switch</button>
      </div>

      {/* Suggested */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-gd-text-muted">Suggested for you</span>
          <button className="text-xs font-semibold text-gd-text-primary hover:opacity-80">See All</button>
        </div>
        <div className="space-y-3">
          {suggestions.slice(0, 5).map(s => {
            const isFollowing = following.has(s.id);
            return (
              <div key={s.id} className="flex items-center gap-3">
                <Link href={`/feed/${s.username}`}>
                  <InstaAvatar user={s} size={40} />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/feed/${s.username}`} className="block truncate text-sm font-semibold text-gd-text-primary hover:opacity-80">
                    {s.username}
                  </Link>
                  <p className="truncate text-xs text-gd-text-muted">{s.name}</p>
                </div>
                <button
                  onClick={() => toggleFollow(s.id)}
                  className={`text-xs font-semibold transition-colors ${isFollowing ? "text-gd-text-muted hover:text-gd-text-secondary" : "text-gd-accent-400 hover:text-gd-accent-300"}`}
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-2">
        <p className="text-[11px] leading-relaxed text-gd-text-muted">
          About · Help · Press · API · Jobs · Privacy · Terms · Locations · Language
        </p>
        <p className="mt-2 text-[11px] text-gd-text-muted">© 2026 InstaGro · GreenDuty</p>
      </div>
    </div>
  );
}
