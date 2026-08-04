"use client";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { BadgeCheck, Grid3x3, PlaySquare, BookOpen, Heart, MessageCircle, ArrowLeft, X } from "lucide-react";
import { InstaAvatar } from "@/components/instagro/InstaAvatar";
import { PostCard } from "@/components/instagro/PostCard";
import { useInsta } from "@/lib/instagro-store";
import { useAuth } from "@/lib/auth-context";
import { instaUsers, formatCount, InstaPost } from "@/lib/instagro-data";

type Tab = "posts" | "videos" | "articles";

export default function ProfilePage() {
  const params = useParams<{ username: string }>();
  const router = useRouter();
  const { posts } = useInsta();
  const { user } = useAuth();

  const username = params.username || "";
  const isMe = username === user?.name?.toLowerCase().replace(/\s+/g, ".");

  // Find user: either the logged-in user or a known InstaGro user
  const knownUser = Object.values(instaUsers).find(u => u.username === username);
  const profileUser = isMe
    ? {
        ...instaUsers.alex,
        username,
        name: user?.name || "You",
        emoji: user?.name?.charAt(0) || "🌿",
      }
    : knownUser;

  const [tab, setTab] = useState<Tab>("posts");
  const [selected, setSelected] = useState<InstaPost | null>(null);

  if (!profileUser) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-4xl">🤷‍♂️</p>
        <p className="mt-4 text-lg font-semibold text-gd-text-primary">Sorry, this page isn't available.</p>
        <p className="mt-1 text-sm text-gd-text-muted">The link you followed may be broken.</p>
        <button onClick={() => router.push("/feed")} className="mt-6 rounded-xl bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 px-5 py-2.5 text-sm font-semibold text-gd-text-inverse">
          Go back to InstaGro
        </button>
      </div>
    );
  }

  const userPosts = posts.filter(p => p.user.username === profileUser.username);
  const filtered = userPosts.filter(p =>
    tab === "posts" ? true : tab === "videos" ? p.type === "video" : p.type === "article"
  );

  return (
    <div className="mx-auto max-w-[935px] px-4 py-6">
      {/* Back */}
      <Link href="/feed" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gd-text-muted hover:text-gd-text-primary transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to feed
      </Link>

      {/* Profile header */}
      <header className="mb-8 flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-16">
        <InstaAvatar user={profileUser} size={150} className="text-6xl" />

        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
            <h1 className="text-xl font-semibold text-gd-text-primary">{profileUser.username}</h1>
            {profileUser.verified && <BadgeCheck className="h-5 w-5 text-gd-info" />}
            <button className="rounded-lg border border-gd-border bg-gd-elevated px-4 py-1.5 text-sm font-semibold text-gd-text-primary hover:bg-gd-overlay transition-colors">
              {isMe ? "Edit profile" : "Follow"}
            </button>
            {!isMe && (
              <button className="rounded-lg border border-gd-border bg-gd-elevated px-4 py-1.5 text-sm font-semibold text-gd-text-primary hover:bg-gd-overlay transition-colors">
                Message
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="mt-4 flex items-center justify-center gap-8 sm:justify-start">
            <span className="text-sm text-gd-text-secondary"><b className="font-semibold text-gd-text-primary">{userPosts.length}</b> posts</span>
            <span className="text-sm text-gd-text-secondary"><b className="font-semibold text-gd-text-primary">{formatCount(profileUser.followers)}</b> followers</span>
            <span className="text-sm text-gd-text-secondary"><b className="font-semibold text-gd-text-primary">{formatCount(profileUser.following)}</b> following</span>
          </div>

          {/* Bio */}
          <div className="mt-4">
            <p className="text-sm font-semibold text-gd-text-primary">{profileUser.name}</p>
            <p className="text-sm text-gd-text-secondary">{profileUser.role}</p>
            <p className="mt-1 text-sm text-gd-text-secondary">{profileUser.bio}</p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex justify-center border-t border-gd-border">
        {([
          { key: "posts", label: "Posts", icon: Grid3x3 },
          { key: "videos", label: "Videos", icon: PlaySquare },
          { key: "articles", label: "Articles", icon: BookOpen },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 border-t px-6 py-3 text-xs font-semibold uppercase tracking-wide transition-colors ${
              tab === t.key ? "-mt-px border-gd-text-primary text-gd-text-primary" : "border-transparent text-gd-text-muted hover:text-gd-text-secondary"
            }`}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-sm text-gd-text-muted">No {tab} yet.</div>
      ) : (
        <div className="grid grid-cols-3 gap-1 pt-4 sm:gap-4">
          {filtered.map(p => (
            <button key={p.id} onClick={() => setSelected(p)} className="group relative aspect-square overflow-hidden rounded-lg sm:rounded-xl">
              {p.type === "video" ? (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-600/40 to-red-900/40">
                  <PlaySquare className="h-10 w-10 text-white/70" />
                </div>
              ) : (
                <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${p.coverGradient}`}>
                  <span className="text-4xl drop-shadow">{p.coverEmoji}</span>
                </div>
              )}
              {/* Hover overlay */}
              <div className="absolute inset-0 flex items-center justify-center gap-5 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-white"><Heart className="h-4 w-4 fill-white" /> {p.likes.toLocaleString()}</span>
                <span className="flex items-center gap-1.5 text-sm font-semibold text-white"><MessageCircle className="h-4 w-4 fill-white" /> {p.comments.length}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Post modal */}
      {selected && (
        <>
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="fixed inset-0 z-[55] flex items-center justify-center p-4">
            <button onClick={() => setSelected(null)} className="absolute right-4 top-4 rounded-full bg-black/40 p-2 text-white hover:bg-black/60 transition-colors">
              <X className="h-6 w-6" />
            </button>
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl">
              <PostCard post={selected} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
