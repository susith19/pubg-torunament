import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";

export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const { id, status } = await req.json();

  db.prepare(`
    UPDATE tournaments 
    SET status = ? 
    WHERE id = ?
  `).run(status, id);

  return NextResponse.json({ success: true });
}