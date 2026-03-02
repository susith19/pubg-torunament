import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");

    // ✅ Validate header format
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "No token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];

    // 🔐 Verify Firebase token
    const decoded = await adminAuth.verifyIdToken(token);

    return NextResponse.json({
      success: true,
      user: {
        uid: decoded.uid,
        email: decoded.email,
        name: decoded.name || "",
        role: decoded.role || "user",
      },
    });

  } catch (err) {
    console.error("Auth error:", err);

    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 }
    );
  }
}