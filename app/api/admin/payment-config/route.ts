// app/api/admin/payment-config/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const QR_DIR     = path.join(process.cwd(), "public", "uploads", "qr");
const QR_FILENAME = "payment-qr.png";

// ── GET current payment config ────────────────────────────
export async function GET(req: NextRequest) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  // Upsert: create a default row if none exists yet
  const config = await prisma.payment_config.upsert({
    where:  { id: 1 },
    update: {},
    create: {
      id:       1,
      upi_id:   "",
      upi_name: "",
      qr_path:  "",
      qr_url:   "",
      note:     "",
    },
  });

  return NextResponse.json(config);
}

// ── PUT update payment config (supports multipart/form-data for QR) ──
export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const contentType = req.headers.get("content-type") ?? "";

  let upi_id:   string | undefined;
  let upi_name: string | undefined;
  let note:     string | undefined;
  let qr_url:   string | undefined;
  let qr_path:  string | undefined;

  // ── Multipart (includes QR image) ────────────────────────
  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();

    upi_id   = formData.get("upi_id")   as string | undefined;
    upi_name = formData.get("upi_name") as string | undefined;
    note     = formData.get("note")     as string | undefined;

    const file = formData.get("qr_image") as File | null;

    if (file && file.size > 0) {
      // Validate: image only, max 2 MB
      if (!file.type.startsWith("image/")) {
        return NextResponse.json({ error: "QR file must be an image" }, { status: 400 });
      }
      if (file.size > 2 * 1024 * 1024) {
        return NextResponse.json({ error: "QR image must be under 2 MB" }, { status: 400 });
      }

      // Save to public/uploads/qr/payment-qr.png
      await mkdir(QR_DIR, { recursive: true });
      const buffer = Buffer.from(await file.arrayBuffer());
      const filePath = path.join(QR_DIR, QR_FILENAME);
      await writeFile(filePath, buffer);

      // Public URL served by Next.js static file serving
      qr_url  = `/uploads/qr/${QR_FILENAME}?t=${Date.now()}`; // cache-bust
      qr_path = filePath;
    }
  } else {
    // ── JSON (text fields only) ───────────────────────────
    const body = await req.json();
    upi_id   = body.upi_id;
    upi_name = body.upi_name;
    note     = body.note;
  }

  // Build update object — only include defined fields
  const data: Record<string, any> = {};
  if (upi_id   !== undefined) data.upi_id   = upi_id.trim();
  if (upi_name !== undefined) data.upi_name = upi_name.trim();
  if (note     !== undefined) data.note     = note.trim();
  if (qr_url   !== undefined) data.qr_url   = qr_url;
  if (qr_path  !== undefined) data.qr_path  = qr_path;

  const updated = await prisma.payment_config.upsert({
    where:  { id: 1 },
    update: data,
    create: {
      id:       1,
      upi_id:   upi_id   ?? "",
      upi_name: upi_name ?? "",
      qr_url:   qr_url   ?? "",
      qr_path:  qr_path  ?? "",
      note:     note     ?? "",
    },
  });

  return NextResponse.json({ success: true, config: updated });
}