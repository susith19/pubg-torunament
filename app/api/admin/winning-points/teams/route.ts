import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/admin";

// Returns all approved registrations for the "Select Team" dropdown
export async function GET(req: NextRequest) {
  const { user, error } = await requireAdmin(req);
  if (error) return error;

  const teams = db
    .prepare(
      `
      SELECT
        r.id            AS registrationId,
        r.team_name     AS teamName,
        r.captain_name  AS captain,
        t.title         AS tournament,
        t.mode,
        (SELECT COUNT(*) FROM players WHERE registration_id = r.id) AS players
      FROM registrations r
      JOIN tournaments t ON t.id = r.tournament_id
      WHERE r.status = 'approved'
      ORDER BY t.title, r.team_name
      `
    )
    .all();

  return NextResponse.json({ teams });
}