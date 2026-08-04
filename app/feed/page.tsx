"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { StoriesBar } from "@/components/instagro/StoriesBar";
import { PostCard } from "@/components/instagro/PostCard";
import { RightPanel } from "@/components/instagro/RightPanel";
import { CreatePostModal } from "@/components/instagro/CreatePostModal";
import { useInsta } from "@/lib/instagro-store";
import { Plus, Heart, Camera, Search, Loader2, Send } from "lucide-react";
import { SearchModal } from "@/components/instagro/SearchModal";

export default function FeedPage() {
  const { user } = useAuth();
  const { posts, loading } = useInsta();
  const [showCreate, setShowCreate] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const myUsername = user?.name?.toLowerCase().replace(/\s+/g, ".") || "you";

  // Mobile bottom-nav buttons dispatch events → open the modals here
  useEffect(() => {
    const onSearch = () => setShowSearch(true);
    const onCreate = () => setShowCreate(true);
    window.addEventListener("gd:open-search", onSearch);
    window.addEventListener("gd:open-create", onCreate);
    return () => {
      window.removeEventListener("gd:open-search", onSearch);
      window.removeEventListener("gd:open-create", onCreate);
    };
  }, []);

  return (
    <div className="-m-6">
      {/* IG top nav */}
      <header className="sticky top-0 z-40 border-b border-gd-border bg-gd-deepest/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[935px] items-center justify-between px-4">
          <Link href="/feed" className="text-xl font-extrabold tracking-tight gradient-text">
            InstaGro
          </Link>

          <button
            onClick={() => setShowSearch(true)}
            className="hidden items-center gap-2 rounded-lg border border-gd-border bg-gd-card px-3 py-1.5 sm:flex hover:border-gd-accent-500/40 transition-colors"
          >
            <Search className="h-3.5 w-3.5 text-gd-text-muted" />
            <span className="text-xs text-gd-text-muted">Search</span>
          </button>
          <button
            onClick={() => setShowSearch(true)}
            className="text-gd-text-secondary hover:text-gd-text-primary transition-colors sm:hidden"
          >
            <Search className="h-6 w-6" />
          </button>

          <div className="flex items-center gap-4">
            <button onClick={() => setShowCreate(true)} className="text-gd-text-secondary hover:text-gd-text-primary transition-colors" title="Create">
              <Plus className="h-6 w-6" />
            </button>
            <button className="text-gd-text-secondary hover:text-gd-text-primary transition-colors" title="Activity">
              <Heart className="h-6 w-6" />
            </button>
            <Link href="/feed/messages" className="text-gd-text-secondary hover:text-gd-text-primary transition-colors" title="Messages">
              <Send className="h-6 w-6" />
            </Link>
            <Link href={`/feed/${myUsername}`} className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-amber-400 to-orange-600 text-sm" title="Profile">
              {user?.name?.charAt(0) || "G"}
            </Link>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto flex max-w-[935px] gap-8 px-4 py-6">
        <div className="min-w-0 flex-1 max-w-[614px] mx-auto lg:mx-0">
          <StoriesBar />
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-gd-text-muted" />
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Camera className="h-12 w-12 text-gd-text-muted" />
              <p className="mt-4 text-lg font-semibold text-gd-text-primary">No posts yet</p>
              <p className="mt-1 max-w-xs text-sm text-gd-text-muted">
                Be the first to share an article or video with the InstaGro community.
              </p>
              <button
                onClick={() => setShowCreate(true)}
                className="mt-6 rounded-xl bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 px-5 py-2.5 text-sm font-semibold text-gd-text-inverse shadow-lg shadow-gd-accent-500/20 hover:brightness-110 transition-all"
              >
                Create your first post
              </button>
            </div>
          ) : (
            posts.map(p => <PostCard key={p.id} post={p} />)
          )}
        </div>
        <RightPanel />
      </div>

      <CreatePostModal isOpen={showCreate} onClose={() => setShowCreate(false)} />
      <SearchModal isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </div>
  );
}
