"use client";
import { useState } from "react";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, BadgeCheck, MapPin, BookOpen } from "lucide-react";
import { InstaAvatar } from "./InstaAvatar";
import { useInsta } from "@/lib/instagro-store";
import { ApiPost } from "@/lib/instagro-api";

export function PostCard({ post }: { post: ApiPost }) {
  const { toggleLike, addComment } = useInsta();
  const [commentText, setCommentText] = useState("");
  const [showAllComments, setShowAllComments] = useState(false);

  const submitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment(post.id, commentText.trim());
    setCommentText("");
  };

  return (
    <div className="mb-5 overflow-hidden rounded-2xl border border-gd-border bg-gd-card">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <InstaAvatar user={post.user} size={38} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-sm font-semibold text-gd-text-primary">
            {post.user.username}
            {post.user.verified && <BadgeCheck className="h-4 w-4 text-gd-info" />}
          </p>
          {post.location && (
            <p className="flex items-center gap-0.5 text-[11px] text-gd-text-muted">
              <MapPin className="h-3 w-3" /> {post.location}
            </p>
          )}
        </div>
        <button className="rounded-lg p-1.5 text-gd-text-muted hover:text-gd-text-primary transition-colors">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      {/* Media */}
      {post.type === "video" ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-black">
          <video src={post.videoUrl} controls playsInline preload="metadata" className="h-full w-full object-contain" />
          {post.duration && (
            <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
              {post.duration}
            </span>
          )}
        </div>
      ) : (
        <div className={`relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden bg-gradient-to-br ${post.coverGradient || "from-amber-400 to-orange-700"}`}>
          <div className="absolute inset-0 bg-grid opacity-20" />
          <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <span className="relative text-7xl drop-shadow-lg">{post.coverEmoji || "🌾"}</span>
          {post.title && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-white">
                <BookOpen className="h-4 w-4" /> {post.title}
              </p>
            </div>
          )}
          <span className="absolute left-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            📄 Article
          </span>
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center gap-4 px-4 pt-3">
        <button onClick={() => toggleLike(post.id)} className="transition-transform hover:scale-110 active:scale-95">
          <Heart className={`h-6 w-6 transition-colors ${post.liked ? "fill-red-500 text-red-500" : "text-gd-text-secondary hover:text-gd-text-primary"}`} />
        </button>
        <button className="transition-transform hover:scale-110 active:scale-95">
          <MessageCircle className="h-6 w-6 text-gd-text-secondary hover:text-gd-text-primary" />
        </button>
        <button className="transition-transform hover:scale-110 active:scale-95">
          <Send className="h-6 w-6 text-gd-text-secondary hover:text-gd-text-primary" />
        </button>
        <div className="flex-1" />
        <button onClick={() => toggleLike(post.id)} className="transition-transform hover:scale-110 active:scale-95">
          <Bookmark className={`h-6 w-6 transition-colors ${post.saved ? "fill-gd-accent-400 text-gd-accent-400" : "text-gd-text-secondary hover:text-gd-text-primary"}`} />
        </button>
      </div>

      {/* Likes */}
      <p className="px-4 pt-2 text-sm font-semibold text-gd-text-primary">
        {post.likes.toLocaleString()} likes
      </p>

      {/* Caption */}
      <div className="px-4 pt-1">
        <p className="text-sm text-gd-text-secondary leading-relaxed">
          <span className="mr-1.5 font-semibold text-gd-text-primary">{post.user.username}</span>
          {post.caption}
        </p>
        {post.type === "article" && post.excerpt && (
          <p className="mt-1 line-clamp-2 text-sm text-gd-text-muted">{post.excerpt}</p>
        )}
        {post.type === "article" && post.tags && post.tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-x-2">
            {post.tags.map(t => (
              <span key={t} className="text-xs font-medium text-gd-info/90">#{t}</span>
            ))}
          </div>
        )}
      </div>

      {/* Comments */}
      <div className="px-4 pt-1">
        {post.comments.length > 0 && (
          <button
            onClick={() => setShowAllComments(s => !s)}
            className="text-xs text-gd-text-muted hover:text-gd-text-secondary transition-colors"
          >
            {showAllComments ? "Hide comments" : `View all ${post.comments.length} comments`}
          </button>
        )}
        {(showAllComments ? post.comments : post.comments.slice(0, 2)).map(c => (
          <p key={c.id} className="mt-1 text-sm text-gd-text-secondary leading-snug">
            <span className="mr-1.5 font-semibold text-gd-text-primary">{c.user.username}</span>
            {c.text}
          </p>
        ))}
        <p className="mt-2 text-[10px] uppercase tracking-wide text-gd-text-muted">
          {new Date(post.createdAt).toLocaleDateString(undefined, { month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Add comment */}
      <form onSubmit={submitComment} className="flex items-center gap-2 border-t border-gd-border px-4 py-2.5">
        <span className="text-lg">😊</span>
        <input
          value={commentText}
          onChange={e => setCommentText(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 bg-transparent text-sm text-gd-text-primary placeholder-gd-text-muted outline-none"
        />
        {commentText.trim() && (
          <button type="submit" className="text-sm font-semibold text-gd-accent-400 hover:text-gd-accent-300 transition-colors">
            Post
          </button>
        )}
      </form>
    </div>
  );
}
