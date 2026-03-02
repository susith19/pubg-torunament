import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "Tournament ID required" }, { status: 400 });
    }

    // ── TOURNAMENT ──────────────────────────────────────────
    const tournament = db.prepare(`
      SELECT * FROM tournaments WHERE id = ?
    `).get(id) as any;

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    // ── REGISTERED TEAMS (approved only) ───────────────────
    const teams = db.prepare(`
      SELECT
        r.id           AS registrationId,
        r.team_name    AS teamName,
        r.team_tag     AS teamTag,
        r.captain_name AS captainName,
        r.status       AS slotStatus
      FROM registrations r
      WHERE r.tournament_id = ?
      AND   r.status = 'approved'
      ORDER BY r.created_at ASC
    `).all(id) as any[];

    const teamsWithPlayers = teams.map((t) => {
      const players = db.prepare(`
        SELECT player_name AS name, player_id AS playerId, is_captain AS isCaptain
        FROM players
        WHERE registration_id = ?
        ORDER BY is_captain DESC
      `).all(t.registrationId) as any[];
      return { ...t, players };
    });

    // ── LEADERBOARD ─────────────────────────────────────────
    const leaderboard = db.prepare(`
      SELECT
        r.team_name AS teamName,
        pt.points,
        pt.created_at AS awardedAt
      FROM points pt
      JOIN registrations r ON r.id = CAST(pt.reference_id AS INTEGER)
      WHERE r.tournament_id = ?
      AND   pt.type = 'match_win'
      ORDER BY pt.points DESC
      LIMIT 5
    `).all(id) as any[];

    // ── NORMALIZE ───────────────────────────────────────────
    const STATUS_MAP: Record<string, string> = {
      open: "Open", upcoming: "Open", full: "Full",
      closed: "Closed", live: "Live",
    };

    const fillPercent = tournament.total_slots > 0
      ? Math.round((tournament.filled_slots / tournament.total_slots) * 100)
      : 0;

    return NextResponse.json({
      success: true,
      tournament: {
        ...tournament,
        slots_left:      tournament.total_slots - tournament.filled_slots,
        status:          STATUS_MAP[tournament.status?.toLowerCase()] ?? tournament.status,
        mode:            tournament.mode ? tournament.mode.charAt(0).toUpperCase() + tournament.mode.slice(1) : "—",
        fee:             tournament.entry_fee ? `₹${tournament.entry_fee}` : "Free",
        prize:           tournament.prize_pool ? `₹${Number(tournament.prize_pool).toLocaleString("en-IN")}` : "TBA",
        platform:        tournament.game === "BGMI" ? "Mobile" : "PC",
        fillPercent,
        slots:           tournament.total_slots,
        filled:          tournament.filled_slots,
        startFormatted:  tournament.start_date
          ? new Date(tournament.start_date.replace(" ", "T")).toLocaleString("en-IN", {
              day: "numeric", month: "short", year: "numeric",
              hour: "2-digit", minute: "2-digit", hour12: true,
            })
          : "TBA",
      },
      teams:      teamsWithPlayers,
      leaderboard,
      totalTeams: teamsWithPlayers.length,
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch tournament" }, { status: 500 });
  }
}