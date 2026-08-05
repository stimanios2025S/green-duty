"use client";
import { useState, useEffect, useRef } from "react";
import anime from "animejs";
import { HotspotMap } from "@/components/eco-map/HotspotMap";
import { ReportModal } from "@/components/eco-map/ReportModal";
import { SponsorPanel } from "@/components/eco-map/SponsorPanel";
import { LeaderboardPanel } from "@/components/eco-map/LeaderboardPanel";
import { CleanupEventsPanel } from "@/components/eco-map/CleanupEventsPanel";
import { AnimeWrapper } from "@/components/ui/AnimeWrapper";
import { Plus } from "lucide-react";

export default function EcoMapPage() {
  const [showReport, setShowReport] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [reportCoords, setReportCoords] = useState<{ lat: number; lng: number } | null>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (titleRef.current) {
      anime({ targets: titleRef.current, opacity: [0, 1], translateY: [20, 0], duration: 600, easing: "easeOutCubic" });
    }
  }, []);

  // Listen for map clicks → open the report modal pre-filled with the clicked spot
  useEffect(() => {
    const onReportAt = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.lat && detail?.lng) {
        setReportCoords({ lat: detail.lat, lng: detail.lng });
        setShowReport(true);
      }
    };
    window.addEventListener("gd:report-at", onReportAt);
    return () => window.removeEventListener("gd:report-at", onReportAt);
  }, []);

  return (
    <div className="space-y-6">
      <AnimeWrapper animate="fadeIn">
        <div ref={titleRef} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gd-text-primary tracking-tight">Eco Action Map</h1>
            <p className="text-sm text-gd-text-secondary mt-1">Report pollution hotspots, join cleanups, and track environmental impact</p>
          </div>
          <button
            onClick={() => setShowReport(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gd-accent-500 to-gd-accent-600 px-4 py-2.5 text-sm font-semibold text-gd-text-inverse shadow-lg shadow-gd-accent-500/20 hover:shadow-gd-accent-500/40 hover:brightness-110 transition-all"
          >
            <Plus className="h-4 w-4" /> Report Hotspot
          </button>
        </div>
      </AnimeWrapper>

      <HotspotMap refreshKey={refreshKey} />
      <div className="grid gap-6 lg:grid-cols-2">
        <SponsorPanel />
        <LeaderboardPanel />
      </div>
      <CleanupEventsPanel refreshKey={refreshKey} />
      <ReportModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        onSubmitted={() => { setRefreshKey(k => k + 1); setReportCoords(null); }}
        initialLat={reportCoords?.lat ?? null}
        initialLng={reportCoords?.lng ?? null}
      />
    </div>
  );
}
