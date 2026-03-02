import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/requireAuth";
import { prisma } from "@/lib/prisma";

// ✅ GET PROFILE
export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth(req);
  if (error) return error;

  const fullUser = await prisma.user.findFirst({
    where: {
      id: user.id,
      is_deleted: false,
    },
  });

  return NextResponse.json(fullUser);
}

// ✅ UPDATE PROFILE
export async function PUT(req: NextRequest) {
  const { user, error } = await requireAuth(req);
  if (error) return error;

  const { name, phone } = await req.json();

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      name,
      phone,
      updated_at: new Date(), // optional (Prisma auto-handles if @updatedAt)
    },
  });

  return NextResponse.json({ message: "Updated" });
}

// ✅ DELETE (SOFT DELETE)
export async function DELETE(req: NextRequest) {
  const { user, error } = await requireAuth(req);
  if (error) return error;

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      is_deleted: true,
    },
  });

  return NextResponse.json({ message: "Account deleted" });
}