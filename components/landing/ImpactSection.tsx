"use client";
import { useEffect, useState } from "react";
import { Factory, Gauge, Building2, Target, Layers, ShieldCheck, Users, Wrench } from "lucide-react";
import { ScrollReveal } from "@/components/landing/ScrollReveal";
import { Card } from "@/components/ui/Card";

interface AgencyStats {
  systemsDelivered?: number;
  projectsActive?: number;
  clientsServed?: number;
  industriesServed?: number;
  partners?: number;
}

/**
 * Track record — real counts, straight from the database.
 *
 * Deliberately no progress bars toward invented goals: an agency's numbers
 * are what they are, and a bar filling toward "20,000" would be decoration
 * pretending to be a measurement.
 */
export function ImpactSection() {
  const [stats, setStats] = useState<AgencyStats | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then(r => (r.ok ? r.json() : null))
      .then(d => d && setStats(d.agency || {}))
      .catch(() => {});
  }, []);

  const cards = [
    {
      label: "Systems Delivered",
      value: stats?.systemsDelivered ?? 0,
      icon: <Gauge className="h-4 w-4" />,
      note: "Live in production",
    },
    {
      label: "Projects In Progress",
      value: stats?.projectsActive ?? 0,
      icon: <Factory className="h-4 w-4" />,
      note: "Being built right now",
    },
    {
      label: "Clients Served",
      value: stats?.clientsServed ?? 0,
      icon: <Building2 className="h-4 w-4" />,
      note: "Businesses we build for",
    },
    {
      label: "Industries Served",
      value: stats?.industriesServed ?? 0,
      icon: <Layers className="h-4 w-4" />,
      note: "Sectors in production",
    },
  ];

  const promises = [
    { icon: <ShieldCheck className="h-3.5 w-3.5" />, text: "You own the code and the data" },
    { icon: <Wrench className="h-3.5 w-3.5" />, text: "Documented handover and training" },
    { icon: <Users className="h-3.5 w-3.5" />, text: `${stats?.partners ?? 0} active partners` },
  ];

  return (
    <section data-perch className="relative overflow-hidden bg-gd-deepest py-20">
      <div className="absolute -right-40 top-0 h-96 w-96 rounded-full bg-gd-olive-500/5 blur-3xl" />
      <div className="absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-gd-accent-500/5 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mb-14 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-gd-accent-500/15 bg-gd-accent-500/5 px-3 py-1 text-xs font-medium text-gd-accent-400 mb-4">
            <Target className="h-3 w-3" /> Track Record
          </div>
          <h2 className="text-3xl font-bold text-gd-text-primary tracking-tight sm:text-4xl">
            Systems running in <span className="gradient-text">real factories</span>
          </h2>
          <p className="mt-3 text-gd-text-secondary max-w-2xl mx-auto leading-relaxed">
            Every figure below is read live from our project records — the same numbers our team works from.
          </p>
        </div>

        <ScrollReveal stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(card => (
            <Card key={card.label} className="relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-gd-border-soft bg-gd-elevated/60 text-gd-accent-400">
                  {card.icon}
                </div>
              </div>
              <p className="mt-4 text-3xl font-bold text-gd-text-primary tracking-tight tabular-nums">
                {card.value.toLocaleString()}
              </p>
              <p className="mt-1 text-xs font-medium text-gd-text-muted uppercase tracking-wider">{card.label}</p>
              <p className="mt-3 border-t border-gd-border pt-3 text-[11px] text-gd-text-muted">{card.note}</p>
            </Card>
          ))}
        </ScrollReveal>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          {promises.map((b, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-full border border-gd-border-soft bg-gd-card/70 px-4 py-2 text-xs font-medium text-gd-text-secondary backdrop-blur-sm"
            >
              <span className="text-gd-accent-400">{b.icon}</span> {b.text}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
