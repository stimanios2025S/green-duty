"use client";
import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-context";
import { ApiPost, ApiStory, ApiUser } from "./instagro-api";

interface CreatePostInput {
  type: "article" | "video" | "image";
  title?: string; excerpt?: string; content?: string; tags?: string[];
  coverEmoji?: string; coverGradient?: string;
  videoUrl?: string; mediaUrl?: string; duration?: string; caption?: string; location?: string;
  likesHidden?: boolean; commentsDisabled?: boolean; musicId?: string | null;
  musicUrl?: string | null; musicName?: string | null;
}

interface CreateStoryInput {
  emoji?: string; gradient?: string; caption?: string; mediaUrl?: string; musicId?: string | null; musicUrl?: string | null; musicName?: string | null; texts?: Array<{ id: string; text: string; x: number; y: number; size: number; color: string }>;
}

interface InstaStoreValue {
  posts: ApiPost[];
  stories: ApiStory[];
  suggestions: ApiUser[];
  loading: boolean;
  refresh: () => Promise<void>;
  createPost: (input: CreatePostInput) => Promise<{ ok: boolean; error?: string }>;
  createStory: (input: CreateStoryInput) => Promise<boolean>;
  toggleLike: (postId: string) => Promise<void>;
  toggleSave: (postId: string) => void;
  addComment: (postId: string, text: string) => Promise<void>;
  removeComment: (postId: string, commentId: string) => Promise<void>;
  toggleFollow: (userId: string) => Promise<void>;
  markStoryViewed: (storyId: string) => Promise<void>;
  deletePost: (postId: string) => Promise<boolean>;
  deleteStory: (storyId: string) => Promise<boolean>;
}

const InstaContext = createContext<InstaStoreValue | null>(null);

export function InstaGroProvider({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [stories, setStories] = useState<ApiStory[]>([]);
  const [suggestions, setSuggestions] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);

  /** If the server says the session user no longer exists, clear it → login */
  const handleAuthError = useCallback(() => {
    logout();
    router.push("/login");
  }, [logout, router]);

  const refresh = useCallback(async () => {
    try {
      const q = user?.id ? `?viewerId=${encodeURIComponent(user.id)}` : "";
      const res = await fetch(`/api/instagro/feed${q}`);
      if (res.ok) {
        const data = await res.json() as { posts?: ApiPost[]; stories?: ApiStory[]; suggestions?: ApiUser[] };
        setPosts(data.posts || []);
        setStories(data.stories || []);
        setSuggestions(data.suggestions || []);
      }
    } catch (e) {
      console.error("[instagro] refresh failed", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [refresh]);

  const createPost = useCallback(async (input: CreatePostInput): Promise<{ ok: boolean; error?: string }> => {
    if (!user) return { ok: false, error: "You need to sign in first." };
    try {
      const res = await fetch("/api/instagro/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, ...input }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401) { handleAuthError(); return { ok: false, error: "Your session expired — please sign in again." }; }
        return { ok: false, error: data.error || "Server rejected the post." };
      }
      await refresh();
      return { ok: true };
    } catch (e) {
      console.error("[instagro] createPost failed", e);
      return { ok: false, error: "Network error — check your connection." };
    }
  }, [user, refresh, handleAuthError]);

  const createStory = useCallback(async (input: CreateStoryInput) => {
    if (!user) return false;
    const res = await fetch("/api/instagro/stories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, ...input }),
    });
    if (!res.ok) {
      if (res.status === 401) handleAuthError();
      return false;
    }
    await refresh();
    return true;
  }, [user, refresh, handleAuthError]);

  const toggleLike = useCallback(async (postId: string) => {
    if (!user) return;
    const prev = posts;
    setPosts(ps => ps.map(p => p.id === postId ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p));
    try {
      const res = await fetch("/api/instagro/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, userId: user.id }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setPosts(prev); // rollback on failure
    }
  }, [user, posts]);

  /** Save/bookmark a post (client-side for now — like a saved collection) */
  const toggleSave = useCallback((postId: string) => {
    setPosts(ps => ps.map(p => (p.id === postId ? { ...p, saved: !p.saved } : p)));
  }, []);

  /** Delete a post (owner only) */
  const deletePost = useCallback(async (postId: string) => {
    if (!user) return false;
    const res = await fetch("/api/instagro/posts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, userId: user.id }),
    });
    if (res.ok) {
      setPosts(ps => ps.filter(p => p.id !== postId));
      return true;
    }
    return false;
  }, [user]);

  /** Delete a story (owner only) */
  const deleteStory = useCallback(async (storyId: string) => {
    if (!user) return false;
    const res = await fetch(`/api/instagro/stories/${encodeURIComponent(storyId)}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });
    if (res.ok) {
      setStories(ss => ss.filter(s => s.id !== storyId));
      return true;
    }
    return false;
  }, [user]);

  const addComment = useCallback(async (postId: string, text: string) => {
    if (!user) return;
    const res = await fetch("/api/instagro/comment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, userId: user.id, text }),
    });
    if (res.ok) await refresh();
  }, [user, refresh]);

  const removeComment = useCallback(async (postId: string, commentId: string) => {
    if (!user) return;
    // Optimistic remove
    setPosts(ps => ps.map(p => p.id === postId ? { ...p, comments: p.comments.filter(c => c.id !== commentId) } : p));
    try {
      const res = await fetch("/api/instagro/comment", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId, userId: user.id }),
      });
      if (!res.ok) await refresh(); // rollback via refresh on failure
    } catch {
      await refresh();
    }
  }, [user, refresh]);

  const toggleFollow = useCallback(async (targetId: string) => {
    if (!user) return;
    setSuggestions(ss => ss.map(s => (s.id === targetId ? { ...s, isFollowing: !s.isFollowing } : s)));
    try {
      await fetch("/api/instagro/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followerId: user.id, followingId: targetId }),
      });
    } catch (e) { console.error(e); }
  }, [user]);

  const markStoryViewed = useCallback(async (storyId: string) => {
    setStories(ss => ss.map(s => (s.id === storyId ? { ...s, viewed: true } : s)));
    if (user) {
      fetch("/api/instagro/stories/view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyId, userId: user.id }),
      }).catch(() => {});
    }
  }, [user]);

  return (
    <InstaContext.Provider value={{ posts, stories, suggestions, loading, refresh, createPost, createStory, toggleLike, toggleSave, addComment, removeComment, toggleFollow, markStoryViewed, deletePost, deleteStory }}>
      {children}
    </InstaContext.Provider>
  );
}

export function useInsta() {
  const ctx = useContext(InstaContext);
  if (!ctx) throw new Error("useInsta must be used within InstaGroProvider");
  return ctx;
}
