"use client";

/**
 * Thin wrapper around the real ThreeUI SylvaHero component.
 * The actual 3D scene (moss-root world, ferns, flowers, pollen, butterfly)
 * is loaded from inner-green-3d.html inside an iframe by the ThreeUI runtime.
 */
import { SylvaHero as ThreeUISylvaHero } from "@designcodeio/threeui";
import "@designcodeio/threeui/style.css";

export interface HeroStat {
  label: string;
  value: string;
}

export interface HeroCard {
  tagline: string;
  title: string;
  image: string;
  href: string;
}

export interface SylvaHeroProps {
  title?: string;
  subtitle?: string;
  card1?: HeroCard;
  stats?: [HeroStat, HeroStat];
  card2?: HeroCard;
}

export default function SylvaHero(_props: SylvaHeroProps) {
  return (
    <div className="shader-frame" style={{ width: "100%", minHeight: "100vh", position: "relative" }}>
      <ThreeUISylvaHero
        headingFont="lexend"
        bodyFont="lexend"
        headingWeight="300"
        bodyWeight="300"
        primaryColor="#ffffff"
        headingSize={63}
        bodySize={16.5}
        headingLetterSpacing={-0.006}
      />
    </div>
  );
}
