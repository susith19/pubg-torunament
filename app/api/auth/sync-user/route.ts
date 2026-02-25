import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { uid, email } = await req.json();

  if (!uid || !email) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  // 🔍 Check if user exists
  const existing = db
    .prepare("SELECT * FROM users WHERE firebase_uid = ?")
    .get(uid);

  if (!existing) {
    // ✅ Insert new user
    db.prepare(`
      INSERT INTO users (firebase_uid, email, role)
      VALUES (?, ?, 'user')
    `).run(uid, email);
  }

  return NextResponse.json({ message: "User synced" });
}