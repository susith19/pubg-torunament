import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { adminAuth } from "@/lib/firebaseAdmin";

export async function PUT(req: NextRequest) {
  const { user: adminUser, error } = await requireAdmin(req);
  if (error) return error;

  try {
    const { uid, role } = await req.json();

    // ✅ Validation
    if (!uid || !role) {
      return NextResponse.json(
        { error: "uid and role are required" },
        { status: 400 }
      );
    }

    if (!["user", "admin"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    // 🔍 Check user exists
    const existing = await prisma.user.findFirst({
      where: {
        uid,
        is_deleted: 0,
      },
      select: {
        id: true,
        uid: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // ❌ Prevent admin from changing their own role
    if (adminUser.uid === uid) {
      return NextResponse.json(
        { error: "You cannot change your own role" },
        { status: 403 }
      );
    }

    // ✅ Update DB
    await prisma.user.update({
      where: { uid },
      data: {
        role,
        updated_at: new Date(),
      },
    });

    // ✅ Sync with Firebase (VERY IMPORTANT)
    await adminAuth.setCustomUserClaims(uid, { role });

    return NextResponse.json({
      success: true,
      message: "Role updated successfully",
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}