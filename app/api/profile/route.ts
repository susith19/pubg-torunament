import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/requireAuth";

export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth(req);
  if (error) return error;

  // ── PROFILE ───────────────────────────────────────────────
  const profile = db.prepare(`
    SELECT id, name, email, phone, referral_code, created_at
    FROM users WHERE id = ? AND is_deleted = 0
  `).get(user.id) as any;

  if (!profile) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // ── STATS ─────────────────────────────────────────────────
  const matchesPlayed = (db.prepare(`
    SELECT COUNT(*) AS c FROM registrations
    WHERE user_id = ? AND status = 'approved'
  `).get(user.id) as any).c;

  const upcomingMatches = (db.prepare(`
    SELECT COUNT(*) AS c FROM registrations r
    JOIN tournaments t ON t.id = r.tournament_id
    WHERE r.user_id = ? AND r.status = 'approved'
    AND t.status IN ('open','upcoming')
  `).get(user.id) as any).c;

  // ── POINTS ────────────────────────────────────────────────
  const winningPts = (db.prepare(`
    SELECT COALESCE(SUM(points),0) AS total
    FROM points WHERE user_id = ? AND type = 'match_win'
  `).get(user.id) as any).total;

  const referralPts = (db.prepare(`
    SELECT COALESCE(SUM(points),0) AS total
    FROM points WHERE user_id = ? AND type = 'referral'
  `).get(user.id) as any).total;

  const redeemedPts = (db.prepare(`
    SELECT COALESCE(SUM(amount),0) AS total
    FROM redeems WHERE user_id = ? AND status = 'approved'
  `).get(user.id) as any).total;

  const totalPoints = winningPts + referralPts;

  return NextResponse.json({
    success: true,
    profile: {
      id:            profile.id,
      name:          profile.name,
      email:         profile.email,
      phone:         profile.phone,
      referralCode:  profile.referral_code,
      joinedAt:      profile.created_at,
    },
    stats: {
      matchesPlayed,
      upcomingMatches,
      totalPoints,
      winningPoints:  winningPts,
      referralPoints: referralPts,
      redeemedPoints: redeemedPts,
    },
  });
}

// ── UPDATE PROFILE ────────────────────────────────────────
export async function PUT(req: NextRequest) {
  const { user, error } = await requireAuth(req);
  if (error) return error;

  try {
    const { name, phone } = await req.json();
    db.prepare(`UPDATE users SET name = ?, phone = ? WHERE id = ?`)
      .run(name, phone, user.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}