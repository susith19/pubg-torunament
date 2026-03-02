import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "All";

  // ── WHERE CONDITION ─────────────────────────
  const where: any = {
    is_deleted: 0,
    role: { not: "admin" },
  };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status === "Active") {
    where.role = { notIn: ["admin", "banned"] };
  } else if (status === "Banned") {
    where.role = "banned";
  }

  // ── FETCH USERS ─────────────────────────────
  const usersRaw = await prisma.user.findMany({
    where,
    orderBy: { created_at: "desc" },
    include: {
      registrations: true,
      payments: {
        where: { status: "verified" },
      },
    },
  });

  // ── FORMAT ────────────────────────────────
  const users = usersRaw.map((u) => {
    const totalSpent = u.payments.reduce(
      (sum, p) => sum + (p.amount || 0),
      0
    );

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      referrals: u.referral_count,
      points: u.total_points,
      joinedAt: u.created_at,
      tournaments: u.registrations.length,
      totalSpent,
      status: u.role === "banned" ? "Banned" : "Active",
      spent:
        totalSpent > 0
          ? `₹${totalSpent.toLocaleString("en-IN")}`
          : "₹0",
    };
  });

  // ── SUMMARY ────────────────────────────────
  const [total, active, banned] = await Promise.all([
    prisma.user.count({
      where: { is_deleted: 0 },
    }),
    prisma.user.count({
      where: {
        is_deleted: 0,
        role: { not: "banned" },
      },
    }),
    prisma.user.count({
      where: {
        is_deleted: 0,
        role: "banned",
      },
    }),
  ]);

  const summary = { total, active, banned };

  return NextResponse.json({ users, summary });
}