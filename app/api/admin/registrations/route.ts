import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const data = db.prepare(`
    SELECT r.*, u.email, t.title
    FROM registrations r
    JOIN users u ON r.user_id = u.id
    JOIN tournaments t ON r.tournament_id = t.id
  `).all();

  return NextResponse.json({ success: true, data });
}