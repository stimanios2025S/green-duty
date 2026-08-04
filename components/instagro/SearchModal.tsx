"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Search, X, Loader2, Hash, User as UserIcon, ImageIcon, BadgeCheck } from "lucide-react";
import { InstaAvatar } from "./InstaAvatar";
import { useAuth } from "@/lib/auth-context";
import { ApiUser, ApiPost } from "@/lib/instagro-api";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchModal({ isOpen, onClose }: Props) {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [hashtags, setHashtags] = useState<{ tag: string; count: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) { setUsers([]); setPosts([]); setHashtags([]); return; }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const q = user?.id ? `&viewerId=${encodeURIComponent(user.id)}` : "";
        const res = await fetch(`/api/instagro/search?q=${encodeURIComponent(query.trim())}${q}`);
        const data = await res.json();
        setUsers(data.users || []);
        setPosts(data.posts || []);
        setHashtags(data.hashtags || []);
      } catch {
        setUsers([]); setPosts([]); setHashtags([]);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  if (!isOpen) return null;

  const hasResults = users.length + posts.length + hashtags.length > 0;

  return (
    <>
      <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[75] flex items-start justify-center p-4 pt-16">
        <div className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-gd-border-soft bg-gd-card shadow-2xl shadow-black/50">
          {/* Search input */}
          <div className="border-b border-gd-border p-4">
            <div className="flex items-center gap-2 rounded-xl border border-gd-border bg-gd-elevated px-3.5 py-2.5">
              <Search className="h-4 w-4 text-gd-text-muted" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search people, posts, hashtags..."
                autoFocus
                className="flex-1 bg-transparent text-sm text-gd-text-primary placeholder-gd-text-muted outline-none"
              />
              {loading && <Loader2 className="h-4 w-4 animate-spin text-gd-text-muted" />}
              {query && <button onClick={() => setQuery("")} className="text-gd-text-muted hover:text-gd-text-primary"><X className="h-4 w-4" /></button>}
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {query.trim().length < 2 ? (
              <p className="py-10 text-center text-sm text-gd-text-muted">Search for people, posts, or #hashtags</p>
            ) : loading ? (
              <div className="flex items-center justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-gd-text-muted" /></div>
            ) : !hasResults ? (
              <p className="py-10 text-center text-sm text-gd-text-muted">No results for "{query}"</p>
            ) : (
              <>
                {/* Users */}
                {users.length > 0 && (
                  <div>
                    <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gd-text-muted">People</p>
                    {users.map(u => (
                      <Link key={u.id} href={`/feed/${u.username}`} onClick={onClose} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-gd-elevated transition-colors">
                        <InstaAvatar user={u} size={40} />
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-1 truncate text-sm font-semibold text-gd-text-primary">
                            {u.username} {u.verified && <BadgeCheck className="h-3.5 w-3.5 text-gd-info" />}
                          </p>
                          <p className="truncate text-xs text-gd-text-muted">{u.name} · {u.followers.toLocaleString()} followers</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Hashtags */}
                {hashtags.length > 0 && (
                  <div>
                    <p className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-gd-text-muted">Hashtags</p>
                    {hashtags.map(h => (
                      <button key={h.tag} className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-gd-elevated transition-colors">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gd-accent-500/10">
                          <Hash className="h-4 w-4 text-gd-accent-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gd-text-primary">#{h.tag}</p>
                          <p className="text-xs text-gd-text-muted">{h.count} posts</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Posts */}
                {posts.length > 0 && (
                  <div>
                    <p className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-gd-text-muted">Posts</p>
                    {posts.map(p => (
                      <Link key={p.id} href={`/feed/${p.user.username}`} onClick={onClose} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-gd-elevated transition-colors">
                        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-gd-elevated">
                          {p.type === "image" && p.mediaUrl ? (
                            <img src={p.mediaUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <ImageIcon className="h-4 w-4 text-gd-text-muted" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gd-text-primary">{p.caption || p.title || "Post"}</p>
                          <p className="truncate text-xs text-gd-text-muted">@{p.user.username} · {p.likes.toLocaleString()} likes</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
