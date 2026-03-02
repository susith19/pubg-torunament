import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/requireAuth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth(req);
  if (error) return error;

  try {
    // ── Detect which columns exist in registrations ───────────
    // Different projects may have slightly different column names
    const regCols = (db.prepare(`PRAGMA table_info(registrations)`).all() as any[])
      .map((c) => c.name);
    const tCols = (db.prepare(`PRAGMA table_info(tournaments)`).all() as any[])
      .map((c) => c.name);

    const hasCaptainName  = regCols.includes("captain_name");
    const hasUpiId        = regCols.includes("upi_id");
    const hasTransactionId = regCols.includes("transaction_id");
    const hasRoomId       = tCols.includes("room_id");
    const hasRoomPass     = tCols.includes("room_pass");
    const hasPrizePool    = tCols.includes("prize_pool");
    const hasFilledSlots  = tCols.includes("filled_slots");

    const sql = `
      SELECT
        r.id         AS registrationId,
        r.team_name  AS teamName,
        r.team_tag   AS teamTag,
        ${hasCaptainName   ? "r.captain_name  AS captainName,"   : "NULL AS captainName,"}
        r.status     AS regStatus,
        r.created_at AS registeredAt,
        ${hasUpiId         ? "r.upi_id        AS upiId,"         : "NULL AS upiId,"}
        ${hasTransactionId ? "r.transaction_id AS transactionId," : "NULL AS transactionId,"}

        t.id         AS tournamentId,
        t.title      AS tournamentName,
        t.map,
        t.mode,
        t.game,
        t.entry_fee,
        ${hasPrizePool    ? "t.prize_pool,"                      : "0 AS prize_pool,"}
        t.total_slots,
        ${hasFilledSlots  ? "t.filled_slots,"                    : "0 AS filled_slots,"}
        t.start_date,
        t.status     AS tournamentStatus,

        ${hasRoomId   ? "CASE WHEN r.status = 'approved' THEN t.room_id   ELSE NULL END AS roomId,"   : "NULL AS roomId,"}
        ${hasRoomPass ? "CASE WHEN r.status = 'approved' THEN t.room_pass ELSE NULL END AS roomPass"  : "NULL AS roomPass"}

      FROM registrations r
      JOIN tournaments   t ON t.id = r.tournament_id
      WHERE r.user_id = ?
      ORDER BY t.start_date DESC
    `;

    const rows = db.prepare(sql).all(user.id) as any[];

    const STATUS_MAP: Record<string, string> = {
      open: "Open", upcoming: "Open", full: "Full",
      closed: "Closed", live: "Live",
    };

    const matches = rows.map((row) => {
      // Players — gracefully handle if table/columns differ
      let players: any[] = [];
      try {
        players = db.prepare(`
          SELECT player_name AS name, player_id AS playerId, is_captain AS isCaptain
          FROM players WHERE registration_id = ? ORDER BY is_captain DESC
        `).all(row.registrationId) as any[];
      } catch { players = []; }

      const startDate = row.start_date
        ? (() => { try { return new Date(String(row.start_date).replace(" ", "T")); } catch { return null; } })()
        : null;

      return {
        registrationId: row.registrationId,
        teamName:       row.teamName       ?? "—",
        teamTag:        row.teamTag        ?? "",
        captainName:    row.captainName    ?? "",
        regStatus:      row.regStatus      ?? "pending",
        registeredAt:   row.registeredAt   ?? "",
        transactionId:  row.transactionId  ?? "",

        tournament: {
          id:       row.tournamentId,
          name:     row.tournamentName ?? "—",
          map:      row.map            ?? "—",
          mode:     row.mode ? row.mode.charAt(0).toUpperCase() + row.mode.slice(1) : "—",
          platform: row.game === "BGMI" ? "Mobile" : "PC",
          game:     row.game ?? "",
          fee:      row.entry_fee  ? `₹${row.entry_fee}` : "Free",
          prize:    row.prize_pool ? `₹${Number(row.prize_pool).toLocaleString("en-IN")}` : "TBA",
          slots:    row.total_slots  ?? 0,
          filled:   row.filled_slots ?? 0,
          status:   STATUS_MAP[row.tournamentStatus?.toLowerCase()] ?? row.tournamentStatus ?? "—",
          startDate:      startDate ? startDate.toISOString() : null,
          startFormatted: startDate
            ? startDate.toLocaleString("en-IN", {
                day: "numeric", month: "short", year: "numeric",
                hour: "2-digit", minute: "2-digit", hour12: true,
              })
            : "TBA",
        },

        room: row.roomId ? { id: row.roomId, pass: row.roomPass ?? "" } : null,
        players,
      };
    });

    return NextResponse.json({ success: true, matches });

  } catch (err: any) {
    console.error("[my-matches] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch matches", detail: err?.message ?? "unknown" },
      { status: 500 }
    );
  }
}