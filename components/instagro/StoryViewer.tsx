"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { X, ChevronLeft, ChevronRight, MoreHorizontal, Send, Music2, Check, Trash2, Flag, Link2, CheckCircle2 } from "lucide-react";
import { InstaAvatar } from "./InstaAvatar";
import { useInsta } from "@/lib/instagro-store";
import { useAuth } from "@/lib/auth-context";
import { MUSIC_TRACKS, playTrack, stopMusic, unlockAudio } from "@/lib/instagro-music";

interface Props {
  startIndex: number;
  onClose: () => void;
}

const AUTO_ADVANCE_MS = 6000;   // photos: 6s like Instagram
const MAX_STORY_MS = 60000;     // videos: cap at 60s (Instagram limit)

export function StoryViewer({ startIndex, onClose }: Props) {
  const { stories, deleteStory } = useInsta();
  const { user } = useAuth();
  const [idx, setIdx] = useState(startIndex);
  const [replyText, setReplyText] = useState("");
  const [sent, setSent] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reported, setReported] = useState(false);
  const [progress, setProgress] = useState(0); // 0..100 for the active story bar
  const musicHandleRef = useRef<{ stop: () => void } | null>(null);

  const story = stories[idx];
  const isMine = story?.user.id === user?.id;

  const handleDelete = async () => {
    if (!story) return;
    setDeleting(true);
    const ok = await deleteStory(story.id);
    setDeleting(false);
    setMenuOpen(false);
    if (ok) onClose();
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/feed/${story?.user.username}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
    setMenuOpen(false);
  };

  const report = () => {
    setReported(true);
    setTimeout(() => setReported(false), 1500);
    setMenuOpen(false);
  };

  const sendReply = async () => {
    if (!replyText.trim() || !story || sent) return;
    // Post a notification to the story author (real, persisted)
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: story.user.id,
          title: "New story reply",
          message: `${user?.name || "Someone"}: "${replyText.trim().slice(0, 80)}"`,
          type: "system",
        }),
      });
      setSent(true);
      setTimeout(() => { setSent(false); setReplyText(""); }, 1500);
    } catch {}
  };

  const stopMusic = () => {
    if (musicHandleRef.current) { musicHandleRef.current.stop(); musicHandleRef.current = null; }
  };

  const goNext = useCallback(() => {
    setIdx(prev => {
      if (prev >= stories.length - 1) { onClose(); return prev; }
      return prev + 1;
    });
  }, [stories.length, onClose]);

  const goPrev = useCallback(() => {
    setIdx(prev => (prev <= 0 ? prev : prev - 1));
  }, []);

  // Auto-advance + VISIBLE progress bar: photos 6s, videos 60s max (IG-style)
  useEffect(() => {
    if (!story) return;
    const isVideo = !!story.mediaUrl && (story.mediaUrl.startsWith("data:video") || story.mediaUrl.includes("commondatastorage"));
    const durationMs = isVideo ? MAX_STORY_MS : AUTO_ADVANCE_MS;
    const start = Date.now();
    setProgress(0);
    let raf = 0;
    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / durationMs) * 100);
      setProgress(pct);
      if (pct >= 100) { goNext(); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [idx, story, goNext]);

  // Music per story (real MP3 — play by URL if saved, else by catalog id)
  useEffect(() => {
    stopMusic();
    if (story?.musicUrl) {
      musicHandleRef.current = playTrack(story.musicUrl);
    } else if (story?.musicId) {
      musicHandleRef.current = playTrack(story.musicId);
    }
    return () => { stopMusic(); musicHandleRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  // Keyboard + lock scroll + unlock audio on first interaction
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      unlockAudio();
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    const onPointer = () => unlockAudio();
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
      document.body.style.overflow = "";
      stopMusic();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose, goNext, goPrev]);

  if (!story) return null;

  const isMedia = !!story.mediaUrl;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95" onClick={onClose}>
      {/* Progress bars */}
      {/* Progress bars — visible timer for each story */}
      <div className="absolute left-0 right-0 top-3 z-[72] flex gap-1.5 px-3">
        {stories.map((_, i) => (
          <div key={i} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/25">
            <div
              className="h-full rounded-full bg-white transition-[width] duration-100 ease-linear"
              style={{ width: i < idx ? "100%" : i === idx ? progress + "%" : "0%" }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute left-0 right-0 top-8 flex items-center gap-3 px-4">
        <InstaAvatar user={story.user} size={36} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">{story.user.username}</p>
          <p className="text-[11px] text-white/60">just now</p>
        </div>
        <div className="flex-1" />
        {(story.musicId || story.musicUrl) && (
          <span className="flex max-w-[40%] items-center gap-1 truncate text-[11px] text-white/80">
            <Music2 className="h-3.5 w-3.5 flex-shrink-0 text-white/70" />
            <span className="truncate">{story.musicName || "Music"}</span>
          </span>
        )}
        <div className="relative">
          <button className="rounded-full p-1.5 text-white/80 hover:bg-white/10" onClick={e => { e.stopPropagation(); setMenuOpen(o => !o); }}>
            <MoreHorizontal className="h-5 w-5" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-[70]" onClick={e => { e.stopPropagation(); setMenuOpen(false); }} />
              <div className="absolute right-0 top-10 z-[71] w-48 overflow-hidden rounded-xl border border-white/10 bg-gd-deepest/95 shadow-2xl backdrop-blur-xl" onClick={e => e.stopPropagation()}>
                {isMine ? (
                  <>
                    <button onClick={handleDelete} disabled={deleting} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-white/10 transition-colors">
                      <Trash2 className="h-4 w-4" /> {deleting ? "Deleting..." : "Delete story"}
                    </button>
                    <button onClick={copyLink} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-white/80 hover:bg-white/10 transition-colors">
                      <Link2 className="h-4 w-4" /> {copied ? "Copied!" : "Copy link"}
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={copyLink} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-white/80 hover:bg-white/10 transition-colors">
                      <Link2 className="h-4 w-4" /> {copied ? "Copied!" : "Copy link"}
                    </button>
                    <button onClick={report} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-white/80 hover:bg-white/10 transition-colors">
                      <Flag className="h-4 w-4" /> {reported ? "Reported ✓" : "Report story"}
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
        <button className="rounded-full p-1.5 text-white hover:bg-white/10" onClick={e => { e.stopPropagation(); onClose(); }}>
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Content */}
      <div
        className={`relative flex h-[70vh] w-[min(420px,90vw)] items-center justify-center overflow-hidden rounded-2xl ${story.gradient}`}
        onClick={e => e.stopPropagation()}
      >
        {isMedia ? (
          <>
            {story.mediaUrl!.startsWith("data:video") || story.mediaUrl!.startsWith("https://commondatastorage") ? (
              <video
                src={story.mediaUrl}
                autoPlay
                loop={false}
                muted
                playsInline
                onEnded={goNext}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <img src={story.mediaUrl} alt="Story" className="absolute inset-0 h-full w-full object-cover" />
            )}
            <div className="absolute inset-0 bg-black/20" />
          </>
        ) : (
          <span className="text-7xl drop-shadow-lg">{story.emoji}</span>
        )}

        {/* Text overlays */}
        {story.texts?.map(t => (
          <div
            key={t.id}
            className="absolute font-bold drop-shadow-md"
            style={{ left: t.x + "%", top: t.y + "%", fontSize: t.size, color: t.color, transform: "translate(-50%,-50%)" }}
          >
            {t.text}
          </div>
        ))}

        {story.caption && (
          <p className="absolute bottom-10 max-w-[80%] text-center text-white font-medium drop-shadow">{story.caption}</p>
        )}
      </div>

      {/* Reply */}
      <div className="absolute bottom-6 left-1/2 flex w-[min(420px,90vw)] -translate-x-1/2 items-center gap-2">
        <input
          value={replyText}
          onChange={e => setReplyText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") sendReply(); }}
          placeholder="Send message"
          className="flex-1 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white placeholder-white/60 outline-none backdrop-blur-sm focus:border-white/40"
        />
        <button onClick={sendReply} disabled={sent} className="rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20 transition-colors disabled:opacity-60">
          {sent ? <Check className="h-4 w-4" /> : <Send className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav */}
      {idx > 0 && (
        <button onClick={e => { e.stopPropagation(); goPrev(); }} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors">
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}
      {idx < stories.length - 1 && (
        <button onClick={e => { e.stopPropagation(); goNext(); }} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors">
          <ChevronRight className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}
