import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth(req);
  if (error) return error;

  try {
    const { points, method, detail } = await req.json();

    if (!points || points < 200) {
      return NextResponse.json({ error: "Minimum 200 points required" }, { status: 400 });
    }
    if (!method || !detail?.trim()) {
      return NextResponse.json({ error: "Payout details required" }, { status: 400 });
    }

    // Check available balance
    const winPtsAgg = await prisma.point.aggregate({
      _sum: { points: true },
      where: {
        user_id: user.id,
        type: { in: ["match_win", "referral"] },
      },
    });

    const redeemedAgg = await prisma.redeem.aggregate({
      _sum: { amount: true },
      where: {
        user_id: user.id,
        status: { in: ["approved", "pending"] },
      },
    });

    const winPts = winPtsAgg._sum.points || 0;
    const redeemedPts = redeemedAgg._sum.amount || 0;
    const available = winPts - redeemedPts;

    if (points > available) {
      return NextResponse.json({ error: "Insufficient points balance" }, { status: 400 });
    }

    // Insert redeem request
    const redeem = await prisma.redeem.create({
      data: {
        user_id: user.id,
        amount: points,
        method,
        detail,
        status: "pending",
      },
    });

    return NextResponse.json({
      success: true,
      redeemId: redeem.id,
      message: "Redeem request submitted. Processed in 2–24 hours.",
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Redeem failed" }, { status: 500 });
  }
}