import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAdmin(req);
  if (error) return error;

  const { id } = await context.params;
  const body = await req.json();
  const tournamentId = Number(id);

  // ── FULL UPDATE ───────────────────────────────
  const isFull =
    "title" in body &&
    "game" in body &&
    "mode" in body &&
    "map" in body &&
    "entry_fee" in body &&
    "total_slots" in body &&
    "start_date" in body &&
    "status" in body;

  try {
    if (isFull) {
      const updated = await prisma.tournament.update({
        where: { id: tournamentId },
        data: {
          title: body.title,
          game: body.game,
          mode: body.mode,
          map: body.map,
          entry_fee: body.entry_fee,
          prize_pool: body.prize_pool ?? 0,
          total_slots: body.total_slots,
          start_date: body.start_date ? new Date(body.start_date) : null,
          status: body.status,
        },
      });

      return NextResponse.json({
        success: true,
        updated_by: user.email,
        data: updated,
      });
    }

    // ── PARTIAL UPDATE ───────────────────────────
    const ALLOWED_PARTIAL = ["room_id", "room_pass", "status"];

    const data: any = {};

    for (const key of ALLOWED_PARTIAL) {
      if (key in body) {
        data[key] = body[key];
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const updated = await prisma.tournament.update({
      where: { id: tournamentId },
      data,
    });

    return NextResponse.json({
      success: true,
      updated_by: user.email,
      data: updated,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Tournament not found or update failed" },
      { status: 400 }
    );
  }
}


// ── DELETE ─────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const { id } = await context.params;

  try {
    await prisma.tournament.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Tournament not found" },
      { status: 404 }
    );
  }
}