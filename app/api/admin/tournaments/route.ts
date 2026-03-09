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

    const slotsSolo = body.slots_solo ?? 0;
    const slotsDuo = body.slots_duo ?? 0;
    const slotsSquad = body.slots_squad ?? 0;
    const totalSlots = slotsSolo + slotsDuo + slotsSquad;

    if (totalSlots === 0)
      return NextResponse.json(
        { error: "At least one mode must have slots" },
        { status: 400 },
      );

    const tournament = await prisma.tournament.create({
      data: {
        title: body.title,
        game: body.game,
        mode: body.mode,
        map: body.map,
        fee_solo: body.fee_solo ?? 50,
        fee_duo: body.fee_duo ?? 100,
        fee_squad: body.fee_squad ?? 150,
        entry_fee: body.entry_fee,
        prize_pool: body.prize_pool ?? 0,
        // per-mode slots
        slots_solo: slotsSolo,
        slots_duo: slotsDuo,
        slots_squad: slotsSquad,
        total_slots: totalSlots,
        // ✅ FIX #1: Explicitly initialize filled counters to 0
        filled_solo: 0,
        filled_duo: 0,
        filled_squad: 0,
        filled_slots: 0,
        start_date: date,
        status: normalizeStatus(body.status),
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

    // ✅ FIX #2: Explicitly normalize ALL filled_* fields with proper defaults
    // CRITICAL: These must match what the frontend expects
    return NextResponse.json(
      tournaments.map((t) => ({
        ...t,
        // ✅ Use database values first, fallback to 0 (NOT to _count)
        filled_solo: t.filled_solo ?? 0,
        filled_duo: t.filled_duo ?? 0,
        filled_squad: t.filled_squad ?? 0,
        // ✅ IMPORTANT: Use the sum of per-mode counters, NOT _count.registrations
        // This prevents the "double counting" bug
        filled_slots: (t.filled_solo ?? 0) + (t.filled_duo ?? 0) + (t.filled_squad ?? 0),
        // ✅ Also provide slot totals for UI
        slots_solo: t.slots_solo ?? 0,
        slots_duo: t.slots_duo ?? 0,
        slots_squad: t.slots_squad ?? 0,
        total_slots: (t.slots_solo ?? 0) + (t.slots_duo ?? 0) + (t.slots_squad ?? 0),
      })),
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}