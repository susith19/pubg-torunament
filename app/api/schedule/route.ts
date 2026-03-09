import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const now = new Date();

function timeLabel(startDate: Date | null): string {
  if (!startDate) return "—";
  return new Date(startDate).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata", // ✅ Added IST timezone
  });
}

export async function GET() {
  try {
    const tournaments = await prisma.tournament.findMany({
      where: {
        status: {
          notIn: ["cancelled", "deleted"],
        },
      },
      select: {
        id: true,
        title: true,
        game: true,
        mode: true,
        map: true,
        entry_fee: true,
        total_slots: true,
        filled_slots: true,
        status: true,
        start_date: true,
      },
      orderBy: { start_date: "asc" },
    });

    const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    const STATUS_MAP: Record<string, string> = {
      open: "Open",
      upcoming: "Open",
      full: "Full",
      closed: "Closed",
      live: "Live",
    };

    const groupMap: Record<string, { date: string; day: string; matches: any[] }> = {};

    for (const t of tournaments) {
      const d = t.start_date ? new Date(t.start_date) : null;

      const dateKey = d
        ? d.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short" }).toUpperCase()
        : "TBA";

      const dayName = d
        ? DAY_NAMES[new Date(d.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })).getDay()]
        : "TBA";

      if (!groupMap[dateKey]) {
        groupMap[dateKey] = { date: dateKey, day: dayName, matches: [] };
      }

      groupMap[dateKey].matches.push({
        id: t.id,
        name: t.title,
        time: timeLabel(d), // ✅ Use consistent timeLabel function
        mode: t.mode ? t.mode.charAt(0).toUpperCase() + t.mode.slice(1) : "—",
        map: t.map ?? "—",
        status: STATUS_MAP[t.status?.toLowerCase()] ?? t.status,
        slots: t.total_slots,
        filled: t.filled_slots,
        fee: t.entry_fee ? `₹${t.entry_fee}` : "Free",
        platform: t.game === "BGMI" ? "BGMI" : "PUBG",
      });
    }

    return NextResponse.json({ schedule: Object.values(groupMap) });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch schedule" }, { status: 500 });
  }
}