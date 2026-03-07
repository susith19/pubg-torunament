// app/api/points/redeem/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth(req);
  if (error) return error;

  try {
    const { points, method, detail } = await req.json();

    // ── Validations ──────────────────────────────────────
    if (!points || points < 200) {
      return NextResponse.json(
        { error: "Minimum 200 points required to redeem" },
        { status: 400 },
      );
    }

    if (!method || !detail?.trim()) {
      return NextResponse.json(
        { error: "Payout details required" },
        { status: 400 },
      );
    }

    // ── Fetch live balance from User.total_points ─────────
    // total_points is always kept in sync — it's the source of truth.
    const userData = await prisma.user.findUnique({
      where:  { id: Number(user.id) },
      select: { total_points: true },
    });

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const available = userData.total_points;

    if (points > available) {
      return NextResponse.json(
        { error: `Insufficient balance. You have ${available} pts, requested ${points} pts.` },
        { status: 400 },
      );
    }

    // ── Create redeem request + deduct points atomically ──
    // Points are deducted immediately (held). If admin rejects,
    // they must manually refund via the admin dashboard.
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the redeem request
      const redeem = await tx.redeem.create({
        data: {
          user_id:     Number(user.id),
          points_used: points,
          amount:      points,          // 1 pt = ₹1
          // Store method + detail together in upi_id since schema has no method field.
          // Format: "UPI::name@upi" or "Bank::AccNo/IFSC"
          upi_id:      `${method}::${detail.trim()}`,
          status:      "pending",
        },
      });

      // 2. Deduct from user wallet immediately (points are "held")
      await tx.user.update({
        where: { id: Number(user.id) },
        data:  { total_points: { decrement: points } },
      });

      // 3. Record the deduction in Point history
      await tx.point.create({
        data: {
          user_id: Number(user.id),
          points:  -points,
          type:    "redeem_cash",
          note:    `Cash redeem request #${redeem.id} — ₹${points} via ${method}`,
        },
      });

      return redeem;
    });

    return NextResponse.json({
      success:   true,
      redeemId:  result.id,
      message:   "Redeem request submitted. Processed in 2–24 hours.",
      deducted:  points,
      remaining: available - points,
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Redeem failed" }, { status: 500 });
  }
}