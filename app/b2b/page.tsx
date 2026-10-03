"use client";
import { useEffect, useRef, useState } from "react";
import anime from "animejs";
import { AnimeWrapper } from "@/components/ui/AnimeWrapper";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { BadgeCheck, Clock, Loader2, Send } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { PublicNav, SiteFooter } from "@/components/layout/PublicChrome";
import { OfferingIcon } from "@/components/catalog/OfferingIcon";
import {
  CATALOG_CATEGORY_LABEL,
  CATALOG_CATEGORY_VARIANT,
  CATALOG_OFFERINGS,
} from "@/lib/catalog-data";

/**
 * Contact / start-a-project page. Public — a prospective client must be able
 * to reach this without an account.
 *
 * Submits to the real /api/inquiries endpoint, which stores the enquiry in
 * the b2b_inquiries table for the owner to follow up.
 */
export default function B2BPage() {
  const { user } = useAuth();
  const titleRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState({
    company: "",
    email: "",
    phone: "",
    service: CATALOG_OFFERINGS[0]?.name || "Personalized ERP",
    message: "",
  });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  // Prefill from the signed-in account when there is one, without
  // clobbering anything the visitor has already typed.
  useEffect(() => {
    if (!user) return;
    setForm(prev => ({
      ...prev,
      company: prev.company || user.businessProfile?.businessName || "",
      email: prev.email || user.email || "",
    }));
  }, [user]);

  useEffect(() => {
    if (titleRef.current)
      anime({ targets: titleRef.current, opacity: [0, 1], translateY: [20, 0], duration: 600, easing: "easeOutCubic" });
  }, []);

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
      setForm(f => ({ ...f, message: "" }));
    } catch {
      setError("We couldn't send that. Please try again, or email us directly.");
    } finally {
      setSending(false);
    }
  };

  const chooseOffering = (name: string) => {
    setForm(f => ({ ...f, service: name }));
    document.getElementById("quote-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const inputClass =
    "rounded-xl border border-gd-border bg-gd-elevated px-3.5 py-2.5 text-sm text-gd-text-primary placeholder-gd-text-muted outline-none focus:border-gd-accent-500/40 transition-colors";

  return (
    <div className="min-h-screen bg-gd-deepest">
      <PublicNav />

      <div className="mx-auto max-w-7xl px-6 py-14">
        <AnimeWrapper animate="fadeIn">
          <div ref={titleRef} className="text-center">
            <Badge variant="success" className="mb-4">Software Agency</Badge>
            <h1 className="text-3xl font-bold tracking-tight text-gd-text-primary sm:text-4xl">
              Tell us what you need <span className="gradient-text">built</span>
            </h1>
            <p className="mx-auto mt-3 max-w-2xl leading-relaxed text-gd-text-secondary">
              Describe your process — the systems you have, what breaks, and what you wish existed. We&apos;ll come
              back with a plan and a realistic timeline.
            </p>
          </div>
        </AnimeWrapper>

        {/* What we build — pick one to prefill the form */}
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CATALOG_OFFERINGS.map(offering => (
            <Card key={offering.id} hover className="flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-gd-accent-500/10 bg-gradient-to-br from-gd-accent-500/15 to-gd-olive-500/10 text-gd-accent-400">
                  <OfferingIcon icon={offering.icon} className="h-5 w-5" />
                </div>
                <Badge variant={CATALOG_CATEGORY_VARIANT[offering.category]}>
                  {CATALOG_CATEGORY_LABEL[offering.category]}
                </Badge>
              </div>
              <h3 className="mt-4 font-semibold text-gd-text-primary">{offering.name}</h3>
              <p className="mt-1 text-xs font-medium text-gd-accent-400">{offering.tagline}</p>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-gd-text-secondary">{offering.description}</p>
              <div className="mt-4 flex items-center justify-between border-t border-gd-border pt-3">
                <span className="flex items-center gap-1.5 text-[11px] text-gd-text-muted">
                  <Clock className="h-3 w-3" /> {offering.timeline}
                </span>
                <button
                  type="button"
                  onClick={() => chooseOffering(offering.name)}
                  className="text-xs font-semibold text-gd-accent-400 transition-colors hover:text-gd-accent-300"
                >
                  Select
                </button>
              </div>
            </Card>
          ))}
        </div>

        {/* Inquiry form */}
        <Card id="quote-form" className="mt-12 scroll-mt-24">
          <h2 className="mb-1 text-xl font-bold text-gd-text-primary">Request a quote</h2>
          <p className="mb-5 text-sm text-gd-text-muted">
            We reply to every enquiry. There is no obligation and no sales sequence.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <input
              value={form.company}
              onChange={e => setForm({ ...form, company: e.target.value })}
              placeholder="Company name"
              className={inputClass}
            />
            <input
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              type="email"
              placeholder="Email"
              className={inputClass}
            />
            <input
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              placeholder="Phone (optional)"
              className={inputClass}
            />
            <select
              value={form.service}
              onChange={e => setForm({ ...form, service: e.target.value })}
              className={`${inputClass} bg-gd-elevated`}
              aria-label="What you need"
            >
              {CATALOG_OFFERINGS.map(o => (
                <option key={o.id} value={o.name} className="bg-gd-card">
                  {o.name}
                </option>
              ))}
              <option value="Something else" className="bg-gd-card">
                Something else
              </option>
            </select>
            <textarea
              value={form.message}
              onChange={e => setForm({ ...form, message: e.target.value })}
              placeholder="Describe your process, the systems you use today, and what you'd like to change…"
              rows={4}
              className={`${inputClass} resize-none sm:col-span-2`}
            />
          </div>

          {error && (
            <p className="mt-3 rounded-xl border border-gd-danger/20 bg-gd-danger/5 px-4 py-2.5 text-xs text-gd-danger">
              {error}
            </p>
          )}
          {done && (
            <p className="mt-3 flex items-center gap-2 rounded-xl border border-gd-success/20 bg-gd-success/5 px-4 py-2.5 text-xs text-gd-success">
              <BadgeCheck className="h-4 w-4" /> Thanks — your enquiry is with us. We&apos;ll be in touch shortly.
            </p>
          )}

          <button
            onClick={sendInquiry}
            disabled={sending}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 px-6 py-2.5 text-sm font-semibold text-gd-text-inverse shadow-sm shadow-gd-accent-500/10 transition-all hover:brightness-110 disabled:opacity-50"
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Sending…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" /> Send inquiry
              </>
            )}
          </button>
        </Card>
      </div>

      <SiteFooter />
    </div>
  );
}
