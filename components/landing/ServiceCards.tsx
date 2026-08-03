"use client";
import { ArrowRight, Cpu } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { b2bServices } from "@/lib/mock-data";
import { AnimeWrapper } from "@/components/ui/AnimeWrapper";

export function ServiceCards() {
  return (
    <section data-perch className="py-20 bg-gd-base">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-gd-accent-500/15 bg-gd-accent-500/5 px-3 py-1 text-xs font-medium text-gd-accent-400 mb-4">
            <Cpu className="h-3 w-3" /> B2B Engineering
          </div>
          <h2 className="text-3xl font-bold text-gd-text-primary tracking-tight">
            Agri-Tech Engineering
          </h2>
          <p className="mt-3 text-gd-text-secondary max-w-2xl mx-auto leading-relaxed">
            Custom web development, IoT greenhouse integration, automated irrigation, and farm management dashboards.
          </p>
          <Link href="/b2b" className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-gd-accent-400 hover:text-gd-accent-300 transition-colors">
            Explore all services <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <AnimeWrapper animate="stagger" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {b2bServices.slice(0, 3).map((svc) => (
            <Card key={svc.id} hover>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gd-accent-500/15 to-gd-olive-500/10 text-gd-accent-400 border border-gd-accent-500/10 text-lg font-bold">
                {svc.name[0]}
              </div>
              <h3 className="mt-5 font-semibold text-gd-text-primary">{svc.name}</h3>
              <p className="mt-2 text-sm text-gd-text-secondary leading-relaxed">{svc.description}</p>
              <div className="mt-5 flex items-center justify-between pt-3 border-t border-gd-border">
                <span className="text-sm font-semibold text-gd-accent-400">{svc.priceRange}</span>
                <span className="text-xs text-gd-text-muted">{svc.deliveryTime}</span>
              </div>
            </Card>
          ))}
        </AnimeWrapper>
      </div>
    </section>
  );
}
