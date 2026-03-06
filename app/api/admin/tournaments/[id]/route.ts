// app/api/tournaments/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/requireAdmin";

// ── UPDATE ───────────────────────────────────────────────
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireAdmin(req);
  if (error) return error;

  try {
    const { id } = await context.params;
    const body   = await req.json();

    // Only update fields that were actually sent
    const data: Record<string, any> = {};

    if (body.title       !== undefined) data.title       = body.title;
    if (body.game        !== undefined) data.game        = body.game;
    if (body.mode        !== undefined) data.mode        = body.mode;
    if (body.map         !== undefined) data.map         = body.map;
    if (body.entry_fee   !== undefined) data.entry_fee   = body.entry_fee;
    if (body.fee_solo    !== undefined) data.fee_solo    = body.fee_solo;
    if (body.fee_duo     !== undefined) data.fee_duo     = body.fee_duo;
    if (body.fee_squad   !== undefined) data.fee_squad   = body.fee_squad;
    if (body.prize_pool  !== undefined) data.prize_pool  = body.prize_pool;
    if (body.total_slots !== undefined) data.total_slots = body.total_slots;
    if (body.status      !== undefined) data.status      = normalizeStatus(body.status);
    if (body.room_id     !== undefined) data.room_id     = body.room_id;
    if (body.room_pass   !== undefined) data.room_pass   = body.room_pass;

    if (body.start_date !== undefined) {
      const date = new Date(body.start_date);
      if (isNaN(date.getTime()))
        return NextResponse.json({ error: "Invalid date" }, { status: 400 });
      data.start_date = date;
    }

    if (Object.keys(data).length === 0)
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });

    const tournament = await prisma.tournament.update({
      where: { id: Number(id) },
      data,
    });

    return NextResponse.json({ success: true, tournament });
  } catch (err: any) {
    console.error(err);
    if (err.code === "P2025")
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

// ── DELETE ───────────────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireAdmin(req);
  if (error) return error;

  try {
    const { id } = await context.params;

    await prisma.tournament.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true, deleted_by: user.email });
  } catch (err: any) {
    console.error(err);
    if (err.code === "P2025")
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "Tournament ID required" }, { status: 400 });
    }

    // ── TOURNAMENT ──────────────────────────────────────────
    const tournament = await prisma.tournament.findUnique({
      where: { id: Number(id) },
    });

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    // ── REGISTERED TEAMS (approved only) ───────────────────
    const teams = await prisma.registration.findMany({
      where:   { tournament_id: Number(id), status: "approved" },
      select:  { id: true, team_name: true, team_tag: true, captain_name: true, status: true },
      orderBy: { created_at: "asc" },
    });

    const teamsWithPlayers = await Promise.all(
      teams.map(async (t) => {
        const players = await prisma.player.findMany({
          where:   { registration_id: t.id },
          select:  { player_name: true, player_id: true, is_captain: true },
          orderBy: { is_captain: "desc" },
        });
        return {
          registrationId: t.id,
          teamName:    t.team_name,
          teamTag:     t.team_tag,
          captainName: t.captain_name,
          slotStatus:  t.status,
          players: players.map((p) => ({
            name:      p.player_name,
            playerId:  p.player_id,
            isCaptain: p.is_captain,
          })),
        };
      }),
    );

    // ── LEADERBOARD ─────────────────────────────────────────
    const leaderboardData = await prisma.point.findMany({
      where: {
        type: "match_win",
        registration: { tournament_id: Number(id) },
      },
      select: {
        points: true,
        created_at: true,
        registration: { select: { team_name: true } },
      },
      orderBy: { points: "desc" },
      take: 5,
    });

    const leaderboard = leaderboardData.map((item) => ({
      teamName:  item.registration?.team_name ?? "—",
      points:    item.points,
      awardedAt: item.created_at,
    }));

    // ── PAYMENT CONFIG (for register page) ─────────────────
    const paymentConfig = await prisma.payment_config.findUnique({
      where: { id: 1 },
    });

    // ── NORMALIZE ───────────────────────────────────────────
    const STATUS_MAP: Record<string, string> = {
      open: "Open", upcoming: "Open", full: "Full",
      closed: "Closed", live: "Live",
    };

    const totalSlots  = tournament.total_slots ?? 0;
    const fillPercent = totalSlots > 0
      ? Math.round((tournament.filled_slots / totalSlots) * 100)
      : 0;

    return NextResponse.json({
      success: true,
      tournament: {
        id:       tournament.id,
        title:    tournament.title,
        game:     tournament.game,
        mode:     tournament.mode
          ? tournament.mode.charAt(0).toUpperCase() + tournament.mode.slice(1)
          : "—",
        map:         tournament.map,
        status:      STATUS_MAP[tournament.status?.toLowerCase()] ?? tournament.status,
        entry_fee:   tournament.entry_fee,
        fee:         tournament.entry_fee ? `₹${tournament.entry_fee}` : "Free",
        // per-mode fees
        fee_solo:    tournament.fee_solo,
        fee_duo:     tournament.fee_duo,
        fee_squad:   tournament.fee_squad,
        prize:       tournament.prize_pool
          ? `₹${Number(tournament.prize_pool).toLocaleString("en-IN")}`
          : "TBA",
        platform:    tournament.game,
        fillPercent,
        slots:       tournament.total_slots,
        filled:      tournament.filled_slots,
        slots_left:  (tournament.total_slots ?? 0) - tournament.filled_slots,
        startFormatted: tournament.start_date
          ? new Date(tournament.start_date).toLocaleString("en-IN", {
              day: "numeric", month: "short", year: "numeric",
              hour: "2-digit", minute: "2-digit", hour12: true,
            })
          : "TBA",
      },
      teams:       teamsWithPlayers,
      leaderboard,
      totalTeams:  teamsWithPlayers.length,
      // ── payment config for registration ──────────────────
      paymentConfig: paymentConfig
        ? {
            upiId:   paymentConfig.upi_id,
            upiName: paymentConfig.upi_name,
            qrUrl:   paymentConfig.qr_url,
            note:    paymentConfig.note,
          }
        : null,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch tournament" }, { status: 500 });
  }
}
