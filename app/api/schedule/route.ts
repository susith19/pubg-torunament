import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const now = new Date();

function timeLabel(startDate: Date | null): string {
  if (!startDate) return "—";
  
  // ✅ FIX: Extract time directly from ISO string without timezone conversion
  // Database stores: "2026-03-21T18:00:00Z" (exactly as user entered)
  // We display: "6:00 PM" (just extract and convert to 12-hour format)
  const isoString = new Date(startDate).toISOString();
  const timeStr = isoString.split("T")[1]?.slice(0, 5); // "18:00"
  
  if (!timeStr) return "—";

  const [hours, minutes] = timeStr.split(":").map(Number);
  
  // Convert 24-hour to 12-hour format
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  
  return `${displayHours}:${String(minutes).padStart(2, "0")} ${period}`;
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

      // ✅ FIX: Extract date without timezone conversion
      // Database stores: "2026-03-21T18:00:00Z"
      // We extract: "2026-03-21" directly from ISO string
      let dateKey = "TBA";
      let dayName = "TBA";

      if (d) {
        const isoString = d.toISOString();
        const dateStr = isoString.split("T")[0]; // "2026-03-21"
        const [year, month, day] = dateStr.split("-").map(Number);
        
        // Format: "21 MAR" or "15 MAR"
        const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        dateKey = `${day} ${monthNames[month - 1]}`.toUpperCase();

        // Get day name (Sunday, Monday, etc.)
        const dayOfWeek = new Date(dateStr + "T00:00:00Z").getUTCDay();
        dayName = DAY_NAMES[dayOfWeek];
      }

      if (!groupMap[dateKey]) {
        groupMap[dateKey] = { date: dateKey, day: dayName, matches: [] };
      }

      groupMap[dateKey].matches.push({
        id: t.id,
        name: t.title,
        time: timeLabel(d), // ✅ Returns "6:00 PM" (12-hour format, no conversion)
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