import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";

// ── GET single payment ────────────────────────────────────
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const { id } = await context.params;

  const payment = db
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
      WHERE p.id = ?
      `
    )
    .get(id) as any;

  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  const statusLabel: Record<string, string> = {
    pending: "Pending", verified: "Approved", rejected: "Rejected",
  };

  return NextResponse.json({
    ...payment,
    status: statusLabel[payment.rawStatus] ?? "Pending",
    fee: payment.fee ? `₹${payment.fee}` : "Free",
    txnId: payment.txnId || "—",
  });
}

// ── PUT — approve or reject ───────────────────────────────
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  try {
    const { id } = await context.params;
    const body = await req.json();
    const { status } = body; // "verified" or "rejected"

    if (!["verified", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status. Use 'verified' or 'rejected'" }, { status: 400 });
    }

    // Update payment status
    const result = db
      .prepare(`UPDATE payments SET status = ? WHERE id = ?`)
      .run(status, id);

    if (result.changes === 0) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (status === "verified") {
      // Fetch payment to get user_id + tournament_id
      const payment = db
        .prepare(`SELECT * FROM payments WHERE id = ?`)
        .get(id) as any;

      if (payment) {
        // Approve the registration + link payment_id
        db.prepare(
          `
          UPDATE registrations
          SET status = 'approved', payment_id = ?
          WHERE user_id = ? AND tournament_id = ? AND status = 'pending'
          `
        ).run(id, payment.user_id, payment.tournament_id);

        // Increment tournament filled_slots
        db.prepare(
          `UPDATE tournaments SET filled_slots = filled_slots + 1 WHERE id = ?`
        ).run(payment.tournament_id);
      }
    }

    if (status === "rejected") {
      // Mark registration as rejected too
      const payment = db
        .prepare(`SELECT * FROM payments WHERE id = ?`)
        .get(id) as any;

      if (payment) {
        db.prepare(
          `
          UPDATE registrations
          SET status = 'rejected'
          WHERE user_id = ? AND tournament_id = ? AND status = 'pending'
          `
        ).run(payment.user_id, payment.tournament_id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update payment" }, { status: 500 });
  }
}

// ── DELETE payment ────────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const { id } = await context.params;

  const result = db.prepare(`DELETE FROM payments WHERE id = ?`).run(id);

  if (result.changes === 0) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}