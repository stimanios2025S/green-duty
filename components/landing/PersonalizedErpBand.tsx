"use client";
import Link from "next/link";
import { ArrowRight, Factory, Sparkles } from "lucide-react";
import { ScrollReveal } from "@/components/landing/ScrollReveal";
import { PERSONALIZED_ERP_POINTS } from "@/lib/catalog-data";

/**
 * The personalized-ERP argument — the agency's central claim.
 * Content lives in lib/catalog-data.ts so /catalogue tells the same story.
 */
export function PersonalizedErpBand() {
  return (
    <section data-perch className="relative overflow-hidden border-y border-gd-border-soft bg-gd-base py-20">
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute -right-32 top-1/4 h-80 w-80 rounded-full bg-gd-accent-500/5 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <ScrollReveal from="left">
            <div className="inline-flex items-center gap-2 rounded-full border border-gd-accent-500/20 bg-gd-accent-500/5 px-3 py-1 text-xs font-medium text-gd-accent-400">
              <Sparkles className="h-3 w-3" /> Our Speciality
            </div>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-gd-text-primary sm:text-4xl">
              A personalized ERP, <span className="gradient-text">not a template</span>
            </h2>
            <p className="mt-4 text-gd-text-secondary leading-relaxed">
              Most ERP projects fail the same way: the software arrives with the vendor&apos;s idea of how a factory
              should run, and your team spends two years bending around it. We do it the other way round.
            </p>
            <p className="mt-4 text-gd-text-secondary leading-relaxed">
              We start by documenting how your operation already works — the steps, the exceptions, the approvals,
              the words your people use — and we build the system to match that. The result is software your team
              recognises as theirs.
            </p>
            <Link
              href="/catalogue"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 px-5 py-3 text-sm font-semibold text-gd-text-inverse shadow-lg shadow-gd-accent-500/20 transition-all hover:brightness-110"
            >
              <Factory className="h-4 w-4" /> See how we build it
              <ArrowRight className="h-4 w-4" />
            </Link>
          </ScrollReveal>

          <ScrollReveal stagger from="right" className="grid gap-4 sm:grid-cols-2">
            {PERSONALIZED_ERP_POINTS.map(point => (
              <div
                key={point.title}
                className="rounded-2xl border border-gd-border-soft bg-gd-card/80 p-5 transition-all duration-300 hover:border-gd-accent-500/25 hover:glow-ring"
              >
                <div className="h-px w-8 bg-gradient-to-r from-gd-accent-500 to-gd-olive-500" />
                <h3 className="mt-4 font-semibold text-gd-text-primary">{point.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gd-text-secondary">{point.body}</p>
              </div>
            ))}
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
