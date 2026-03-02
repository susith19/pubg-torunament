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
          title: true,
          mode: true,
        },
      },
      players: true,
    },
    orderBy: [
      { tournament: { title: "asc" } },
      { team_name: "asc" },
    ],
  });

  // ── FORMAT ───────────────────────────
  const teams = registrations.map((r) => ({
    registrationId: r.id,
    teamName: r.team_name,
    captain: r.captain_name,
    tournament: r.tournament?.title,
    mode: r.tournament?.mode,
    players: r.players.length,
  }));

  return NextResponse.json({ teams });
}