import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";


// ── GET single registration ───────────────────────────────
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const { id } = await context.params;

  const registration = await prisma.registration.findUnique({
    where: { id: Number(id) },
  });

  if (!registration) {
    return NextResponse.json(
      { error: "Registration not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(registration);
}


// ── PUT (update status) ───────────────────────────────────
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const { id } = await context.params;
  const { status } = await req.json();

  try {
    const updated = await prisma.registration.update({
      where: { id: Number(id) },
      data: { status },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    return NextResponse.json(
      { error: "Registration not found" },
      { status: 404 }
    );
  }
}


// ── DELETE registration ───────────────────────────────────
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const { id } = await context.params;

  try {
    await prisma.registration.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Registration not found" },
      { status: 404 }
    );
  }
}