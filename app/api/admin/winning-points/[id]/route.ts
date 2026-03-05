import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { getPlacementPoints } from "@/lib/points";

type RouteContext = { params: Promise<{ id: string }> };

// ── PATCH — edit award ────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const { id } = await params; // ← await params (Next.js 15)

  const { position, kills } = await req.json();

  if (position === undefined || kills === undefined) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const point = await prisma.point.findUnique({
    where: { id: Number(id) },
    include: { registration: { include: { tournament: true } } },
  });

  if (!point) {
    return NextResponse.json({ error: "Award not found" }, { status: 404 });
  }

  const mode      = point.registration?.tournament?.mode ?? "solo";
  const newPoints = getPlacementPoints(position, mode) + kills * 5;
  const diff      = newPoints - point.points; // can be negative (deduct) or positive (add)

  await prisma.$transaction([
    prisma.point.update({
      where: { id: Number(id) },
      data:  { position, kills, points: newPoints },
    }),
    prisma.user.update({
      where: { id: point.user_id! },
      data:  { total_points: { increment: diff } },
    }),
  ]);

  return NextResponse.json({ success: true, points: newPoints });
}

// ── DELETE — remove award ─────────────────────────────────
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const { id } = await params; // ← await params (Next.js 15)

  const point = await prisma.point.findUnique({
    where: { id: Number(id) },
  });

  if (!point) {
    return NextResponse.json({ error: "Award not found" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.point.delete({
      where: { id: Number(id) },
    }),
    prisma.user.update({
      where: { id: point.user_id! },
      data:  { total_points: { decrement: point.points } },
    }),
  ]);

  return NextResponse.json({ success: true });
}