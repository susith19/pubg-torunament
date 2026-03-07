// app/api/about/stats/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [tournaments, players] = await Promise.all([
      prisma.tournament.count(),
      prisma.player.count(),
    ]);

    return NextResponse.json({ tournaments, players });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ tournaments: 0, players: 0 }, { status: 500 });
  }
}