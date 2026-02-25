import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const users = db.prepare("SELECT * FROM users").all();
  return NextResponse.json({ users });
}