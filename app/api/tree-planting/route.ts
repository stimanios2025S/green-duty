import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { genId } from "@/lib/instagro-api";

// GET /api/tree-planting → list planted trees
export async function GET() {
  try {
    const d = await getDb();
    const rows = await d.prepare("SELECT id, name, species, latitude, longitude, planted_at FROM tree_plantings ORDER BY planted_at DESC LIMIT 200").all();
    return NextResponse.json(rows);
  } catch (err) {
    console.error("[tree-planting]", err);
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}

// POST /api/tree-planting → report a new tree planting
export async function POST(req: Request) {
  try {
    const { latitude, longitude, name, species } = await req.json();
    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return NextResponse.json({ error: "Valid latitude and longitude required." }, { status: 400 });
    }
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Tree name is required." }, { status: 400 });
    }
    const d = await getDb();
    const id = genId("tree");
    await d.prepare(
      "INSERT INTO tree_plantings (id, name, species, latitude, longitude, planted_at) VALUES (?,?,?,?,?,?)"
    ).run(id, name.trim(), species?.trim() || null, latitude, longitude, new Date().toISOString());
    return NextResponse.json({ id, name: name.trim(), species: species?.trim() || null, latitude, longitude, planted_at: new Date().toISOString() }, { status: 201 });
  } catch (err) {
    console.error("[tree-planting]", err);
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}
