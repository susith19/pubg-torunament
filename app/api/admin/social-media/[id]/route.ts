// app/api/admin/social-media/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

// ── PATCH update link ─────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const { id } = await params;
  const body    = await req.json();

  const ALLOWED = ["platform", "label", "url", "is_live", "is_active"] as const;
  const data: any = {};
  for (const key of ALLOWED) {
    if (key in body) data[key] = body[key];
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  try {
    const updated = await prisma.social_media.update({
      where: { id: Number(id) },
      data,
    });
    return NextResponse.json({ success: true, link: updated });
  } catch {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }
}

// ── DELETE remove link ────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const { id } = await params;

  try {
    await prisma.social_media.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }
}