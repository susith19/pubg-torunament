import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

// ── GET — list all awarded points ─────────────────────────
export async function GET(req: NextRequest) {
  const { user, error } = await requireAdmin(req);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const search     = searchParams.get("search") || "";
  const tournament = searchParams.get("tournament") || "All";

  const conditions: string[] = [];
  const params: any[]        = [];

  if (search) {
    conditions.push(`(r.team_name LIKE ? OR t.title LIKE ?)`);
    params.push(`%${search}%`, `%${search}%`);
  }

  if (tournament !== "All") {
    conditions.push(`t.title = ?`);
    params.push(tournament);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const awards = db
    .prepare(
      `
      SELECT
        p.id,
        r.team_name    AS teamName,
        t.title        AS tournament,
        p.reference_id AS position,
        p.points,
        p.created_at   AS awardedAt
      FROM points p
      JOIN registrations r ON r.id  = CAST(p.reference_id AS INTEGER)
      JOIN tournaments   t ON t.id  = r.tournament_id
      ${where}
      AND p.type = 'match_win'
      ORDER BY p.created_at DESC
      `
    )
    .all(...params) as any[];

  // summary — always unfiltered
  const summary = db
    .prepare(
      `
      SELECT
        COALESCE(SUM(points), 0)  AS totalPoints,
        COUNT(*)                  AS totalAwards
      FROM points
      WHERE type = 'match_win'
      `
    )
    .get() as any;

  const tournamentList = db
    .prepare(
      `
      SELECT DISTINCT t.title
      FROM points p
      JOIN registrations r ON r.id = CAST(p.reference_id AS INTEGER)
      JOIN tournaments   t ON t.id = r.tournament_id
      WHERE p.type = 'match_win'
      ORDER BY t.title
      `
    )
    .all()
    .map((t: any) => t.title);

  return NextResponse.json({ awards, summary, tournaments: tournamentList });
}

// ── POST — award points to a team ─────────────────────────
export async function POST(req: NextRequest) {
  const { user, error } = await requireAdmin(req);
  if (error) return error;

  const body = await req.json();
  const { registrationId, position, points } = body;

  if (!registrationId || !position || !points || points <= 0) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Get registration + user
  const reg = db
    .prepare(`SELECT * FROM registrations WHERE id = ?`)
    .get(registrationId) as any;

  if (!reg) {
    return NextResponse.json({ error: "Registration not found" }, { status: 404 });
  }

  // Insert into points ledger
  const result = db
    .prepare(
      `INSERT INTO points (user_id, points, type, reference_id)
       VALUES (?, ?, 'match_win', ?)`
    )
    .run(reg.user_id, points, String(registrationId));

  if (result.changes === 0) {
    return NextResponse.json({ error: "Failed to insert points" }, { status: 500 });
  }

  // Update user total_points
  db.prepare(
    `UPDATE users SET total_points = total_points + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).run(points, reg.user_id);

  return NextResponse.json({ success: true, id: result.lastInsertRowid });
}