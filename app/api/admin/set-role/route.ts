import { NextRequest, NextResponse } from "next/server";
import admin from "@/lib/firebaseAdmin";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { uid, role } = await req.json();

  if (!uid || !role) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  // 1. Update DB
  db.prepare(`
    UPDATE users SET role = ? WHERE uid = ?
  `).run(role, uid);

  // 2. Update Firebase claims
  await admin.auth().setCustomUserClaims(uid, { role });

  return NextResponse.json({ message: "Role updated" });
}