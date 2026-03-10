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

    // ✅ FIX: Format start date consistently without timezone conversion
    function formatStartDate(startDate: Date | null): string {
      if (!startDate) return "TBA";
      
      // Extract date and time from ISO string without timezone conversion
      const isoString = new Date(startDate).toISOString();
      const dateStr = isoString.split("T")[0]; // "2026-03-21"
      const timeStr = isoString.split("T")[1]?.slice(0, 5); // "18:00"
      
      if (!timeStr) return "TBA";
      
      // Parse date components
      const [year, month, day] = dateStr.split("-").map(Number);
      const [hours, minutes] = timeStr.split(":").map(Number);
      
      // Format date as "21 Mar 2026"
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const formattedDate = `${day} ${monthNames[month - 1]} ${year}`;
      
      // Convert 24-hour to 12-hour format
      const period = hours >= 12 ? "PM" : "AM";
      const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      const formattedTime = `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
      
      return `${formattedDate} · ${formattedTime}`;
    }

    return NextResponse.json({
      success: true,
      tournament: {
        id: tournament.id, 
        title: tournament.title, 
        game: tournament.game,
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
        fillPercent, 
        slots: tournament.total_slots, 
        filled: tournament.filled_slots,
        slots_left: (tournament.total_slots ?? 0) - tournament.filled_slots,
        start_date: tournament.start_date ? tournament.start_date.toISOString() : null,
        startFormatted: formatStartDate(tournament.start_date), // ✅ FIX: Consistent formatting
      },
      teams: teamsWithPlayers,
      leaderboard: leaderboardData.map((item) => ({
        teamName: item.registration?.team_name ?? "—", 
        points: item.points, 
        awardedAt: item.created_at,
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