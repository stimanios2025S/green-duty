"use client";

import dynamic from "next/dynamic";

const EcoMapClient = dynamic(() => import("@/components/eco-map/EcoMapClient").then(m => m.EcoMapClient), { ssr: false });

export default function EcoMapPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <EcoMapClient />
    </div>
  );
}
