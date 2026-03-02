import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/requireAuth";
import { db } from "@/lib/db";
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
    const tournament: any = db
      .prepare("SELECT * FROM tournaments WHERE id=?")
      .get(id);

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    if (tournament.filled_slots >= tournament.total_slots) {
      return NextResponse.json({ error: "Slots full" }, { status: 400 });
    }

    // ❌ Duplicate join
    const exists = db.prepare(`
      SELECT id FROM registrations WHERE user_id=? AND tournament_id=?
    `).get(user.id, id);

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

    // ✅ CREATE REGISTRATION
    const reg = db.prepare(`
      INSERT INTO registrations
      (user_id, tournament_id, team_name, team_tag, captain_name, captain_player_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      user.id,
      id,
      team_name,
      team_tag,
      captain.player_name,
      captain.player_id
    );

    const registrationId = reg.lastInsertRowid;

    // ✅ INSERT PLAYERS
    for (const p of players) {
      db.prepare(`
        INSERT INTO players
        (registration_id, player_name, player_id, is_captain)
        VALUES (?, ?, ?, ?)
      `).run(
        registrationId,
        p.player_name,
        p.player_id,
        p.is_captain ? 1 : 0
      );
    }

    // ✅ CREATE PAYMENT
    const payment = db.prepare(`
      INSERT INTO payments
      (user_id, tournament_id, amount, method, transaction_id, screenshot_url, status)
      VALUES (?, ?, ?, 'UPI', ?, ?, 'pending')
    `).run(
      user.id,
      id,
      tournament.entry_fee,
      transaction_id,
      fileUrl
    );

    // ✅ LINK PAYMENT
    db.prepare(`
      UPDATE registrations SET payment_id=? WHERE id=?
    `).run(payment.lastInsertRowid, registrationId);

    // ✅ UPDATE SLOT
    db.prepare(`
      UPDATE tournaments SET filled_slots = filled_slots + 1 WHERE id=?
    `).run(id);

    return NextResponse.json({
      success: true,
      registration_id: registrationId,
      payment_id: payment.lastInsertRowid,
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}