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
 * Searches the WHOLE WORLD's music, including national/commercial artists:
 *  1. Deezer (public API, no key) — full commercial catalog, every country,
 *     album art + 30s previews (like Instagram's music clips)
 *  2. Jamendo (CC indie library) if Deezer is down
 *  3. Built-in catalog as the always-on fallback
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const genre = (searchParams.get("genre") || "all").trim();

  // ── 1. Deezer — the whole world (commercial artists, national musicians) ──
  try {
    const url = new URL("https://api.deezer.com/search");
    // Genre browsing: Deezer supports q=genre:"rock" style queries
    if (q) {
      url.searchParams.set("q", q);
    } else if (genre && genre !== "all") {
      url.searchParams.set("q", `genre:"${genre}"`);
    } else {
      url.searchParams.set("q", "top");
    }
    url.searchParams.set("limit", "30");

    const res = await fetch(url.toString(), { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.data) && data.data.length > 0) {
        const tracks = data.data
          .map((t: { id: number; title: string; duration: number; preview?: string; artist?: { name?: string }; album?: { title?: string; cover_medium?: string } }, i: number) => ({
            id: "dz_" + t.id,
            name: t.title,
            artist: t.artist?.name || "Unknown",
            album: t.album?.title || "",
            duration: fmt(t.duration),
            emoji: EMOJIS[i % EMOJIS.length],
            gradient: GRADIENTS[i % GRADIENTS.length],
            url: t.preview || "",
            albumImage: t.album?.cover_medium || "",
            genre: genre === "all" ? "various" : genre,
          }))
          .filter((t: { url: string }) => t.url); // only tracks with a playable preview
        if (tracks.length > 0) return NextResponse.json({ tracks, source: "deezer", count: tracks.length });
      }
    }
  } catch (e) {
    console.error("[music] Deezer failed:", e);
  }

  // ── 2. Jamendo (indie/CC world library) ──
  const key = process.env.JAMENDO_CLIENT_ID?.trim();
  if (key) {
    try {
      const url = new URL("https://api.jamendo.com/v3.0/tracks/");
      url.searchParams.set("client_id", key);
      url.searchParams.set("format", "json");
      url.searchParams.set("limit", "30");
      url.searchParams.set("include", "musicinfo");
      url.searchParams.set("audioformat", "mp32");
      url.searchParams.set("order", "popularity_total");
      if (q) { url.searchParams.set("search", q); url.searchParams.set("search_in", "all"); }
      if (genre && genre !== "all") url.searchParams.set("tags", genre);

      const res = await fetch(url.toString(), { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (data.headers?.status === "success" && Array.isArray(data.results) && data.results.length) {
        const tracks = (data.results || []).map((t: any, i: number) => {
          const rawTags = t.musicinfo?.tags;
          const g = Array.isArray(rawTags) ? rawTags.join(", ") : typeof rawTags === "string" && rawTags ? rawTags : "various";
          return {
            id: "j_" + t.id,
            name: t.name,
            artist: t.artist_name,
            album: t.album_name || "",
            duration: fmt(t.duration),
            emoji: EMOJIS[i % EMOJIS.length],
            gradient: GRADIENTS[i % GRADIENTS.length],
            url: t.audio,
            albumImage: t.album_image || t.image || "",
            genre: g,
          };
        });
        if (tracks.length) return NextResponse.json({ tracks, source: "jamendo", count: tracks.length });
      }
    } catch (e) {
      console.error("[music] Jamendo failed:", e);
    }
  }

  // ── 3. Built-in catalog fallback ──
  return NextResponse.json({ tracks: searchLocalTracks(q, genre), source: "local" });
}

function fmt(sec: number): string {
  const s = Math.round(Number(sec) || 0);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

export { MUSIC_TRACKS };
