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
  const { status } = await req.json();

  db.prepare(`
    UPDATE registrations SET status = ? WHERE id = ?
  `).run(status, id);

  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const { id } = await context.params;

  db.prepare(`DELETE FROM registrations WHERE id = ?`).run(id);

  return NextResponse.json({ success: true });
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const { id } = await context.params;

  const registration = db
    .prepare(`SELECT * FROM registrations WHERE id = ?`)
    .get(id);

  return NextResponse.json(registration);
}