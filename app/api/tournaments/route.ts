import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Public — used by /tournaments page with ?mode= and ?date= filters
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") ?? "";  // solo | duo | squad | tdm
  const date = searchParams.get("date") ?? "";  // Today | Tomorrow | This Week | Next Week

  const conditions: string[] = [];
  const params: any[] = [];

  // Mode filter
  if (mode && mode !== "all") {
    conditions.push(`LOWER(mode) = ?`);
    params.push(mode.toLowerCase());
  }

  // Date filter — SQLite date comparisons
  if (date === "Today") {
    conditions.push(`date(start_date) = date('now')`);
  } else if (date === "Tomorrow") {
    conditions.push(`date(start_date) = date('now', '+1 day')`);
  } else if (date === "This Week") {
    conditions.push(`date(start_date) BETWEEN date('now') AND date('now', '+6 days')`);
  } else if (date === "Next Week") {
    conditions.push(`date(start_date) BETWEEN date('now', '+7 days') AND date('now', '+13 days')`);
  }

  // Always show non-deleted, non-cancelled
  conditions.push(`status NOT IN ('cancelled','deleted')`);

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const rows = db.prepare(`
    SELECT
      id, title, game, mode, map,
      entry_fee   AS fee,
      prize_pool  AS prize,
      total_slots AS slots,
      filled_slots AS filled,
      status,
      start_date
    FROM tournaments
    ${where}
    ORDER BY
      CASE status
        WHEN 'live'     THEN 1
        WHEN 'open'     THEN 2
        WHEN 'upcoming' THEN 3
        WHEN 'full'     THEN 4
        WHEN 'closed'   THEN 5
        ELSE 6
      END,
      start_date ASC
  `).all(...params) as any[];

  // Normalize for frontend
  const STATUS_MAP: Record<string, string> = {
    open: "Open", upcoming: "Open", full: "Full", closed: "Closed", live: "Live",
  };

  function dateLabel(iso: string): string {
    if (!iso) return "—";
    const d = new Date(iso.replace(" ", "T"));
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Tomorrow";
    if (diff > 1 && diff <= 6) return "This Week";
    if (diff >= 7 && diff <= 13) return "Next Week";
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  }

  function timeLabel(iso: string): string {
    if (!iso) return "—";
    return new Date(iso.replace(" ", "T")).toLocaleTimeString("en-IN", {
      hour: "2-digit", minute: "2-digit", hour12: true,
    });
  }

  const tournaments = rows.map((t) => ({
    ...t,
    status:    STATUS_MAP[t.status?.toLowerCase()] ?? t.status,
    mode:      t.mode ? t.mode.charAt(0).toUpperCase() + t.mode.slice(1) : "—",
    fee:       t.fee ? `₹${t.fee}` : "Free",
    prize:     t.prize ? `₹${Number(t.prize).toLocaleString("en-IN")}` : "TBA",
    platform:  t.game === "BGMI" ? "Mobile" : "PC",
    dateLabel: dateLabel(t.start_date),
    timeLabel: timeLabel(t.start_date),
  }));

  return NextResponse.json({ tournaments, total: tournaments.length });
}