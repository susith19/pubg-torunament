import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const data = await prisma.registration.findMany({
    include: {
      user: {
        select: {
          email: true,
        },
      },
      tournament: {
        select: {
          title: true,
        },
      },
    },
  });

  // Flatten like your SQL result
  const formatted = data.map((r) => ({
    ...r,
    email: r.user?.email,
    title: r.tournament?.title,
  }));

  return NextResponse.json({ success: true, data: formatted });
}