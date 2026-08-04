import { getDb } from "./db";

/** Streak → emoji progression (Snapchat flame → GreenDuty growing tree).
 *  NOTE: client-safe helpers (streakEmoji/streakLabel) live in chat-client.ts
 *  so the messages page can import them without pulling node:sqlite. */
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

/**
 * Recompute a conversation's streak from its messages.
 * Snapchat-style: each consecutive day with at least one message keeps it alive.
 * Returns { streak, streakTrees } where streakTrees are the trees earned at
 * milestones (7, 14, 30, then every 10) — counted toward the platform.
 */
export async function recomputeStreak(conversationId: string): Promise<{ streak: number; streakTrees: number }> {
  const d = await getDb();
  const rows = await d.prepare(
    "SELECT DISTINCT substr(created_at, 1, 10) as day FROM messages WHERE conversation_id = ? ORDER BY day ASC"
  ).all(conversationId) as any[];

  if (!rows.length) return { streak: 0, streakTrees: 0 };

  // Count consecutive days ending today/yesterday (Snapchat rule)
  const days = rows.map(r => r.day as string);
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  let streak = 0;
  let cursor = days.includes(today) || days.includes(yesterday) ? (days.includes(today) ? today : yesterday) : null;
  if (!cursor) return { streak: 0, streakTrees: 0 };

  while (cursor) {
    if (!days.includes(cursor)) break;
    streak++;
    const prev = new Date(new Date(cursor + "T00:00:00Z").getTime() - 86400000).toISOString().slice(0, 10);
    cursor = prev;
  }

  // Trees earned at milestones: 7, 14, 30, 40, 50, 60... (7 then every 10 after 30)
  const milestones = [7, 14, 30];
  let streakTrees = 0;
  for (const m of milestones) if (streak >= m) streakTrees++;
  if (streak > 30) streakTrees += Math.floor((streak - 30) / 10);

  await d.prepare("UPDATE conversations SET streak = ?, streak_last = ? WHERE id = ?")
    .run(streak, days[days.length - 1], conversationId);

  return { streak, streakTrees };
}

/** Milestone trees earned fresh since the last save (for adding to the counter) */
export async function applyStreakTrees(userId: string, conversationId: string, streakTrees: number): Promise<void> {
  const d = await getDb();
  const conv = await d.prepare("SELECT streak_trees FROM conversations WHERE id = ?").get(conversationId) as any;
  const prev = Number(conv?.streak_trees || 0);
  if (streakTrees <= prev) return;
  const added = streakTrees - prev;
  await d.prepare("UPDATE conversations SET streak_trees = ? WHERE id = ?").run(streakTrees, conversationId);
  await d.prepare("UPDATE users SET points = points + ? WHERE id = ?").run(added * 50, userId);
}
