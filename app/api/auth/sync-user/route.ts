import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { uid, email } = await req.json();

    if (!uid || !email) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    // 🔍 Check if user exists
    const existing = await prisma.user.findUnique({
      where: { uid },
    });

    if (!existing) {
      // ✅ Create user
      await prisma.user.create({
        data: {
          uid,
          email,
          role: "user",
          referral_code: crypto.randomUUID().slice(0, 8), // generate code
        },
      });
    }

    return NextResponse.json({ message: "User synced" });
  } catch (err) {
    console.error(err);

    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
