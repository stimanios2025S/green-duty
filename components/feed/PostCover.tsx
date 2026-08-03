"use client";

// Deterministic branded gradient covers for feed posts (like an IG image header)
const COVERS: { from: string; to: string; icon: string }[] = [
  { from: "from-amber-400", to: "to-emerald-600", icon: "🌱" },
  { from: "from-emerald-500", to: "to-teal-700", icon: "🌿" },
  { from: "from-orange-400", to: "to-amber-700", icon: "🌾" },
  { from: "from-lime-500", to: "to-emerald-800", icon: "🌳" },
  { from: "from-yellow-400", to: "to-orange-600", icon: "🌻" },
];

export function PostCover({ title, seed }: { title: string; seed: string }) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const c = COVERS[hash % COVERS.length];

  return (
    <div className={`relative flex h-48 items-center justify-center overflow-hidden bg-gradient-to-br ${c.from} ${c.to}`}>
      {/* subtle texture */}
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      <span className="relative text-6xl drop-shadow-lg">{c.icon}</span>
    </div>
  );
}
