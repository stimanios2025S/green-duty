"use client";
import { useState } from "react";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { timeAgo } from "@/lib/utils";
import { PostCover } from "./PostCover";
import type { EducationalPost } from "@/types";

export function PostCard({ post }: { post: EducationalPost }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);

  const toggleLike = () => {
    setLiked(prev => {
      setLikeCount(c => (prev ? c - 1 : c + 1));
      return !prev;
    });
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gd-border bg-gd-card transition-colors hover:border-gd-border-strong">
      {/* Header: avatar + name + time + menu */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-gd-accent-500 to-gd-olive-600 text-gd-text-inverse text-sm font-bold ring-2 ring-gd-border-strong">
          {post.authorName[0]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gd-text-primary flex items-center gap-1">
            {post.authorName}
            {post.status === "certified" && <BadgeCheck className="h-3.5 w-3.5 text-gd-olive-400" />}
          </p>
          <p className="text-[11px] text-gd-text-muted">{post.authorRole} · {timeAgo(post.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          {post.status === "certified" ? (
            <Badge variant="success">Certified</Badge>
          ) : (
            <Badge variant="warning">Pending</Badge>
          )}
          <button className="rounded-lg p-1 text-gd-text-muted hover:text-gd-text-primary transition-colors">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Cover (image-like) */}
      <PostCover title={post.title} seed={post.id} />

      {/* Action bar */}
      <div className="flex items-center gap-4 px-4 pt-3">
        <button onClick={toggleLike} className="transition-transform hover:scale-110">
          <Heart className={`h-6 w-6 transition-colors ${liked ? "fill-red-500 text-red-500" : "text-gd-text-secondary hover:text-gd-text-primary"}`} />
        </button>
        <button className="transition-transform hover:scale-110">
          <MessageCircle className="h-6 w-6 text-gd-text-secondary hover:text-gd-text-primary" />
        </button>
        <button className="transition-transform hover:scale-110">
          <Send className="h-6 w-6 text-gd-text-secondary hover:text-gd-text-primary" />
        </button>
        <div className="flex-1" />
        <button onClick={() => setSaved(s => !s)} className="transition-transform hover:scale-110">
          <Bookmark className={`h-6 w-6 transition-colors ${saved ? "fill-gd-accent-400 text-gd-accent-400" : "text-gd-text-secondary hover:text-gd-text-primary"}`} />
        </button>
      </div>

      {/* Likes */}
      <p className="px-4 pt-2 text-sm font-semibold text-gd-text-primary">
        {likeCount.toLocaleString()} likes
      </p>

      {/* Caption */}
      <div className="px-4 pt-1 pb-3">
        <p className="text-sm text-gd-text-secondary leading-relaxed">
          <span className="font-semibold text-gd-text-primary mr-1.5">{post.authorName}</span>
          {post.excerpt}
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {post.tags.map(t => (
            <span key={t} className="text-xs text-gd-info/90 hover:text-gd-info cursor-pointer">#{t}</span>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-gd-text-muted">{post.comments} comments</p>
      </div>
    </div>
  );
}
