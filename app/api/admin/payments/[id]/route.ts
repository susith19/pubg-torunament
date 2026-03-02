import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";


// ── GET single payment ────────────────────────────────────
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const { id } = await context.params;

  const payment = await prisma.payment.findUnique({
    where: { id: Number(id) },
    include: {
      user: true,
      tournament: true,
    },
  });

  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  const statusLabel: Record<string, string> = {
    pending: "Pending",
    verified: "Approved",
    rejected: "Rejected",
  };

  return NextResponse.json({
    id: payment.id,
    amount: payment.amount,
    method: payment.method,
    txnId: payment.transaction_id || "—",
    screenshotUrl: payment.screenshot_url,
    rawStatus: payment.status,
    submittedAt: payment.created_at,
    userId: payment.user?.id,
    userName: payment.user?.name,
    email: payment.user?.email,
    tournamentId: payment.tournament?.id,
    tournament: payment.tournament?.title,
    fee: payment.tournament?.entry_fee
      ? `₹${payment.tournament.entry_fee}`
      : "Free",
    status: statusLabel[payment.status] ?? "Pending",
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
    const { status } = await req.json();

    if (!["verified", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    const paymentId = Number(id);

    // 🔥 TRANSACTION (important)
    const result = await prisma.$transaction(async (tx) => {
      // Update payment
      const payment = await tx.payment.update({
        where: { id: paymentId },
        data: { status },
      });

      if (!payment) throw new Error("Payment not found");

      if (status === "verified") {
        // Approve registration
        await tx.registration.updateMany({
          where: {
            user_id: payment.user_id,
            tournament_id: payment.tournament_id,
            status: "pending",
          },
          data: {
            status: "approved",
            payment_id: paymentId,
          },
        });

        // Increment slots
        await tx.tournament.update({
          where: { id: payment.tournament_id! },
          data: {
            filled_slots: {
              increment: 1,
            },
          },
        });
      }

      if (status === "rejected") {
        await tx.registration.updateMany({
          where: {
            user_id: payment.user_id,
            tournament_id: payment.tournament_id,
            status: "pending",
          },
          data: {
            status: "rejected",
          },
        });
      }

      return true;
    });

    return NextResponse.json({ success: result });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update payment" },
      { status: 500 }
    );
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

  try {
    await prisma.payment.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Payment not found" },
      { status: 404 }
    );
  }
}