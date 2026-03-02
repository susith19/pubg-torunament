import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminAuth } from "@/lib/firebaseAdmin";

// ✅ Generate referral code
function generateReferralCode(email: string) {
  const base = email.split("@")[0];
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${base}${random}`.toUpperCase();
}

export async function POST(req: NextRequest) {
  try {
    const { token, referral_code } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "No token" }, { status: 400 });
    }

    // 🔐 Verify Firebase token
    const decoded = await adminAuth.verifyIdToken(token);
    const uid = decoded.uid;
    const email = decoded.email;
    const name = decoded.name || "";

    if (!email) {
      return NextResponse.json({ error: "No email" }, { status: 400 });
    }

    // 🔍 Check existing user
    const existing = await prisma.user.findUnique({
      where: { uid },
    });

    if (existing) {
      return NextResponse.json(existing);
    }

    // 🎁 Generate unique referral code
    let newCode = generateReferralCode(email);

    while (
      await prisma.user.findFirst({
        where: { referral_code: newCode },
      })
    ) {
      newCode = generateReferralCode(email);
    }

    // 🎯 Validate referral
    let referrer = null;

    if (referral_code) {
      const found = await prisma.user.findFirst({
        where: { referral_code },
      });

      if (found && found.uid !== uid) {
        referrer = found;
      }
    }

    const POINTS = 10;

    // 🔥 TRANSACTION (CRITICAL)
    const result = await prisma.$transaction(async (tx : any) => {
      // ✅ Create user
      const newUser = await tx.user.create({
        data: {
          uid,
          email,
          name,
          role: "user",
          referral_code: newCode,
          referred_by: referrer?.referral_code || null,
        },
      });

      // 🎁 Referral logic
      if (referrer) {
        // increment referral count
        await tx.user.update({
          where: { id: referrer.id },
          data: {
            referral_count: { increment: 1 },
            total_points: { increment: POINTS },
          },
        });

        // give points to new user
        await tx.user.update({
          where: { id: newUser.id },
          data: {
            total_points: { increment: POINTS },
          },
        });

        // save referral relation
        await tx.referral.create({
          data: {
            referrer_id: referrer.id,
            referred_user_id: newUser.id,
            points_given: POINTS,
          },
        });

        // points log (referrer)
        await tx.point.create({
          data: {
            user_id: referrer.id,
            points: POINTS,
            type: "referral",
            reference_id: String(newUser.id),
          },
        });

        // points log (new user)
        await tx.point.create({
          data: {
            user_id: newUser.id,
            points: POINTS,
            type: "referral",
            reference_id: String(referrer.id),
          },
        });
      }

      return newUser;
    });

    return NextResponse.json({
      success: true,
      user: {
        id: result.id,
        uid,
        email,
        name,
        referral_code: newCode,
      },
    });

  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Auth failed" },
      { status: 401 }
    );
  }
}