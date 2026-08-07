"use client";
import { useEffect, useRef, useState } from "react";
import anime from "animejs";
import { TreeCounter } from "@/components/tree-tracker/TreeCounter";
import { AnimeWrapper } from "@/components/ui/AnimeWrapper";
import { Card } from "@/components/ui/Card";
import { Heart, HandHeart, Trees, Droplets, Loader2, CheckCircle2, MessageCircle, Mail, ExternalLink } from "lucide-react";
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
  const [contact, setContact] = useState<{ whatsapp: string | null; email: string | null }>({ whatsapp: null, email: null });
  const [treesPlanted, setTreesPlanted] = useState(0);
  useEffect(() => { if (titleRef.current) anime({ targets: titleRef.current, opacity: [0, 1], translateY: [20, 0], duration: 600, easing: "easeOutCubic" }); }, []);

  // Contact channels (WhatsApp + Gmail) for completing the donation
  useEffect(() => {
    fetch("/api/contact").then(r => (r.ok ? r.json() : null)).then(d => d && setContact(d)).catch(() => {});
  }, []);

  const treesFor = (amt: number) => Math.max(1, Math.floor(amt / 5));

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
      setTreesPlanted(treesFor(amt));
      setDone(true); // keep the modal open → contact step
    } catch {
      setError("Donation failed. Please try again.");
    } finally {
      setDonating(false);
    }
  };

  const closeModal = () => { setShowDonate(false); setDone(false); setError(""); };

  const waText = encodeURIComponent(
    `Hello GreenDuty! 🌳 I'd like to donate $${amount} to plant ${treesFor(Number(amount || 0))} tree(s).\nName: ${name || "—"}\nEmail: ${email || "—"}`
  );
  const mailSubject = encodeURIComponent(`Tree Donation — $${amount} (${treesFor(Number(amount || 0))} trees)`);
  const mailBody = encodeURIComponent(
    `Hello GreenDuty team,\n\nI would like to complete a tree donation:\n\n• Amount: $${amount}\n• Trees: ${treesFor(Number(amount || 0))}\n• Name: ${name || "—"}\n• Email: ${email || "—"}\n\nPlease guide me on how to finalize the payment.\n\nThank you!`
  );

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
              <Trees className="h-4 w-4 text-gd-olive-500" /> Why Plant Trees?
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
              <span className="font-semibold text-gd-accent-400">$5 plants 1 tree.</span> Choose your amount — we&apos;ll contact you directly on WhatsApp or by email to finalize your sponsorship.
            </p>
          </Card>
        </div>
      </div>

      {/* Donation modal */}
      {showDonate && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={closeModal} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl bg-gd-card border border-gd-border-soft p-6 shadow-2xl shadow-black/40" onClick={e => e.stopPropagation()}>
              {done ? (
                /* ── Step 2: complete donation via WhatsApp or Email ── */
                <div className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gd-success/10 border border-gd-success/25">
                    <CheckCircle2 className="h-8 w-8 text-gd-success" />
                  </div>
                  <p className="mt-3 text-lg font-semibold text-gd-text-primary">Almost there! 🌳</p>
                  <p className="mt-1 text-sm text-gd-text-muted">
                    Your sponsorship of <span className="text-gd-text-primary font-semibold">${Number(amount).toLocaleString()}</span> ({treesPlanted} tree{treesPlanted > 1 ? "s" : ""}) is recorded.
                  </p>
                  <p className="mt-3 text-sm text-gd-text-secondary">Finish your donation by contacting us directly:</p>

                  <div className="mt-5 space-y-3">
                    {contact.whatsapp ? (
                      <a
                        href={`https://wa.me/${contact.whatsapp}?text=${waText}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-3 rounded-xl border border-gd-success/25 bg-gd-success/5 px-4 py-3.5 text-left transition-all hover:border-gd-success/40 hover:bg-gd-success/10"
                      >
                        <div className="flex items-center gap-3">
                          <MessageCircle className="h-5 w-5 text-gd-success" />
                          <div>
                            <p className="text-sm font-semibold text-gd-text-primary">Donate via WhatsApp</p>
                            <p className="text-xs text-gd-text-muted">Chat with us directly — quick & easy</p>
                          </div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-gd-text-muted" />
                      </a>
                    ) : (
                      <p className="rounded-xl border border-gd-border bg-gd-elevated/50 px-4 py-3 text-xs text-gd-text-muted">WhatsApp contact coming soon.</p>
                    )}

                    {contact.email ? (
                      <a
                        href={`mailto:${contact.email}?subject=${mailSubject}&body=${mailBody}`}
                        className="flex items-center justify-between gap-3 rounded-xl border border-gd-accent-500/25 bg-gd-accent-500/5 px-4 py-3.5 text-left transition-all hover:border-gd-accent-500/40 hover:bg-gd-accent-500/10"
                      >
                        <div className="flex items-center gap-3">
                          <Mail className="h-5 w-5 text-gd-accent-400" />
                          <div>
                            <p className="text-sm font-semibold text-gd-text-primary">Donate via Email</p>
                            <p className="text-xs text-gd-text-muted">We&apos;ll send you the payment details</p>
                          </div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-gd-text-muted" />
                      </a>
                    ) : (
                      <p className="rounded-xl border border-gd-border bg-gd-elevated/50 px-4 py-3 text-xs text-gd-text-muted">Email contact coming soon.</p>
                    )}
                  </div>

                  <button onClick={closeModal} className="mt-5 w-full rounded-xl border border-gd-border bg-gd-card py-2.5 text-sm font-medium text-gd-text-secondary hover:bg-gd-elevated transition-colors">
                    Close
                  </button>
                </div>
              ) : (
                /* ── Step 1: choose amount + details ── */
                <>
                  <div className="text-center mb-6">
                    <Heart className="mx-auto h-10 w-10 text-gd-accent-400" />
                    <h3 className="mt-3 text-lg font-semibold text-gd-text-primary">Sponsor Trees</h3>
                    <p className="text-sm text-gd-text-secondary mt-1">$5 plants one tree. We&apos;ll contact you to finalize.</p>
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
                    <p className="rounded-xl border border-gd-olive-500/15 bg-gd-olive-500/5 px-3.5 py-2.5 text-[11px] text-gd-olive-500">
                      🌳 You&apos;re planting <span className="font-semibold">{treesFor(Number(amount || 0))} tree(s)</span> — we&apos;ll finalize via WhatsApp or email.
                    </p>
                  </div>
                  {error && <p className="mb-3 rounded-xl border border-gd-danger/20 bg-gd-danger/5 px-4 py-2.5 text-xs text-gd-danger">{error}</p>}
                  <button
                    onClick={donate}
                    disabled={donating}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 py-3 text-sm font-semibold text-gd-text-inverse hover:brightness-110 transition-all shadow-lg shadow-gd-accent-500/20 disabled:opacity-50"
                  >
                    {donating ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</> : <><HandHeart className="h-4 w-4" /> Continue — Plant {treesFor(Number(amount || 0))} Tree(s)</>}
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
