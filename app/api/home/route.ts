// app/api/home/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
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
      platform: t.game,
    };
  }

  // ── HERO ────────────────────────────────────────────────
  const heroMatches = await prisma.tournament.findMany({
    where: { status: { in: ["open", "upcoming"] } },
    orderBy: { start_date: "asc" },
    take: 10,
  });

  const bgmiMatch = heroMatches.find((t) => t.game === "BGMI") ?? null;
  const pubgMatch =
    heroMatches.find((t) => t.game === "PUBG" || t.game === "PUBG") ?? null;

  // ── UPCOMING ────────────────────────────────────────────
  const upcomingRaw = await prisma.tournament.findMany({
    where: { status: { in: ["open", "upcoming", "full"] } },
    orderBy: { start_date: "asc" },
    take: 6,
  });

  // ── MAP MATCHES ─────────────────────────────────────────
  const mapRaw = await prisma.tournament.findMany({
    where: {
      map: {
        in: [
          "Erangel",
          "Miramar",
          "Sanhok",
          "Vikendi",
          "Rondo",
          "Warehouse",
          "Livik",
        ],
      },
      status: { in: ["open", "upcoming", "full", "live"] },
    },
    orderBy: { start_date: "asc" },
  });

  const mapMatchesMap: Record<string, any> = {};

  for (const t of mapRaw) {
    if (t.map && !mapMatchesMap[t.map]) {
      mapMatchesMap[t.map] = t;
    }
  }

  const mapMatches = Object.values(mapMatchesMap).map(normalizeTournament);

  // ── MODES ───────────────────────────────────────────────
  const modeCountsRaw = await prisma.tournament.groupBy({
    by: ["mode"],
    where: { status: { in: ["open", "upcoming"] } },
    _count: { mode: true },
  });

  const modeMap: Record<string, number> = {};
  modeCountsRaw.forEach((m) => {
    if (m.mode) modeMap[m.mode.toLowerCase()] = m._count.mode;
  });

  // ── SOCIAL MEDIA ─────────────────────────────────────────
  const socialLinks = await prisma.social_media.findMany({
    where: { is_active: true },
    orderBy: { created_at: "asc" },
  });

  return NextResponse.json({
    hero: {
      bgmi: bgmiMatch ? normalizeTournament(bgmiMatch) : null,
      pubg: pubgMatch ? normalizeTournament(pubgMatch) : null,
    },
    upcoming: upcomingRaw.map(normalizeTournament),
    mapMatches: mapMatches,
    modes: {
      solo: modeMap["solo"] ?? 0,
      duo: modeMap["duo"] ?? 0,
      squad: modeMap["squad"] ?? 0,
      tdm: modeMap["tdm"] ?? 0,
    },
    social: socialLinks,
  });
}
