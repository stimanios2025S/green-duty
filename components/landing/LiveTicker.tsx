"use client";
import { useEffect, useState } from "react";
import { Activity } from "lucide-react";

/**
 * High-tech live ticker: a scrolling marquee of real platform statistics.
 * Values refresh every 30s from /api/stats — all numbers are real.
 */
export function LiveTicker() {
  const [items, setItems] = useState<string[]>([]);
  const [live, setLive] = useState(false);

  const refresh = () => {
    fetch("/api/stats")
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (!d) return;
        setLive(true);
        const n = (v: number) => v.toLocaleString();
        setItems([
          `🌳 ${n(d.trees || 0)} trees planted`,
          `📢 ${n(d.hotspots || 0)} hotspots reported`,
          `🧹 ${n(d.cleanups || 0)} cleanups organized`,
          `🤝 ${n(d.volunteers || 0)} volunteers joined`,
          `✅ ${n(d.hotspotsResolved || 0)} hotspots resolved`,
          `👥 ${n(d.users || 0)} community members`,
          `💬 ${n(d.posts || 0)} InstaGro posts`,
          `💳 $${(d.revenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} verified commerce`,
          `📦 ${n(d.orders || 0)} marketplace orders`,
          `🏆 ${n(d.verifiedUsers || 0)} verified accounts`,
        ]);
      })
      .catch(() => {});
  };

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 30000);
    return () => clearInterval(t);
  }, []);

  if (items.length === 0) return null;

  // Duplicate the list for a seamless -50% marquee loop
  const doubled = [...items, ...items];

  return (
    <div className="relative overflow-hidden border-y border-gd-border-soft bg-gd-deepest/95">
      <div className="absolute left-0 top-0 z-10 flex h-full items-center gap-2 bg-gradient-to-r from-gd-deepest via-gd-deepest/80 to-transparent px-4 pr-10">
        <span className="flex items-center gap-1.5 rounded-full border border-gd-accent-500/20 bg-gd-accent-500/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-gd-accent-400">
          <Activity className="h-3 w-3" />
          {live ? <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-gd-success animate-pulse shadow-[0_0_6px_rgba(34,197,94,0.8)]" />Live</span> : "Stats"}
        </span>
      </div>
      <div className="animate-marquee flex w-max items-center gap-10 py-3 pl-40">
        {doubled.map((item, i) => (
          <span key={i} className="whitespace-nowrap text-xs font-medium text-gd-text-secondary">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
