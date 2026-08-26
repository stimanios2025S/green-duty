import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-helpers";
import path from "node:path";
import fs from "node:fs";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const ALLOWED_EXTENSIONS = ["png", "jpg", "jpeg", "webp"];

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const contentType = req.headers.get("content-type") || "";

    // ── Handle base64 or URL fallback ──
    if (contentType.includes("application/json")) {
      const body = await req.json();

      // URL passthrough — only allow whitelisted image hosts
      if (typeof body.url === "string" && body.url.startsWith("http")) {
        try {
          const parsedUrl = new URL(body.url);
          const hostname = parsedUrl.hostname.toLowerCase();
          const ALLOWED_HOSTS = [
            "images.unsplash.com",
            "cdn.pixabay.com",
            "res.cloudinary.com",
            "i.imgur.com",
            "upload.wikimedia.org",
          ];
          const isAllowed = ALLOWED_HOSTS.some(h => hostname === h || hostname.endsWith("." + h));
          if (!isAllowed) {
            return NextResponse.json({ error: "Image URL host not allowed." }, { status: 400 });
          }
          // Reject non-image file extensions
          const ext = parsedUrl.pathname.split(".").pop()?.toLowerCase() || "";
          if (ext && !ALLOWED_EXTENSIONS.includes(ext)) {
            return NextResponse.json({ error: "URL must point to an image file." }, { status: 400 });
          }
          return NextResponse.json({ url: body.url });
        } catch {
          return NextResponse.json({ error: "Invalid URL format." }, { status: 400 });
        }
      }

      // Base64 image upload
      if (typeof body.base64 === "string") {
        const match = body.base64.match(/^data:image\/(png|jpe?g|webp);base64,(.+)$/);
        if (!match) {
          return NextResponse.json({ error: "Invalid base64 image format." }, { status: 400 });
        }
        const ext = match[1] === "jpeg" ? "jpg" : match[1];
        const data = match[2];
        // Validate size before writing (base64 is ~33% larger than raw)
        const estimatedSize = (data.length * 3) / 4;
        if (estimatedSize > MAX_SIZE) {
          return NextResponse.json({ error: "Image must be under 5MB." }, { status: 400 });
        }
        const filename = `upload-${userId.slice(0, 8)}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
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

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json({ error: "Invalid file extension." }, { status: 400 });
    }
    const filename = `upload-${userId.slice(0, 8)}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
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
