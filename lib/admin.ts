import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "./auth";

export async function requireAdmin(req: NextRequest) {
  const user = await getAuthUser(req);

  if (!user) {
    return {
      error: NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  if (user.role !== "admin") {
    return {
      error: NextResponse.json(
        { message: "Forbidden - Admin only" },
        { status: 403 }
      ),
    };
  }

  return { user };
}