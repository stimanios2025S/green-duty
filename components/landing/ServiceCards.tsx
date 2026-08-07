"use client";
import { ArrowRight, Cpu, CircuitBoard } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { b2bServices } from "@/lib/mock-data";
import { ScrollReveal } from "@/components/landing/ScrollReveal";

export function ServiceCards() {
  return (
    <section data-perch className="relative overflow-hidden bg-gd-deepest py-20">
      <div className="absolute -left-32 top-1/3 h-80 w-80 rounded-full bg-gd-accent-500/4 blur-3xl float-slow" />
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-gd-accent-500/15 bg-gd-accent-500/5 px-3 py-1 text-xs font-medium text-gd-accent-400 mb-4">
            <Cpu className="h-3 w-3" /> B2B Engineering
          </div>
          <h2 className="text-3xl font-bold text-gd-text-primary tracking-tight sm:text-4xl">
            Agri-Tech <span className="gradient-text">Engineering</span>
          </h2>
          <p className="mt-3 text-gd-text-secondary max-w-2xl mx-auto leading-relaxed">
            Custom web development, IoT greenhouse integration, automated irrigation, and farm management dashboards.
          </p>
          <Link href="/b2b" className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-gd-accent-400 hover:text-gd-accent-300 transition-colors">
            Explore all services <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <ScrollReveal stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {b2bServices.slice(0, 3).map((svc) => (
            <Card key={svc.id} hover className="group relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gd-accent-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gd-accent-500/15 to-gd-olive-500/10 text-gd-accent-400 border border-gd-accent-500/10 text-lg font-bold">
                {svc.name[0]}
              </div>
              <h3 className="mt-5 font-semibold text-gd-text-primary">{svc.name}</h3>
              <p className="mt-2 text-sm text-gd-text-secondary leading-relaxed">{svc.description}</p>
              <div className="mt-5 flex items-center justify-between pt-3 border-t border-gd-border">
                <span className="text-sm font-semibold text-gd-accent-400">{svc.priceRange}</span>
                <span className="text-xs text-gd-text-muted flex items-center gap-1">
                  <CircuitBoard className="h-3 w-3" /> {svc.deliveryTime}
                </span>
              </div>
            </Card>
          ))}
        </ScrollReveal>
      </div>
    </section>
  );
}
