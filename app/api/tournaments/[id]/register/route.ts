import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/requireAuth";
import { prisma } from "@/lib/prisma";
import { uploadPaymentScreenshot } from "@/lib/cloudinary";

// ── helper ────────────────────────────────────────────────
const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

// ✅ Type-safe field selection for per-mode slots
type ModeField = 'filled_solo' | 'filled_duo' | 'filled_squad';
type SlotField = 'slots_solo' | 'slots_duo' | 'slots_squad';

const getModeField = (mode: string | null): ModeField => {
  switch ((mode ?? '').toLowerCase()) {
    case 'solo':  return 'filled_solo';
    case 'duo':   return 'filled_duo';
    default:      return 'filled_squad';
  }
};

const getSlotField = (mode: string | null): SlotField => {
  switch ((mode ?? '').toLowerCase()) {
    case 'solo':  return 'slots_solo';
    case 'duo':   return 'slots_duo';
    default:      return 'slots_squad';
  }
};

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { user, error } = await requireAuth(req);
  if (error) return error;

  try {
    const { id } = await context.params;
    const tournamentId = Number(id);

    const formData       = await req.formData();
    const team_name      = formData.get("team_name")      as string;
    const team_tag       = formData.get("team_tag")       as string;
    const playersRaw     = JSON.parse(formData.get("players") as string);
    const use_redeem     = formData.get("use_redeem") === "true";
    const upi_id         = formData.get("upi_id")         as string | null;
    const transaction_id = formData.get("transaction_id") as string | null;
    const file           = formData.get("screenshot")     as File   | null;

    if (!team_name || !playersRaw || playersRaw.length < 1)
      return NextResponse.json({ error: "Team & players required" }, { status: 400 });

    // ✅ FIX: Filter out empty players (those with no name AND no id)
    const players = playersRaw.filter((p: any) => 
      p.player_name?.trim() || p.player_id?.trim()
    );

    if (players.length < 1)
      return NextResponse.json({ error: "At least captain is required" }, { status: 400 });

    const captain = players.find((p: any) => p.is_captain);
    if (!captain)
      return NextResponse.json({ error: "Captain required" }, { status: 400 });

    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament)
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });

    // ── PER-MODE SLOT CHECK ────────────────────
    const modeField = getModeField(tournament.mode);
    const slotField = getSlotField(tournament.mode);
    
    const modeFilled = (tournament as any)[modeField] ?? 0;
    const modeTotal  = (tournament as any)[slotField]  ?? 0;

    if (modeTotal > 0 && modeFilled >= modeTotal)
      return NextResponse.json(
        { error: `${capitalize(tournament.mode ?? "Squad")} is full (${modeFilled}/${modeTotal} teams)` },
        { status: 400 },
      );

    // ── DUPLICATE REGISTRATION CHECK ─────────────────────────
    const exists = await prisma.registration.findFirst({
      where: { user_id: Number(user.id), tournament_id: tournamentId },
    });
    if (exists)
      return NextResponse.json({ error: "Already joined" }, { status: 400 });

    const entryFee = tournament.entry_fee ?? 0;

    // ── HELPER: increment slots + auto-flip to "full" ────────
    // ✅ FIX: Only increment per-mode OR total, not both!
    // The per-mode IS part of the total, so just increment per-mode
    // and filled_slots will be: filled_solo + filled_duo + filled_squad
    const incrementSlots = async (tx: any) => {
      // ✅ CORRECT: Only increment the per-mode field
      // filled_slots will be calculated as sum of per-mode when displayed
      const updateData: Record<string, any> = {
        [modeField]: { increment: 1 },  // Only increment the mode-specific counter
      };

      const updated = await tx.tournament.update({
        where: { id: tournamentId },
        data: updateData,
      });

      // Auto-flip status to "full" when total slots are exhausted
      // Calculate total filled from per-mode fields
      const totalFilled = 
        (updated.filled_solo ?? 0) +
        (updated.filled_duo ?? 0) +
        (updated.filled_squad ?? 0);

      const totalFull =
        (updated.total_slots ?? 0) > 0 &&
        totalFilled >= (updated.total_slots ?? 0);

      if (totalFull) {
        await tx.tournament.update({
          where: { id: tournamentId },
          data: { status: "full" },
        });
      }

      // ✅ NEW: Update filled_slots to match sum of per-mode
      // This keeps them in sync
      await tx.tournament.update({
        where: { id: tournamentId },
        data: { filled_slots: totalFilled },
      });
    };

    // ── REDEEM PATH ───────────────────────────────────────────
    if (use_redeem) {
      const userData = await prisma.user.findUnique({
        where:  { id: Number(user.id) },
        select: { total_points: true },
      });
      const userPoints = userData?.total_points ?? 0;

      if (userPoints < entryFee)
        return NextResponse.json(
          { error: `Insufficient points. You have ${userPoints} pts but need ${entryFee} pts.` },
          { status: 400 },
        );

      const result = await prisma.$transaction(async (tx) => {
        const reg = await tx.registration.create({
          data: {
            user_id:           Number(user.id),
            tournament_id:     tournamentId,
            team_name,
            team_tag,
            captain_name:      captain.player_name,
            captain_player_id: captain.player_id,
            status:            "approved", // ✅ APPROVED IMMEDIATELY
          },
        });

        // ✅ FIX: Only create players that are actually filled
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
            status:         "completed", // ✅ INSTANT PAYMENT
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

        // ✅ REDEEM: INCREMENT HERE (instant approval)
        await incrementSlots(tx);

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

    // ── UPI PATH ──────────────────────────────────────────────
    if (!upi_id || !transaction_id || !file)
      return NextResponse.json(
        { error: "UPI ID, Transaction ID and screenshot are required" },
        { status: 400 },
      );

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
          status:            "pending", // ✅ PENDING (not approved yet)
        },
      });

      // ✅ FIX: Only create players that are actually filled
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
          screenshot_url: fileUrl,
          status:         "pending", // ✅ PENDING (awaiting admin verification)
        },
      });

      const updatedReg = await tx.registration.update({
        where: { id: reg.id },
        data:  { payment_id: payment.id },
      });

      // ❌ DO NOT INCREMENT HERE FOR UPI
      // Will increment in admin payment approval endpoint instead

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