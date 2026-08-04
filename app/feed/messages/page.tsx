"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MessageCircle, Send, ArrowLeft, Loader2, MoreHorizontal } from "lucide-react";
import { InstaAvatar } from "@/components/instagro/InstaAvatar";
import { useAuth } from "@/lib/auth-context";
import { useInsta } from "@/lib/instagro-store";
import { ApiUser } from "@/lib/instagro-api";

interface Conversation {
  id: string;
  otherUser: ApiUser;
  lastMessage: { text: string; fromMe: boolean; createdAt: string } | null;
  unread: number;
  updatedAt: string;
}
interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  fromMe: boolean;
  createdAt: string;
}

export default function MessagesPage() {
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

  // Keep activeRef in sync so the poll can read the current conversation
  useEffect(() => { activeRef.current = active; }, [active]);

  // Auto-open conversation from ?conv= param (e.g. from a profile "Message" button)
  useEffect(() => {
    if (!user) return;
    const convParam = searchParams.get("conv");
    if (convParam && conversations.length > 0) {
      const c = conversations.find(x => x.id === convParam);
      if (c) openConversation(c);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, searchParams, user]);

  // Initial load + live polling (every 4s) so new messages appear WITHOUT refresh
  const loadConversations = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/chat/conversations?userId=${encodeURIComponent(user.id)}`);
      const d = await res.json().catch(() => ({}));
      if (d.conversations) {
        setConversations(prev => {
          // keep the active conversation's unread at 0 (it's open)
          const activeId = activeRef.current?.id;
          return d.conversations.map((c: Conversation) =>
            c.id === activeId ? { ...c, unread: 0 } : c
          );
        });
      }
    } catch {}
  }, [user]);

  useEffect(() => {
    if (!user) { router.replace("/login"); return; }
    loadConversations().finally(() => setLoading(false));
    const t = setInterval(loadConversations, 4000);
    return () => clearInterval(t);
  }, [user, router, loadConversations]);

  // Live-poll the ACTIVE thread every 3s for new incoming messages
  useEffect(() => {
    if (!active || !user) return;
    const poll = async () => {
      try {
        const res = await fetch(`/api/chat/messages?conversationId=${encodeURIComponent(active.id)}&userId=${encodeURIComponent(user.id)}`);
        const d = await res.json().catch(() => ({}));
        if (d.messages) setMessages(d.messages);
      } catch {}
    };
    const t = setInterval(poll, 3000);
    return () => clearInterval(t);
  }, [active, user]);

  const openConversation = async (conv: Conversation) => {
    setActive(conv);
    if (!user) return;
    const res = await fetch(`/api/chat/messages?conversationId=${encodeURIComponent(conv.id)}&userId=${encodeURIComponent(user.id)}`);
    const d = await res.json().catch(() => ({}));
    setMessages(d.messages || []);
    // clear unread locally
    setConversations(cs => cs.map(c => c.id === conv.id ? { ...c, unread: 0 } : c));
  };

  const startNewChat = async (otherUserId: string) => {
    if (!user) return;
    const res = await fetch("/api/chat/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, otherUserId }),
    });
    const d = await res.json().catch(() => ({}));
    if (d.conversationId) {
      // find the other user from suggestions and open the thread
      const other = suggestions.find(s => s.id === otherUserId);
      if (other) {
        const conv: Conversation = { id: d.conversationId, otherUser: other, lastMessage: null, unread: 0, updatedAt: new Date().toISOString() };
        setActive(conv);
        setMessages([]);
      }
    }
  };

  const send = async () => {
    if (!draft.trim() || !active || !user) return;
    setSending(true);
    try {
      await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: active.id, senderId: user.id, text: draft.trim() }),
      });
      setMessages(ms => [...ms, { id: "local_" + Date.now(), senderId: user.id, text: draft.trim(), fromMe: true, createdAt: new Date().toISOString() }]);
      setDraft("");
    } catch {}
    setSending(false);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, active]);

  return (
    <div className="h-full">
      <div className="mx-auto flex h-[calc(100dvh-4rem)] max-w-[935px]">
        {/* ── Conversation list ── */}
        <div className={`w-full flex-col border-r border-gd-border md:flex md:w-[350px] ${active ? "hidden" : "flex"}`}>
          <div className="flex items-center justify-between border-b border-gd-border px-4 py-4">
            <h2 className="text-xl font-bold text-gd-text-primary">{user?.name?.split(" ")[0]}</h2>
            <MessageCircle className="h-6 w-6 text-gd-text-secondary" />
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
                <p className="text-xs text-gd-text-muted">Tap a suggested user above to start chatting.</p>
              </div>
            ) : (
              conversations.map(c => (
                <button
                  key={c.id}
                  onClick={() => openConversation(c)}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${active?.id === c.id ? "bg-gd-elevated" : "hover:bg-gd-elevated/50"}`}
                >
                  <InstaAvatar user={c.otherUser} size={52} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="truncate text-sm font-semibold text-gd-text-primary">{c.otherUser.username}</p>
                      {c.lastMessage && <span className="ml-2 text-[10px] text-gd-text-muted">{new Date(c.lastMessage.createdAt).toLocaleDateString()}</span>}
                    </div>
                    <p className="truncate text-sm text-gd-text-secondary">
                      {c.lastMessage ? (c.lastMessage.fromMe ? "You: " : "") + c.lastMessage.text : "Say hi 👋"}
                    </p>
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
        <div className={`flex-1 flex-col ${active ? "flex" : "hidden md:flex"}`}>
          {!active ? (
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
                <Link href={`/feed/${active.otherUser.username}`}>
                  <InstaAvatar user={active.otherUser} size={40} />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/feed/${active.otherUser.username}`} className="block truncate text-sm font-semibold text-gd-text-primary hover:opacity-80">
                    {active.otherUser.username}
                  </Link>
                  <p className="text-xs text-gd-text-muted">Active now</p>
                </div>
                <button className="rounded-lg p-1.5 text-gd-text-secondary hover:bg-gd-elevated"><MoreHorizontal className="h-5 w-5" /></button>
              </div>

              {/* Messages */}
              <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
                {messages.map(m => (
                  <div key={m.id} className={`flex ${m.fromMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${m.fromMe ? "rounded-br-md bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 text-gd-text-inverse" : "rounded-bl-md bg-gd-elevated text-gd-text-primary"}`}>
                      <p className="break-words">{m.text}</p>
                      <p className={`mt-0.5 text-[10px] ${m.fromMe ? "text-gd-text-inverse/70" : "text-gd-text-muted"}`}>
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="border-t border-gd-border px-4 py-3">
                <div className="flex items-center gap-2 rounded-full border border-gd-border bg-gd-elevated px-4 py-2">
                  <input
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") send(); }}
                    placeholder="Message..."
                    className="flex-1 bg-transparent text-sm text-gd-text-primary placeholder-gd-text-muted outline-none"
                  />
                  <button
                    onClick={send}
                    disabled={sending || !draft.trim()}
                    className="text-sm font-semibold text-gd-accent-400 hover:text-gd-accent-300 transition-colors disabled:opacity-40"
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
