import {
  Factory,
  Gauge,
  TrendingUp,
  LayoutDashboard,
  Smartphone,
  Layers,
  BrainCircuit,
  Plug,
  Cpu,
} from "lucide-react";
import type { CatalogIconKey } from "@/lib/catalog-data";

/**
 * Maps a catalogue icon key to a real lucide component.
 *
 * Lives here rather than in lib/catalog-data.ts so the data module stays free
 * of React and can be imported from anywhere.
 */
const ICONS: Record<CatalogIconKey, typeof Factory> = {
  erp: Factory,
  mes: Gauge,
  crm: TrendingUp,
  web: LayoutDashboard,
  mobile: Smartphone,
  platform: Layers,
  ai: BrainCircuit,
  integration: Plug,
  analytics: Cpu,
};

export function OfferingIcon({ icon, className }: { icon: CatalogIconKey; className?: string }) {
  const Icon = ICONS[icon] ?? Factory;
  return <Icon className={className} />;
}
