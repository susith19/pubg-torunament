import { NextRequest, NextResponse } from "next/server";
import {adminAuth} from "@/lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.split("Bearer ")[1];

  if (!token) {
    return NextResponse.json({ error: "No token" }, { status: 401 });
  }

  const decoded = await adminAuth.verifyIdToken(token);

  if (decoded.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ message: "Welcome Admin" });
}