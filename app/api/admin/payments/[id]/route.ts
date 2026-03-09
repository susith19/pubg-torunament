import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

// ── Type-safe field selection ────────────────────────────
type ModeField = 'filled_solo' | 'filled_duo' | 'filled_squad';

const getModeField = (mode: string | null): ModeField => {
  switch ((mode ?? '').toLowerCase()) {
    case 'solo':  return 'filled_solo';
    case 'duo':   return 'filled_duo';
    default:      return 'filled_squad';
  }
};

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
    completed: "Completed",
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

    // 🔥 TRANSACTION
    const result = await prisma.$transaction(async (tx) => {
      // Get payment details
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
      });

      if (!payment) throw new Error("Payment not found");

      // Update payment status
      await tx.payment.update({
        where: { id: paymentId },
        data: { status },
      });

      if (status === "verified") {
        // Approve registration
        const updatedRegs = await tx.registration.updateMany({
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

        // ✅ ONLY increment if method is "UPI"
        // REDEEM already incremented during registration
        if (payment.method === "UPI" && updatedRegs.count > 0) {
          const modeField = getModeField(payment.tournament?.mode ?? null);
          
          const updateData: Record<string, any> = {
            filled_slots: { increment: 1 }, // 1 team
          };
          updateData[modeField] = { increment: 1 };

          const updated = await tx.tournament.update({
            where: { id: payment.tournament_id! },
            data: updateData,
          });

          // Auto-flip to "full" if all slots taken
          if (
            (updated.total_slots ?? 0) > 0 &&
            updated.filled_slots >= (updated.total_slots ?? 0)
          ) {
            await tx.tournament.update({
              where: { id: payment.tournament_id! },
              data: { status: "full" },
            });
          }
        }
      }

      if (status === "rejected") {
        // Reject registration (no slot increment)
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
    const payment = await prisma.payment.findUnique({
      where: { id: Number(id) },
      include: { tournament: true },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    // If deleting an approved UPI payment, decrement slots
    if (
      (payment.status === "verified" || payment.status === "completed") &&
      payment.method === "UPI"
    ) {
      await prisma.$transaction(async (tx) => {
        const modeField = getModeField(payment.tournament?.mode ?? null);
        
        const updateData: Record<string, any> = {
          filled_slots: { decrement: 1 },
        };
        updateData[modeField] = { decrement: 1 };

        // Decrement slots
        await tx.tournament.update({
          where: { id: payment.tournament_id! },
          data: updateData,
        });

        // Reject associated registrations
        await tx.registration.updateMany({
          where: {
            user_id: payment.user_id,
            tournament_id: payment.tournament_id,
            status: "approved",
          },
          data: {
            status: "rejected",
          },
        });

        // Delete the payment
        await tx.payment.delete({
          where: { id: Number(id) },
        });
      });
    } else {
      // For REDEEM or pending payments, just delete without slot changes
      await prisma.payment.delete({
        where: { id: Number(id) },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to delete payment" },
      { status: 500 }
    );
  }
}