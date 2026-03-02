import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/requireAuth";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { user, error } = await requireAuth(req);
  if (error) return error;

  try {
    const { id } = await context.params;

    const formData = await req.formData();

    // 🎮 TEAM
    const team_name = formData.get("team_name") as string;
    const team_tag = formData.get("team_tag") as string;

    // 👥 PLAYERS (JSON string)
    const players = JSON.parse(formData.get("players") as string);

    // 💰 PAYMENT
    const upi_id = formData.get("upi_id") as string;
    const transaction_id = formData.get("transaction_id") as string;
    const file = formData.get("screenshot") as File;

    // ❌ VALIDATIONS
    if (!team_name || !players || players.length < 4) {
      return NextResponse.json(
        { error: "Team & 4 players required" },
        { status: 400 }
      );
    }

    const captain = players.find((p: any) => p.is_captain);
    if (!captain) {
      return NextResponse.json(
        { error: "Captain required" },
        { status: 400 }
      );
    }

    // 🔍 Tournament check
    const tournament = await prisma.tournament.findUnique({
      where: { id },
    });

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    if (tournament.filled_slots >= tournament.total_slots) {
      return NextResponse.json({ error: "Slots full" }, { status: 400 });
    }

    // ❌ Duplicate join
    const exists = await prisma.registration.findFirst({
      where: {
        user_id: user.id,
        tournament_id: id,
      },
    });

    if (exists) {
      return NextResponse.json({ error: "Already joined" }, { status: 400 });
    }

    // ✅ SAVE IMAGE
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileName = `${Date.now()}-${file.name}`;
    const uploadPath = path.join(
      process.cwd(),
      "public/uploads/payments",
      fileName
    );

    fs.writeFileSync(uploadPath, buffer);

    const fileUrl = `/uploads/payments/${fileName}`;

    // ✅ CREATE REGISTRATION with PLAYERS in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create registration
      const reg = await tx.registration.create({
        data: {
          user_id: user.id,
          tournament_id: id,
          team_name,
          team_tag,
          captain_name: captain.player_name,
          captain_player_id: captain.player_id,
          status: "pending",
        },
      });

      // Create players
      await tx.player.createMany({
        data: players.map((p: any) => ({
          registration_id: reg.id,
          player_name: p.player_name,
          player_id: p.player_id,
          is_captain: p.is_captain ? 1 : 0,
        })),
      });

      // Create payment
      const payment = await tx.payment.create({
        data: {
          user_id: user.id,
          tournament_id: id,
          amount: tournament.entry_fee,
          method: "UPI",
          transaction_id,
          screenshot_url: fileUrl,
          status: "pending",
        },
      });

      // Link payment to registration
      const updatedReg = await tx.registration.update({
        where: { id: reg.id },
        data: { payment_id: payment.id },
      });

      // Update tournament filled slots
      await tx.tournament.update({
        where: { id },
        data: { filled_slots: { increment: 1 } },
      });

      return { registration: updatedReg, payment };
    });

    return NextResponse.json({
      success: true,
      registration_id: result.registration.id,
      payment_id: result.payment.id,
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}