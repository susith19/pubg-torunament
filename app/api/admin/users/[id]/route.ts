import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const { id } = await context.params;
  const { action } = await req.json();

  if (!["ban", "unban"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const user = db.prepare(`SELECT * FROM users WHERE id = ? AND is_deleted = 0`).get(id) as any;
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.role === "admin" && action === "ban") {
    return NextResponse.json({ error: "Cannot ban an admin account" }, { status: 403 });
  }

  const newRole = action === "ban" ? "banned" : "user";
  db.prepare(`UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(newRole, id);

  return NextResponse.json({ success: true, role: newRole });
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const { id } = await context.params;
  const user = db.prepare(`SELECT role FROM users WHERE id = ?`).get(id) as any;
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.role === "admin") return NextResponse.json({ error: "Cannot delete admin" }, { status: 403 });

  db.prepare(`UPDATE users SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(id);
  return NextResponse.json({ success: true });
}