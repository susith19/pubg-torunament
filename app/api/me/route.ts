import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/requireAuth";
import { db } from "@/lib/db";

// ✅ GET PROFILE
export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth(req);
  if (error) return error;

  const fullUser = db
    .prepare("SELECT * FROM users WHERE id = ? AND is_deleted = 0")
    .get(user.id);

  return NextResponse.json(fullUser);
}

// ✅ UPDATE PROFILE
export async function PUT(req: NextRequest) {
  const { user, error } = await requireAuth(req);
  if (error) return error;

  const { name, phone } = await req.json();

  db.prepare(`
    UPDATE users
    SET name = ?, phone = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, phone, user.id);

  return NextResponse.json({ message: "Updated" });
}

// ✅ DELETE (SOFT DELETE)
export async function DELETE(req: NextRequest) {
  const { user, error } = await requireAuth(req);
  if (error) return error;

  db.prepare(`
    UPDATE users SET is_deleted = 1 WHERE id = ?
  `).run(user.id);

  return NextResponse.json({ message: "Account deleted" });
}