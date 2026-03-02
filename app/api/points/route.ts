import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/requireAuth";

export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth(req);
  if (error) return error;

  // ── TOTALS ────────────────────────────────────────────────
  const winningPts = (db.prepare(`
    SELECT COALESCE(SUM(points),0) AS t FROM points
    WHERE user_id = ? AND type = 'match_win'
  `).get(user.id) as any).t;

  const referralPts = (db.prepare(`
    SELECT COALESCE(SUM(points),0) AS t FROM points
    WHERE user_id = ? AND type = 'referral'
  `).get(user.id) as any).t;

  const redeemedPts = (db.prepare(`
    SELECT COALESCE(SUM(amount),0) AS t FROM redeems
    WHERE user_id = ? AND status = 'approved'
  `).get(user.id) as any).t;

  // ── WINNING HISTORY ───────────────────────────────────────
  const winningHistory = db.prepare(`
  SELECT
    p.id,
    p.points,
    p.created_at AS date,
    r.team_name AS teamName,
    t.title AS tournament,
    1 AS position
  FROM points p
  LEFT JOIN registrations r ON r.id = CAST(p.reference_id AS INTEGER)
  LEFT JOIN tournaments t ON t.id = r.tournament_id
  WHERE p.user_id = ? AND p.type = 'match_win'
  ORDER BY p.created_at DESC
  LIMIT 20
`).all(user.id);

  // ── REFERRAL HISTORY ──────────────────────────────────────
  const referralHistory = db.prepare(`
  SELECT
    p.id,
    p.points AS earned,
    p.created_at AS date,
    COALESCE(u.name, 'Anonymous') AS userName
  FROM points p
  LEFT JOIN users u ON u.id = CAST(p.reference_id AS INTEGER)
  WHERE p.user_id = ? AND p.type = 'referral'
  ORDER BY p.created_at DESC
  LIMIT 20
`).all(user.id);

  // ── REDEEM HISTORY ────────────────────────────────────────
  const redeemHistory = db.prepare(`
  SELECT 
    id,
    amount,
    upi_id AS detail,
    'UPI' AS method,
    status,
    created_at AS date
  FROM redeems
  WHERE user_id = ?
  ORDER BY created_at DESC
  LIMIT 20
`).all(user.id);

  // ── REFERRAL CODE ─────────────────────────────────────────
  const me = db.prepare(`SELECT referral_code FROM users WHERE id = ?`).get(user.id) as any;

  // badge helper
  function badge(pos: number): string {
    return pos === 1 ? "gold" : pos === 2 ? "silver" : pos === 3 ? "bronze" : "default";
  }

  function fmtDate(iso: string): string {
    if (!iso) return "—";
    return new Date(iso.replace(" ", "T")).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    });
  }

  return NextResponse.json({
    success: true,
    points: {
      total:    winningPts + referralPts,
      winning:  winningPts,
      referral: referralPts,
      redeemed: redeemedPts,
    },
    referralCode: me?.referral_code ?? null,
    winningHistory: winningHistory.map((w: any) => ({
      ...w,
      badge:    badge(w.position),
      date:     fmtDate(w.date),
    })),
    referralHistory: referralHistory.map((r: any) => ({
      ...r,
      date: fmtDate(r.date),
    })),
    redeemHistory: redeemHistory.map((r: any) => ({
      ...r,
      date: fmtDate(r.date),
    })),
  });
}