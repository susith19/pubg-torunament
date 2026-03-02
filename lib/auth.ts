import { NextRequest } from "next/server";
import { adminAuth } from "./firebaseAdmin";
import { db } from "./db";

export interface AuthUser {
  id: number;
  uid: string;
  email: string;
  role: string;
  referral_code: string;
  referral_count: number;
}

export async function getAuthUser(req: NextRequest): Promise<AuthUser | null> {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.split(" ")[1];

    // ✅ Verify Firebase token
    const decoded = await adminAuth.verifyIdToken(token);

    // ✅ Get user from DB
    const user = db
      .prepare("SELECT * FROM users WHERE uid = ?")
      .get(decoded.uid);

    if (!user) return null;

    return user as AuthUser;
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
}