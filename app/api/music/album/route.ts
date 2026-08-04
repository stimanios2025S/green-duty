import { NextResponse } from "next/server";

const GRADIENTS = [
  "from-amber-400 to-orange-600", "from-lime-400 to-green-700",
  "from-orange-400 to-red-700", "from-sky-400 to-blue-700",
  "from-emerald-500 to-teal-700", "from-purple-400 to-indigo-700",
  "from-yellow-400 to-orange-700", "from-pink-400 to-rose-700",
];
const EMOJIS = ["🎵", "🎧", "🎸", "🎹", "🎷", "🌍", "✨", "🎶"];

/**
 * GET /api/music/album?albumId=...&albumImage=...
 * Returns ALL tracks of an album so the user can pick the exact morceau
 * (like Instagram's "choose which track of the album").
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const albumId = searchParams.get("albumId");
  const albumImage = searchParams.get("albumImage") || "";
  const albumName = searchParams.get("albumName") || "";
  const artistName = searchParams.get("artistName") || "";

  if (!albumId) return NextResponse.json({ tracks: [] });

  try {
    const res = await fetch(`https://api.deezer.com/album/${encodeURIComponent(albumId)}/tracks?limit=50`, { cache: "no-store" });
    if (!res.ok) return NextResponse.json({ tracks: [] });
    const data = await res.json();

    const tracks = (Array.isArray(data.data) ? data.data : []).map((t: any, i: number) => ({
      id: "dz_" + t.id,
      name: t.title,
      artist: artistName || "Unknown",
      album: albumName || t.album?.title || "",
      duration: fmt(t.duration),
      emoji: EMOJIS[i % EMOJIS.length],
      gradient: GRADIENTS[i % GRADIENTS.length],
      url: t.preview || "",
      albumImage,
      genre: "various",
      trackNumber: t.track_position || i + 1,
    })).filter((t: { url: string }) => t.url);

    return NextResponse.json({ tracks, albumName, artistName, albumImage });
  } catch (e) {
    console.error("[music/album]", e);
    return NextResponse.json({ tracks: [] });
  }
}

function fmt(sec: number): string {
  const s = Math.round(Number(sec) || 0);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}
