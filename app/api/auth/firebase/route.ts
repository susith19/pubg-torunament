import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import admin from "@/lib/firebaseAdmin";


type User = {
  id: number;
  uid: string;
  email: string;
  role: string;
  created_at: string;
};

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "No token" }, { status: 400 });
    }

    // 🔐 Verify Firebase token
    const decoded = await admin.auth().verifyIdToken(token);

    const uid = decoded.uid;
    const email = decoded.email;

    // 🔍 Check if user exists
    const existing = db
      .prepare("SELECT * FROM users WHERE uid = ?")
      .get(uid) as User | undefined;

    if (!existing) {
      // ✅ Insert user
      db.prepare(`
        INSERT INTO users (uid, email, role)
        VALUES (?, ?, 'user')
      `).run(uid, email);
    }

    return NextResponse.json({
      uid,
      email,
      role: existing?.role || "user",
    });

  } catch (error) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}