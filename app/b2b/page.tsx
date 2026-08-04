"use client";
import { useEffect, useRef, useState } from "react";
import anime from "animejs";
import { AnimeWrapper } from "@/components/ui/AnimeWrapper";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { b2bServices } from "@/lib/mock-data";
import { Check, Send, Thermometer, Droplets as WaterDroplets, Sun, Wind, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const greenhouseSensors = [
  { icon: Thermometer, label: "Temp", value: "24.5°C", color: "text-gd-ember-400" },
  { icon: WaterDroplets, label: "Humidity", value: "68%", color: "text-blue-400" },
  { icon: Sun, label: "Light", value: "45,000 lux", color: "text-gd-accent-400" },
  { icon: Wind, label: "CO₂", value: "420 ppm", color: "text-gd-olive-400" },
];

export default function B2BPage() {
  const { user } = useAuth();
  const titleRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState({ company: user?.businessProfile?.businessName || "", email: user?.email || "", phone: "", service: "Custom Farm Dashboard", message: "" });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { if (titleRef.current) anime({ targets: titleRef.current, opacity: [0, 1], translateY: [20, 0], duration: 600, easing: "easeOutCubic" }); }, []);

  const sendInquiry = async () => {
    setError("");
    if (!form.company.trim() || !form.email.trim() || !form.message.trim()) {
      setError("Please fill in company, email, and message.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id || null,
          companyName: form.company.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          service: form.service,
          message: form.message.trim(),
        }),
      });
      if (!res.ok) throw new Error();
      setDone(true);
      setTimeout(() => { setDone(false); setForm(f => ({ ...f, message: "" })); }, 2200);
    } catch {
      setError("Failed to send inquiry. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8">
      <AnimeWrapper animate="fadeIn">
        <div ref={titleRef} className="text-center py-8">
          <Badge variant="purple" className="mb-4">B2B Engineering Agency</Badge>
          <h1 className="text-3xl font-bold text-gd-text-primary tracking-tight">Agri-Tech Engineering Services</h1>
          <p className="mt-3 text-gd-text-secondary max-w-2xl mx-auto leading-relaxed">
            Custom web development, IoT greenhouse integration, automated irrigation, and smart farm dashboards.
          </p>
        </div>
      </AnimeWrapper>

      {/* Services grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {b2bServices.map(svc => (
          <Card key={svc.id} hover>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gd-accent-500/15 to-gd-olive-500/10 text-gd-accent-400 border border-gd-accent-500/10 text-lg font-bold">
              {svc.name[0]}
            </div>
            <h3 className="mt-5 font-semibold text-gd-text-primary text-lg">{svc.name}</h3>
            <p className="mt-2 text-sm text-gd-text-secondary leading-relaxed">{svc.description}</p>
            <div className="mt-4 space-y-1.5">
              {svc.features.map((f, j) => (
                <div key={j} className="flex items-center gap-2 text-xs text-gd-text-secondary">
                  <Check className="h-3 w-3 text-gd-olive-500 flex-shrink-0" />{f}
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-center justify-between pt-4 border-t border-gd-border">
              <span className="text-sm font-semibold text-gd-accent-400">{svc.priceRange}</span>
              <span className="text-[10px] text-gd-text-muted">{svc.deliveryTime}</span>
            </div>
            <button
              onClick={() => { setForm(f => ({ ...f, service: svc.name })); document.getElementById("quote-form")?.scrollIntoView({ behavior: "smooth" }); }}
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 py-2.5 text-sm font-semibold text-gd-text-inverse hover:brightness-110 transition-all shadow-sm shadow-gd-accent-500/10"
            >
              Book Consultation
            </button>
          </Card>
        ))}
      </div>

      {/* Greenhouse demo */}
      <Card className="!bg-gradient-to-br !from-gd-overlay !to-gd-card !border-gd-border-strong overflow-hidden relative">
        <div className="absolute top-0 right-0 h-32 w-32 bg-gd-olive-500/10 rounded-full blur-3xl" />
        <div className="relative">
          <h2 className="text-2xl font-bold text-gd-text-primary mb-1">Live Greenhouse Demo</h2>
          <p className="text-sm text-gd-text-muted mb-6">Real-time sensor data from a connected smart greenhouse</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {greenhouseSensors.map((s, i) => (
              <div key={i} className="rounded-xl bg-gd-accent-500/3 border border-gd-accent-500/8 p-4 text-center backdrop-blur-sm">
                <s.icon className={`mx-auto h-6 w-6 ${s.color}`} />
                <p className="mt-2 text-lg font-bold text-gd-text-primary">{s.value}</p>
                <p className="text-xs text-gd-text-muted mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-xl bg-gd-olive-500/5 border border-gd-olive-500/10 p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-gd-olive-500 animate-pulse shadow-[0_0_8px_rgba(132,204,22,0.4)]" />
                <span className="text-sm text-gd-text-primary">Smart Greenhouse System — Operational</span>
              </div>
              <span className="text-xs text-gd-text-muted">Auto-pilot mode · v2.4</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Quote form */}
      <Card id="quote-form">
        <h2 className="text-xl font-bold text-gd-text-primary mb-5">Get a Custom Quote</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <input value={form.company} onChange={e => setForm({...form, company: e.target.value})} placeholder="Company Name" className="rounded-xl border border-gd-border bg-gd-elevated px-3.5 py-2.5 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none focus:border-gd-accent-500/40 transition-colors" />
          <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} type="email" placeholder="Email" className="rounded-xl border border-gd-border bg-gd-elevated px-3.5 py-2.5 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none focus:border-gd-accent-500/40 transition-colors" />
          <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="Phone" className="rounded-xl border border-gd-border bg-gd-elevated px-3.5 py-2.5 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none focus:border-gd-accent-500/40 transition-colors" />
          <select value={form.service} onChange={e => setForm({...form, service: e.target.value})} className="rounded-xl border border-gd-border bg-gd-elevated px-3.5 py-2.5 text-sm text-gd-text-primary outline-none focus:border-gd-accent-500/40 transition-colors">
            {b2bServices.map(s => <option key={s.id} className="bg-gd-card">{s.name}</option>)}
          </select>
          <textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})} placeholder="Describe your project..." rows={3} className="sm:col-span-2 rounded-xl border border-gd-border bg-gd-elevated px-3.5 py-2.5 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none focus:border-gd-accent-500/40 transition-colors resize-none" />
        </div>
        {error && <p className="mt-3 rounded-xl border border-gd-danger/20 bg-gd-danger/5 px-4 py-2.5 text-xs text-gd-danger">{error}</p>}
        {done && (
          <p className="mt-3 flex items-center gap-2 rounded-xl border border-gd-success/20 bg-gd-success/5 px-4 py-2.5 text-xs text-gd-success">
            <CheckCircle2 className="h-4 w-4" /> Inquiry sent! Our team will reach out within 24h.
          </p>
        )}
        <button
          onClick={sendInquiry}
          disabled={sending}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 px-6 py-2.5 text-sm font-semibold text-gd-text-inverse hover:brightness-110 transition-all shadow-sm shadow-gd-accent-500/10 disabled:opacity-50"
        >
          {sending ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</> : <><Send className="h-4 w-4" /> Send Inquiry</>}
        </button>
      </Card>
    </div>
  );
}
