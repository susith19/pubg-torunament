import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Public endpoint — no auth required
export async function GET() {
  // ── HERO CARD — latest open tournament per game ──────────
  const heroMatches = db
    .prepare(
      `
      SELECT
        id, title, game, mode, map,
        entry_fee  AS fee,
        prize_pool AS prize,
        total_slots AS slots,
        filled_slots AS filled,
        status,
        start_date
      FROM tournaments
      WHERE status IN ('open','upcoming')
      ORDER BY start_date ASC
      LIMIT 10
      `
    )
    .all() as any[];

  // One per game (BGMI / PUBG_PC) for the hero card switcher
  const bgmiMatch = heroMatches.find((t) => t.game === "BGMI") ?? null;
  const pubgMatch = heroMatches.find((t) => t.game === "PUBG_PC") ?? null;

  // ── UPCOMING TOURNAMENTS — 6 most recent open/upcoming ──
  const upcomingRaw = db
    .prepare(
      `
      SELECT
        id, title, game, mode, map,
        entry_fee  AS fee,
        prize_pool AS prize,
        total_slots AS slots,
        filled_slots AS filled,
        status,
        start_date
      FROM tournaments
      WHERE status IN ('open','upcoming','full')
      ORDER BY start_date ASC
      LIMIT 6
      `
    )
    .all() as any[];

  // ── MAP TOP MATCHES — best match per map ─────────────────
  const mapMatches = db
    .prepare(
      `
      SELECT
        id, title, game, mode, map,
        entry_fee  AS fee,
        prize_pool AS prize,
        total_slots AS slots,
        filled_slots AS filled,
        status,
        start_date
      FROM tournaments
      WHERE map IN ('Erangel','Miramar','Sanhok','Vikendi')
      AND   status IN ('open','upcoming','full','live')
      GROUP BY map
      ORDER BY start_date ASC
      LIMIT 4
      `
    )
    .all() as any[];

  // ── MODES — count of open tournaments per mode ───────────
  const modeCounts = db
    .prepare(
      `
      SELECT
        mode,
        COUNT(*) AS count
      FROM tournaments
      WHERE status IN ('open','upcoming')
      GROUP BY mode
      `
    )
    .all() as { mode: string; count: number }[];

  const modeMap: Record<string, number> = {};
  modeCounts.forEach((m) => { modeMap[m.mode.toLowerCase()] = m.count; });

  // ── HELPERS ───────────────────────────────────────────────
  function normalizeStatus(s: string): string {
    const map: Record<string, string> = {
      open: "Open", upcoming: "Open", full: "Full",
      closed: "Closed", live: "Live",
    };
    return map[s?.toLowerCase()] ?? s;
  }

  function normalizeTournament(t: any) {
    return {
      ...t,
      status:  normalizeStatus(t.status),
      mode:    t.mode ? t.mode.charAt(0).toUpperCase() + t.mode.slice(1) : "—",
      fee:     t.fee  ? `₹${t.fee}` : "Free",
      prize:   t.prize ? `₹${Number(t.prize).toLocaleString("en-IN")}` : "TBA",
      platform: t.game === "BGMI" ? "Mobile" : "PC",
    };
  }

  return NextResponse.json({
    hero: {
      bgmi: bgmiMatch ? normalizeTournament(bgmiMatch) : null,
      pubg: pubgMatch ? normalizeTournament(pubgMatch) : null,
    },
    upcoming:   upcomingRaw.map(normalizeTournament),
    mapMatches: mapMatches.map(normalizeTournament),
    modes: {
      solo:  modeMap["solo"]  ?? 0,
      duo:   modeMap["duo"]   ?? 0,
      squad: modeMap["squad"] ?? 0,
      tdm:   modeMap["tdm"]   ?? 0,
    },
  });
}