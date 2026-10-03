"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Clock, Factory, Layers, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ScrollReveal } from "@/components/landing/ScrollReveal";
import { OfferingIcon } from "@/components/catalog/OfferingIcon";
import { OrderButton } from "@/components/catalog/OrderButton";
import { PublicNav, SiteFooter } from "@/components/layout/PublicChrome";
import { cn } from "@/lib/utils";
import {
  CATALOG_CATEGORIES,
  CATALOG_CATEGORY_LABEL,
  CATALOG_CATEGORY_VARIANT,
  CATALOG_OFFERINGS,
  INDUSTRIES,
  PERSONALIZED_ERP_POINTS,
  type CatalogCategory,
} from "@/lib/catalog-data";

type Filter = CatalogCategory | "all";

export default function CataloguePage() {
  const [filter, setFilter] = useState<Filter>("all");

  const visible = filter === "all" ? CATALOG_OFFERINGS : CATALOG_OFFERINGS.filter(o => o.category === filter);

  return (
    <div className="min-h-screen bg-gd-deepest">
      <PublicNav />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-gd-border-soft py-20">
        <div className="absolute inset-0 bg-grid opacity-25" />
        <div className="absolute -left-32 top-0 h-80 w-80 rounded-full bg-gd-accent-500/5 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-6">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-gd-accent-500/20 bg-gd-accent-500/5 px-3 py-1 text-xs font-medium text-gd-accent-400">
              <Layers className="h-3 w-3" /> What We Build
            </div>
            <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight text-gd-text-primary sm:text-5xl">
              Systems shaped to <span className="gradient-text">your operation</span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-gd-text-secondary">
              We build ERP, MES and CRM systems, custom web and mobile applications, and the integrations that hold
              them together — for factories and industrial businesses that have outgrown off-the-shelf software.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/b2b"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 px-5 py-3 text-sm font-semibold text-gd-text-inverse shadow-lg shadow-gd-accent-500/20 transition-all hover:brightness-110"
              >
                Request a quote <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/partners"
                className="inline-flex items-center gap-2 rounded-xl border border-gd-border-strong bg-gd-elevated/50 px-5 py-3 text-sm font-semibold text-gd-text-primary transition-all hover:border-gd-accent-500/30 hover:bg-gd-overlay"
              >
                Partner with us
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Offerings ── */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6">
          {/* Category filter */}
          <div className="mb-10 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={cn(
                "rounded-xl border px-4 py-2 text-sm font-medium transition-all",
                filter === "all"
                  ? "border-gd-accent-500/50 bg-gd-accent-500/10 text-gd-accent-400"
                  : "border-gd-border bg-gd-card text-gd-text-secondary hover:border-gd-border-strong hover:text-gd-text-primary"
              )}
            >
              All ({CATALOG_OFFERINGS.length})
            </button>
            {CATALOG_CATEGORIES.map(category => {
              const count = CATALOG_OFFERINGS.filter(o => o.category === category).length;
              if (count === 0) return null;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setFilter(category)}
                  className={cn(
                    "rounded-xl border px-4 py-2 text-sm font-medium transition-all",
                    filter === category
                      ? "border-gd-accent-500/50 bg-gd-accent-500/10 text-gd-accent-400"
                      : "border-gd-border bg-gd-card text-gd-text-secondary hover:border-gd-border-strong hover:text-gd-text-primary"
                  )}
                >
                  {CATALOG_CATEGORY_LABEL[category]} ({count})
                </button>
              );
            })}
          </div>

          <ScrollReveal stagger className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {visible.map(offering => (
              <Card key={offering.id} hover className="group flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-gd-accent-500/10 bg-gradient-to-br from-gd-accent-500/15 to-gd-olive-500/10 text-gd-accent-400">
                    <OfferingIcon icon={offering.icon} className="h-5 w-5" />
                  </div>
                  <Badge variant={CATALOG_CATEGORY_VARIANT[offering.category]}>
                    {CATALOG_CATEGORY_LABEL[offering.category]}
                  </Badge>
                </div>

                <h2 className="mt-5 text-lg font-semibold text-gd-text-primary">{offering.name}</h2>
                <p className="mt-1 text-xs font-medium text-gd-accent-400">{offering.tagline}</p>
                <p className="mt-3 text-sm leading-relaxed text-gd-text-secondary">{offering.description}</p>

                <div className="mt-5">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gd-text-muted">
                    Typical modules
                  </p>
                  <ul className="space-y-1.5">
                    {offering.modules.map(module => (
                      <li key={module} className="flex items-start gap-2 text-xs text-gd-text-secondary">
                        <Check className="mt-0.5 h-3 w-3 flex-shrink-0 text-gd-olive-500" />
                        {module}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-auto border-t border-gd-border pt-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-xs text-gd-text-muted">
                      <Clock className="h-3 w-3" /> {offering.timeline}
                    </span>
                    <OrderButton offeringId={offering.id} />
                  </div>
                  <Link
                    href="/b2b"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-gd-text-muted transition-colors hover:text-gd-accent-400"
                  >
                    Or ask a question first <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </Card>
            ))}
          </ScrollReveal>

          {visible.length === 0 && (
            <p className="py-16 text-center text-sm text-gd-text-muted">
              Nothing in this category yet — try another, or{" "}
              <Link href="/b2b" className="text-gd-accent-400 hover:underline">
                tell us what you need
              </Link>
              .
            </p>
          )}
        </div>
      </section>

      {/* ── Personalized ERP ── */}
      <section className="border-y border-gd-border-soft bg-gd-base py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gd-accent-500/20 bg-gd-accent-500/5 px-3 py-1 text-xs font-medium text-gd-accent-400">
              <Sparkles className="h-3 w-3" /> Our Speciality
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-gd-text-primary sm:text-4xl">
              Every ERP is built <span className="gradient-text">for one factory</span>
            </h2>
            <p className="mt-4 leading-relaxed text-gd-text-secondary">
              There is no GreenDuty product you have to adapt to. Each ERP we ship is built around the process of the
              business it serves — which is why we ask so many questions before we write any code.
            </p>
          </div>

          <ScrollReveal stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PERSONALIZED_ERP_POINTS.map(point => (
              <Card key={point.title} className="flex flex-col">
                <div className="h-px w-8 bg-gradient-to-r from-gd-accent-500 to-gd-olive-500" />
                <h3 className="mt-4 font-semibold text-gd-text-primary">{point.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gd-text-secondary">{point.body}</p>
              </Card>
            ))}
          </ScrollReveal>

          <ScrollReveal className="mt-12 grid gap-4 rounded-2xl border border-gd-border-soft bg-gd-card/70 p-6 sm:grid-cols-3">
            {[
              { step: "1", title: "We shadow your process", body: "Time on the floor, interviews with the people doing the work, and your existing documents." },
              { step: "2", title: "We model it back to you", body: "A written process model and screen designs in your own terminology, before any code." },
              { step: "3", title: "We build, train, hand over", body: "Delivered in stages, with your team trained and the source code in your hands." },
            ].map(item => (
              <div key={item.step}>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-gd-accent-500/20 bg-gd-accent-500/10 text-sm font-bold text-gd-accent-400">
                  {item.step}
                </span>
                <h3 className="mt-3 font-semibold text-gd-text-primary">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gd-text-secondary">{item.body}</p>
              </div>
            ))}
          </ScrollReveal>
        </div>
      </section>

      {/* ── Industries ── */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gd-accent-500/15 bg-gd-accent-500/5 px-3 py-1 text-xs font-medium text-gd-accent-400">
              <Factory className="h-3 w-3" /> Industries Served
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-gd-text-primary sm:text-4xl">
              Built for <span className="gradient-text">industrial businesses</span>
            </h2>
            <p className="mx-auto mt-3 max-w-2xl leading-relaxed text-gd-text-secondary">
              Different sectors, the same problem: the operation has outgrown the tools holding it together.
            </p>
          </div>

          <ScrollReveal stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {INDUSTRIES.map(industry => (
              <div
                key={industry.name}
                className="rounded-2xl border border-gd-border-soft bg-gd-card/70 p-5 transition-all duration-300 hover:border-gd-accent-500/25 hover:glow-ring"
              >
                <h3 className="font-semibold text-gd-text-primary">{industry.name}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gd-text-secondary">{industry.description}</p>
              </div>
            ))}
          </ScrollReveal>
        </div>
      </section>

      {/* ── CTA band ── */}
      <section className="border-t border-gd-border-soft bg-gd-base py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <ScrollReveal>
            <h2 className="text-3xl font-bold tracking-tight text-gd-text-primary sm:text-4xl">
              Tell us what you need <span className="gradient-text">built</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl leading-relaxed text-gd-text-secondary">
              Describe your process — the systems you have, what breaks, and what you wish existed. We&apos;ll come
              back with a plan and a realistic timeline.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/b2b"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 px-6 py-3 text-sm font-semibold text-gd-text-inverse shadow-lg shadow-gd-accent-500/20 transition-all hover:brightness-110"
              >
                Start a project inquiry <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/partners"
                className="inline-flex items-center gap-2 rounded-xl border border-gd-border-strong bg-gd-elevated/50 px-6 py-3 text-sm font-semibold text-gd-text-primary transition-all hover:border-gd-accent-500/30 hover:bg-gd-overlay"
              >
                Become a partner
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
