"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Globe, Handshake, Loader2, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ScrollReveal } from "@/components/landing/ScrollReveal";
import { PublicNav, SiteFooter } from "@/components/layout/PublicChrome";
import { PARTNERSHIP_TYPES } from "@/lib/catalog-data";
import { PARTNER_CATEGORY_LABEL, PARTNER_CATEGORY_VARIANT, type PartnerRow } from "@/lib/agency";

/** The subset of fields /api/public/partners is allowed to return. */
type PublicPartner = Pick<
  PartnerRow,
  "id" | "name" | "logo_url" | "category" | "website" | "collaboration_type" | "description" | "since"
>;

export default function PartnersPage() {
  const [partners, setPartners] = useState<PublicPartner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/public/partners")
      .then(r => (r.ok ? r.json() : null))
      .then(d => d && setPartners(d.partners || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gd-deepest">
      <PublicNav />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-gd-border-soft py-20">
        <div className="absolute inset-0 bg-grid opacity-25" />
        <div className="absolute -right-32 top-0 h-80 w-80 rounded-full bg-gd-olive-500/5 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-6">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-gd-accent-500/20 bg-gd-accent-500/5 px-3 py-1 text-xs font-medium text-gd-accent-400">
              <Handshake className="h-3 w-3" /> Partnerships
            </div>
            <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight text-gd-text-primary sm:text-5xl">
              We build better systems <span className="gradient-text">together</span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-gd-text-secondary">
              No agency delivers an ERP alone. Hardware, infrastructure, finance and local support all have to line
              up around the software — so we work with partners who cover what we don&apos;t.
            </p>
            <Link
              href="/b2b"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 px-5 py-3 text-sm font-semibold text-gd-text-inverse shadow-lg shadow-gd-accent-500/20 transition-all hover:brightness-110"
            >
              Become a partner <ArrowRight className="h-4 w-4" />
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Partnership model ── */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight text-gd-text-primary sm:text-3xl">
              How we collaborate
            </h2>
            <p className="mt-3 leading-relaxed text-gd-text-secondary">
              Six kinds of partnership, each solving a different part of getting software running inside a real
              factory.
            </p>
          </div>

          <ScrollReveal stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PARTNERSHIP_TYPES.map(type => (
              <div
                key={type.name}
                className="rounded-2xl border border-gd-border-soft bg-gd-card/70 p-5 transition-all duration-300 hover:border-gd-accent-500/25 hover:glow-ring"
              >
                <h3 className="font-semibold text-gd-text-primary">{type.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gd-text-secondary">{type.description}</p>
              </div>
            ))}
          </ScrollReveal>
        </div>
      </section>

      {/* ── Active partners ── */}
      <section className="border-y border-gd-border-soft bg-gd-base py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gd-accent-500/15 bg-gd-accent-500/5 px-3 py-1 text-xs font-medium text-gd-accent-400">
              <Sparkles className="h-3 w-3" /> Active Collaborations
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-gd-text-primary sm:text-4xl">
              Who we work <span className="gradient-text">with</span>
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-14 text-sm text-gd-text-muted">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading partners…
            </div>
          ) : partners.length === 0 ? (
            <div className="mx-auto max-w-md rounded-2xl border border-dashed border-gd-border-soft p-10 text-center">
              <Handshake className="mx-auto h-6 w-6 text-gd-text-muted" />
              <p className="mt-3 text-sm text-gd-text-secondary">
                We&apos;re building our partner network now.
              </p>
              <Link
                href="/b2b"
                className="mt-2 inline-block text-sm font-medium text-gd-accent-400 hover:underline"
              >
                Be the first to join us
              </Link>
            </div>
          ) : (
            <ScrollReveal stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {partners.map(partner => (
                <Card key={partner.id} hover className="flex flex-col">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gd-border bg-gd-elevated text-gd-accent-400">
                      {partner.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={partner.logo_url}
                          alt={partner.name}
                          className="h-full w-full object-contain p-1.5"
                        />
                      ) : (
                        <Handshake className="h-5 w-5" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gd-text-primary">{partner.name}</p>
                      {partner.since && (
                        <p className="text-[11px] text-gd-text-muted">Partner since {partner.since}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <Badge variant={PARTNER_CATEGORY_VARIANT[partner.category] || "default"}>
                      {PARTNER_CATEGORY_LABEL[partner.category] || partner.category}
                    </Badge>
                  </div>

                  {partner.description && (
                    <p className="mt-3 text-sm leading-relaxed text-gd-text-secondary">{partner.description}</p>
                  )}

                  {partner.collaboration_type && (
                    <p className="mt-3 rounded-lg border border-gd-border bg-gd-elevated/40 px-3 py-2 text-xs text-gd-text-muted">
                      {partner.collaboration_type}
                    </p>
                  )}

                  {partner.website && (
                    <a
                      href={partner.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-gd-accent-400 transition-colors hover:text-gd-accent-300"
                    >
                      <Globe className="h-3 w-3" />
                      {partner.website.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                </Card>
              ))}
            </ScrollReveal>
          )}
        </div>
      </section>

      {/* ── Become a partner ── */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <ScrollReveal>
            <h2 className="text-3xl font-bold tracking-tight text-gd-text-primary sm:text-4xl">
              Become a <span className="gradient-text">partner</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl leading-relaxed text-gd-text-secondary">
              If you supply hardware, infrastructure, integration, finance or local support to industrial clients,
              tell us what you do — we&apos;ll get back to you.
            </p>
            <Link
              href="/b2b"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 px-6 py-3 text-sm font-semibold text-gd-text-inverse shadow-lg shadow-gd-accent-500/20 transition-all hover:brightness-110"
            >
              Propose a collaboration <ArrowRight className="h-4 w-4" />
            </Link>
          </ScrollReveal>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
