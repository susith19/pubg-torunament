import { NextRequest, NextResponse } from "next/server";
import {adminAuth} from "@/lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.split("Bearer ")[1];

  if (!token) {
    return NextResponse.json({ error: "No token" }, { status: 401 });
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);

    return NextResponse.json({
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name || "",
      role: decoded.role || "user",
    });
  } catch (err) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}