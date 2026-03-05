import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

// Returns all approved registrations for dropdown
export async function GET(req: NextRequest) {

  const { error } = await requireAdmin(req);
  if (error) return error;

  const registrations = await prisma.registration.findMany({
    where: {
      status: "approved",
    },
    include: {
      tournament: {
        select: {
          id: true,
          title: true,
          mode: true,
        },
      },
      players: true,
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [
      { tournament: { title: "asc" } },
      { team_name: "asc" },
    ],
  });

  const teams = registrations.map((r) => {

    const isSolo = r.tournament?.mode === "solo";

    return {
      registrationId: r.id,
      userId: r.user_id,
      tournamentId: r.tournament_id,

      teamName: isSolo
        ? r.user?.name || r.captain_name
        : r.team_name || "Unnamed Team",

      captain: r.captain_name,
      tournament: r.tournament?.title,
      mode: r.tournament?.mode,

      players: r.players.length,
    };
  });

  return NextResponse.json({ teams });
}