import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public endpoint — no auth required
export async function GET() {
  // ── HERO CARD — latest open tournament per game ──────────
  const heroMatches = await prisma.tournament.findMany({
    where: {
      status: { in: ["open", "upcoming"] },
    },
    orderBy: {
      start_date: "asc",
    },
    take: 10,
  });

  // One per game (BGMI / PUBG_PC)
  const bgmiMatch = heroMatches.find((t) => t.game === "BGMI") ?? null;
  const pubgMatch = heroMatches.find((t) => t.game === "PUBG_PC") ?? null;

  // ── UPCOMING TOURNAMENTS ────────────────────────────────
  const upcomingRaw = await prisma.tournament.findMany({
    where: {
      status: { in: ["open", "upcoming", "full"] },
    },
    orderBy: {
      start_date: "asc",
    },
    take: 6,
  });

  // ── MAP TOP MATCHES ─────────────────────────────────────
  // Prisma doesn't support GROUP BY like SQLite in same way
  // So we fetch + reduce manually (same output)
  const mapRaw = await prisma.tournament.findMany({
    where: {
      map: { in: ["Erangel", "Miramar", "Sanhok", "Vikendi"] },
      status: { in: ["open", "upcoming", "full", "live"] },
    },
    orderBy: {
      start_date: "asc",
    },
  });

  const mapMatchesMap: Record<string, any> = {};
  for (const t of mapRaw) {
    const mapName = t.map;
    if (!mapName) continue;

    if (!mapMatchesMap[mapName]) {
      mapMatchesMap[mapName] = t;
    }
  }
  const mapMatches = Object.values(mapMatchesMap).slice(0, 4);

  // ── MODES COUNT ─────────────────────────────────────────
  const modeCountsRaw = await prisma.tournament.groupBy({
    by: ["mode"],
    where: {
      status: { in: ["open", "upcoming"] },
    },
    _count: {
      mode: true,
    },
  });

  const modeMap: Record<string, number> = {};

  modeCountsRaw.forEach((m) => {
    if (!m.mode) return;
    modeMap[m.mode.toLowerCase()] = m._count.mode;
  });
  // ── HELPERS ─────────────────────────────────────────────
  function normalizeStatus(s: string): string {
    const map: Record<string, string> = {
      open: "Open",
      upcoming: "Open",
      full: "Full",
      closed: "Closed",
      live: "Live",
    };
    return map[s?.toLowerCase()] ?? s;
  }

  function normalizeTournament(t: any) {
    return {
      ...t,
      fee: t.entry_fee ? `₹${t.entry_fee}` : "Free",
      prize: t.prize_pool
        ? `₹${Number(t.prize_pool).toLocaleString("en-IN")}`
        : "TBA",
      slots: t.total_slots,
      filled: t.filled_slots,
      status: normalizeStatus(t.status),
      mode: t.mode ? t.mode.charAt(0).toUpperCase() + t.mode.slice(1) : "—",
      platform: t.game === "BGMI" ? "Mobile" : "PC",
    };
  }

  return NextResponse.json({
    hero: {
      bgmi: bgmiMatch ? normalizeTournament(bgmiMatch) : null,
      pubg: pubgMatch ? normalizeTournament(pubgMatch) : null,
    },
    upcoming: upcomingRaw.map(normalizeTournament),
    mapMatches: mapMatches.map(normalizeTournament),
    modes: {
      solo: modeMap["solo"] ?? 0,
      duo: modeMap["duo"] ?? 0,
      squad: modeMap["squad"] ?? 0,
      tdm: modeMap["tdm"] ?? 0,
    },
  });
}
