import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth-helpers";
import { genId } from "@/lib/instagro-api";
import { productListingSchema } from "@/lib/validations";

// GET /api/products → list products (with optional category/seller filters)
export async function GET(req: NextRequest) {
  try {
    const d = await getDb();
    const { searchParams } = req.nextUrl;
    const category = searchParams.get("category");
    const sellerId = searchParams.get("sellerId");
    const search = searchParams.get("search");

    let sql = "SELECT * FROM products WHERE 1=1";
    const args: unknown[] = [];

    if (category && category !== "all") {
      sql += " AND category = ?";
      args.push(category);
    }
    if (sellerId) {
      sql += " AND seller_id = ?";
      args.push(sellerId);
    }
    if (search) {
      sql += " AND (name LIKE ? OR description LIKE ?)";
      args.push(`%${search}%`, `%${search}%`);
    }
    sql += " ORDER BY created_at DESC LIMIT 100";

    const rows = await d.prepare(sql).all(...args);
    const products = rows.map(mapRow);
    return NextResponse.json({ products });
  } catch (err) {
    console.error("[products]", err);
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}

// POST /api/products → create a product listing (seller only)
export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const d = await getDb();
    const user = await d.prepare("SELECT id, name, account_type FROM users WHERE id = ?").get(userId) as any;
    if (!user || user.account_type !== "seller") {
      return NextResponse.json({ error: "Only sellers can create products." }, { status: 403 });
    }

    const body = await req.json();
    const parsed = productListingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { name, description, category, price, stock, qualityCertified, organicCertified, warrantyMonths, features } = parsed.data;
    const imageUrl = body.imageUrl || null;

    const id = genId("prod");
    await d.prepare(`
      INSERT INTO products (id, name, description, category, price, currency, stock, quality_certified, organic_certified, seller_id, seller_name, seller_verified, image_url, images, rating, review_count, warranty_months, features, created_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      id, name, description, category, price, "DZD", stock,
      qualityCertified ? 1 : 0, organicCertified ? 1 : 0,
      userId, user.name, 0,
      imageUrl, imageUrl ? JSON.stringify([imageUrl]) : null,
      0, 0, warrantyMonths,
      JSON.stringify(features), new Date().toISOString()
    );

    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (err) {
    console.error("[products:post]", err);
    return NextResponse.json({ error: "Failed to create product." }, { status: 500 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(r: any) {
  let images: string[] = [];
  try { images = r.images ? JSON.parse(r.images) : []; } catch {}
  let features: string[] = [];
  try { features = r.features ? JSON.parse(r.features) : []; } catch {}
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    category: r.category,
    price: Number(r.price),
    currency: r.currency || "DZD",
    stock: Number(r.stock),
    qualityCertified: !!r.quality_certified,
    organicCertified: !!r.organic_certified,
    sellerId: r.seller_id,
    sellerName: r.seller_name,
    sellerVerified: !!r.seller_verified,
    imageUrl: r.image_url || undefined,
    images,
    rating: Number(r.rating || 0),
    reviewCount: Number(r.review_count || 0),
    warrantyMonths: Number(r.warranty_months || 0),
    createdAt: r.created_at,
    features,
  };
}
