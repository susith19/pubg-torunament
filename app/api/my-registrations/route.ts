import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/requireAuth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth(req);
  if (error) return error;

  const rows = await prisma.registration.findMany({
    where: {
      user_id: Number(user.id),
    },
    include: {
      tournament: {
        select: {
          title: true,
          game: true,
          start_date: true,
        },
      },
    },
    orderBy: {
      created_at: "desc",
    },
  });

  // Flatten result to match your SQL output
  const data = rows.map((r) => ({
    ...r,
    title: r.tournament?.title,
    game: r.tournament?.game,
    start_date: r.tournament?.start_date,
  }));

  return NextResponse.json({ success: true, data });
}