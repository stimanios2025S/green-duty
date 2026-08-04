"use client";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { StoriesBar } from "@/components/instagro/StoriesBar";
import { PostCard } from "@/components/instagro/PostCard";
import { RightPanel } from "@/components/instagro/RightPanel";
import { CreatePostModal } from "@/components/instagro/CreatePostModal";
import { useInsta } from "@/lib/instagro-store";
import { Plus, Heart, Camera, Search } from "lucide-react";

export default function FeedPage() {
  const { user } = useAuth();
  const { posts } = useInsta();
  const [showCreate, setShowCreate] = useState(false);
  const myUsername = user?.name?.toLowerCase().replace(/\s+/g, ".") || "you";

  return (
    <div className="-m-6">
      {/* IG top nav */}
      <header className="sticky top-0 z-40 border-b border-gd-border bg-gd-deepest/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[935px] items-center justify-between px-4">
          <Link href="/feed" className="text-xl font-extrabold tracking-tight gradient-text">
            InstaGro
          </Link>

          <div className="hidden items-center gap-2 rounded-lg border border-gd-border bg-gd-card px-3 py-1.5 sm:flex">
            <Search className="h-3.5 w-3.5 text-gd-text-muted" />
            <span className="text-xs text-gd-text-muted">Search</span>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => setShowCreate(true)} className="text-gd-text-secondary hover:text-gd-text-primary transition-colors" title="Create">
              <Plus className="h-6 w-6" />
            </button>
            <button className="text-gd-text-secondary hover:text-gd-text-primary transition-colors" title="Activity">
              <Heart className="h-6 w-6" />
            </button>
            <Link href={`/feed/${myUsername}`} className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-amber-400 to-orange-600 text-sm" title="Profile">
              {user?.name?.charAt(0) || "G"}
            </Link>
          </div>
        </div>
      </header>

      {/* Body: feed + right panel */}
      <div className="mx-auto flex max-w-[935px] gap-8 px-4 py-6">
        <div className="min-w-0 flex-1 max-w-[614px] mx-auto lg:mx-0">
          <StoriesBar />
          {posts.map(p => <PostCard key={p.id} post={p} />)}
        </div>
        <RightPanel />
      </div>

      <CreatePostModal isOpen={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
