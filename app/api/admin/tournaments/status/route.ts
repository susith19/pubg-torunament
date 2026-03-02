import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  try {
    const { id, status } = await req.json();

    // ✅ Validate input
    if (!id || !status) {
      return NextResponse.json(
        { error: "id and status are required" },
        { status: 400 }
      );
    }

    const allowed = ["upcoming", "open", "full", "closed", "live"];
    if (!allowed.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    // ✅ Update
    const updated = await prisma.tournament.update({
      where: { id: Number(id) },
      data: { status },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });

  } catch (err) {
    return NextResponse.json(
      { error: "Tournament not found or update failed" },
      { status: 400 }
    );
  }
}