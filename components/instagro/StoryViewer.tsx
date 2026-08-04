"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { X, ChevronLeft, ChevronRight, MoreHorizontal, Send, Music2, Check } from "lucide-react";
import { InstaAvatar } from "./InstaAvatar";
import { useInsta } from "@/lib/instagro-store";
import { useAuth } from "@/lib/auth-context";
import { MUSIC_TRACKS, playTrack, stopMusic, unlockAudio } from "@/lib/instagro-music";

interface Props {
  startIndex: number;
  onClose: () => void;
}

const AUTO_ADVANCE_MS = 6000;

export function StoryViewer({ startIndex, onClose }: Props) {
  const { stories } = useInsta();
  const { user } = useAuth();
  const [idx, setIdx] = useState(startIndex);
  const [replyText, setReplyText] = useState("");
  const [sent, setSent] = useState(false);
  const musicHandleRef = useRef<{ stop: () => void } | null>(null);

  const story = stories[idx];

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

  // Auto-advance
  useEffect(() => {
    if (!story) return;
    const t = setTimeout(goNext, AUTO_ADVANCE_MS);
    return () => clearTimeout(t);
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
      <div className="absolute left-0 right-0 top-3 flex gap-1.5 px-3">
        {stories.map((_, i) => (
          <div key={i} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/25">
            <div
              className="h-full bg-white"
              style={{ width: i < idx ? "100%" : i === idx ? "100%" : "0%", animation: i === idx ? "storyProgress 6s linear forwards" : undefined }}
            />
          </div>
        ))}
      </div>
      <style>{`@keyframes storyProgress { from { width: 0% } to { width: 100% } }`}</style>

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
        <button className="rounded-full p-1.5 text-white/80 hover:bg-white/10" onClick={e => { e.stopPropagation(); }}>
          <MoreHorizontal className="h-5 w-5" />
        </button>
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
              <video src={story.mediaUrl} autoPlay loop muted playsInline className="absolute inset-0 h-full w-full object-cover" />
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
