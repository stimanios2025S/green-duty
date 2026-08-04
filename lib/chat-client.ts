/** Client-safe streak helpers (no node:sqlite import) — safe for browser bundles */

export function streakEmoji(streak: number): string {
  if (streak >= 30) return "🌳";
  if (streak >= 14) return "🌿";
  if (streak >= 7) return "🌱";
  if (streak >= 3) return "🪴";
  return "🌰";
}

export function streakLabel(streak: number): string {
  if (streak === 0) return "Start a streak — message daily to grow a tree";
  if (streak < 3) return `${streak} day streak 🌰 — keep it going`;
  if (streak < 7) return `${streak} day streak 🪴`;
  if (streak < 14) return `${streak} day streak 🌱 — it's growing!`;
  if (streak < 30) return `${streak} day streak 🌿 — almost a tree!`;
  return `${streak} day streak 🌳 — a full tree!`;
}
