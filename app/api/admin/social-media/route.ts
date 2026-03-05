// app/api/admin/social-media/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

// ── GET all social media links ────────────────────────────
export async function GET(req: NextRequest) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const links = await prisma.social_media.findMany({
    orderBy: { created_at: "desc" },
  });

  return NextResponse.json(links);
}

// ── POST create new link ──────────────────────────────────
export async function POST(req: NextRequest) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const body = await req.json();
  const { platform, label, url, is_live, is_active } = body;

  if (!platform || !url) {
    return NextResponse.json({ error: "platform and url are required" }, { status: 400 });
  }

  if (!["youtube", "instagram"].includes(platform)) {
    return NextResponse.json({ error: "platform must be youtube or instagram" }, { status: 400 });
  }

  const link = await prisma.social_media.create({
    data: {
      platform,
      label:     label     ?? (platform === "youtube" ? "Live Stream" : "Instagram"),
      url,
      is_live:   is_live   ?? false,
      is_active: is_active ?? true,
    },
  });

  return NextResponse.json({ success: true, link });
}