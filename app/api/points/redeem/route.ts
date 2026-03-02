import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
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
    const winPts = (db.prepare(`
      SELECT COALESCE(SUM(pts.points),0) AS t FROM points pts
      WHERE pts.user_id = ? AND pts.type IN ('match_win','referral')
    `).get(user.id) as any).t;

    const redeemedPts = (db.prepare(`
      SELECT COALESCE(SUM(amount),0) AS t FROM redeems
      WHERE user_id = ? AND status IN ('approved','pending')
    `).get(user.id) as any).t;

    const available = winPts - redeemedPts;

    if (points > available) {
      return NextResponse.json({ error: "Insufficient points balance" }, { status: 400 });
    }

    // Insert redeem request
    const result = db.prepare(`
      INSERT INTO redeems (user_id, amount, method, detail, status, created_at)
      VALUES (?, ?, ?, ?, 'pending', datetime('now'))
    `).run(user.id, points, method, detail);

    return NextResponse.json({
      success: true,
      redeemId: result.lastInsertRowid,
      message: "Redeem request submitted. Processed in 2–24 hours.",
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Redeem failed" }, { status: 500 });
  }
}