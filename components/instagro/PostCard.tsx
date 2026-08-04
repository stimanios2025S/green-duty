"use client";
import { useState } from "react";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, BadgeCheck, MapPin, BookOpen, Trash2, Music2, Link2, Check } from "lucide-react";
import { InstaAvatar } from "./InstaAvatar";
import { useInsta } from "@/lib/instagro-store";
import { useAuth } from "@/lib/auth-context";
import { ApiPost } from "@/lib/instagro-api";
import { MUSIC_TRACKS } from "@/lib/instagro-music";

/** Render caption with #hashtags clickable */
function renderCaption(text: string) {
  const parts = text.split(/(#\w+)/g);
  return parts.map((p, i) =>
    p.startsWith("#") ? (
      <span key={i} className="font-medium text-gd-info/90 hover:text-gd-info cursor-pointer">#{p.slice(1)}</span>
    ) : (
      <span key={i}>{p}</span>
    )
  );
}

export function PostCard({ post }: { post: ApiPost }) {
  const { toggleLike, toggleSave, addComment, removeComment, deletePost } = useInsta();
  const { user } = useAuth();
  const [commentText, setCommentText] = useState("");
  const [showAllComments, setShowAllComments] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isMine = user?.id === post.user.id;

  const submitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment(post.id, commentText.trim());
    setCommentText("");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/feed/${post.user.username}`);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 1500);
    } catch {}
    setMenuOpen(false);
  };

  const handleDelete = async () => {
    if (!isMine) return;
    if (!confirm("Delete this post?")) { setMenuOpen(false); return; }
    setDeleting(true);
    const ok = await deletePost(post.id);
    setDeleting(false);
    setMenuOpen(false);
    if (!ok) alert("Couldn't delete the post.");
  };

  const music = post.musicId
    ? (post.musicName ? { id: post.musicId, name: post.musicName } : MUSIC_TRACKS.find(m => m.id === post.musicId) || null)
    : null;

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
        <div className="relative">
          <button onClick={() => setMenuOpen(o => !o)} className="rounded-lg p-1.5 text-gd-text-muted hover:text-gd-text-primary transition-colors">
            <MoreHorizontal className="h-5 w-5" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-9 z-20 w-44 overflow-hidden rounded-xl border border-gd-border bg-gd-card shadow-xl">
              {isMine ? (
                <>
                  <button onClick={() => setMenuOpen(false)} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gd-text-secondary hover:bg-gd-elevated transition-colors">
                    <Link2 className="h-4 w-4" /> Edit post
                  </button>
                  <button onClick={handleDelete} disabled={deleting} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-gd-elevated transition-colors">
                    <Trash2 className="h-4 w-4" /> {deleting ? "Deleting..." : "Delete post"}
                  </button>
                  <button onClick={copyLink} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gd-text-secondary hover:bg-gd-elevated transition-colors">
                    <Link2 className="h-4 w-4" /> Copy link
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setMenuOpen(false)} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-gd-elevated transition-colors">
                    <Link2 className="h-4 w-4" /> Report post
                  </button>
                  <button onClick={() => setMenuOpen(false)} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gd-text-secondary hover:bg-gd-elevated transition-colors">
                    <Link2 className="h-4 w-4" /> Not interested
                  </button>
                  <button onClick={copyLink} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gd-text-secondary hover:bg-gd-elevated transition-colors">
                    <Link2 className="h-4 w-4" /> Copy link
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Media */}
      {post.type === "image" ? (
        <div className="relative aspect-square w-full overflow-hidden bg-black">
          <img src={post.mediaUrl} alt={post.caption || "Post"} className="h-full w-full object-cover" />
          {music && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white backdrop-blur-sm">
              <Music2 className="h-3 w-3 text-gd-accent-400" /> {music.name}
            </div>
          )}
        </div>
      ) : post.type === "video" ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-black">
          <video src={post.mediaUrl || post.videoUrl} controls playsInline preload="metadata" className="h-full w-full object-contain" />
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
        {!post.commentsDisabled && (
          <button className="transition-transform hover:scale-110 active:scale-95">
            <MessageCircle className="h-6 w-6 text-gd-text-secondary hover:text-gd-text-primary" />
          </button>
        )}
        <button onClick={copyLink} className="transition-transform hover:scale-110 active:scale-95" title="Copy link">
          {linkCopied ? <Check className="h-6 w-6 text-gd-success" /> : <Send className="h-6 w-6 text-gd-text-secondary hover:text-gd-text-primary" />}
        </button>
        <div className="flex-1" />
        <button onClick={() => toggleSave(post.id)} className="transition-transform hover:scale-110 active:scale-95">
          <Bookmark className={`h-6 w-6 transition-colors ${post.saved ? "fill-gd-accent-400 text-gd-accent-400" : "text-gd-text-secondary hover:text-gd-text-primary"}`} />
        </button>
      </div>

      {/* Likes (respect hide-likes) */}
      {!post.likesHidden && (
        <p className="px-4 pt-2 text-sm font-semibold text-gd-text-primary">
          {post.likes.toLocaleString()} likes
        </p>
      )}

      {/* Caption */}
      <div className="px-4 pt-1">
        <p className="text-sm text-gd-text-secondary leading-relaxed">
          <span className="mr-1.5 font-semibold text-gd-text-primary">{post.user.username}</span>
          {post.caption && renderCaption(post.caption)}
        </p>
        {post.type === "article" && post.excerpt && (
          <p className="mt-1 line-clamp-2 text-sm text-gd-text-muted">{post.excerpt}</p>
        )}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-x-2">
            {post.tags.map(t => (
              <span key={t} className="cursor-pointer text-xs font-medium text-gd-info/90 hover:text-gd-info">#{t}</span>
            ))}
          </div>
        )}
      </div>

      {/* Comments (respect disable-comments) */}
      {!post.commentsDisabled && (
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
            <div key={c.id} className="group flex items-start justify-between gap-2">
              <p className="mt-1 text-sm text-gd-text-secondary leading-snug">
                <span className="mr-1.5 font-semibold text-gd-text-primary">{c.user.username}</span>
                {c.text}
              </p>
              {/* Remove comment (own comment or own post) */}
              {(c.user.id === user?.id || isMine) && (
                <button onClick={() => removeComment(post.id, c.id)} className="mt-1.5 text-gd-text-muted opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100">
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
          <p className="mt-2 text-[10px] uppercase tracking-wide text-gd-text-muted">
            {new Date(post.createdAt).toLocaleDateString(undefined, { month: "long", day: "numeric" })}
          </p>
        </div>
      )}
      {post.commentsDisabled && (
        <p className="px-4 pt-1 text-[10px] uppercase tracking-wide text-gd-text-muted">Comments are turned off</p>
      )}

      {/* Add comment */}
      {!post.commentsDisabled && (
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
      )}
    </div>
  );
}
