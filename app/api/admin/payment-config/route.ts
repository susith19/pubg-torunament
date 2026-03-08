import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key:    process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

async function uploadQrToCloudinary(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder:          "payment-qr",
          public_id:       "payment-qr",   // fixed ID so it overwrites the old one
          overwrite:       true,
          resource_type:   "image",
          allowed_formats: ["jpg", "jpeg", "png", "webp"],
        },
        (err, result) => {
          if (err || !result) return reject(err ?? new Error("Upload failed"));
          resolve(result.secure_url);
        }
      )
      .end(buffer);
  });
}

// ── GET current payment config ────────────────────────────
export async function GET(req: NextRequest) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const config = await prisma.payment_config.upsert({
    where:  { id: 1 },
    update: {},
    create: {
      id:       1,
      upi_id:   "",
      upi_name: "",
      qr_url:   "",
      note:     "",
    },
  });

  return NextResponse.json(config);
}

// ── PUT update payment config ─────────────────────────────
export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const contentType = req.headers.get("content-type") ?? "";

  let upi_id:   string | undefined;
  let upi_name: string | undefined;
  let note:     string | undefined;
  let qr_url:   string | undefined;

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    upi_id   = formData.get("upi_id")   as string | undefined;
    upi_name = formData.get("upi_name") as string | undefined;
    note     = formData.get("note")     as string | undefined;

    const file = formData.get("qr_image") as File | null;

    if (file && file.size > 0) {
      if (!file.type.startsWith("image/")) {
        return NextResponse.json({ error: "QR file must be an image" }, { status: 400 });
      }
      if (file.size > 2 * 1024 * 1024) {
        return NextResponse.json({ error: "QR image must be under 2 MB" }, { status: 400 });
      }

      // ✅ Upload to Cloudinary — no disk write
      qr_url = await uploadQrToCloudinary(file);
    }
  } else {
    const body = await req.json();
    upi_id   = body.upi_id;
    upi_name = body.upi_name;
    note     = body.note;
  }

  const data: Record<string, any> = {};
  if (upi_id   !== undefined) data.upi_id   = upi_id.trim();
  if (upi_name !== undefined) data.upi_name = upi_name.trim();
  if (note     !== undefined) data.note     = note.trim();
  if (qr_url   !== undefined) data.qr_url   = qr_url;

  const updated = await prisma.payment_config.upsert({
    where:  { id: 1 },
    update: data,
    create: {
      id:       1,
      upi_id:   upi_id   ?? "",
      upi_name: upi_name ?? "",
      qr_url:   qr_url   ?? "",
      note:     note     ?? "",
    },
  });

  return NextResponse.json({ success: true, config: updated });
}