import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth(req);
  if (error) return error;

  try {
    // ── PROFILE ───────────────────────────────────────────────
    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        referral_code: true,
        created_at: true,
      },
    });

    if (!profile || profile === null) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ── STATS ─────────────────────────────────────────────────
    const matchesPlayedCount = await prisma.registration.count({
      where: {
        user_id: user.id,
        status: "approved",
      },
    });

    const upcomingMatchesCount = await prisma.registration.count({
      where: {
        user_id: user.id,
        status: "approved",
        tournament: {
          status: {
            in: ["open", "upcoming"],
          },
        },
      },
    });

    // ── POINTS ────────────────────────────────────────────────
    const winPtsAgg = await prisma.point.aggregate({
      _sum: { points: true },
      where: {
        user_id: user.id,
        type: "match_win",
      },
    });

    const referralPtsAgg = await prisma.point.aggregate({
      _sum: { points: true },
      where: {
        user_id: user.id,
        type: "referral",
      },
    });

    const redeemedPtsAgg = await prisma.redeem.aggregate({
      _sum: { amount: true },
      where: {
        user_id: user.id,
        status: "approved",
      },
    });

    const winningPts = winPtsAgg._sum.points || 0;
    const referralPts = referralPtsAgg._sum.points || 0;
    const redeemedPts = redeemedPtsAgg._sum.amount || 0;
    const totalPoints = winningPts + referralPts;

    return NextResponse.json({
      success: true,
      profile: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        referralCode: profile.referral_code,
        joinedAt: profile.created_at,
      },
      stats: {
        matchesPlayed: matchesPlayedCount,
        upcomingMatches: upcomingMatchesCount,
        totalPoints,
        winningPoints: winningPts,
        referralPoints: referralPts,
        redeemedPoints: redeemedPts,
      },
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

// ── UPDATE PROFILE ────────────────────────────────────────
export async function PUT(req: NextRequest) {
  const { user, error } = await requireAuth(req);
  if (error) return error;

  try {
    const { name, phone } = await req.json();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        phone,
      },
    });

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}