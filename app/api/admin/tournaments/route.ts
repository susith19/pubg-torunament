import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

const normalizeStatus = (s: string) => (s ?? "open").toLowerCase();

// ── CREATE ───────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { user, error } = await requireAdmin(req);
  if (error) return error;

  try {
    const body = await req.json();
    const date = new Date(body.start_date);
    if (isNaN(date.getTime()))
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });

    const tournament = await prisma.tournament.create({
      data: {
        title:       body.title,
        game:        body.game,
        mode:        body.mode,
        map:         body.map,
        fee_solo:    body.fee_solo    ?? 50,
        fee_duo:     body.fee_duo     ?? 100,
        fee_squad:   body.fee_squad   ?? 150,
        entry_fee:   body.entry_fee,
        prize_pool:  body.prize_pool  ?? 0,
        total_slots: body.total_slots,
        start_date:  date,
        status:      normalizeStatus(body.status),
      },
    });

    return NextResponse.json({ success: true, id: tournament.id });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Insert failed" }, { status: 500 });
  }
}

// ── GET ALL ──────────────────────────────────────────────
export async function GET() {
  try {
    const tournaments = await prisma.tournament.findMany({
      orderBy: { id: "desc" },
      include: {
        _count: { select: { registrations: true } },
      },
    });

    return NextResponse.json(
      tournaments.map((t) => ({
        ...t,
        filled_slots: t.filled_slots ?? t._count.registrations,
      }))
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}
