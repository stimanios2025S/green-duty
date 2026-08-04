/** Instagram-style filter presets (CSS filters) — named after IG's classic filters */
export interface FilterDef {
  name: string;
  css: string;
}

export const FILTERS: FilterDef[] = [
  { name: "Normal", css: "none" },
  { name: "Clarendon", css: "contrast(1.2) saturate(1.35) brightness(1.05)" },
  { name: "Gingham", css: "brightness(1.05) contrast(0.95) saturate(0.85) sepia(0.06)" },
  { name: "Moon", css: "grayscale(1) contrast(1.1) brightness(1.05)" },
  { name: "Lark", css: "brightness(1.05) contrast(0.92) saturate(0.8) sepia(0.1)" },
  { name: "Reyes", css: "sepia(0.22) brightness(1.1) contrast(0.85) saturate(0.75)" },
  { name: "Juno", css: "brightness(1.05) contrast(1.1) saturate(1.2) sepia(0.08)" },
  { name: "Slumber", css: "brightness(0.95) contrast(1.05) saturate(0.7) sepia(0.15) hue-rotate(-8deg)" },
  { name: "Crema", css: "brightness(1.08) contrast(0.9) sepia(0.25) saturate(0.9)" },
  { name: "Ludwig", css: "brightness(1.03) contrast(0.98) saturate(0.85) sepia(0.12)" },
  { name: "Aden", css: "brightness(1.08) contrast(0.92) saturate(0.85) sepia(0.2) hue-rotate(-10deg)" },
  { name: "Perpetua", css: "brightness(1.05) contrast(1.08) saturate(0.9) sepia(0.05) hue-rotate(2deg)" },
  { name: "Amaro", css: "brightness(1.08) contrast(0.95) saturate(1.15) sepia(0.1)" },
  { name: "Mayfair", css: "brightness(1.05) contrast(0.95) saturate(1.1) sepia(0.08) hue-rotate(-5deg)" },
  { name: "Rise", css: "brightness(1.05) contrast(0.9) saturate(1.1) sepia(0.12) hue-rotate(-15deg)" },
  { name: "Hudson", css: "brightness(1.1) contrast(0.9) saturate(1.1) sepia(0.15) hue-rotate(-15deg)" },
  { name: "Valencia", css: "brightness(1.08) contrast(0.92) sepia(0.25) saturate(0.9)" },
  { name: "X-Pro II", css: "contrast(1.15) brightness(0.98) saturate(1.1) sepia(0.15)" },
  { name: "Sierra", css: "brightness(0.95) contrast(0.95) saturate(0.85) sepia(0.2)" },
  { name: "Willow", css: "grayscale(0.9) contrast(1.05) brightness(1.05) sepia(0.1)" },
  { name: "Lo-Fi", css: "brightness(1.05) contrast(1.25) saturate(1.2)" },
  { name: "Inkwell", css: "grayscale(1) contrast(1.1) brightness(1.05) sepia(0.05)" },
  { name: "Nashville", css: "brightness(0.98) contrast(0.95) sepia(0.25) saturate(0.8) hue-rotate(-10deg)" },
];

/** Aspect ratios like IG's crop screen */
export const ASPECTS = [
  { name: "Original", value: 0 },
  { name: "1:1", value: 1 },
  { name: "4:5", value: 4 / 5 },
  { name: "16:9", value: 16 / 9 },
  { name: "9:16", value: 9 / 16 },
];

export interface Adjustments {
  brightness: number; // 0.5 - 1.5, default 1
  contrast: number;   // 0.5 - 1.5, default 1
  saturation: number; // 0 - 2, default 1
  warmth: number;     // -0.5 - 0.5, default 0
}

export const DEFAULT_ADJUST: Adjustments = { brightness: 1, contrast: 1, saturation: 1, warmth: 0 };

/** Build the full CSS filter string from a preset + manual adjustments */
export function buildFilterCss(filter: string, adj: Adjustments): string {
  const parts: string[] = [];
  if (filter && filter !== "none") parts.push(filter);
  if (adj.brightness !== 1) parts.push(`brightness(${adj.brightness})`);
  if (adj.contrast !== 1) parts.push(`contrast(${adj.contrast})`);
  if (adj.saturation !== 1) parts.push(`saturate(${adj.saturation})`);
  if (adj.warmth !== 0) {
    // warmth: positive = warm (sepia + hue), negative = cool
    if (adj.warmth > 0) parts.push(`sepia(${adj.warmth})`);
    else parts.push(`hue-rotate(${adj.warmth * 60}deg)`);
  }
  return parts.length ? parts.join(" ") : "none";
}

/** Apply the current filter+adjustments to an image and export a JPEG data URL */
export function exportFilteredImage(img: HTMLImageElement, filter: string, adj: Adjustments, quality = 0.85): string {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext("2d")!;
  ctx.filter = buildFilterCss(filter, adj);
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL("image/jpeg", quality);
}

/** Avatar options (client-safe — do not import from instagro-api, it's server-only) */
export const EMOJI_OPTIONS = ["🌿", "🌾", "🌻", "🌳", "🪱", "📡", "💧", "🧑‍🔬", "🗺️", "🐝"];
export const GRADIENT_OPTIONS = [
  "from-amber-400 to-orange-600",
  "from-lime-400 to-green-700",
  "from-teal-400 to-cyan-700",
  "from-sky-400 to-blue-700",
  "from-emerald-500 to-teal-800",
  "from-orange-400 to-red-700",
  "from-yellow-400 to-amber-700",
];

/** Curated locations for the IG-style location picker */
export const LOCATIONS = [
  { name: "Santos Organic Farm", city: "New York, NY" },
  { name: "GreenField Acres", city: "New Jersey" },
  { name: "Coney Island Beach", city: "Brooklyn, NY" },
  { name: "East River Park", city: "Manhattan, NY" },
  { name: "Valley View Farm", city: "Upstate NY" },
  { name: "Central Park", city: "Manhattan, NY" },
  { name: "AgriTech Greenhouse", city: "Boston, MA" },
  { name: "Algiers Urban Farm", city: "Algiers, DZ" },
];
