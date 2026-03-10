import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public — used by /tournaments page with ?mode= and ?date= filters
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") ?? ""; // solo | duo | squad | tdm
  const date = searchParams.get("date") ?? ""; // Today | Tomorrow | This Week | Next Week

  const conditions: any = {};
  const now = new Date();

  // Mode filter
  if (mode && mode !== "all") {
    conditions.mode = {
      equals: mode.toLowerCase(),
      mode: "insensitive", // Case-insensitive for PostgreSQL
    };
  }

  // Date filter
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let dateFilter: any = null;

  if (date === "Today") {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateFilter = {
      gte: today,
      lt: tomorrow,
    };
  } else if (date === "Tomorrow") {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);
    dateFilter = {
      gte: tomorrow,
      lt: dayAfter,
    };
  } else if (date === "This Week") {
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 6);
    dateFilter = {
      gte: today,
      lte: weekEnd,
    };
  } else if (date === "Next Week") {
    const nextWeekStart = new Date(today);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);
    const nextWeekEnd = new Date(nextWeekStart);
    nextWeekEnd.setDate(nextWeekEnd.getDate() + 6);
    dateFilter = {
      gte: nextWeekStart,
      lte: nextWeekEnd,
    };
  }

  if (dateFilter) {
    conditions.start_date = dateFilter;
  }

  // Always exclude deleted and cancelled tournaments
  conditions.status = {
    notIn: ["cancelled", "deleted"],
  };

  // Fetch tournaments
  const tournaments = await prisma.tournament.findMany({
    where: conditions,
    orderBy: {
      start_date: "asc",
    },
  });

  // Normalize for frontend
  const STATUS_MAP: Record<string, string> = {
    open: "Open",
    upcoming: "Open",
    full: "Full",
    closed: "Closed",
    live: "Live",
  };

  function dateLabel(startDate: Date | null): string {
    if (!startDate) return "—";
    const d = new Date(startDate);
    const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const todayDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const diff = Math.round(
      (dateOnly.getTime() - todayDate.getTime()) / 86400000,
    );

    if (diff === 0) return "Today";
    if (diff === 1) return "Tomorrow";
    if (diff > 1 && diff <= 6) return "This Week";
    if (diff >= 7 && diff <= 13) return "Next Week";
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  }

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

  const normalizedTournaments = tournaments.map((t) => ({
    id: t.id,
    title: t.title,
    game: t.game,
    mode: t.mode ? t.mode.charAt(0).toUpperCase() + t.mode.slice(1) : "—",
    map: t.map,
    status: STATUS_MAP[t.status?.toLowerCase()] ?? t.status,
    fee: t.entry_fee ? `₹${t.entry_fee}` : "Free",
    prize: t.prize_pool
      ? `₹${Number(t.prize_pool).toLocaleString("en-IN")}`
      : "TBA",
    platform: t.game,
    dateLabel: dateLabel(t.start_date),
    timeLabel: timeLabel(t.start_date), // ✅ FIX: Returns "6:00 PM" (no conversion)
    slots: t.total_slots,
    filled: t.filled_slots,
  }));

  return NextResponse.json({
    tournaments: normalizedTournaments,
    total: normalizedTournaments.length,
  });
}