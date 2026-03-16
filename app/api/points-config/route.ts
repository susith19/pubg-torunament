// app/api/points-config/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // Fetch the points configuration (there should only be one entry)
    const pointsConfig = await prisma.pointsConfig.findUnique({
      where: { id: 1 },
    });

    if (!pointsConfig) {
      // Return default config if none exists
      return NextResponse.json({
        success: true,
        pointsConfig: {
          placement: {
            solo: {
              "1": 500,
              "2": 400,
              "3": 300,
              "4": 200,
              "5": 100,
              "6-10": 75,
              "11-15": 50,
              "16-20": 30,
            },
            duo: {
              "1": 500,
              "2": 400,
              "3": 300,
              "4": 200,
              "5-10": 100,
              "11-15": 50,
            },
            team: {
              "1": 500,
              "2": 400,
              "3": 300,
              "4": 200,
              "5": 180,
              "6-10": 75,
            },
          },
          kill_points: 5,
        },
      });
    }

    // Parse the JSON placement data
    const placement =
      typeof pointsConfig.placement === "string"
        ? JSON.parse(pointsConfig.placement)
        : pointsConfig.placement;

    return NextResponse.json({
      success: true,
      pointsConfig: {
        placement,
        kill_points: pointsConfig.kill_points,
      },
    });
  } catch (err) {
    console.error("Error fetching points config:", err);
    return NextResponse.json(
      { error: "Failed to fetch points configuration" },
      { status: 500 }
    );
  }
}