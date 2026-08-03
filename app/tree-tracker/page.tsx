"use client";
import { useEffect, useRef, useState } from "react";
import anime from "animejs";
import { TreeCounter } from "@/components/tree-tracker/TreeCounter";
import { AnimeWrapper } from "@/components/ui/AnimeWrapper";
import { Card } from "@/components/ui/Card";
import { Heart, HandHeart, Trees, Droplets } from "lucide-react";

export default function TreeTrackerPage() {
  const titleRef = useRef<HTMLDivElement>(null);
  const [showDonate, setShowDonate] = useState(false);
  useEffect(() => { if (titleRef.current) anime({ targets: titleRef.current, opacity: [0, 1], translateY: [20, 0], duration: 600, easing: "easeOutCubic" }); }, []);

  return (
    <div className="space-y-6">
      <AnimeWrapper animate="fadeIn">
        <div ref={titleRef} className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gd-text-primary tracking-tight">Tree Planting Tracker</h1>
            <p className="text-sm text-gd-text-secondary mt-1">Track reforestation, sign up for planting events, sponsor trees</p>
          </div>
          <button
            onClick={() => setShowDonate(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 px-4 py-2.5 text-sm font-semibold text-gd-text-inverse shadow-lg shadow-gd-accent-500/20 hover:shadow-gd-accent-500/40 hover:brightness-110 transition-all"
          >
            <Heart className="h-4 w-4" /> Sponsor Trees
          </button>
        </div>
      </AnimeWrapper>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2"><TreeCounter /></div>
        <div className="space-y-4">
          <Card>
            <h3 className="font-semibold text-gd-text-primary mb-4 flex items-center gap-2">
              <Trees className="h-4 w-4 text-gd-olive-400" /> Why Plant Trees?
            </h3>
            <div className="space-y-3 text-sm text-gd-text-secondary">
              <p className="flex items-center gap-2"><span className="text-base">🌳</span> 1 tree absorbs ~48 lbs CO₂/year</p>
              <p className="flex items-center gap-2"><span className="text-base">💧</span> Trees reduce water runoff by 30%</p>
              <p className="flex items-center gap-2"><span className="text-base">🌱</span> Forests host 80% of biodiversity</p>
            </div>
          </Card>
          <Card>
            <h3 className="font-semibold text-gd-text-primary mb-4 flex items-center gap-2">
              <Droplets className="h-4 w-4 text-gd-accent-400" /> Your Impact
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gd-text-muted uppercase tracking-wider">Trees Planted by You</p>
                <p className="text-2xl font-bold text-gd-text-primary">12</p>
              </div>
              <div>
                <p className="text-xs text-gd-text-muted uppercase tracking-wider">Events Attended</p>
                <p className="text-2xl font-bold text-gd-text-primary">5</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Donation modal */}
      {showDonate && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setShowDonate(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl bg-gd-card border border-gd-border-soft p-6 shadow-2xl shadow-black/40" onClick={e => e.stopPropagation()}>
              <div className="text-center mb-6">
                <Heart className="mx-auto h-10 w-10 text-gd-accent-400" />
                <h3 className="mt-3 text-lg font-semibold text-gd-text-primary">Sponsor Trees</h3>
                <p className="text-sm text-gd-text-secondary mt-1">$5 plants one tree.</p>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex gap-2">
                  {["$10","$25","$50","$100"].map(a => (
                    <button key={a} className="flex-1 rounded-xl border border-gd-border bg-gd-elevated py-3 text-sm font-medium text-gd-text-secondary hover:border-gd-accent-500/40 hover:text-gd-accent-400 transition-all">{a}</button>
                  ))}
                </div>
                <input placeholder="Custom amount" className="w-full rounded-xl border border-gd-border bg-gd-elevated px-3.5 py-2.5 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none focus:border-gd-accent-500/40 transition-colors" />
                <input placeholder="Your name" className="w-full rounded-xl border border-gd-border bg-gd-elevated px-3.5 py-2.5 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none focus:border-gd-accent-500/40 transition-colors" />
                <input placeholder="Your email" className="w-full rounded-xl border border-gd-border bg-gd-elevated px-3.5 py-2.5 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none focus:border-gd-accent-500/40 transition-colors" />
              </div>
              <button className="w-full rounded-xl bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 py-3 text-sm font-semibold text-gd-text-inverse hover:brightness-110 transition-all shadow-lg shadow-gd-accent-500/20">
                <HandHeart className="h-4 w-4 inline mr-1.5" /> Plant Trees Now
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
