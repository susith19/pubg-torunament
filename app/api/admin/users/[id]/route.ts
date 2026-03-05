import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

const VALID_ACTIONS = ["ban", "unban", "promote", "demote"] as const;
type Action = typeof VALID_ACTIONS[number];

// ── PUT — ban / unban / promote / demote ──────────────────
export async function PUT(req: NextRequest, { params }: RouteContext) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const { id }     = await params;
  const { action } = await req.json() as { action: Action };

  if (!VALID_ACTIONS.includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findFirst({
      where: { id: Number(id), is_deleted: 0 },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ── Safety guards ─────────────────────────
    if (action === "ban" && user.role === "admin") {
      return NextResponse.json({ error: "Cannot ban an admin account" }, { status: 403 });
    }
    if (action === "demote" && user.role !== "admin") {
      return NextResponse.json({ error: "User is not an admin" }, { status: 400 });
    }
    if (action === "promote" && user.role === "admin") {
      return NextResponse.json({ error: "User is already an admin" }, { status: 400 });
    }

    // ── Role mapping ──────────────────────────
    const roleMap: Record<Action, string> = {
      ban:     "banned",
      unban:   "user",
      promote: "admin",
      demote:  "user",
    };

    const updated = await prisma.user.update({
      where: { id: Number(id) },
      data:  { role: roleMap[action], updated_at: new Date() },
    });

    return NextResponse.json({ success: true, role: updated.role });

  } catch (err) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

// ── DELETE — soft delete ──────────────────────────────────
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const { id } = await params;

  try {
    const user = await prisma.user.findUnique({
      where:  { id: Number(id) },
      select: { role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (user.role === "admin") {
      return NextResponse.json({ error: "Cannot delete an admin account" }, { status: 403 });
    }

    await prisma.user.update({
      where: { id: Number(id) },
      data:  { is_deleted: 1, updated_at: new Date() },
    });

    return NextResponse.json({ success: true });

  } catch (err) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}