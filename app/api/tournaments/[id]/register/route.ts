import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/requireAuth";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

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

    // 🎮 TEAM
    const team_name = formData.get("team_name") as string;
    const team_tag  = formData.get("team_tag")  as string;

    // 👥 PLAYERS (JSON string)
    const players = JSON.parse(formData.get("players") as string);

    // 🪙 REDEEM FLAG
    const use_redeem = formData.get("use_redeem") === "true";

    // 💰 PAYMENT (only required if NOT redeeming)
    const upi_id        = formData.get("upi_id")        as string | null;
    const transaction_id = formData.get("transaction_id") as string | null;
    const file           = formData.get("screenshot")    as File   | null;

    // ❌ VALIDATIONS
    if (!team_name || !players || players.length < 1) {
      return NextResponse.json(
        { error: "Team & players required" },
        { status: 400 },
      );
    }

    const captain = players.find((p: any) => p.is_captain);
    if (!captain) {
      return NextResponse.json({ error: "Captain required" }, { status: 400 });
    }

    // 🔍 Tournament check
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    const totalSlots = tournament.total_slots ?? 0;
    if (tournament.filled_slots >= totalSlots) {
      return NextResponse.json({ error: "Slots full" }, { status: 400 });
    }

    // ❌ Duplicate join
    const exists = await prisma.registration.findFirst({
      where: {
        user_id:       Number(user.id),
        tournament_id: tournamentId,
      },
    });

    if (exists) {
      return NextResponse.json({ error: "Already joined" }, { status: 400 });
    }

    const entryFee = tournament.entry_fee ?? 0;

    // ─────────────────────────────────────────────────────────
    // 🪙 REDEEM PATH
    // ─────────────────────────────────────────────────────────
    if (use_redeem) {
      // Fetch current user points
      const userData = await prisma.user.findUnique({
        where: { id: Number(user.id) },
        select: { total_points: true },
      });

      const userPoints = userData?.total_points ?? 0;

      // ❌ STRICT RULE: points must be >= entry fee (no partial)
      if (userPoints < entryFee) {
        return NextResponse.json(
          {
            error: `Insufficient points. You have ${userPoints} pts but need ${entryFee} pts.`,
          },
          { status: 400 },
        );
      }

      // ✅ CREATE REGISTRATION with point deduction in transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create registration
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

        // Create players
        await tx.player.createMany({
          data: players.map((p: any) => ({
            registration_id: reg.id,
            player_name:     p.player_name,
            player_id:       p.player_id,
            is_captain:      Boolean(p.is_captain),
          })),
        });

        // Create payment record with method = "REDEEM"
        const payment = await tx.payment.create({
          data: {
            user_id:       Number(user.id),
            tournament_id: tournamentId,
            amount:        entryFee,
            method:        "REDEEM",        // ← signals admin dashboard it's points-based
            transaction_id: `REDEEM-${Date.now()}`,
            screenshot_url: null,
            status:        "pending",       // admin still must approve
          },
        });

        // Link payment to registration
        const updatedReg = await tx.registration.update({
          where: { id: reg.id },
          data:  { payment_id: payment.id },
        });

        // Deduct points from user wallet (exactly entryFee)
        await tx.user.update({
          where: { id: Number(user.id) },
          data:  { total_points: { decrement: entryFee } },
        });

        // Record point transaction (negative)
        await tx.point.create({
          data: {
            user_id:         Number(user.id),
            points:          -entryFee,
            type:            "redeem_entry",
            registration_id: reg.id,
            note:            `Entry fee redeemed for tournament #${tournamentId}`,
          },
        });

        // Update tournament filled slots
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

    // ─────────────────────────────────────────────────────────
    // 💳 NORMAL UPI PAYMENT PATH
    // ─────────────────────────────────────────────────────────

    if (!upi_id || !transaction_id || !file) {
      return NextResponse.json(
        { error: "UPI ID, Transaction ID and screenshot are required for payment" },
        { status: 400 },
      );
    }

    // ✅ SAVE IMAGE
    const bytes  = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileName  = `${Date.now()}-${file.name}`;
    const uploadPath = path.join(process.cwd(), "public/uploads/payments", fileName);

    fs.writeFileSync(uploadPath, buffer);
    const fileUrl = `/uploads/payments/${fileName}`;

    // ✅ CREATE REGISTRATION with PLAYERS in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create registration
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

      // Create players
      await tx.player.createMany({
        data: players.map((p: any) => ({
          registration_id: reg.id,
          player_name:     p.player_name,
          player_id:       p.player_id,
          is_captain:      Boolean(p.is_captain),
        })),
      });

      // Create payment
      const payment = await tx.payment.create({
        data: {
          user_id:       Number(user.id),
          tournament_id: tournamentId,
          amount:        entryFee,
          method:        "UPI",
          transaction_id,
          screenshot_url: fileUrl,
          status:        "pending",
        },
      });

      // Link payment to registration
      const updatedReg = await tx.registration.update({
        where: { id: reg.id },
        data:  { payment_id: payment.id },
      });

      // Update tournament filled slots
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