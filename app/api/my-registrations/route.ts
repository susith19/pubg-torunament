import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/requireAuth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth(req);
  if (error) return error;

  const data = db.prepare(`
    SELECT r.*, t.title, t.game, t.start_date
    FROM registrations r
    JOIN tournaments t ON r.tournament_id = t.id
    WHERE r.user_id = ?
    ORDER BY r.created_at DESC
  `).all(user.id);

  return NextResponse.json({ success: true, data });
}