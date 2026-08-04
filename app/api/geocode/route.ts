import { NextResponse } from "next/server";

/**
 * Real geocoding search via Nominatim (OpenStreetMap) — free, no API key.
 * Lets users search ANY real place ("Algiers", "Paris", "New York") and get
 * the real name + coordinates back.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    if (!q?.trim()) return NextResponse.json({ results: [] });

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=8&q=${encodeURIComponent(q.trim())}`,
      { headers: { "User-Agent": "GreenDuty/1.0 (agri-tech platform)" }, next: { revalidate: 300 } }
    );
    if (!res.ok) return NextResponse.json({ results: [] }, { status: 502 });

    const data = await res.json();
    const results = (data as any[]).map(r => ({
      name: r.display_name.split(",").slice(0, 3).join(", "),
      fullName: r.display_name,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
    }));
    return NextResponse.json({ results });
  } catch (err) {
    console.error("[geocode]", err);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
