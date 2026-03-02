import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "All";

  const conditions: string[] = [];
  const params: any[] = [];

  if (search) {
    conditions.push(`(u.name LIKE ? OR u.email LIKE ? OR p.transaction_id LIKE ? OR t.title LIKE ?)`);
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (status !== "All") {
    // Map frontend label → DB value
    const statusMap: Record<string, string> = {
      Pending: "pending",
      Approved: "verified",
      Rejected: "rejected",
    };
    conditions.push(`p.status = ?`);
    params.push(statusMap[status] ?? status.toLowerCase());
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const payments = db
    .prepare(
      `
      SELECT
        p.id,
        p.amount,
        p.method,
        p.transaction_id  AS txnId,
        p.screenshot_url  AS screenshotUrl,
        p.status          AS rawStatus,
        p.created_at      AS submittedAt,
        u.id              AS userId,
        u.name            AS userName,
        u.email,
        t.id              AS tournamentId,
        t.title           AS tournament,
        t.entry_fee       AS fee
      FROM payments p
      JOIN users       u ON u.id = p.user_id
      JOIN tournaments t ON t.id = p.tournament_id
      ${where}
      ORDER BY
        CASE p.status WHEN 'pending' THEN 0 WHEN 'verified' THEN 1 ELSE 2 END,
        p.created_at DESC
      `
    )
    .all(...params) as any[];

  // Normalize status for frontend
  const statusLabel: Record<string, string> = {
    pending:  "Pending",
    verified: "Approved",
    rejected: "Rejected",
  };

  const normalized = payments.map((p) => ({
    ...p,
    status: statusLabel[p.rawStatus] ?? "Pending",
    fee: p.fee ? `₹${p.fee}` : "Free",
    txnId: p.txnId || "—",
  }));

  // Summary counts — always unfiltered
  const summary = db
    .prepare(
      `
      SELECT
        COUNT(*)                                            AS total,
        SUM(CASE WHEN status = 'pending'  THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN status = 'verified' THEN 1 ELSE 0 END) AS approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected
      FROM payments
      `
    )
    .get() as any;

  return NextResponse.json({ payments: normalized, summary });
}