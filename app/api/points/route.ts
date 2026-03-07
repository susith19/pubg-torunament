// app/api/points/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

function badge(pos: number): string {
  if (pos === 1) return "gold";
  if (pos === 2) return "silver";
  if (pos === 3) return "bronze";
  return "default";
}

function fmtDate(date: Date): string {
  if (!date) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth(req);
  if (error) return error;

  try {
    const userId = Number(user.id);

    // ── 1. Use User.total_points as the SINGLE source of truth ──
    // This is always kept in sync by every transaction that touches points.
    const userData = await prisma.user.findUnique({
      where:  { id: userId },
      select: { total_points: true, referral_code: true },
    });

    const totalPoints = userData?.total_points ?? 0;

    // ── 2. Breakdown by type (for the cards + progress bars) ──
    const breakdown = await prisma.point.groupBy({
      by:    ["type"],
      where: { user_id: userId },
      _sum:  { points: true },
    });

    const byType: Record<string, number> = {};
    for (const row of breakdown) {
      byType[row.type] = row._sum.points ?? 0;
    }

    // Positive earning buckets
    const winningPts  = byType["match_win"]  ?? 0;
    const referralPts = byType["referral"]   ?? 0;
    const bonusPts    = byType["bonus"]       ?? 0;

    // Total redeemed (cash withdrawals only — approved in Redeem table)
    const redeemedAgg = await prisma.redeem.aggregate({
      _sum:  { amount: true },
      where: { user_id: userId, status: "approved" },
    });
    const redeemedPts = redeemedAgg._sum.amount ?? 0;

    // ── 3. Winning history ─────────────────────────────────────
    const winningHistoryRaw = await prisma.point.findMany({
      where:   { user_id: userId, type: "match_win" },
      orderBy: { created_at: "desc" },
      take:    30,
      select: {
        id: true, points: true, created_at: true, position: true, note: true,
        registration: {
          select: {
            team_name: true,
            tournament: { select: { title: true } },
          },
        },
      },
    });

    const winningHistory = winningHistoryRaw.map((w) => ({
      id:         w.id,
      points:     w.points,
      date:       fmtDate(w.created_at),
      position:   w.position ?? 1,
      badge:      badge(w.position ?? 1),
      teamName:   w.registration?.team_name  ?? "—",
      tournament: w.registration?.tournament?.title ?? w.note ?? "Tournament",
    }));

    // ── 4. Referral history ────────────────────────────────────
    const referralHistoryRaw = await prisma.point.findMany({
      where:   { user_id: userId, type: "referral" },
      orderBy: { created_at: "desc" },
      take:    30,
      select: {
        id: true, points: true, created_at: true, reference_id: true,
      },
    });

    // Try to resolve the referred user's name for display
    const refUserIds = referralHistoryRaw
      .map((r) => r.reference_id)
      .filter(Boolean) as number[];

    const refUsers = refUserIds.length > 0
      ? await prisma.user.findMany({
          where:  { id: { in: refUserIds } },
          select: { id: true, name: true },
        })
      : [];

    const refUserMap: Record<number, string> = {};
    for (const u of refUsers) refUserMap[u.id] = u.name ?? "User";

    const referralHistory = referralHistoryRaw.map((r) => ({
      id:       r.id,
      earned:   r.points,
      date:     fmtDate(r.created_at),
      userName: r.reference_id ? (refUserMap[r.reference_id] ?? "User") : "User",
    }));

    // ── 5. Redeem history ──────────────────────────────────────
    const redeemHistoryRaw = await prisma.redeem.findMany({
      where:   { user_id: userId },
      orderBy: { created_at: "desc" },
      take:    30,
    });

    const redeemHistory = redeemHistoryRaw.map((r) => {
      // Parse stored "METHOD::detail" format
      const raw = r.upi_id ?? "";
      const [method, ...rest] = raw.includes("::") ? raw.split("::") : ["UPI", raw];
      return {
        id:     r.id,
        amount: r.amount,
        method: method ?? "UPI",
        detail: rest.join("::") || raw,
        status: r.status,
        date:   fmtDate(r.created_at),
      };
    });

    // ── 6. Return ──────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      points: {
        total:    totalPoints,   // ← from User.total_points, always correct
        winning:  winningPts,
        referral: referralPts,
        bonus:    bonusPts,
        redeemed: redeemedPts,   // approved cash redeems only
      },
      referralCode:   userData?.referral_code ?? null,
      winningHistory,
      referralHistory,
      redeemHistory,
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch rewards" }, { status: 500 });
  }
}