// app/api/user/me/route.ts

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/requireAuth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth(req);
  if (error) return error;

  try {
    const userData = await prisma.user.findUnique({
      where: { id: Number(user.id) },
      select: {
        id:           true,
        name:         true,
        email:        true,
        phone:        true,
        total_points: true,
        referral_code: true,
        referral_count: true,
      },
    });

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: userData });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}