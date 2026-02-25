import { NextRequest, NextResponse } from "next/server";
import admin from "@/lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.split("Bearer ")[1];

  if (!token) {
    return NextResponse.json({ error: "No token" }, { status: 401 });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);

    return NextResponse.json({
      uid: decoded.uid,
      email: decoded.email,
    });
  } catch (err) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}