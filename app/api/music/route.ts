import { NextResponse } from "next/server";
import { MUSIC_TRACKS, searchLocalTracks } from "@/lib/instagro-music";

const GRADIENTS = [
  "from-amber-400 to-orange-600", "from-lime-400 to-green-700",
  "from-orange-400 to-red-700", "from-sky-400 to-blue-700",
  "from-emerald-500 to-teal-700", "from-purple-400 to-indigo-700",
  "from-yellow-400 to-orange-700", "from-pink-400 to-rose-700",
];
const EMOJIS = ["🎵", "🎧", "🎸", "🎹", "🎷", "🌍", "✨", "🎶"];

/**
 * GET /api/music?q=...&genre=...
 * Searches the whole world's music:
 *  - If JAMENDO_CLIENT_ID is set: real Jamendo search (100k+ songs, all genres,
 *    Creative-Commons licensed, free streams) — proxied so the key stays secret.
 *  - Otherwise: falls back to the built-in catalog so the picker always works.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const genre = (searchParams.get("genre") || "all").trim();

  const key = process.env.JAMENDO_CLIENT_ID;

  if (key) {
    try {
      const url = new URL("https://api.jamendo.com/v3.0/tracks/");
      url.searchParams.set("client_id", key);
      url.searchParams.set("format", "json");
      url.searchParams.set("limit", "30");
      url.searchParams.set("include", "musicinfo");
      url.searchParams.set("audioformat", "mp32");
      url.searchParams.set("order", "popularity_total");
      if (q) url.searchParams.set("search", q);
      if (genre && genre !== "all") url.searchParams.set("tags", genre);

      const res = await fetch(url.toString(), { next: { revalidate: 300 } });
      if (res.ok) {
        const data = await res.json();
        const tracks = (data.results || []).map((t: any, i: number) => ({
          id: "j_" + t.id,
          name: t.name,
          artist: t.artist_name,
          duration: fmt(t.duration),
          emoji: EMOJIS[i % EMOJIS.length],
          gradient: GRADIENTS[i % GRADIENTS.length],
          url: t.audio,
          genre: t.musicinfo?.tags?.join(", ") || "various",
        }));
        return NextResponse.json({ tracks, source: "jamendo" });
      }
    } catch (e) {
      console.error("[music] Jamendo failed:", e);
    }
  }

  return NextResponse.json({ tracks: searchLocalTracks(q, genre), source: "local" });
}

function fmt(sec: number): string {
  const s = Math.round(Number(sec) || 0);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

// Keep the constant referenced so tree-shaking doesn't drop it
export { MUSIC_TRACKS };
