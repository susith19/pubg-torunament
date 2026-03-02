import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const normalizeStatus = (s: string) => {
  if (!s) return "open";
  return s.toLowerCase();
};

// ── CREATE TOURNAMENT ─────────────────────────
export async function POST(req: NextRequest) {
  const { user, error } = await requireAdmin(req);
  if (error) return error;

  try {
    const body = await req.json();

    const date = new Date(body.start_date);
    if (isNaN(date.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

    const tournament = await prisma.tournament.create({
      data: {
        title: body.title,
        game: body.game,
        mode: body.mode,
        map: body.map,
        entry_fee: body.entry_fee,
        prize_pool: body.prize_pool ?? 0,
        total_slots: body.total_slots,
        start_date: date,
        status: normalizeStatus(body.status),
      },
    });

    return NextResponse.json({
      success: true,
      id: tournament.id,
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Insert failed" },
      { status: 500 }
    );
  }
}


// ── GET ALL TOURNAMENTS ──────────────────────
export async function GET() {
  try {
    const tournaments = await prisma.tournament.findMany({
      orderBy: { id: "desc" },
    });

    return NextResponse.json(tournaments);

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Fetch failed" },
      { status: 500 }
    );
  }
}


// ── DELETE TOURNAMENT ────────────────────────
export async function DELETE(req: NextRequest) {
  const { user, error } = await requireAdmin(req);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Tournament ID is required" },
      { status: 400 }
    );
  }

  try {
    await prisma.tournament.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({
      success: true,
      deleted_by: user.email,
    });

  } catch (err) {
    return NextResponse.json(
      { error: "Tournament not found" },
      { status: 404 }
    );
  }
}