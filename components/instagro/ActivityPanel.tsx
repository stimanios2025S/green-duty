"use client";
import { useState, useEffect } from "react";
import { X, Heart, MessageCircle, ShoppingBag, Star, Bell, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface Activity {
  id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
}

const ICONS: Record<string, any> = {
  event: Heart,
  order: ShoppingBag,
  post: MessageCircle,
  reward: Star,
  system: Bell,
};

export function ActivityPanel({ isOpen, onClose }: Props) {
  const { user } = useAuth();
  const [items, setItems] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !user) return;
    setLoading(true);
    fetch(`/api/notifications?userId=${encodeURIComponent(user.id)}`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d) setItems(d.notifications || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOpen, user]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[75] flex items-start justify-center p-4 pt-16" onClick={e => e.stopPropagation()}>
        <div className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-gd-border-soft bg-gd-card shadow-2xl shadow-black/50">
          <div className="flex items-center justify-between border-b border-gd-border px-5 py-3">
            <h3 className="text-base font-semibold text-gd-text-primary">Activity</h3>
            <button onClick={onClose} className="rounded-lg p-1.5 text-gd-text-muted hover:text-gd-text-primary transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 space-y-1 overflow-y-auto p-2">
            {loading ? (
              <div className="flex items-center justify-center py-14"><Loader2 className="h-6 w-6 animate-spin text-gd-text-muted" /></div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <Bell className="h-10 w-10 text-gd-text-muted" />
                <p className="mt-3 text-sm text-gd-text-muted">No activity yet.</p>
                <p className="text-xs text-gd-text-muted">Likes, comments, messages and rewards will show here.</p>
              </div>
            ) : (
              items.map(a => {
                const Icon = ICONS[a.type] || Bell;
                return (
                  <div key={a.id} className="flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-gd-elevated transition-colors">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gd-accent-500/10">
                      <Icon className="h-4 w-4 text-gd-accent-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gd-text-primary">{a.title}</p>
                      <p className="text-xs text-gd-text-secondary mt-0.5">{a.message}</p>
                      <p className="mt-1 text-[10px] text-gd-text-muted">{new Date(a.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}
