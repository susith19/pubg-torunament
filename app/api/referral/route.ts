import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/requireAuth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth(req);
  if (error) return error;

  try {
    // Fetch user's referral code and referral count
    const userRecord = await prisma.user.findUnique({
      where: { id: Number(user.id) },
      select: {
        referral_code: true,
        referral_count: true,
      },
    });

    if (!userRecord) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch all referrals made by this user
    const referrals = await prisma.referral.findMany({
      where: {
        referrer_id: Number(user.id),
      },
      select: {
        id: true,
        referred_user_id: true,
        created_at: true,
        referred_user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    const normalizedReferrals = referrals.map((r) => ({
      id: r.id,
      referred_user_id: r.referred_user_id,
      email: r.referred_user?.email ?? "—",
      name: r.referred_user?.name ?? "Anonymous",
      created_at: r.created_at,
    }));

    return NextResponse.json({
      success: true,
      referral_code: userRecord.referral_code,
      referral_count: userRecord.referral_count,
      data: normalizedReferrals,
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch referrals" }, { status: 500 });
  }
}