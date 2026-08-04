"use client";
import { useEffect, useRef, useState } from "react";
import anime from "animejs";
import { TreeCounter } from "@/components/tree-tracker/TreeCounter";
import { AnimeWrapper } from "@/components/ui/AnimeWrapper";
import { Card } from "@/components/ui/Card";
import { Heart, HandHeart, Trees, Droplets, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function TreeTrackerPage() {
  const { user } = useAuth();
  const titleRef = useRef<HTMLDivElement>(null);
  const [showDonate, setShowDonate] = useState(false);
  const [amount, setAmount] = useState("25");
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [donating, setDonating] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { if (titleRef.current) anime({ targets: titleRef.current, opacity: [0, 1], translateY: [20, 0], duration: 600, easing: "easeOutCubic" }); }, []);

  const donate = async () => {
    setError("");
    const amt = Number(amount);
    if (!amt || amt <= 0) { setError("Enter a valid amount."); return; }
    if (user && !name.trim()) { setError("Please enter your name."); return; }
    setDonating(true);
    try {
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id || null, amount: amt, name: name.trim(), email: email.trim() }),
      });
      if (!res.ok) throw new Error();
      setDone(true);
      setTimeout(() => { setDone(false); setShowDonate(false); }, 2000);
    } catch {
      setError("Donation failed. Please try again.");
    } finally {
      setDonating(false);
    }
  };

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
              <Droplets className="h-4 w-4 text-gd-accent-400" /> Donation Impact
            </h3>
            <p className="text-sm text-gd-text-secondary leading-relaxed">
              <span className="font-semibold text-gd-accent-400">$5 plants 1 tree.</span> Every tree you sponsor is tracked in real-time and counted toward the community goal.
            </p>
          </Card>
        </div>
      </div>

      {/* Donation modal */}
      {showDonate && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setShowDonate(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl bg-gd-card border border-gd-border-soft p-6 shadow-2xl shadow-black/40" onClick={e => e.stopPropagation()}>
              {done ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <CheckCircle2 className="h-14 w-14 text-gd-success" />
                  <p className="mt-4 text-lg font-semibold text-gd-text-primary">Thank you! 🌳</p>
                  <p className="mt-1 text-sm text-gd-text-muted">{Math.floor(Number(amount) / 5)} tree(s) sponsored.</p>
                </div>
              ) : (
                <>
                  <div className="text-center mb-6">
                    <Heart className="mx-auto h-10 w-10 text-gd-accent-400" />
                    <h3 className="mt-3 text-lg font-semibold text-gd-text-primary">Sponsor Trees</h3>
                    <p className="text-sm text-gd-text-secondary mt-1">$5 plants one tree.</p>
                  </div>
                  <div className="space-y-3 mb-6">
                    <div className="flex gap-2">
                      {["$10","$25","$50","$100"].map(a => (
                        <button
                          key={a}
                          onClick={() => setAmount(a.replace("$", ""))}
                          className={`flex-1 rounded-xl border py-3 text-sm font-medium transition-all ${
                            amount === a.replace("$", "")
                              ? "border-gd-accent-500/50 bg-gd-accent-500/10 text-gd-accent-400"
                              : "border-gd-border bg-gd-elevated text-gd-text-secondary hover:border-gd-accent-500/40"
                          }`}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                    <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="Custom amount" className="w-full rounded-xl border border-gd-border bg-gd-elevated px-3.5 py-2.5 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none focus:border-gd-accent-500/40 transition-colors" />
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" className="w-full rounded-xl border border-gd-border bg-gd-elevated px-3.5 py-2.5 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none focus:border-gd-accent-500/40 transition-colors" />
                    <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Your email" className="w-full rounded-xl border border-gd-border bg-gd-elevated px-3.5 py-2.5 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none focus:border-gd-accent-500/40 transition-colors" />
                  </div>
                  {error && <p className="mb-3 rounded-xl border border-gd-danger/20 bg-gd-danger/5 px-4 py-2.5 text-xs text-gd-danger">{error}</p>}
                  <button
                    onClick={donate}
                    disabled={donating}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 py-3 text-sm font-semibold text-gd-text-inverse hover:brightness-110 transition-all shadow-lg shadow-gd-accent-500/20 disabled:opacity-50"
                  >
                    {donating ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</> : <><HandHeart className="h-4 w-4" /> Plant {Math.max(1, Math.floor(Number(amount || 0) / 5))} Tree(s)</>}
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
