"use client";
import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MessageCircle, Send, ArrowLeft, Loader2, MoreHorizontal, Plus, ImageIcon, Video, Mic, MapPin, Check, X, Users, Flame, Smile, Pause, Play, Phone, PhoneOff, Bell } from "lucide-react";
import { InstaAvatar } from "@/components/instagro/InstaAvatar";
import { LocationPicker } from "@/components/instagro/LocationPicker";
import { CallOverlay } from "@/components/instagro/CallOverlay";
import { useAuth } from "@/lib/auth-context";
import { useInsta } from "@/lib/instagro-store";
import { ApiUser } from "@/lib/instagro-api";
import { streakEmoji, streakLabel } from "@/lib/chat-client";

interface Conversation {
  id: string;
  type: "direct" | "group";
  name: string;
  otherUser: ApiUser | null;
  memberCount?: number;
  memberAvatars?: ApiUser[];
  lastMessage: { text: string; fromMe: boolean; createdAt: string } | null;
  unread: number;
  streak: number;
  streakEmoji: string;
  vanish: boolean;
  updatedAt: string;
}
interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  mediaUrl: string | null;
  mediaType: string | null;
  replyTo: string | null;
  reactions: Record<string, string[]>;
  vanish: boolean;
  fromMe: boolean;
  createdAt: string;
}

interface IncomingCallData {
  call: {
    id: string;
    type: "audio" | "video";
    status: string;
    caller_id?: string;
    callee_id?: string;
  };
  peer: ApiUser;
}

const ECO_REACTIONS = ["🌱", "🤝", "💧", "🔥", "🌿", "❤️"];
const MAX_SNAP_MB = 2.5;

function MessagesContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { suggestions } = useInsta();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [active, setActive] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<Conversation | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [replyTarget, setReplyTarget] = useState<ChatMessage | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordingSec, setRecordingSec] = useState(0);
  const [showLocation, setShowLocation] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupMembers, setGroupMembers] = useState<Set<string>>(new Set());
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Typing + calls
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastMsgCountRef = useRef(0);
  const [activeCall, setActiveCall] = useState<{ id: string; type: "audio" | "video"; role: "caller" | "callee" } | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);

  useEffect(() => { activeRef.current = active; }, [active]);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/chat/conversations?userId=${encodeURIComponent(user.id)}`);
      const d = await res.json().catch(() => ({}));
      if (d.conversations) {
        setConversations(prev => {
          const activeId = activeRef.current?.id;
          return d.conversations.map((c: Conversation) => (c.id === activeId ? { ...c, unread: 0 } : c));
        });
      }
    } catch {}
  }, [user]);

  // Initial load + live polling
  useEffect(() => {
    if (!user) { router.replace("/login"); return; }
    loadConversations().finally(() => setLoading(false));
    const t = setInterval(loadConversations, 4000);
    return () => clearInterval(t);
  }, [user, router, loadConversations]);

  const activeConversation = active ?? (searchParams.get("conv") ? conversations.find(c => c.id === searchParams.get("conv")) ?? null : null);

  // Live-poll the active thread
  useEffect(() => {
    if (!activeConversation || !user) return;
    const poll = async () => {
      try {
        const res = await fetch(`/api/chat/messages?conversationId=${encodeURIComponent(activeConversation.id)}&userId=${encodeURIComponent(user.id)}`);
        const d = await res.json().catch(() => ({}));
        if (d.messages) {
          // Browser notification + sound when a NEW incoming message arrives
          const was = lastMsgCountRef.current;
          const now = d.messages.length;
          const hasNew = now > was && now > 0 && d.messages[now - 1]?.senderId !== user.id && !document.hasFocus();
          if (hasNew) {
            const m = d.messages[now - 1];
            try {
              if (typeof Notification !== "undefined" && Notification.permission === "granted") {
                new Notification("💬 " + (activeConversation.otherUser?.name || "New message"), { body: m.text || "New message", icon: "/logo.png" });
              }
            } catch {}
            try { const a = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFb2hkaWJycGxycHh6eHh4d3h4eHh5eHl5eXp6e3t8fX1+f3+AgYGCg4OEhIWFhYaGh4eIiImJioqKi4uMjIyNjY2Ojo+PkJCQkZGRkpKSk5OTlJSUlZWVlpaWl5eXmJiYmZmZmpqam5ubnJycnZ2dnp6en5+foKCgoaGhoqKio6OjpKSkpaWlpqamp6enqKioqampqqqqq6urrKysra2trq6ur6+vsLCwsbGxsrKys7OztLS0tbW1tra2t7e3uLi4ubm5urq6u7u7vLy8vb29vr6+v7+/wMDAwcHBwsLCw8PDxMTExcXFxsbGx8fHyMjIycnJysrKy8vLzMzMzc3Nzs7Oz8/P0NDQ0dHR0tLS09PT1NTU1dXV1tbW19fX2NjY2dnZ2tra29vb3Nzc3d3d3t7e39/f4ODg4eHh4uLi4+Pj5OTk5eXl5ubm5+fn6Ojo6enp6urq6+vr7Ozs7e3t7u7u7+/v8PDw8fHx8vLy8/Pz9PT09fX19vb29/f3+Pj4+fn5+vr6+/v7/Pz8/f39/v7+/w=="); a.volume = 0.4; a.play().catch(() => {}); } catch {}
          }
          lastMsgCountRef.current = now;
          setMessages(d.messages);
        }
      } catch {}
    };
    poll();
    const t = setInterval(poll, 3000);
    return () => clearInterval(t);
  }, [active, user]);

  // Typing indicator: poll who's typing in the active thread
  useEffect(() => {
    if (!activeConversation || !user) return;
    const poll = async () => {
      try {
        const res = await fetch(`/api/chat/typing?conversationId=${encodeURIComponent(activeConversation.id)}&userId=${encodeURIComponent(user.id)}`);
        const d = await res.json().catch(() => ({}));
        setTypingUsers(d.typing || []);
      } catch {}
    };
    poll();
    const t = setInterval(poll, 2500);
    return () => clearInterval(t);
  }, [active, user]);

  // Incoming call polling (ring UI)
  useEffect(() => {
    if (!user || activeCall) return;
    const poll = async () => {
      try {
        const res = await fetch(`/api/chat/calls?userId=${encodeURIComponent(user.id)}`);
        const d = await res.json().catch(() => ({}));
        const ringing = (d.calls || []).find((c: IncomingCallData["call"]) => c.status === "ringing" && c.callee_id === user.id);
        if (ringing && !incomingCall) {
          // find the caller's user
          const caller = suggestions.find(s => s.id === ringing.caller_id) || activeConversation?.otherUser;
          if (caller) setIncomingCall({ call: ringing, peer: caller });
        }
      } catch {}
    };
    poll();
    const t = setInterval(poll, 2000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeCall, incomingCall]);

  const openConversation = async (conv: Conversation) => {
    setActive(conv);
    if (!user) return;
    const res = await fetch(`/api/chat/messages?conversationId=${encodeURIComponent(conv.id)}&userId=${encodeURIComponent(user.id)}`);
    const d = await res.json().catch(() => ({}));
    setMessages(d.messages || []);
    setConversations(cs => cs.map(c => c.id === conv.id ? { ...c, unread: 0 } : c));
  };

  const startNewChat = async (otherUserId: string) => {
    if (!user) return;
    const res = await fetch("/api/chat/conversations", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, otherUserId }),
    });
    const d = await res.json().catch(() => ({}));
    if (d.conversationId) {
      const other = suggestions.find(s => s.id === otherUserId);
      if (other) {
        const conv: Conversation = { id: d.conversationId, type: "direct", name: other.name, otherUser: other, lastMessage: null, unread: 0, streak: 0, streakEmoji: "", vanish: false, updatedAt: new Date().toISOString() };
        setActive(conv); setMessages([]);
      }
    }
  };

  const send = async (opts?: { mediaUrl?: string; mediaType?: string; text?: string }) => {
    const isLocation = opts?.mediaType === "location";
    if (!draft.trim() && !opts?.mediaUrl && !isLocation) return;
    if (!activeConversation || !user) return;
    const bodyText = opts?.text || draft.trim() || (isLocation ? "📍 Location" : undefined);
    setSending(true);
    try {
      await fetch("/api/chat/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConversation.id, senderId: user.id,
          text: bodyText,
          mediaUrl: isLocation ? null : opts?.mediaUrl, mediaType: isLocation ? "location" : opts?.mediaType,
          replyTo: replyTarget?.id,
        }),
      });
      setMessages(ms => [...ms, {
        id: "local_" + Date.now(), senderId: user.id,
        text: bodyText || "",
        mediaUrl: isLocation ? null : opts?.mediaUrl || null,
        mediaType: isLocation ? "location" : opts?.mediaType || null,
        replyTo: replyTarget?.id || null, reactions: {}, vanish: activeConversation.vanish,
        fromMe: true, createdAt: new Date().toISOString(),
      }]);
      setDraft(""); setReplyTarget(null);
    } catch {}
    setSending(false);
  };

  // Snap reply media
  const handleSnapFile = (file: File | undefined) => {
    if (!file) return;
    const type = file.type.startsWith("video") ? "video" : "image";
    if (type === "video" && file.size > MAX_SNAP_MB * 1024 * 1024) { alert("Video too large (max 2.5MB)."); return; }
    const reader = new FileReader();
    reader.onload = () => {
      if (type === "image") {
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(1, 1000 / Math.max(img.width, img.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(img.width * scale); canvas.height = Math.round(img.height * scale);
          canvas.getContext("2d")!.drawImage(img, 0, 0);
          send({ mediaUrl: canvas.toDataURL("image/jpeg", 0.8), mediaType: "image" });
        };
        img.src = String(reader.result);
      } else {
        send({ mediaUrl: String(reader.result), mediaType: "video" });
      }
    };
    reader.readAsDataURL(file);
  };

  // Voice note
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      rec.ondataavailable = e => chunks.push(e.data);
      rec.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onload = () => send({ mediaUrl: String(reader.result), mediaType: "audio" });
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      rec.start();
      mediaRecorderRef.current = rec;
      setRecording(true);
      setRecordingSec(0);
      const iv = setInterval(() => setRecordingSec(s => s + 1), 1000);
      setTimeout(() => { stopRecording(); clearInterval(iv); }, 60000);
    } catch { alert("Microphone access denied."); }
  };
  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
    setRecording(false);
  };

  // Reactions
  const toggleReaction = async (msgId: string, emoji: string) => {
    if (!user) return;
    const res = await fetch("/api/chat/reaction", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId: msgId, userId: user.id, emoji }),
    });
    const d = await res.json().catch(() => ({}));
    if (d.reactions) setMessages(ms => ms.map(m => (m.id === msgId ? { ...m, reactions: d.reactions } : m)));
  };

  // Vanish toggle
  const toggleVanish = async () => {
    if (!activeConversation || !user) return;
    const on = !activeConversation.vanish;
    await fetch("/api/chat/vanish", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: activeConversation.id, userId: user.id, on }),
    });
    setActive(a => a ? { ...a, vanish: on } : a);
    setConversations(cs => cs.map(c => c.id === activeConversation.id ? { ...c, vanish: on } : c));
  };

  // Group creation
  const createGroup = async () => {
    if (!user || groupMembers.size === 0) return;
    const res = await fetch("/api/chat/group", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creatorId: user.id, name: groupName, memberIds: Array.from(groupMembers) }),
    });
    const d = await res.json().catch(() => ({}));
    if (d.conversationId) { setShowNewGroup(false); setGroupName(""); setGroupMembers(new Set()); loadConversations(); }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeConversation]);

  // Broadcast typing (throttled)
  const broadcastTyping = (isTyping: boolean) => {
    if (!activeConversation || !user) return;
    fetch("/api/chat/typing", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: activeConversation.id, userId: user.id, isTyping }),
    }).catch(() => {});
  };
  const onDraftChange = (v: string) => {
    setDraft(v);
    if (v.trim() && activeConversation && user) {
      if (!typingRef.current) {
        broadcastTyping(true);
        typingRef.current = setTimeout(() => { broadcastTyping(false); typingRef.current = null; }, 3000);
      }
    }
  };

  // Start a call
  const startCall = async (type: "audio" | "video") => {
    if (!activeConversation || !user || activeConversation.type !== "direct" || !activeConversation.otherUser) return;
    const res = await fetch("/api/chat/calls", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: activeConversation.id, callerId: user.id, calleeId: activeConversation.otherUser.id, type }),
    });
    const d = await res.json().catch(() => ({}));
    if (d.callId) setActiveCall({ id: d.callId, type, role: "caller" });
  };

  const renderMessage = (m: ChatMessage) => {
    const replied = m.replyTo ? messages.find(x => x.id === m.replyTo) : null;
    return (
      <div key={m.id} className={`flex ${m.fromMe ? "justify-end" : "justify-start"} group`}>
        <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm ${m.fromMe ? "rounded-br-md bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 text-gd-text-inverse" : "rounded-bl-md bg-gd-elevated text-gd-text-primary"}`}>
          {replied && (
            <div className={`mb-1 rounded-lg px-2 py-1 text-xs ${m.fromMe ? "bg-black/15 text-white/80" : "bg-gd-deepest/40 text-gd-text-muted"}`}>
              <p className="truncate">{replied.mediaUrl ? "📎 " + (replied.mediaType === "audio" ? "Voice note" : replied.mediaType) : replied.text}</p>
            </div>
          )}
          {m.mediaType === "image" && m.mediaUrl && (
            <img src={m.mediaUrl} alt="snap" className="mb-1 max-h-56 w-full rounded-xl object-cover" />
          )}
          {m.mediaType === "video" && m.mediaUrl && (
            <video src={m.mediaUrl} controls className="mb-1 max-h-56 w-full rounded-xl object-contain" />
          )}
          {m.mediaType === "audio" && m.mediaUrl && (
            <div className="flex items-center gap-2">
              <button onClick={() => {
                if (playingAudio === m.id) { audioRef.current?.pause(); setPlayingAudio(null); }
                else { audioRef.current?.pause(); const a = new Audio(m.mediaUrl!); a.play(); audioRef.current = a; setPlayingAudio(m.id); a.onended = () => setPlayingAudio(null); }
              }} className={`flex h-8 w-8 items-center justify-center rounded-full ${m.fromMe ? "bg-white/20 text-white" : "bg-gd-accent-500/10 text-gd-accent-400"}`}>
                {playingAudio === m.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <div className="flex items-end gap-0.5"><span className="h-1 w-0.5 rounded bg-current" /><span className="h-2 w-0.5 rounded bg-current" /><span className="h-3 w-0.5 rounded bg-current" /><span className="h-2 w-0.5 rounded bg-current" /><span className="h-1 w-0.5 rounded bg-current" /></div>
              <span className="text-xs opacity-70">Voice note</span>
            </div>
          )}
          {m.mediaType === "location" && (
            <div className="mb-1 flex items-center gap-2 rounded-xl border border-current/20 bg-black/10 p-2">
              <MapPin className="h-4 w-4" /> <span className="text-xs">{m.text || "Shared location"}</span>
            </div>
          )}
          {m.text && m.mediaType !== "location" && <p className="break-words">{m.text}</p>}
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className={`text-[10px] ${m.fromMe ? "text-gd-text-inverse/70" : "text-gd-text-muted"}`}>
              {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            {m.vanish && <span className="text-[9px] opacity-60">⏳ vanishes</span>}
          </div>
          {/* Reactions */}
          {Object.keys(m.reactions).length > 0 && (
            <div className={`mt-1 flex flex-wrap gap-1 ${m.fromMe ? "justify-end" : "justify-start"}`}>
              {Object.entries(m.reactions).filter(([, us]) => us.length > 0).map(([e, us]) => (
                <span key={e} className="flex items-center gap-0.5 rounded-full bg-black/15 px-1.5 py-0.5 text-[11px]">{e}{us.length > 1 ? us.length : ""}</span>
              ))}
            </div>
          )}
        </div>
        {/* Quick actions on hover */}
        <div className="flex flex-col justify-end gap-0.5 pl-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button onClick={() => setReplyTarget(m)} className="text-gd-text-muted hover:text-gd-text-primary" title="Reply"><ArrowLeft className="h-3.5 w-3.5 rotate-180" /></button>
          <button onClick={() => toggleReaction(m.id, "❤️")} className="text-gd-text-muted hover:text-gd-text-primary" title="React"><Smile className="h-3.5 w-3.5" /></button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full">
      <div className="mx-auto flex h-[calc(100dvh-4rem)] max-w-[935px]">
        {/* ── Conversation list ── */}
        <div className={`w-full flex-col border-r border-gd-border md:flex md:w-[350px] ${active ? "hidden" : "flex"}`}>
          <div className="flex items-center justify-between border-b border-gd-border px-4 py-4">
            <h2 className="text-xl font-bold text-gd-text-primary">{user?.name?.split(" ")[0]}</h2>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowNewGroup(true)} className="rounded-lg p-1.5 text-gd-text-secondary hover:bg-gd-elevated" title="New group">
                <Users className="h-5 w-5" />
              </button>
              <MessageCircle className="h-6 w-6 text-gd-text-secondary" />
            </div>
          </div>

          {/* New chat from suggestions */}
          <div className="border-b border-gd-border px-4 py-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gd-text-muted">New chat</p>
            <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {suggestions.slice(0, 6).map(s => (
                <button key={s.id} onClick={() => startNewChat(s.id)} className="flex w-14 flex-shrink-0 flex-col items-center gap-1">
                  <InstaAvatar user={s} size={52} />
                  <span className="w-full truncate text-center text-[10px] text-gd-text-secondary">{s.username}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-gd-text-muted" /></div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <MessageCircle className="h-10 w-10 text-gd-text-muted" />
                <p className="mt-3 text-sm text-gd-text-muted">No messages yet.</p>
                <p className="text-xs text-gd-text-muted">Tap a suggested user to start chatting.</p>
              </div>
            ) : (
              conversations.map(c => (
                <button key={c.id} onClick={() => openConversation(c)} className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${activeConversation?.id === c.id ? "bg-gd-elevated" : "hover:bg-gd-elevated/50"}`}>
                  <div className="relative">
                    {c.type === "group" ? (
                      <div className="flex h-[52px] w-[52px] flex-col items-center justify-center rounded-full bg-gd-accent-500/15 text-gd-accent-400">
                        <Users className="h-5 w-5" />
                      </div>
                    ) : (
                      <InstaAvatar user={c.otherUser!} size={52} />
                    )}
                    {c.streak > 0 && <span className="absolute -bottom-1 -right-1 text-base">{c.streakEmoji}</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="truncate text-sm font-semibold text-gd-text-primary">{c.type === "group" ? c.name : c.otherUser?.username}</p>
                      {c.lastMessage && <span className="ml-2 text-[10px] text-gd-text-muted">{new Date(c.lastMessage.createdAt).toLocaleDateString()}</span>}
                    </div>
                    <p className="truncate text-sm text-gd-text-secondary">
                      {c.lastMessage ? (c.lastMessage.fromMe ? "You: " : "") + c.lastMessage.text : c.type === "group" ? "Group chat started" : "Say hi 👋"}
                    </p>
                    {c.type === "group" && c.memberCount && <p className="text-[10px] text-gd-text-muted">{c.memberCount} members</p>}
                  </div>
                  {c.unread > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gd-accent-500 text-[10px] font-bold text-gd-text-inverse">{c.unread}</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── Thread ── */}
        <div className={`flex-1 flex-col ${activeConversation ? "flex" : "hidden md:flex"}`}>
          {!activeConversation ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-gd-border-strong bg-gd-elevated">
                <MessageCircle className="h-8 w-8 text-gd-text-muted" />
              </div>
              <p className="mt-4 text-lg font-semibold text-gd-text-primary">Your messages</p>
              <p className="mt-1 text-sm text-gd-text-muted">Select a conversation or start a new one</p>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="flex items-center gap-3 border-b border-gd-border px-4 py-3">
                <button onClick={() => setActive(null)} className="rounded-lg p-1.5 text-gd-text-secondary hover:bg-gd-elevated md:hidden">
                  <ArrowLeft className="h-5 w-5" />
                </button>
                {activeConversation.type === "direct" ? (
                  <Link href={`/feed/${activeConversation.otherUser?.username}`}>
                    <InstaAvatar user={activeConversation.otherUser!} size={40} />
                  </Link>
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gd-accent-500/15 text-gd-accent-400"><Users className="h-5 w-5" /></div>
                )}
                <div className="min-w-0 flex-1">
                  <Link href={activeConversation.type === "direct" ? `/feed/${activeConversation.otherUser?.username}` : "#"} className="block truncate text-sm font-semibold text-gd-text-primary hover:opacity-80">
                    {activeConversation.type === "direct" ? activeConversation.otherUser?.username : activeConversation.name}
                  </Link>
                  <p className="flex items-center gap-1 text-xs">
                    {typingUsers.length > 0 ? (
                      <span className="text-gd-olive-400">typing<span className="animate-pulse">…</span></span>
                    ) : (active?.streak ?? 0) > 0 ? (
                      <><span>{activeConversation.streakEmoji}</span> <span className="text-gd-accent-400">{streakLabel(activeConversation.streak)}</span></>
                    ) : (
                      <span className="text-gd-text-muted">Active now</span>
                    )}
                  </p>
                </div>
                {/* Call buttons */}
                {activeConversation.type === "direct" && (
                  <>
                    <button onClick={() => startCall("audio")} className="rounded-lg p-2 text-gd-text-secondary hover:bg-gd-elevated hover:text-gd-text-primary" title="Voice call">
                      <Phone className="h-5 w-5" />
                    </button>
                    <button onClick={() => startCall("video")} className="rounded-lg p-2 text-gd-text-secondary hover:bg-gd-elevated hover:text-gd-text-primary" title="Video call">
                      <Video className="h-5 w-5" />
                    </button>
                  </>
                )}
                {/* Vanish toggle */}
                <button onClick={toggleVanish} className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${activeConversation.vanish ? "border-gd-danger/30 bg-gd-danger/10 text-gd-danger" : "border-gd-border text-gd-text-secondary hover:border-gd-border-strong"}`} title="Vanish mode (Snapchat-style)">
                  ⏳ {activeConversation.vanish ? "Vanish ON" : "Vanish"}
                </button>
                <button className="rounded-lg p-1.5 text-gd-text-secondary hover:bg-gd-elevated"><MoreHorizontal className="h-5 w-5" /></button>
              </div>

              {/* Messages */}
              <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
                {messages.map(renderMessage)}
                <div ref={bottomRef} />
              </div>

              {/* Reply target bar */}
              {replyTarget && (
                <div className="flex items-center gap-2 border-t border-gd-border bg-gd-elevated/50 px-4 py-2">
                  <p className="flex-1 truncate text-xs text-gd-text-secondary">
                    Replying to: <span className="text-gd-text-primary">{replyTarget.mediaUrl ? "📎 " + replyTarget.mediaType : replyTarget.text}</span>
                  </p>
                  <button onClick={() => setReplyTarget(null)} className="text-gd-text-muted hover:text-gd-text-primary"><X className="h-4 w-4" /></button>
                </div>
              )}

              {/* Composer */}
              <div className="border-t border-gd-border px-4 py-3">
                <div className="flex items-center gap-1.5">
                  {/* Snap media */}
                  <button onClick={() => { setMediaType("image"); fileInputRef.current?.click(); }} className="rounded-full p-2 text-gd-text-muted hover:bg-gd-elevated hover:text-gd-text-primary" title="Send photo">
                    <ImageIcon className="h-5 w-5" />
                  </button>
                  <button onClick={() => { setMediaType("video"); fileInputRef.current?.click(); }} className="rounded-full p-2 text-gd-text-muted hover:bg-gd-elevated hover:text-gd-text-primary" title="Send video">
                    <Video className="h-5 w-5" />
                  </button>
                  <button onClick={recording ? stopRecording : startRecording} className={`rounded-full p-2 transition-colors ${recording ? "bg-gd-danger/15 text-gd-danger" : "text-gd-text-muted hover:bg-gd-elevated hover:text-gd-text-primary"}`} title="Voice note">
                    <Mic className="h-5 w-5" />
                  </button>
                  <button onClick={() => setShowLocation(true)} className="rounded-full p-2 text-gd-text-muted hover:bg-gd-elevated hover:text-gd-text-primary" title="Share location">
                    <MapPin className="h-5 w-5" />
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={mediaType === "image" ? "image/*" : "video/*"}
                    className="hidden"
                    onChange={e => handleSnapFile(e.target.files?.[0])}
                  />

                  {recording ? (
                    <span className="flex items-center gap-1.5 px-2 text-sm font-medium text-gd-danger">● Recording {recordingSec}s</span>
                  ) : (
                    <input
                      value={draft}
                      onChange={e => onDraftChange(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { send(); broadcastTyping(false); } }}
                      placeholder={activeConversation.vanish ? "Message (will vanish)..." : "Message..."}
                      className="flex-1 rounded-full border border-gd-border bg-gd-elevated px-4 py-2 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none focus:border-gd-accent-500/40"
                    />
                  )}
                  <button
                    onClick={() => send()}
                    disabled={sending || (!draft.trim() && !recording)}
                    className="rounded-full bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 p-2.5 text-gd-text-inverse hover:brightness-110 transition-all disabled:opacity-40"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                {/* Eco reactions quick row */}
                <div className="mt-2 flex gap-1">
                  {ECO_REACTIONS.map(e => (
                    <button key={e} onClick={() => active && messages.length > 0 && toggleReaction(messages[messages.length - 1].id, e)} className="rounded-lg px-1.5 py-0.5 text-base opacity-70 hover:opacity-100 hover:bg-gd-elevated transition-all" title={`React ${e}`}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Location picker */}
      {showLocation && (
        <LocationPicker
          value=""
          onSelect={loc => { send({ mediaUrl: "", mediaType: "location", text: loc }); setShowLocation(false); }}
          onClose={() => setShowLocation(false)}
        />
      )}

      {/* New group modal */}
      {showNewGroup && (
        <>
          <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm" onClick={() => setShowNewGroup(false)} />
          <div className="fixed inset-0 z-[75] flex items-center justify-center p-4">
            <div className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-gd-border-soft bg-gd-card shadow-2xl">
              <div className="flex items-center justify-between border-b border-gd-border px-5 py-3">
                <h3 className="text-base font-semibold text-gd-text-primary">New group chat</h3>
                <button onClick={() => setShowNewGroup(false)} className="rounded-lg p-1.5 text-gd-text-muted hover:text-gd-text-primary"><X className="h-5 w-5" /></button>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                <input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="Group name" className="w-full rounded-xl border border-gd-border bg-gd-elevated px-3.5 py-2.5 text-sm text-gd-text-primary outline-none focus:border-gd-accent-500/40" />
                <p className="text-xs font-semibold uppercase tracking-wide text-gd-text-muted">Add members</p>
                <div className="space-y-1">
                  {suggestions.slice(0, 8).map(s => (
                    <button key={s.id} onClick={() => setGroupMembers(p => { const n = new Set(p); n.has(s.id) ? n.delete(s.id) : n.add(s.id); return n; })} className="flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left hover:bg-gd-elevated transition-colors">
                      <InstaAvatar user={s} size={32} />
                      <span className="min-w-0 flex-1 truncate text-sm text-gd-text-primary">{s.username}</span>
                      {groupMembers.has(s.id) && <Check className="h-4 w-4 text-gd-accent-400" />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="border-t border-gd-border p-3">
                <button onClick={createGroup} disabled={groupMembers.size === 0} className="w-full rounded-xl bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 py-2.5 text-sm font-semibold text-gd-text-inverse hover:brightness-110 disabled:opacity-40">
                  Create group ({groupMembers.size} member{groupMembers.size === 1 ? "" : "s"})
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Active call (caller or answered callee) */}
      {activeCall && activeConversation?.otherUser && (
        <CallOverlay
          conversationId={activeConversation.id}
          peer={activeConversation.otherUser}
          callType={activeCall.type}
          role={activeCall.role}
          callId={activeCall.id}
          incoming={false}
          onEnd={() => setActiveCall(null)}
        />
      )}

      {/* Incoming call ring */}
      {incomingCall && !activeCall && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/90 p-6">
          <div className="flex flex-col items-center gap-6 text-center">
            <InstaAvatar user={incomingCall.peer} size={120} />
            <div>
              <p className="text-xl font-bold text-white">{incomingCall.peer.name}</p>
              <p className="mt-1 text-sm text-white/60">Incoming {incomingCall.call.type} call...</p>
            </div>
            <div className="flex items-center gap-6">
              <button
                onClick={async () => {
                  try {
                    await fetch("/api/chat/calls", {
                      method: "PATCH", headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ callId: incomingCall.call.id, action: "decline", userId: user?.id }),
                    });
                  } catch {}
                  setIncomingCall(null);
                }}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-all"
              >
                <PhoneOff className="h-7 w-7" />
              </button>
              <button
                onClick={() => {
                  setActiveCall({ id: incomingCall.call.id, type: incomingCall.call.type, role: "callee" });
                  setIncomingCall(null);
                }}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500 text-white hover:bg-green-600 transition-all"
              >
                <Phone className="h-7 w-7" />
              </button>
            </div>
            <p className="text-xs text-white/40">Answer with the green button</p>
          </div>
        </div>
      )}

      {/* Request notification permission once (for message alerts) */}
      {user && typeof Notification !== "undefined" && Notification.permission === "default" && (
        <button
          onClick={() => Notification.requestPermission()}
          className="fixed bottom-20 left-1/2 z-[60] -translate-x-1/2 rounded-full border border-gd-accent-500/30 bg-gd-card px-4 py-2 text-xs font-medium text-gd-accent-400 shadow-xl"
        >
          <Bell className="mr-1 inline h-3.5 w-3.5" /> Enable message notifications
        </button>
      )}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gd-text-muted" />
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
}
