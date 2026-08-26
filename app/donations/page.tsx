"use client";
import { useState, useRef, useEffect } from "react";
import anime from "animejs";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/Card";
import { AnimeWrapper } from "@/components/ui/AnimeWrapper";
import {
  Heart, TreePine, Banknote, Copy, CheckCircle2, Loader2,
  Leaf, Users, MapPin, Shield, ArrowRight, MessageCircle, Mail
} from "lucide-react";

const PRESET_AMOUNTS = [500, 1000, 2500, 5000, 10000];

const IMPACT_FACTS = [
  { icon: TreePine, label: "1 tree absorbs ~48 lbs CO₂/year", color: "text-gd-olive-500" },
  { icon: Users, label: "Every donation supports local farmers", color: "text-gd-info" },
  { icon: MapPin, label: "Trees planted across Algeria", color: "text-gd-accent-400" },
  { icon: Shield, label: "Transparent — we publish impact reports", color: "text-gd-success" },
];

export default function DonationsPage() {
  const { user } = useAuth();
  const titleRef = useRef<HTMLDivElement>(null);
  const [amount, setAmount] = useState("1000");
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (titleRef.current) {
      anime({ targets: titleRef.current, opacity: [0, 1], translateY: [20, 0], duration: 600, easing: "easeOutCubic" });
    }
  }, []);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const treesFor = (amt: number) => Math.max(1, Math.floor(amt / 500));

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const submitDonation = async () => {
    setError("");
    const amt = Number(amount);
    if (!amt || amt <= 0) { setError("Please enter a valid amount."); return; }
    if (!name.trim()) { setError("Please enter your name."); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id || null,
          amount: amt,
          name: name.trim(),
          email: email.trim(),
          message: message.trim(),
        }),
      });
      if (!res.ok) throw new Error();
      setDone(true);
    } catch {
      setError("Donation failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <AnimeWrapper animate="fadeIn">
        <div ref={titleRef} className="text-center py-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-gd-success/20 bg-gd-success/5 px-4 py-1.5 mb-4">
            <Heart className="h-4 w-4 text-gd-success" />
            <span className="text-xs font-semibold text-gd-success">Support Our Mission</span>
          </div>
          <h1 className="text-3xl font-bold text-gd-text-primary tracking-tight">
            Plant a Tree, <span className="gradient-text">Change the World</span>
          </h1>
          <p className="mt-3 text-sm text-gd-text-secondary max-w-xl mx-auto leading-relaxed">
            Every donation funds tree planting, community cleanups, and environmental education across Algeria.
            500 DA plants one tree. Your generosity makes a real impact.
          </p>
        </div>
      </AnimeWrapper>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left: Donation form */}
        <div className="lg:col-span-3 space-y-5">
          {done ? (
            <Card className="text-center py-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gd-success/10 border border-gd-success/25">
                <CheckCircle2 className="h-9 w-9 text-gd-success" />
              </div>
              <p className="mt-4 text-xl font-bold text-gd-text-primary">Thank you for your generosity! 🌳</p>
              <p className="mt-2 text-sm text-gd-text-muted">
                Your donation of {Number(amount).toLocaleString()} DA will plant {treesFor(Number(amount))} tree{treesFor(Number(amount)) > 1 ? "s" : ""}.
              </p>
              <div className="mt-6 space-y-3 max-w-sm mx-auto">
                <p className="text-xs text-gd-text-secondary">Complete your donation by contacting us:</p>
                <a
                  href={`https://wa.me/213555123456?text=${encodeURIComponent(`Hello GreenDuty! I'd like to donate ${amount} DA to plant ${treesFor(Number(amount))} tree(s).\nName: ${name}\nEmail: ${email}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl border border-gd-success/25 bg-gd-success/5 py-3 text-sm font-semibold text-gd-success hover:bg-gd-success/10 transition-all"
                >
                  <MessageCircle className="h-4 w-4" /> Donate via WhatsApp
                </a>
                <a
                  href={`mailto:donations@greenduty.eco?subject=${encodeURIComponent(`Tree Donation — ${amount} DA`)}&body=${encodeURIComponent(`I would like to donate ${amount} DA to plant ${treesFor(Number(amount))} tree(s).\n\nName: ${name}\nEmail: ${email}\nMessage: ${message}`)}`}
                  className="flex items-center justify-center gap-2 rounded-xl border border-gd-accent-500/25 bg-gd-accent-500/5 py-3 text-sm font-semibold text-gd-accent-400 hover:bg-gd-accent-500/10 transition-all"
                >
                  <Mail className="h-4 w-4" /> Donate via Email
                </a>
              </div>
              <button onClick={() => { setDone(false); setAmount("1000"); setMessage(""); }} className="mt-6 text-xs text-gd-text-muted hover:text-gd-text-secondary transition-colors">
                Make another donation
              </button>
            </Card>
          ) : (
            <>
              {/* Amount selection */}
              <Card>
                <h3 className="text-sm font-semibold text-gd-text-primary mb-4 flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-gd-accent-400" /> Donation Amount
                </h3>
                <div className="grid grid-cols-5 gap-2 mb-3">
                  {PRESET_AMOUNTS.map(a => (
                    <button
                      key={a}
                      onClick={() => setAmount(String(a))}
                      className={`rounded-xl border py-3 text-sm font-medium transition-all ${
                        amount === String(a)
                          ? "border-gd-accent-500/50 bg-gd-accent-500/10 text-gd-accent-400 shadow-lg shadow-gd-accent-500/10"
                          : "border-gd-border bg-gd-elevated/50 text-gd-text-secondary hover:border-gd-accent-500/30"
                      }`}
                    >
                      {a.toLocaleString()} DA
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="Custom amount in DA"
                  className="w-full rounded-xl border border-gd-border bg-gd-elevated px-4 py-2.5 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none focus:border-gd-accent-500/40 transition-colors"
                />
                <div className="mt-3 rounded-xl border border-gd-olive-500/15 bg-gd-olive-500/5 px-4 py-2.5 flex items-center gap-2">
                  <TreePine className="h-4 w-4 text-gd-olive-500 shrink-0" />
                  <span className="text-xs text-gd-olive-500">
                    Your donation will plant <span className="font-bold">{treesFor(Number(amount || 0))}</span> tree{treesFor(Number(amount || 0)) > 1 ? "s" : ""} (500 DA = 1 tree)
                  </span>
                </div>
              </Card>

              {/* Your info */}
              <Card>
                <h3 className="text-sm font-semibold text-gd-text-primary mb-4 flex items-center gap-2">
                  <Leaf className="h-4 w-4 text-gd-accent-400" /> Your Information
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your name"
                    className="rounded-xl border border-gd-border bg-gd-elevated px-4 py-2.5 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none focus:border-gd-accent-500/40 transition-colors"
                  />
                  <input
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    type="email"
                    placeholder="Email address"
                    className="rounded-xl border border-gd-border bg-gd-elevated px-4 py-2.5 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none focus:border-gd-accent-500/40 transition-colors"
                  />
                </div>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Leave a message (optional)"
                  rows={2}
                  className="mt-3 w-full rounded-xl border border-gd-border bg-gd-elevated px-4 py-2.5 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none focus:border-gd-accent-500/40 transition-colors resize-none"
                />
              </Card>

              {error && (
                <div className="rounded-xl border border-gd-danger/20 bg-gd-danger/5 px-4 py-2.5 text-xs text-gd-danger">{error}</div>
              )}

              {/* Submit */}
              <button
                onClick={submitDonation}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 py-3.5 text-sm font-semibold text-gd-text-inverse shadow-lg shadow-gd-accent-500/20 hover:shadow-gd-accent-500/40 hover:brightness-110 transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                ) : (
                  <><Heart className="h-4 w-4" /> Donate {Number(amount || 0).toLocaleString()} DA — Plant {treesFor(Number(amount || 0))} Tree{treesFor(Number(amount || 0)) > 1 ? "s" : ""}</>
                )}
              </button>
            </>
          )}
        </div>

        {/* Right: Bank details + info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Bank transfer details */}
          <Card className="!bg-gradient-to-br !from-gd-overlay !to-gd-card !border-gd-border-strong">
            <h3 className="text-sm font-semibold text-gd-text-primary mb-4 flex items-center gap-2">
              <Banknote className="h-4 w-4 text-gd-accent-400" /> Bank Transfer Details
            </h3>
            <div className="space-y-3">
              {[
                { label: "Account Holder", value: "GreenDuty SARL" },
                { label: "Bank", value: "BNA (Banque Nationale d'Algérie)" },
                { label: "RIB / Account Number", value: "00799999001234567890", id: "rib" },
                { label: "CCP Number", value: "799999900123456789", id: "ccp" },
                { label: "SWIFT / BIC", value: "BNALDZDZ" },
                { label: "Currency", value: "DZD (Algerian Dinar)" },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between rounded-xl bg-gd-elevated/50 border border-gd-border px-3.5 py-2.5">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gd-text-muted">{item.label}</p>
                    <p className="mt-0.5 text-sm font-medium text-gd-text-primary font-mono">{item.value}</p>
                  </div>
                  {item.id && (
                    <button
                      onClick={() => copyToClipboard(item.value, item.id)}
                      className="shrink-0 rounded-lg border border-gd-border p-1.5 text-gd-text-muted hover:text-gd-accent-400 hover:border-gd-accent-500/30 transition-all"
                      title="Copy"
                    >
                      {copied === item.id ? <CheckCircle2 className="h-3.5 w-3.5 text-gd-success" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-4 text-[10px] text-gd-text-muted leading-relaxed">
              After transferring, please send us a confirmation via WhatsApp or email with your name and the amount.
              We&apos;ll confirm receipt and update your impact dashboard.
            </p>
          </Card>

          {/* Impact facts */}
          <Card>
            <h3 className="text-sm font-semibold text-gd-text-primary mb-4">Your Impact</h3>
            <div className="space-y-3">
              {IMPACT_FACTS.map((fact, i) => {
                const Icon = fact.icon;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gd-elevated border border-gd-border shrink-0">
                      <Icon className={`h-4 w-4 ${fact.color}`} />
                    </div>
                    <p className="text-xs text-gd-text-secondary leading-relaxed">{fact.label}</p>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Transparency note */}
          <Card className="!border-gd-success/15 !bg-gd-success/5">
            <p className="text-xs text-gd-text-secondary leading-relaxed">
              🔍 <span className="font-semibold text-gd-text-primary">Full transparency:</span> We publish quarterly impact reports showing exactly how funds were used — trees planted, cleanups organized, and communities reached.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
