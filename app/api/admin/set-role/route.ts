import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
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
    const existing = db
      .prepare("SELECT id, uid FROM users WHERE uid = ? AND is_deleted = 0")
      .get(uid);

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
    db.prepare(`
      UPDATE users 
      SET role = ?, updated_at = CURRENT_TIMESTAMP
      WHERE uid = ?
    `).run(role, uid);

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