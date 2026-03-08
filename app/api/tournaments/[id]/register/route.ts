import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/requireAuth";
import { prisma } from "@/lib/prisma";
import { uploadPaymentScreenshot } from "@/lib/cloudinary";   // ← new helper

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireAuth(req);
  if (error) return error;

  try {
    const { id } = await context.params;
    const tournamentId = Number(id);

    const formData = await req.formData();

    const team_name = formData.get("team_name") as string;
    const team_tag  = formData.get("team_tag")  as string;
    const players   = JSON.parse(formData.get("players") as string);
    const use_redeem = formData.get("use_redeem") === "true";

    const upi_id         = formData.get("upi_id")         as string | null;
    const transaction_id = formData.get("transaction_id") as string | null;
    const file           = formData.get("screenshot")     as File   | null;

    if (!team_name || !players || players.length < 1) {
      return NextResponse.json({ error: "Team & players required" }, { status: 400 });
    }

    const captain = players.find((p: any) => p.is_captain);
    if (!captain) {
      return NextResponse.json({ error: "Captain required" }, { status: 400 });
    }

    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }
    if (tournament.filled_slots >= (tournament.total_slots ?? 0)) {
      return NextResponse.json({ error: "Slots full" }, { status: 400 });
    }

    const exists = await prisma.registration.findFirst({
      where: { user_id: Number(user.id), tournament_id: tournamentId },
    });
    if (exists) {
      return NextResponse.json({ error: "Already joined" }, { status: 400 });
    }

    const entryFee = tournament.entry_fee ?? 0;

    // ── REDEEM PATH ──────────────────────────────────────────
    if (use_redeem) {
      const userData = await prisma.user.findUnique({
        where:  { id: Number(user.id) },
        select: { total_points: true },
      });
      const userPoints = userData?.total_points ?? 0;

      if (userPoints < entryFee) {
        return NextResponse.json(
          { error: `Insufficient points. You have ${userPoints} pts but need ${entryFee} pts.` },
          { status: 400 },
        );
      }

      const result = await prisma.$transaction(async (tx) => {
        const reg = await tx.registration.create({
          data: {
            user_id:           Number(user.id),
            tournament_id:     tournamentId,
            team_name,
            team_tag,
            captain_name:      captain.player_name,
            captain_player_id: captain.player_id,
            status:            "pending",
          },
        });

        await tx.player.createMany({
          data: players.map((p: any) => ({
            registration_id: reg.id,
            player_name:     p.player_name,
            player_id:       p.player_id,
            is_captain:      Boolean(p.is_captain),
          })),
        });

        const payment = await tx.payment.create({
          data: {
            user_id:        Number(user.id),
            tournament_id:  tournamentId,
            amount:         entryFee,
            method:         "REDEEM",
            transaction_id: `REDEEM-${Date.now()}`,
            screenshot_url: null,
            status:         "pending",
          },
        });

        const updatedReg = await tx.registration.update({
          where: { id: reg.id },
          data:  { payment_id: payment.id },
        });

        await tx.user.update({
          where: { id: Number(user.id) },
          data:  { total_points: { decrement: entryFee } },
        });

        await tx.point.create({
          data: {
            user_id:         Number(user.id),
            points:          -entryFee,
            type:            "redeem_entry",
            registration_id: reg.id,
            note:            `Entry fee redeemed for tournament #${tournamentId}`,
          },
        });

        await tx.tournament.update({
          where: { id: tournamentId },
          data:  { filled_slots: { increment: 1 } },
        });

        return { registration: updatedReg, payment };
      });

      return NextResponse.json({
        success:         true,
        method:          "redeem",
        registration_id: result.registration.id,
        payment_id:      result.payment.id,
        points_deducted: entryFee,
      });
    }

    // ── UPI PAYMENT PATH ─────────────────────────────────────
    if (!upi_id || !transaction_id || !file) {
      return NextResponse.json(
        { error: "UPI ID, Transaction ID and screenshot are required" },
        { status: 400 },
      );
    }

    // ✅ Upload screenshot to Cloudinary (works on Vercel — no disk write)
    const fileUrl = await uploadPaymentScreenshot(file);

    const result = await prisma.$transaction(async (tx) => {
      const reg = await tx.registration.create({
        data: {
          user_id:           Number(user.id),
          tournament_id:     tournamentId,
          team_name,
          team_tag,
          captain_name:      captain.player_name,
          captain_player_id: captain.player_id,
          status:            "pending",
        },
      });

      await tx.player.createMany({
        data: players.map((p: any) => ({
          registration_id: reg.id,
          player_name:     p.player_name,
          player_id:       p.player_id,
          is_captain:      Boolean(p.is_captain),
        })),
      });

      const payment = await tx.payment.create({
        data: {
          user_id:        Number(user.id),
          tournament_id:  tournamentId,
          amount:         entryFee,
          method:         "UPI",
          transaction_id,
          screenshot_url: fileUrl,   // ← Cloudinary https:// URL
          status:         "pending",
        },
      });

      const updatedReg = await tx.registration.update({
        where: { id: reg.id },
        data:  { payment_id: payment.id },
      });

      await tx.tournament.update({
        where: { id: tournamentId },
        data:  { filled_slots: { increment: 1 } },
      });

      return { registration: updatedReg, payment };
    });

    return NextResponse.json({
      success:         true,
      method:          "upi",
      registration_id: result.registration.id,
      payment_id:      result.payment.id,
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}