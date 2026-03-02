import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";


// ── BAN / UNBAN USER ─────────────────────────
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const { id } = await context.params;
  const { action } = await req.json();

  if (!["ban", "unban"].includes(action)) {
    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        id: Number(id),
        is_deleted: 0,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (user.role === "admin" && action === "ban") {
      return NextResponse.json(
        { error: "Cannot ban an admin account" },
        { status: 403 }
      );
    }

    const newRole = action === "ban" ? "banned" : "user";

    const updated = await prisma.user.update({
      where: { id: Number(id) },
      data: {
        role: newRole,
        updated_at: new Date(), // optional if using @updatedAt
      },
    });

    return NextResponse.json({
      success: true,
      role: updated.role,
    });

  } catch (err) {
    return NextResponse.json(
      { error: "Update failed" },
      { status: 500 }
    );
  }
}


// ── SOFT DELETE USER ────────────────────────
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const { id } = await context.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
      select: { role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (user.role === "admin") {
      return NextResponse.json(
        { error: "Cannot delete admin" },
        { status: 403 }
      );
    }

    await prisma.user.update({
      where: { id: Number(id) },
      data: {
        is_deleted: 1,
        updated_at: new Date(), // optional
      },
    });

    return NextResponse.json({ success: true });

  } catch (err) {
    return NextResponse.json(
      { error: "Delete failed" },
      { status: 500 }
    );
  }
}