import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAdmin(req);
  if (error) return error;

  const { id } = await context.params;
  const body   = await req.json();

  // ── Full update (Create/Edit form) ────────────────────────
  // If all core fields are present, run the full UPDATE
  const isFull =
    "title"       in body &&
    "game"        in body &&
    "mode"        in body &&
    "map"         in body &&
    "entry_fee"   in body &&
    "total_slots" in body &&
    "start_date"  in body &&
    "status"      in body;

  if (isFull) {
    const result = db.prepare(`
      UPDATE tournaments
      SET title=?, game=?, mode=?, map=?,
          entry_fee=?, prize_pool=?, total_slots=?,
          start_date=?, status=?
      WHERE id = ?
    `).run(
      body.title,
      body.game,
      body.mode,
      body.map,
      body.entry_fee,
      body.prize_pool ?? 0,
      body.total_slots,
      body.start_date,
      body.status,
      Number(id),
    );

    if (result.changes === 0) {
      return NextResponse.json({ error: "No row updated" }, { status: 400 });
    }

    return NextResponse.json({ success: true, updated_by: user.email });
  }

  // ── Partial update (Room ID / Password only) ──────────────
  const ALLOWED_PARTIAL = ["room_id", "room_pass", "status"];

  const sets:   string[] = [];
  const values: any[]    = [];

  for (const key of ALLOWED_PARTIAL) {
    if (key in body) {
      sets.push(`${key} = ?`);
      values.push(body[key]);
    }
  }

  if (sets.length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  values.push(Number(id));

  const result = db
    .prepare(`UPDATE tournaments SET ${sets.join(", ")} WHERE id = ?`)
    .run(...values);

  if (result.changes === 0) {
    return NextResponse.json({ error: "No row updated" }, { status: 400 });
  }

  return NextResponse.json({ success: true, updated_by: user.email });
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const { id } = await context.params;

  const result = db.prepare("DELETE FROM tournaments WHERE id = ?").run(id);

  if (result.changes === 0) {
    return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}