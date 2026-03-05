// app/api/tournaments/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: "Tournament ID required" }, { status: 400 });

    const tournament = await prisma.tournament.findUnique({ where: { id: Number(id) } });
    if (!tournament) return NextResponse.json({ error: "Tournament not found" }, { status: 404 });

    // teams
    const teams = await prisma.registration.findMany({
      where: { tournament_id: Number(id), status: "approved" },
      select: { id: true, team_name: true, team_tag: true, captain_name: true, status: true },
      orderBy: { created_at: "asc" },
    });
    const teamsWithPlayers = await Promise.all(teams.map(async (t) => {
      const players = await prisma.player.findMany({
        where: { registration_id: t.id },
        select: { player_name: true, player_id: true, is_captain: true },
        orderBy: { is_captain: "desc" },
      });
      return {
        registrationId: t.id, teamName: t.team_name, teamTag: t.team_tag,
        captainName: t.captain_name, slotStatus: t.status,
        players: players.map((p) => ({ name: p.player_name, playerId: p.player_id, isCaptain: p.is_captain })),
      };
    }));

    // leaderboard
    const leaderboardData = await prisma.point.findMany({
      where: { type: "match_win", registration: { tournament_id: Number(id) } },
      select: { points: true, created_at: true, registration: { select: { team_name: true } } },
      orderBy: { points: "desc" },
      take: 5,
    });

    // ── PAYMENT CONFIG — upsert so row always exists, never null ──
    const pc = await prisma.payment_config.upsert({
      where:  { id: 1 },
      update: {},
      create: { id: 1, upi_id: "", upi_name: "", qr_url: "", qr_path: "", note: "" },
    });

    const STATUS_MAP: Record<string, string> = {
      open: "Open", upcoming: "Open", full: "Full", closed: "Closed", live: "Live",
    };
    const totalSlots  = tournament.total_slots ?? 0;
    const fillPercent = totalSlots > 0 ? Math.round((tournament.filled_slots / totalSlots) * 100) : 0;

    return NextResponse.json({
      success: true,
      tournament: {
        id: tournament.id, title: tournament.title, game: tournament.game,
        mode: tournament.mode ? tournament.mode.charAt(0).toUpperCase() + tournament.mode.slice(1) : "—",
        map: tournament.map,
        status: STATUS_MAP[tournament.status?.toLowerCase()] ?? tournament.status,
        entry_fee: tournament.entry_fee,
        fee:       tournament.entry_fee ?? 0,
        fee_solo:  tournament.fee_solo,
        fee_duo:   tournament.fee_duo,
        fee_squad: tournament.fee_squad,
        prize: tournament.prize_pool ? `₹${Number(tournament.prize_pool).toLocaleString("en-IN")}` : "TBA",
        platform: tournament.game,
        fillPercent, slots: tournament.total_slots, filled: tournament.filled_slots,
        slots_left: (tournament.total_slots ?? 0) - tournament.filled_slots,
        startFormatted: tournament.start_date
          ? new Date(tournament.start_date).toLocaleString("en-IN", {
              day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true,
            })
          : "TBA",
      },
      teams: teamsWithPlayers,
      leaderboard: leaderboardData.map((item) => ({
        teamName: item.registration?.team_name ?? "—", points: item.points, awardedAt: item.created_at,
      })),
      totalTeams: teamsWithPlayers.length,
      paymentConfig: {
        upiId:   pc.upi_id   ?? "",
        upiName: pc.upi_name ?? "",
        qrUrl:   pc.qr_url   ?? "",
        note:    pc.note     ?? "",
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch tournament" }, { status: 500 });
  }
}