import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "All";

  const conditions: string[] = [
    "u.is_deleted = 0",
    "u.role != 'admin'", // 🔥 IMPORTANT
  ];
  const params: any[] = [];

  if (search) {
    conditions.push(`(u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)`);
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (status === "Active") {
    conditions.push(`u.role != 'banned'`);
  } else if (status === "Banned") {
    conditions.push(`u.role = 'banned'`);
  }

  const where = `WHERE ${conditions.join(" AND ")} `;

  const users = db
    .prepare(
      `
      SELECT
        u.id,
        u.name,
        u.email,
        u.phone,
        u.role,
        u.referral_count  AS referrals,
        u.total_points    AS points,
        u.created_at      AS joinedAt,
        (SELECT COUNT(*) FROM registrations r WHERE r.user_id = u.id) AS tournaments,
        COALESCE(
          (SELECT SUM(p.amount) FROM payments p WHERE p.user_id = u.id AND p.status = 'verified'),
          0
        ) AS totalSpent
      FROM users u
      ${where}
      ORDER BY u.created_at DESC
      `,
    )
    .all(...params) as any[];

  const normalized = users.map((u) => ({
    ...u,
    status: u.role === "banned" ? "Banned" : "Active",
    spent:
      u.totalSpent > 0
        ? `₹${Number(u.totalSpent).toLocaleString("en-IN")}`
        : "₹0",
  }));

  const summary = db
    .prepare(
      `
      SELECT
        COUNT(*)                                           AS total,
        SUM(CASE WHEN role != 'banned' THEN 1 ELSE 0 END) AS active,
        SUM(CASE WHEN role  = 'banned' THEN 1 ELSE 0 END) AS banned
      FROM users
      WHERE is_deleted = 0
      `,
    )
    .get() as any;

  return NextResponse.json({ users: normalized, summary });
}
