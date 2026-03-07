// app/api/admin/points/tournaments/route.ts
// Returns all tournaments that have approved registrations,
// with team count + how many have already been awarded points.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  // All tournaments that have at least 1 approved registration
  const tournaments = await prisma.tournament.findMany({
    where: {
      registrations: { some: { status: "approved" } },
    },
    include: {
      _count: {
        select: { registrations: true },
      },
      registrations: {
        where: { status: "approved" },
        select: {
          id: true,
          points: { where: { type: "match_win" }, select: { id: true } },
        },
      },
    },
    orderBy: { start_date: "desc" },
  });

  const result = tournaments.map((t) => {
    const approved   = t.registrations.length;
    const awarded    = t.registrations.filter((r) => r.points.length > 0).length;

    return {
      id:          t.id,
      title:       t.title,
      mode:        t.mode,
      status:      t.status,
      start_date:  t.start_date,
      approvedTeams: approved,
      awardedTeams:  awarded,
      pendingTeams:  approved - awarded,
    };
  });

  return NextResponse.json({ tournaments: result });
}