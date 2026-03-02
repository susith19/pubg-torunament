import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";

const normalizeStatus = (s: string) => {
  if (!s) return "open";
  return s.toLowerCase();
};

export async function POST(req: NextRequest) {
  const { user, error } = await requireAdmin(req);
  if (error) return error;

  const body = await req.json();
  const date = new Date(body.start_date);

  if (isNaN(date.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  console.log("BODY:", body);
  const result = db
    .prepare(
      `
  INSERT INTO tournaments
  (title, game, mode, map, entry_fee, prize_pool, total_slots, start_date, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`,
    )
    .run(
      body.title,
      body.game,
      body.mode,
      body.map,
      body.entry_fee,
      body.prize_pool ?? 0,
      body.total_slots,
      body.start_date,
      normalizeStatus(body.status),
    );

  // 🔥 ADD THIS CHECK
  if (result.changes === 0) {
    return NextResponse.json({ error: "Insert failed" }, { status: 400 });
  }
  console.log("RESULT:", result);
  return NextResponse.json({
    success: true,
    id: result.lastInsertRowid,
  });
}

export async function GET() {
  try {
    const tournaments = db
      .prepare("SELECT * FROM tournaments ORDER BY id DESC")
      .all();

    return NextResponse.json(tournaments);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Fetch failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const { user, error } = await requireAdmin(req);
  if (error) return error;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Tournament ID is required" },
      { status: 400 },
    );
  }

  try {
    const result = db.prepare("DELETE FROM tournaments WHERE id = ?").run(id);

    if (result.changes === 0) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      deleted_by: user.email,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to delete tournament" },
      { status: 500 },
    );
  }
}
