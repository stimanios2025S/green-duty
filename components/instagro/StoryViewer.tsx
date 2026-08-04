"use client";
import { useEffect, useState, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, MoreHorizontal, Send } from "lucide-react";
import { InstaAvatar } from "./InstaAvatar";
import { useInsta } from "@/lib/instagro-store";

interface Props {
  startIndex: number;
  onClose: () => void;
}

const AUTO_ADVANCE_MS = 4500;

export function StoryViewer({ startIndex, onClose }: Props) {
  const { stories } = useInsta();
  const [idx, setIdx] = useState(startIndex);

  const story = stories[idx];

  const goNext = useCallback(() => {
    setIdx(prev => {
      if (prev >= stories.length - 1) { onClose(); return prev; }
      return prev + 1;
    });
  }, [stories.length, onClose]);

  const goPrev = useCallback(() => {
    setIdx(prev => (prev <= 0 ? prev : prev - 1));
  }, []);

  useEffect(() => {
    if (!story) return;
    const t = setTimeout(goNext, AUTO_ADVANCE_MS);
    return () => clearTimeout(t);
  }, [idx, story, goNext]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, goNext, goPrev]);

  if (!story) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95" onClick={onClose}>
      {/* Progress bars */}
      <div className="absolute left-0 right-0 top-3 flex gap-1.5 px-3">
        {stories.map((_, i) => (
          <div key={i} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/25">
            <div
              className="h-full bg-white"
              style={{ width: i < idx ? "100%" : i === idx ? "100%" : "0%", animation: i === idx ? "storyProgress 4.5s linear forwards" : undefined }}
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
        <button className="rounded-full p-1.5 text-white/80 hover:bg-white/10" onClick={e => { e.stopPropagation(); }}>
          <MoreHorizontal className="h-5 w-5" />
        </button>
        <button className="rounded-full p-1.5 text-white hover:bg-white/10" onClick={e => { e.stopPropagation(); onClose(); }}>
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Content */}
      <div className={`flex h-[70vh] w-[min(420px,90vw)] items-center justify-center rounded-2xl bg-gradient-to-br ${story.gradient}`} onClick={e => e.stopPropagation()}>
        <span className="text-7xl drop-shadow-lg">{story.emoji}</span>
        {story.caption && <p className="mt-4 max-w-[80%] text-center text-white/95 font-medium">{story.caption}</p>}
      </div>

      {/* Reply */}
      <div className="absolute bottom-6 left-1/2 flex w-[min(420px,90vw)] -translate-x-1/2 items-center gap-2">
        <input placeholder="Send message" className="flex-1 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white placeholder-white/60 outline-none backdrop-blur-sm focus:border-white/40" />
        <button className="rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20 transition-colors">
          <Send className="h-4 w-4" />
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
