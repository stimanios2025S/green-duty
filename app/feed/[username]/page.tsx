"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { BadgeCheck, Grid3x3, PlaySquare, BookOpen, Heart, MessageCircle, ArrowLeft, X, Loader2 } from "lucide-react";
import { InstaAvatar } from "@/components/instagro/InstaAvatar";
import { PostCard } from "@/components/instagro/PostCard";
import { ProfileEditor } from "@/components/instagro/ProfileEditor";
import { useInsta } from "@/lib/instagro-store";
import { useAuth } from "@/lib/auth-context";
import { ApiUser, ApiPost } from "@/lib/instagro-api";

type Tab = "posts" | "videos" | "articles";

export default function ProfilePage() {
  const params = useParams<{ username: string }>();
  const router = useRouter();
  const { user: authUser } = useAuth();
  const { toggleFollow, refresh: refreshFeed } = useInsta();

  const username = (params.username || "").toLowerCase();
  const [profile, setProfile] = useState<{ user: ApiUser; posts: ApiPost[]; isFollowing: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("posts");
  const [selected, setSelected] = useState<ApiPost | null>(null);
  const [following, setFollowing] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);

  useEffect(() => {
    let alive = true;
    const q = authUser?.id ? `?viewerId=${encodeURIComponent(authUser.id)}` : "";
    fetch(`/api/instagro/users/${encodeURIComponent(username)}${q}`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (!alive) return;
        if (data) { setProfile(data); setFollowing(data.isFollowing); }
        setLoading(false);
      })
      .catch(() => setLoading(false));
    return () => { alive = false; };
  }, [username, authUser?.id]);

  const handleFollow = async () => {
    if (!profile) return;
    setFollowing(f => !f);
    await toggleFollow(profile.user.id);
  };

  const handleMessage = async () => {
    if (!authUser) { router.push("/login"); return; }
    const msg = prompt(`Send a message to @${profile?.user.username}:`);
    if (!msg?.trim()) return;
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: profile!.user.id,
          title: `New message from ${authUser.name}`,
          message: msg.trim().slice(0, 200),
          type: "system",
        }),
      });
      alert("Message sent!");
    } catch {
      alert("Couldn't send the message.");
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-gd-text-muted" /></div>;
  }

  if (!profile) {
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

  const { user, posts } = profile;
  const isMe = authUser?.id === user.id;
  const filtered = posts.filter(p =>
    tab === "posts" ? true : tab === "videos" ? p.type === "video" : p.type === "article"
  );

  return (
    <div className="mx-auto max-w-[935px] px-4 py-6">
      <Link href="/feed" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gd-text-muted hover:text-gd-text-primary transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to feed
      </Link>

      {/* Profile header */}
      <header className="mb-8 flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-16">
        <InstaAvatar user={user} size={150} className="text-6xl" />

        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
            <h1 className="text-xl font-semibold text-gd-text-primary">{user.username}</h1>
            {user.verified && <BadgeCheck className="h-5 w-5 text-gd-info" />}
            {isMe ? (
              <button
                onClick={() => setEditingProfile(true)}
                className="rounded-lg border border-gd-border bg-gd-elevated px-4 py-1.5 text-sm font-semibold text-gd-text-primary hover:bg-gd-overlay transition-colors"
              >
                Edit profile
              </button>
            ) : (
              <>
                <button
                  onClick={handleFollow}
                  className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-all ${
                    following
                      ? "border border-gd-border bg-gd-elevated text-gd-text-primary hover:bg-gd-overlay"
                      : "bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 text-gd-text-inverse shadow-lg shadow-gd-accent-500/20 hover:brightness-110"
                  }`}
                >
                  {following ? "Following" : "Follow"}
                </button>
                <button
                  onClick={handleMessage}
                  className="rounded-lg border border-gd-border bg-gd-elevated px-4 py-1.5 text-sm font-semibold text-gd-text-primary hover:bg-gd-overlay transition-colors"
                >
                  Message
                </button>
              </>
            )}
          </div>

          <div className="mt-4 flex items-center justify-center gap-8 sm:justify-start">
            <span className="text-sm text-gd-text-secondary"><b className="font-semibold text-gd-text-primary">{posts.length}</b> posts</span>
            <span className="text-sm text-gd-text-secondary"><b className="font-semibold text-gd-text-primary">{user.followers.toLocaleString()}</b> followers</span>
            <span className="text-sm text-gd-text-secondary"><b className="font-semibold text-gd-text-primary">{user.following.toLocaleString()}</b> following</span>
          </div>

          <div className="mt-4">
            <p className="text-sm font-semibold text-gd-text-primary">{user.name}</p>
            <p className="text-sm capitalize text-gd-text-secondary">{user.role}</p>
            <p className="mt-1 text-sm text-gd-text-secondary">{user.bio}</p>
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
              {p.type === "image" ? (
                <img src={p.mediaUrl} alt={p.caption || "Post"} className="h-full w-full object-cover" />
              ) : p.type === "video" ? (
                <div className="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-600/40 to-red-900/40">
                  {p.mediaUrl ? (
                    <video src={p.mediaUrl} className="h-full w-full object-cover" muted playsInline preload="metadata" />
                  ) : (
                    <PlaySquare className="h-10 w-10 text-white/70" />
                  )}
                </div>
              ) : (
                <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${p.coverGradient || "from-amber-400 to-orange-700"}`}>
                  <span className="text-4xl drop-shadow">{p.coverEmoji || "🌾"}</span>
                </div>
              )}
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

      {/* Profile editor */}
      {isMe && (
        <ProfileEditor
          isOpen={editingProfile}
          onClose={() => setEditingProfile(false)}
          onSaved={() => {
            // Re-fetch this profile AND refresh the whole InstaGro feed so the
            // new avatar/name syncs everywhere (posts, stories, suggestions).
            setLoading(true);
            const q = authUser?.id ? `?viewerId=${encodeURIComponent(authUser.id)}` : "";
            fetch(`/api/instagro/users/${encodeURIComponent(username)}${q}`)
              .then(r => (r.ok ? r.json() : null))
              .then(data => { if (data) { setProfile(data); setFollowing(data.isFollowing); } setLoading(false); });
            refreshFeed();
          }}
        />
      )}
    </div>
  );
}
