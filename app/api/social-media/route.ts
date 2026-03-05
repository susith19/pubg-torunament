// app/api/social-media/route.ts  — PUBLIC, no auth
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const links = await prisma.social_media.findMany({
    where:   { is_active: true },
    orderBy: { created_at: "asc" },
  });
  return NextResponse.json(links);
}