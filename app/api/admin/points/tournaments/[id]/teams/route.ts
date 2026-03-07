// app/api/admin/points/tournaments/[id]/teams/route.ts
// Returns all approved teams for a tournament with their award status.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: RouteContext) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const { id } = await params;

  const registrations = await prisma.registration.findMany({
    where: {
      tournament_id: Number(id),
      status: "approved",
    },
    include: {
      tournament: { select: { id: true, title: true, mode: true } },
      players:    true,
      user:       { select: { id: true, name: true } },
      points:     {
        where: { type: "match_win" },
        select: { id: true, position: true, kills: true, points: true },
      },
    },
    orderBy: { team_name: "asc" },
  });

  const isSolo = (mode?: string | null) => mode === "solo";

  const teams = registrations.map((r) => ({
    registrationId: r.id,
    userId:         r.user_id,
    teamName:       isSolo(r.tournament?.mode)
                      ? (r.user?.name ?? r.captain_name)
                      : (r.team_name ?? "Unnamed Team"),
    captain:        r.captain_name,
    mode:           r.tournament?.mode,
    players:        r.players.map((p) => ({
                      name:       p.player_name,
                      playerId:   p.player_id,
                      isCaptain:  p.is_captain,
                    })),
    // Award already given?
    awarded:        r.points.length > 0,
    award:          r.points[0] ?? null,   // existing award (if any)
  }));

  return NextResponse.json({ teams, tournamentId: Number(id) });
}