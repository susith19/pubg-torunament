import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/requireAuth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth(req);
  if (error) return error;

  const referrals = db.prepare(`
    SELECT r.*, u.email
    FROM referrals r
    JOIN users u ON r.referred_user_id = u.id
    WHERE r.referrer_id = ?
  `).all(user.id);

  return NextResponse.json({
    success: true,
    referral_code: user.referral_code,
    referral_count: user.referral_count,
    data: referrals,
  });
}