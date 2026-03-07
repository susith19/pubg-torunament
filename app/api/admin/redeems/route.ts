// app/api/admin/redeems/route.ts
// GET  /api/admin/redeems          → list all redeem requests (with filters)
// POST /api/admin/redeems          → approve or reject a request

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";

// ── Helper: parse method/detail from stored upi_id string ──
function parsePayoutDetail(raw: string) {
  if (!raw) return { method: "UPI", detail: raw };
  if (raw.includes("::")) {
    const [method, ...rest] = raw.split("::");
    return { method, detail: rest.join("::") };
  }
  return { method: "UPI", detail: raw };
}

// ── GET — list redeem requests ─────────────────────────────
export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth(req);
  if (error) return error;
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "all";   // all | pending | approved | rejected
  const page   = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit  = 20;
  const skip   = (page - 1) * limit;

  const where: any = {};
  if (status !== "all") where.status = status;

  const [redeems, total] = await Promise.all([
    prisma.redeem.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, total_points: true },
        },
      },
    }),
    prisma.redeem.count({ where }),
  ]);

  // Aggregate stats for header cards
  const [pendingCount, approvedSum, rejectedCount, totalRequests] = await Promise.all([
    prisma.redeem.count({ where: { status: "pending" } }),
    prisma.redeem.aggregate({ _sum: { amount: true }, where: { status: "approved" } }),
    prisma.redeem.count({ where: { status: "rejected" } }),
    prisma.redeem.count(),
  ]);

  const rows = redeems.map((r) => {
    const { method, detail } = parsePayoutDetail(r.upi_id ?? "");
    return {
      id:           r.id,
      status:       r.status,
      points_used:  r.points_used,
      amount:       r.amount,
      method,
      detail,
      created_at:   r.created_at,
      processed_at: r.processed_at,
      user: {
        id:           r.user.id,
        name:         r.user.name,
        email:        r.user.email,
        phone:        r.user.phone,
        total_points: r.user.total_points,
      },
    };
  });

  return NextResponse.json({
    redeems: rows,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    stats: {
      pending:      pendingCount,
      approvedSum:  approvedSum._sum.amount ?? 0,
      rejected:     rejectedCount,
      total:        totalRequests,
    },
  });
}

// ── POST — approve or reject ───────────────────────────────
export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth(req);
  if (error) return error;
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { redeemId, action } = await req.json();   // action: "approve" | "reject"

  if (!redeemId || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const redeem = await prisma.redeem.findUnique({
    where: { id: Number(redeemId) },
    include: { user: { select: { id: true, total_points: true } } },
  });

  if (!redeem) {
    return NextResponse.json({ error: "Redeem request not found" }, { status: 404 });
  }

  if (redeem.status !== "pending") {
    return NextResponse.json(
      { error: `Already ${redeem.status}` },
      { status: 400 },
    );
  }

  if (action === "approve") {
    // Just mark as approved — points already deducted at request time
    await prisma.redeem.update({
      where: { id: redeem.id },
      data:  { status: "approved", processed_at: new Date() },
    });

    return NextResponse.json({ success: true, action: "approved", redeemId: redeem.id });
  }

  // ── REJECT: refund points back to user ──────────────────
  await prisma.$transaction([
    // 1. Mark rejected
    prisma.redeem.update({
      where: { id: redeem.id },
      data:  { status: "rejected", processed_at: new Date() },
    }),
    // 2. Refund points to user wallet
    prisma.user.update({
      where: { id: redeem.user.id },
      data:  { total_points: { increment: redeem.points_used } },
    }),
    // 3. Record refund in Point history
    prisma.point.create({
      data: {
        user_id: redeem.user.id,
        points:  redeem.points_used,
        type:    "refund_cash",
        note:    `Redeem request #${redeem.id} rejected — ₹${redeem.amount} refunded`,
      },
    }),
  ]);

  return NextResponse.json({ success: true, action: "rejected", redeemId: redeem.id, refunded: redeem.points_used });
}