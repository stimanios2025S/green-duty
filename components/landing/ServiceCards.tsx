"use client";
import { ArrowRight, Cpu, Clock } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { OfferingIcon } from "@/components/catalog/OfferingIcon";
import { CATALOG_CATEGORY_LABEL, CATALOG_CATEGORY_VARIANT, FEATURED_OFFERINGS } from "@/lib/catalog-data";
import { ScrollReveal } from "@/components/landing/ScrollReveal";

export function ServiceCards() {
  return (
    <section data-perch className="relative overflow-hidden bg-gd-deepest py-20">
      <div className="absolute -left-32 top-1/3 h-80 w-80 rounded-full bg-gd-accent-500/4 blur-3xl float-slow" />
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-gd-accent-500/15 bg-gd-accent-500/5 px-3 py-1 text-xs font-medium text-gd-accent-400 mb-4">
            <Cpu className="h-3 w-3" /> What We Build
          </div>
          <h2 className="text-3xl font-bold text-gd-text-primary tracking-tight sm:text-4xl">
            Software for <span className="gradient-text">how you actually work</span>
          </h2>
          <p className="mt-3 text-gd-text-secondary max-w-2xl mx-auto leading-relaxed">
            ERP, MES and CRM systems, custom web and mobile applications, and integrations — built around your
            processes, your terminology and your rules.
          </p>
          <Link
            href="/catalogue"
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-gd-accent-400 hover:text-gd-accent-300 transition-colors"
          >
            Explore the catalogue <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <ScrollReveal stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURED_OFFERINGS.map(offering => (
            <Card key={offering.id} hover className="group relative overflow-hidden flex flex-col">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gd-accent-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gd-accent-500/15 to-gd-olive-500/10 text-gd-accent-400 border border-gd-accent-500/10">
                  <OfferingIcon icon={offering.icon} className="h-5 w-5" />
                </div>
                <Badge variant={CATALOG_CATEGORY_VARIANT[offering.category]}>
                  {CATALOG_CATEGORY_LABEL[offering.category]}
                </Badge>
              </div>

              <h3 className="mt-5 font-semibold text-gd-text-primary">{offering.name}</h3>
              <p className="mt-1 text-xs font-medium text-gd-accent-400">{offering.tagline}</p>
              <p className="mt-2 text-sm text-gd-text-secondary leading-relaxed flex-1">{offering.description}</p>

              <div className="mt-5 flex items-center justify-between border-t border-gd-border pt-3">
                <span className="text-xs text-gd-text-muted">{offering.modules.length} modules</span>
                <span className="flex items-center gap-1 text-xs text-gd-text-muted">
                  <Clock className="h-3 w-3" /> {offering.timeline}
                </span>
              </div>
            </Card>
          ))}
        </ScrollReveal>

        <ScrollReveal className="mt-10 text-center" delay={120}>
          <Link
            href="/catalogue"
            className="inline-flex items-center gap-2 rounded-xl border border-gd-border bg-gd-card px-5 py-3 text-sm font-medium text-gd-text-secondary transition-colors hover:border-gd-border-strong hover:bg-gd-elevated hover:text-gd-text-primary"
          >
            See the full catalogue <ArrowRight className="h-4 w-4" />
          </Link>
        </ScrollReveal>
      </div>
    </section>
  );
}
