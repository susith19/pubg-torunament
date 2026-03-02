import { NextRequest } from "next/server";
import { adminAuth } from "./firebaseAdmin";
import { prisma } from "./prisma";

export interface AuthUser {
  id: string;
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
    const user = await prisma.user.findUnique({
      where: { uid: decoded.uid },
      select: {
        id: true,
        uid: true,
        email: true,
        role: true,
        referral_code: true,
        referral_count: true,
      },
    });

    if (!user) return null;

    return user as AuthUser;
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
}