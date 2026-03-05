import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { getPlacementPoints } from "@/lib/points";

// ── GET — list all awarded points ─────────────────────────
export async function GET(req: NextRequest) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const tournament = searchParams.get("tournament") || "All";

  const points = await prisma.point.findMany({
    where: { type: "match_win" },
    include: {
      registration: {
        include: {
          tournament: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
  });

  const awards = points
    .map((p) => ({
      id: p.id,
      teamName: p.registration?.team_name,
      tournament: p.registration?.tournament?.title,
      position: p.position,
      kills: p.kills, // ← ADD THIS
      mode: p.registration?.tournament?.mode, // ← ADD THIS
      points: p.points,
      awardedAt: p.created_at,
    }))
    .filter((a) => {
      if (search) {
        return (
          a.teamName?.toLowerCase().includes(search.toLowerCase()) ||
          a.tournament?.toLowerCase().includes(search.toLowerCase())
        );
      }

      return true;
    })
    .filter((a) => {
      if (tournament !== "All") {
        return a.tournament === tournament;
      }
      return true;
    });

  const summaryAgg = await prisma.point.aggregate({
    _sum: { points: true },
    _count: true,
    where: { type: "match_win" },
  });

  const summary = {
    totalPoints: summaryAgg._sum.points || 0,
    totalAwards: summaryAgg._count,
  };

  const tournaments = [
    ...new Set(
      points.map((p) => p.registration?.tournament?.title).filter(Boolean),
    ),
  ];

  return NextResponse.json({
    awards,
    summary,
    tournaments,
  });
}

// ── POST — award points ─────────────────────────
export async function POST(req: NextRequest) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { registrationId, position, kills } = body;

    if (!registrationId || position === undefined || kills === undefined) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const reg = await prisma.registration.findUnique({
      where: { id: Number(registrationId) },
      include: { tournament: true },
    });

    if (!reg) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 },
      );
    }

    const mode = reg.tournament?.mode ?? "solo";

    const placementPoints = getPlacementPoints(position, mode);
    const killPoints = kills * 5;

    const totalPoints = placementPoints + killPoints;

    const result = await prisma.$transaction(async (tx) => {
      const point = await tx.point.create({
        data: {
          user_id: reg.user_id!,
          type: "match_win",
          registration_id: reg.id,
          position,
          kills,
          points: totalPoints,
        },
      });

      await tx.user.update({
        where: { id: reg.user_id! },
        data: {
          total_points: {
            increment: totalPoints,
          },
        },
      });

      return point;
    });

    return NextResponse.json({
      success: true,
      points: totalPoints,
      id: result.id,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Failed to award points" },
      { status: 500 },
    );
  }
}
