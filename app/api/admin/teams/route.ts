import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

export async function GET(req: NextRequest) {
  const { user, error } = await requireAdmin(req);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const tournament = searchParams.get("tournament") || "All";
  const mode = searchParams.get("mode") || "All";
  const status = searchParams.get("status") || "All";

  // Build dynamic SQL filters
  const conditions: string[] = [];
  const params: any[] = [];

  if (search) {
    conditions.push(`(
      r.team_name LIKE ?
      OR r.captain_name LIKE ?
      OR t.title LIKE ?
      OR pay.transaction_id LIKE ?
    )`);
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }

  if (tournament !== "All") {
    conditions.push(`t.title = ?`);
    params.push(tournament);
  }

  if (mode !== "All") {
    conditions.push(`t.mode = ?`);
    params.push(mode);
  }

  if (status !== "All") {
    const dbStatus = status.toLowerCase(); // pending / verified / rejected
    // Map frontend labels → DB values
    const statusMap: Record<string, string> = {
      approved: "verified",
      pending: "pending",
      rejected: "rejected",
    };
    conditions.push(`pay.status = ?`);
    params.push(statusMap[dbStatus] ?? dbStatus);
  }

  const where =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const rows = db
    .prepare(
      `
      SELECT
        r.id,
        r.team_name        AS teamName,
        r.team_tag         AS teamTag,
        r.captain_name     AS captainName,
        r.captain_player_id AS captainPlayerId,
        r.status           AS slotStatus,
        r.created_at       AS registeredAt,

        t.id               AS tournamentId,
        t.title            AS tournament,
        t.game             AS platform,
        t.mode,
        t.map,
        t.entry_fee        AS fee,

        u.email,

        pay.id             AS paymentId,
        pay.transaction_id AS txnId,
        pay.status         AS paymentStatus,
        pay.method,
        pay.screenshot_url AS screenshotUrl

      FROM registrations r
      JOIN tournaments t   ON t.id = r.tournament_id
      JOIN users u         ON u.id = r.user_id
      LEFT JOIN payments pay ON pay.id = r.payment_id

      ${where}
      ORDER BY r.created_at DESC
    `
    )
    .all(...params) as any[];

  // Fetch players for each registration
  const teams = rows.map((row) => {
    const players = db
      .prepare(
        `SELECT player_name AS name, player_id AS playerId, is_captain AS isCaptain
         FROM players
         WHERE registration_id = ?`
      )
      .all(row.id) as any[];

    const captain = players.find((p) => p.isCaptain) ?? {
      name: row.captainName,
      playerId: row.captainPlayerId,
    };

    const members = players.filter((p) => !p.isCaptain);

    // Normalize payment status for frontend
    const payStatusMap: Record<string, string> = {
      verified: "Approved",
      pending: "Pending",
      rejected: "Rejected",
    };

    return {
      id: row.id,
      teamName: row.teamName,
      teamTag: row.teamTag,
      mode: row.mode,
      platform: row.platform,
      tournament: row.tournament,
      tournamentId: row.tournamentId,
      map: row.map,
      fee: row.fee,
      email: row.email,
      txnId: row.txnId ?? "—",
      screenshotUrl: row.screenshotUrl,
      registeredAt: row.registeredAt,
      paymentStatus: payStatusMap[row.paymentStatus] ?? "Pending",
      slotStatus: row.slotStatus === "approved" ? "Confirmed" : row.slotStatus === "rejected" ? "Rejected" : "Pending",
      captain,
      players: members,
    };
  });

  // Summary counts (unfiltered)
  const summary = db
    .prepare(
      `
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN pay.status = 'verified'  THEN 1 ELSE 0 END) AS approved,
        SUM(CASE WHEN pay.status = 'pending'   THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN pay.status = 'rejected'  THEN 1 ELSE 0 END) AS rejected
      FROM registrations r
      LEFT JOIN payments pay ON pay.id = r.payment_id
    `
    )
    .get() as any;

  // Distinct tournament list for filter dropdown
  const tournaments = db
    .prepare(`SELECT DISTINCT title FROM tournaments ORDER BY title`)
    .all()
    .map((t: any) => t.title);

  return NextResponse.json({ teams, summary, tournaments });
}