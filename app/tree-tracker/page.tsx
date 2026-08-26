"use client";
import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import anime from "animejs";
import { TreeCounter } from "@/components/tree-tracker/TreeCounter";
import { AnimeWrapper } from "@/components/ui/AnimeWrapper";
import { Card } from "@/components/ui/Card";
import { Heart, TreePine, MapPin, Leaf, ArrowRight, Users, Globe, Sprout } from "lucide-react";
import Link from "next/link";

const TreePlantingMap = dynamic(() => import("@/components/tree-tracker/TreePlantingMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[600px] items-center justify-center rounded-2xl border border-gd-border-strong bg-gd-elevated/50">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 border-3 border-gd-olive-500/20 border-t-gd-olive-500 rounded-full animate-spin" />
        <p className="mt-3 text-xs text-gd-text-muted">Loading map...</p>
      </div>
    </div>
  ),
});

const IMPACT_STATS = [
  { icon: TreePine, value: "12,450+", label: "Trees Planted", color: "text-gd-olive-500" },
  { icon: MapPin, value: "48", label: "Wilayas Covered", color: "text-gd-accent-400" },
  { icon: Users, value: "3,200+", label: "Contributors", color: "text-gd-info" },
  { icon: Globe, value: "960", label: "Tons CO₂ Offset", color: "text-gd-success" },
];

const HOW_IT_WORKS = [
  { step: "1", icon: MapPin, title: "Pick a Location", desc: "Choose any spot on the map where you want to plant a tree" },
  { step: "2", icon: Sprout, title: "Report Planting", desc: "Enter the tree name and species, confirm the planting spot" },
  { step: "3", icon: Leaf, title: "Track Growth", desc: "Watch your tree grow and see the collective impact across Algeria" },
];

export default function TreeTrackerPage() {
  const titleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (titleRef.current) {
      anime({ targets: titleRef.current, opacity: [0, 1], translateY: [20, 0], duration: 600, easing: "easeOutCubic" });
    }
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <AnimeWrapper animate="fadeIn">
        <div ref={titleRef} className="text-center py-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-gd-olive-500/20 bg-gd-olive-500/5 px-4 py-1.5 mb-4">
            <TreePine className="h-4 w-4 text-gd-olive-500" />
            <span className="text-xs font-semibold text-gd-olive-500">Reforestation Initiative</span>
          </div>
          <h1 className="text-3xl font-bold text-gd-text-primary tracking-tight">
            Tree <span className="gradient-text">Tracker</span>
          </h1>
          <p className="mt-3 text-sm text-gd-text-secondary max-w-lg mx-auto leading-relaxed">
            Help us reforest Algeria. Pick a location, plant a tree, and track our collective impact in real-time.
          </p>
        </div>
      </AnimeWrapper>

      {/* Impact Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {IMPACT_STATS.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="text-center py-4">
              <Icon className={`mx-auto h-5 w-5 ${stat.color} mb-1`} />
              <p className="text-lg font-bold text-gd-text-primary">{stat.value}</p>
              <p className="text-[10px] text-gd-text-muted font-medium">{stat.label}</p>
            </Card>
          );
        })}
      </div>

      {/* Tree Counter */}
      <AnimeWrapper animate="fadeIn" delay={200}>
        <TreeCounter />
      </AnimeWrapper>

      {/* Interactive Map */}
      <AnimeWrapper animate="fadeIn" delay={300}>
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gd-text-primary flex items-center gap-2">
              <MapPin className="h-5 w-5 text-gd-accent-400" /> Choose a Planting Location
            </h2>
            <p className="text-[10px] text-gd-text-muted">Click anywhere on the map</p>
          </div>
          <TreePlantingMap />
        </div>
      </AnimeWrapper>

      {/* How It Works */}
      <AnimeWrapper animate="fadeIn" delay={400}>
        <div>
          <h2 className="text-lg font-bold text-gd-text-primary text-center mb-5">How It Works</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {HOW_IT_WORKS.map((item, i) => {
              const Icon = item.icon;
              return (
                <Card key={i} className="text-center relative overflow-hidden group hover:border-gd-accent-500/20 transition-all">
                  <div className="absolute -top-2 -right-2 h-12 w-12 rounded-full bg-gd-accent-500/5 flex items-center justify-center text-2xl font-bold text-gd-accent-500/10">
                    {item.step}
                  </div>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gd-accent-500/5 border border-gd-accent-500/15 group-hover:scale-110 transition-transform">
                    <Icon className="h-6 w-6 text-gd-accent-400" />
                  </div>
                  <p className="mt-3 text-sm font-semibold text-gd-text-primary">{item.title}</p>
                  <p className="mt-1 text-xs text-gd-text-secondary leading-relaxed">{item.desc}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </AnimeWrapper>

      {/* Donate CTA */}
      <AnimeWrapper animate="fadeIn" delay={500}>
        <Card className="text-center !bg-gradient-to-br !from-gd-olive-500/10 !to-gd-accent-500/5 !border-gd-olive-500/15">
          <Heart className="mx-auto h-8 w-8 text-gd-success mb-3" />
          <h3 className="text-lg font-bold text-gd-text-primary">Can&apos;t Plant Right Now?</h3>
          <p className="mt-2 text-sm text-gd-text-secondary max-w-md mx-auto">
            Donate to fund tree planting. We handle the logistics — you get the impact.
            500 DA plants one tree in Algeria.
          </p>
          <Link
            href="/donations"
            className="inline-flex items-center gap-2 mt-4 rounded-xl bg-gradient-to-r from-gd-olive-500 to-gd-olive-600 px-6 py-3 text-sm font-semibold text-gd-text-inverse shadow-lg shadow-gd-olive-500/20 hover:shadow-gd-olive-500/40 hover:brightness-110 transition-all"
          >
            <Heart className="h-4 w-4" /> Donate Now <ArrowRight className="h-4 w-4" />
          </Link>
        </Card>
      </AnimeWrapper>
    </div>
  );
}
