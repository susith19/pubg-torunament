export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Fetch current config
export async function GET() {
  try {
    let config = await prisma.pointsConfig.findFirst();

    if (!config) {
      config = await prisma.pointsConfig.create({
        data: {}
      });
    }

    return NextResponse.json({
      success: true,
      placement: config.placement,
      kill_points: config.kill_points,
      updated_at: config.updated_at
    });

  } catch (error) {
    console.error("Error fetching config:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch config" },
      { status: 500 }
    );
  }
}


// POST - Update config
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { placement, kill_points } = body;

    // ✅ sanitize placement values to integers
    const sanitizedPlacement = Object.fromEntries(
      Object.entries(placement || {}).map(([mode, positions]: any) => [
        mode,
        Object.fromEntries(
          Object.entries(positions || {}).map(([pos, value]) => [
            pos,
            parseInt(value as any, 10) || 0
          ])
        )
      ])
    );

    const sanitizedKillPoints = parseInt(kill_points, 10) || 0;

    let config = await prisma.pointsConfig.findFirst();

    if (!config) {
      config = await prisma.pointsConfig.create({
        data: {
          placement: sanitizedPlacement,
          kill_points: sanitizedKillPoints
        }
      });
    } else {
      config = await prisma.pointsConfig.update({
        where: { id: config.id },
        data: {
          placement: sanitizedPlacement,
          kill_points: sanitizedKillPoints
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: "Points config updated",
      placement: config.placement,
      kill_points: config.kill_points,
      updated_at: config.updated_at
    });

  } catch (error) {
    console.error("Error updating config:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update config" },
      { status: 500 }
    );
  }
}