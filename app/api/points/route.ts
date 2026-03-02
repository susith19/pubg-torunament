import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth(req);
  if (error) return error;

  try {
    // ── TOTALS ────────────────────────────────────────────────
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

    // ── WINNING HISTORY ───────────────────────────────────────
    const winningHistoryRaw = await prisma.point.findMany({
      where: {
        user_id: user.id,
        type: "match_win",
      },
      select: {
        id: true,
        points: true,
        created_at: true,
        reference_id: true,
        registration: {
          select: {
            team_name: true,
            tournament: {
              select: {
                title: true,
              },
            },
          },
        },
      },
      orderBy: { created_at: "desc" },
      take: 20,
    });

    const winningHistory = winningHistoryRaw.map((w) => ({
      id: w.id,
      points: w.points,
      date: w.created_at,
      teamName: w.registration?.team_name ?? "—",
      tournament: w.registration?.tournament?.title ?? "—",
      position: 1, // Default position; adjust based on your business logic
    }));

    // ── REFERRAL HISTORY ──────────────────────────────────────
    const referralHistoryRaw = await prisma.point.findMany({
      where: {
        user_id: user.id,
        type: "referral",
      },
      select: {
        id: true,
        points: true,
        created_at: true,
        reference_id: true,
        referee: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
      take: 20,
    });

    const referralHistory = referralHistoryRaw.map((r) => ({
      id: r.id,
      earned: r.points,
      date: r.created_at,
      userName: r.referee?.name ?? "Anonymous",
    }));

    // ── REDEEM HISTORY ────────────────────────────────────────
    const redeemHistoryRaw = await prisma.redeem.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: "desc" },
      take: 20,
    });

    const redeemHistory = redeemHistoryRaw.map((r) => ({
      id: r.id,
      amount: r.amount,
      detail: r.detail,
      method: r.method,
      status: r.status,
      date: r.created_at,
    }));

    // ── REFERRAL CODE ─────────────────────────────────────────
    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: { referral_code: true },
    });

    // ── HELPERS ───────────────────────────────────────────────
    function badge(pos: number): string {
      return pos === 1 ? "gold" : pos === 2 ? "silver" : pos === 3 ? "bronze" : "default";
    }

    function fmtDate(date: Date): string {
      if (!date) return "—";
      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }

    return NextResponse.json({
      success: true,
      points: {
        total: winningPts + referralPts,
        winning: winningPts,
        referral: referralPts,
        redeemed: redeemedPts,
      },
      referralCode: userRecord?.referral_code ?? null,
      winningHistory: winningHistory.map((w) => ({
        ...w,
        badge: badge(w.position),
        date: fmtDate(w.date),
      })),
      referralHistory: referralHistory.map((r) => ({
        ...r,
        date: fmtDate(r.date),
      })),
      redeemHistory: redeemHistory.map((r) => ({
        ...r,
        date: fmtDate(r.date),
      })),
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch rewards" }, { status: 500 });
  }
}