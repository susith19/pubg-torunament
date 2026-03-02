import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "./auth";

export async function requireAuth(req: NextRequest) {
  const user = await getAuthUser(req);

  if (!user) {
    return {
      error: NextResponse.json(
        { error: "Please login" },
        { status: 401 }
      ),
    };
  }

  return { user };
}