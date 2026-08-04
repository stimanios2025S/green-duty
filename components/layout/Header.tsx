"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bell, Search, X, Menu, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { ROLE_LABEL } from "@/lib/nav-config";

interface ApiNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: number;
  created_at: string;
}

export function Header() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const type = user?.accountType || "guest";
  const roleLabel = ROLE_LABEL[type] || "Guest";

  useEffect(() => {
    if (!user?.id || !showNotifications) return;
    setLoading(true);
    fetch(`/api/notifications?userId=${encodeURIComponent(user.id)}`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d) setNotifications(d.notifications || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id, showNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = async () => {
    if (!user) return;
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });
    setNotifications(ns => ns.map(n => ({ ...n, read: 1 })));
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-gd-border bg-gd-card/80 backdrop-blur-xl px-6">
      <div className="flex items-center gap-4">
        <Link href="/" className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-lg bg-gd-card ring-1 ring-gd-border-strong lg:hidden">
          <Image src="/logo.png" alt="GreenDuty" fill sizes="32px" className="object-contain p-0.5" />
        </Link>
        <button className="lg:hidden rounded-xl p-2 text-gd-text-muted hover:text-gd-text-secondary hover:bg-gd-elevated transition-colors" onClick={() => setShowMobileMenu(!showMobileMenu)}>
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden sm:flex items-center gap-2 rounded-xl border border-gd-border bg-gd-elevated/50 px-3.5 py-2 transition-colors focus-within:border-gd-accent-500/40 focus-within:ring-1 focus-within:ring-gd-accent-500/20">
          <Search className="h-4 w-4 text-gd-text-muted" />
          <input type="text" placeholder="Search..." className="w-56 bg-transparent text-sm text-gd-text-primary placeholder-gd-text-muted outline-none" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 rounded-xl bg-gd-accent-500/10 border border-gd-accent-500/15 px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-gd-accent-400 animate-pulse"></span>
          <span className="text-xs font-medium text-gd-accent-400">{roleLabel}</span>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-xl p-2 text-gd-text-muted hover:text-gd-text-secondary hover:bg-gd-elevated transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gd-ember-500 text-[10px] font-bold text-white shadow-md shadow-gd-ember-500/30">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
              <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-gd-border-soft bg-gd-card shadow-2xl shadow-black/40 glass-strong overflow-hidden">
                <div className="flex items-center justify-between border-b border-gd-border px-4 py-3">
                  <h3 className="font-semibold text-gd-text-primary">Notifications</h3>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-[11px] font-medium text-gd-accent-400 hover:text-gd-accent-300 transition-colors">
                        Mark all read
                      </button>
                    )}
                    <button onClick={() => setShowNotifications(false)} className="rounded-lg p-1 hover:bg-gd-elevated text-gd-text-muted">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-gd-text-muted" /></div>
                  ) : notifications.length === 0 ? (
                    <p className="py-10 text-center text-sm text-gd-text-muted">No notifications yet.</p>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className={cn(
                        "border-b border-gd-border px-4 py-3 hover:bg-gd-elevated/50 transition-colors",
                        !n.read && "bg-gd-accent-500/5"
                      )}>
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "mt-0.5 h-2.5 w-2.5 flex-shrink-0 rounded-full",
                            n.type === 'event' ? 'bg-blue-500' :
                            n.type === 'reward' ? 'bg-gd-accent-400' :
                            n.type === 'order' ? 'bg-purple-500' :
                            'bg-gd-olive-500'
                          )} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gd-text-primary">{n.title}</p>
                            <p className="text-xs text-gd-text-secondary mt-0.5">{n.message}</p>
                            <p className="text-[10px] text-gd-text-muted mt-1.5">{timeAgo(n.created_at)}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <Link
          href="/dashboard"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-gd-accent-500 to-gd-ember-500 text-gd-text-inverse text-xs font-bold shadow-md shadow-gd-accent-500/20 transition-transform hover:scale-105"
          title={user?.name || "My Portal"}
        >
          {user?.name?.charAt(0)?.toUpperCase() || "G"}
        </Link>
      </div>
    </header>
  );
}
