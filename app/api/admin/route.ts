import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "No token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];

    // ✅ Verify Firebase token
    const decoded = await adminAuth.verifyIdToken(token);

    // ✅ Role check
    if (decoded.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Welcome Admin",
      user: {
        uid: decoded.uid,
        email: decoded.email,
        role: decoded.role,
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