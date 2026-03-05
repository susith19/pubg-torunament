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
  const where: any = { is_deleted: 0 };

  if (status === "Active") {
    where.role = { notIn: ["admin", "banned"] };
  } else if (status === "Banned") {
    where.role = "banned";
  } else if (status === "Admin") {
    where.role = "admin";
  }
  // "All" → no role filter, shows everyone including admins

  if (search) {
    where.OR = [
      { name:  { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ];
  }

  // ── FETCH USERS ─────────────────────────────
  const usersRaw = await prisma.user.findMany({
    where,
    orderBy: { created_at: "desc" },
    include: {
      registrations: true,
      payments: { where: { status: "verified" } },
    },
  });

  // ── FORMAT ────────────────────────────────
  const users = usersRaw.map((u) => {
    const totalSpent = u.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    return {
      id:          u.id,
      name:        u.name,
      email:       u.email,
      phone:       u.phone,
      role:        u.role,
      referrals:   u.referral_count,
      points:      u.total_points,
      joinedAt:    u.created_at,
      tournaments: u.registrations.length,
      totalSpent,
      // Admin role gets its own status label
      status: u.role === "banned" ? "Banned" : u.role === "admin" ? "Admin" : "Active",
      spent:  totalSpent > 0 ? `₹${totalSpent.toLocaleString("en-IN")}` : "₹0",
    };
  });

  // ── SUMMARY ────────────────────────────────
  const [total, active, banned, admins] = await Promise.all([
    prisma.user.count({ where: { is_deleted: 0 } }),
    prisma.user.count({ where: { is_deleted: 0, role: { notIn: ["admin", "banned"] } } }),
    prisma.user.count({ where: { is_deleted: 0, role: "banned" } }),
    prisma.user.count({ where: { is_deleted: 0, role: "admin" } }),
  ]);

  return NextResponse.json({ users, summary: { total, active, banned, admins } });
}