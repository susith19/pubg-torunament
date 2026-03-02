import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";


// ── GET — list all awarded points ─────────────────────────
export async function GET(req: NextRequest) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const tournament = searchParams.get("tournament") || "All";

  // ⚠️ reference_id is STRING → registration id
  const pointsRaw = await prisma.point.findMany({
    where: {
      type: "match_win",
    },
    orderBy: { created_at: "desc" },
  });

  // Fetch related registrations
  const registrationIds = pointsRaw.map((p) => Number(p.reference_id));

  const registrations = await prisma.registration.findMany({
    where: {
      id: { in: registrationIds },
    },
    include: {
      tournament: true,
    },
  });

  const regMap = new Map(registrations.map((r) => [r.id, r]));

  // ── FILTER + FORMAT ─────────────────────
  const awards = pointsRaw
    .map((p) => {
      const reg = regMap.get(Number(p.reference_id));

      return {
        id: p.id,
        teamName: reg?.team_name,
        tournament: reg?.tournament?.title,
        position: p.reference_id,
        points: p.points,
        awardedAt: p.created_at,
      };
    })
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

  // ── SUMMARY ─────────────────────────────
  const summaryAgg = await prisma.point.aggregate({
    _sum: { points: true },
    _count: true,
    where: { type: "match_win" },
  });

  const summary = {
    totalPoints: summaryAgg._sum.points || 0,
    totalAwards: summaryAgg._count,
  };

  // ── TOURNAMENT LIST ─────────────────────
  const tournaments = [
    ...new Set(
      registrations
        .map((r) => r.tournament?.title)
        .filter(Boolean)
    ),
  ].sort();

  return NextResponse.json({ awards, summary, tournaments });
}


// ── POST — award points ─────────────────────────
export async function POST(req: NextRequest) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { registrationId, position, points } = body;

    if (!registrationId || !position || !points || points <= 0) {
      return NextResponse.json(
        { error: "Invalid payload" },
        { status: 400 }
      );
    }

    // Get registration
    const reg = await prisma.registration.findUnique({
      where: { id: Number(registrationId) },
    });

    if (!reg) {
      return NextResponse.json(
        { error: "Registration not found" },
        { status: 404 }
      );
    }

    // 🔥 TRANSACTION (VERY IMPORTANT)
    const result = await prisma.$transaction(async (tx) => {
      // Insert points
      const point = await tx.point.create({
        data: {
          user_id: reg.user_id!,
          points,
          type: "match_win",
          reference_id: String(registrationId),
        },
      });

      // Update user total points
      await tx.user.update({
        where: { id: reg.user_id! },
        data: {
          total_points: {
            increment: points,
          },
        },
      });

      return point;
    });

    return NextResponse.json({
      success: true,
      id: result.id,
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to award points" },
      { status: 500 }
    );
  }
}