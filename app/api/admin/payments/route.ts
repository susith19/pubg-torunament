import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "All";

  // ── STATUS MAP ───────────────────────
  const statusMap: Record<string, string> = {
    Pending: "pending",
    Approved: "verified",
    Rejected: "rejected",
  };

  const dbStatus =
    status !== "All" ? statusMap[status] ?? status.toLowerCase() : undefined;

  // ── WHERE CONDITION ─────────────────
  const where: any = {
    ...(dbStatus && { status: dbStatus }),

    ...(search && {
      OR: [
        { transaction_id: { contains: search, mode: "insensitive" } },
        {
          user: {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          },
        },
        {
          tournament: {
            title: { contains: search, mode: "insensitive" },
          },
        },
      ],
    }),
  };

  // ── FETCH PAYMENTS ──────────────────
  const payments = await prisma.payment.findMany({
    where,
    include: {
      user: true,
      tournament: true,
    },
    orderBy: [
      {
        // custom order simulation
        status: "asc", // pending < verified < rejected (works because of string order)
      },
      {
        created_at: "desc",
      },
    ],
  });

  // ── FORMAT DATA ─────────────────────
  const statusLabel: Record<string, string> = {
    pending: "Pending",
    verified: "Approved",
    rejected: "Rejected",
  };

  const normalized = payments.map((p) => ({
    id: p.id,
    amount: p.amount,
    method: p.method,
    txnId: p.transaction_id || "—",
    screenshotUrl: p.screenshot_url,
    rawStatus: p.status,
    submittedAt: p.created_at,
    userId: p.user?.id,
    userName: p.user?.name,
    email: p.user?.email,
    tournamentId: p.tournament?.id,
    tournament: p.tournament?.title,
    fee: p.tournament?.entry_fee
      ? `₹${p.tournament.entry_fee}`
      : "Free",
    status: statusLabel[p.status] ?? "Pending",
  }));

  // ── SUMMARY ─────────────────────────
  const [total, pending, approved, rejected] = await Promise.all([
    prisma.payment.count(),
    prisma.payment.count({ where: { status: "pending" } }),
    prisma.payment.count({ where: { status: "verified" } }),
    prisma.payment.count({ where: { status: "rejected" } }),
  ]);

  const summary = {
    total,
    pending,
    approved,
    rejected,
  };

  return NextResponse.json({ payments: normalized, summary });
}