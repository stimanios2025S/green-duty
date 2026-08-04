"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { InstaAvatar } from "./InstaAvatar";
import { useInsta } from "@/lib/instagro-store";
import { useAuth } from "@/lib/auth-context";

export function RightPanel() {
  const { suggestions, toggleFollow } = useInsta();
  const { user, logout } = useAuth();
  const router = useRouter();
  const myUsername = user?.name?.toLowerCase().replace(/\s+/g, ".") || "you";

  const handleSwitch = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="sticky top-6 hidden w-[319px] flex-col gap-5 lg:flex">
      {/* Current user */}
      <div className="flex items-center gap-3">
        <InstaAvatar user={{ username: myUsername, name: user?.name || "You", emoji: user?.name?.charAt(0) || "🌿", gradient: "from-amber-400 to-orange-600" }} size={56} />
        <div className="min-w-0 flex-1">
          <Link href={`/feed/${myUsername}`} className="block truncate text-sm font-semibold text-gd-text-primary hover:opacity-80">
            {myUsername}
          </Link>
          <p className="truncate text-xs text-gd-text-muted">{user?.name || "You"}</p>
        </div>
        <button onClick={handleSwitch} className="text-xs font-semibold text-gd-accent-400 hover:text-gd-accent-300 transition-colors">Switch</button>
      </div>

      {/* Suggested */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-gd-text-muted">Suggested for you</span>
          <Link href="/feed" className="text-xs font-semibold text-gd-text-primary hover:opacity-80">See All</Link>
        </div>
        {suggestions.length === 0 ? (
          <p className="text-xs text-gd-text-muted">
            {user ? "Follow people to build your feed." : "Sign in to see suggestions."}
          </p>
        ) : (
          <div className="space-y-3">
            {suggestions.slice(0, 5).map(s => (
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
                  className={`text-xs font-semibold transition-colors ${s.isFollowing ? "text-gd-text-muted hover:text-gd-text-secondary" : "text-gd-accent-400 hover:text-gd-accent-300"}`}
                >
                  {s.isFollowing ? "Following" : "Follow"}
                </button>
              </div>
            ))}
          </div>
        )}
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
