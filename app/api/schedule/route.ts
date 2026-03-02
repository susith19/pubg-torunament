import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const rows = db.prepare(`
    SELECT
      id,
      title       AS name,
      game,
      mode,
      map,
      entry_fee   AS fee,
      total_slots  AS slots,
      filled_slots AS filled,
      status,
      start_date
    FROM tournaments
    WHERE status NOT IN ('cancelled', 'deleted')
    ORDER BY start_date ASC
  `).all() as any[];

  const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

  const STATUS_MAP: Record<string, string> = {
    open: "Open", upcoming: "Open", full: "Full", closed: "Closed", live: "Live",
  };

  // Group by calendar date
  const groupMap: Record<string, { date: string; day: string; matches: any[] }> = {};

  for (const t of rows) {
    const d = t.start_date
      ? new Date(t.start_date.replace(" ", "T"))
      : null;

    const dateKey = d
      ? d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }).toUpperCase()
      : "TBA";

    const dayName = d ? DAY_NAMES[d.getDay()] : "TBA";

    if (!groupMap[dateKey]) {
      groupMap[dateKey] = { date: dateKey, day: dayName, matches: [] };
    }

    groupMap[dateKey].matches.push({
      id:     t.id,
      name:   t.name,
      time:   d
        ? d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false })
        : "TBA",
      mode:   t.mode ? t.mode.charAt(0).toUpperCase() + t.mode.slice(1) : "—",
      map:    t.map  ?? "—",
      status: STATUS_MAP[t.status?.toLowerCase()] ?? t.status,
      slots:  t.slots,
      filled: t.filled,
      fee:    t.fee ? `₹${t.fee}` : "Free",
      platform: t.game === "BGMI" ? "BGMI" : "PUBG",
    });
  }

  return NextResponse.json({ schedule: Object.values(groupMap) });
}