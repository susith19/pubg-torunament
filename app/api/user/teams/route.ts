// app/api/user/teams/route.ts
// Returns the last 5 distinct teams the logged-in user has registered with.
// Used by the registration page to quick-fill player details.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/requireAuth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth(req);
  if (error) return error;

  try {
    // Fetch registrations for this user (latest first), with players
    const registrations = await prisma.registration.findMany({
      where:   { user_id: Number(user.id) },
      orderBy: { created_at: "desc" },
      take:    20,                             // look at last 20, deduplicate by team_name
      include: { players: true },
    });

    // Deduplicate by team_name — keep most recent per team
    const seen    = new Set<string>();
    const teams: {
      team_name: string;
      team_tag:  string;
      players:   { player_name: string; player_id: string; is_captain: boolean }[];
    }[] = [];

    for (const reg of registrations) {
      const key = (reg.team_name ?? "").trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);

      teams.push({
        team_name: reg.team_name ?? "",
        team_tag:  reg.team_tag  ?? "",
        players:   reg.players.map((p) => ({
          player_name: p.player_name ?? "",
          player_id:   p.player_id   ?? "",
          is_captain:  p.is_captain,
        })),
      });

      if (teams.length >= 5) break;           // return max 5 distinct teams
    }

    return NextResponse.json({ teams });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ teams: [] }, { status: 500 });
  }
}