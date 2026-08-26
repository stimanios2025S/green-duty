import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-helpers";
import path from "node:path";
import fs from "node:fs";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const contentType = req.headers.get("content-type") || "";

    // ── Handle base64 or URL fallback ──
    if (contentType.includes("application/json")) {
      const body = await req.json();
      if (typeof body.url === "string" && body.url.startsWith("http")) {
        return NextResponse.json({ url: body.url });
      }
      if (typeof body.base64 === "string") {
        const ext = body.base64.match(/^data:image\/(\w+)/)?.[1] || "jpg";
        const data = body.base64.replace(/^data:image\/\w+;base64,/, "");
        const filename = `product-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        fs.mkdirSync(uploadsDir, { recursive: true });
        fs.writeFileSync(path.join(uploadsDir, filename), Buffer.from(data, "base64"));
        return NextResponse.json({ url: `/uploads/${filename}` });
      }
      return NextResponse.json({ error: "Provide a URL or base64 string." }, { status: 400 });
    }

    // ── Handle multipart/form-data ──
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided." }, { status: 400 });

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Only PNG, JPEG, and WebP images are allowed." }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File must be under 5MB." }, { status: 400 });
    }

    const ext = file.name.split(".").pop() || "jpg";
    const filename = `product-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    fs.mkdirSync(uploadsDir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(path.join(uploadsDir, filename), buffer);

    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (err) {
    console.error("[upload]", err);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
