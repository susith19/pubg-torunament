import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcrypt";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const existing = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email);

  if (existing) {
    return NextResponse.json({ error: "User exists" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 10);

  db.prepare("INSERT INTO users (email, password) VALUES (?, ?)")
    .run(email, hashed);

  return NextResponse.json({ message: "User registered" });
}