import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  // ── STAT CARDS ──────────────────────────────────────────

  // Total users
  const totalUsers = (db.prepare(`SELECT COUNT(*) AS c FROM users WHERE is_deleted = 0 AND role != 'admin'`).get() as any).c;
  const lastMonthUsers = (db.prepare(`
    SELECT COUNT(*) AS c FROM users
    WHERE is_deleted = 0
    AND created_at >= datetime('now', '-60 days')
    AND created_at <  datetime('now', '-30 days')
  `).get() as any).c;
  const thisMonthUsers = (db.prepare(`
    SELECT COUNT(*) AS c FROM users
    WHERE is_deleted = 0 AND created_at >= datetime('now', '-30 days')
  `).get() as any).c;

  // Active tournaments this week
  const activeTournaments = (db.prepare(`
    SELECT COUNT(*) AS c FROM tournaments
    WHERE status IN ('open', 'upcoming')
  `).get() as any).c;
  const lastWeekTournaments = (db.prepare(`
    SELECT COUNT(*) AS c FROM tournaments
    WHERE status IN ('open', 'upcoming')
    AND created_at >= datetime('now', '-14 days')
    AND created_at <  datetime('now', '-7 days')
  `).get() as any).c;
  const thisWeekTournaments = (db.prepare(`
    SELECT COUNT(*) AS c FROM tournaments
    WHERE status IN ('open', 'upcoming')
    AND created_at >= datetime('now', '-7 days')
  `).get() as any).c;

  // Revenue (sum of verified payments)
  const totalRevenue = (db.prepare(`
    SELECT COALESCE(SUM(amount), 0) AS r FROM payments WHERE status = 'verified'
  `).get() as any).r;
  const lastMonthRevenue = (db.prepare(`
    SELECT COALESCE(SUM(amount), 0) AS r FROM payments
    WHERE status = 'verified'
    AND created_at >= datetime('now', '-60 days')
    AND created_at <  datetime('now', '-30 days')
  `).get() as any).r;
  const thisMonthRevenue = (db.prepare(`
    SELECT COALESCE(SUM(amount), 0) AS r FROM payments
    WHERE status = 'verified'
    AND created_at >= datetime('now', '-30 days')
  `).get() as any).r;

  // Pending redeems
  const pendingRedeems = (db.prepare(`
    SELECT COUNT(*) AS c FROM redeems WHERE status = 'pending'
  `).get() as any).c;
  const lastWeekRedeems = (db.prepare(`
    SELECT COUNT(*) AS c FROM redeems
    WHERE status = 'pending'
    AND created_at >= datetime('now', '-14 days')
    AND created_at <  datetime('now', '-7 days')
  `).get() as any).c;

  // Helper to compute change label
  const pctChange = (now: number, prev: number) => {
    if (prev === 0) return now > 0 ? { label: `+${now}`, up: true } : { label: "0", up: true };
    const diff = ((now - prev) / prev) * 100;
    return { label: `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}%`, up: diff >= 0 };
  };
  const absChange = (now: number, prev: number) => {
    const diff = now - prev;
    return { label: `${diff >= 0 ? "+" : ""}${diff}`, up: diff >= 0 };
  };

  const stats = [
    {
      title: "Total Users",
      value: totalUsers.toLocaleString("en-IN"),
      ...pctChange(thisMonthUsers, lastMonthUsers),
      sub: "vs last month",
      iconKey: "users",
    },
    {
      title: "Tournaments",
      value: String(activeTournaments),
      ...absChange(thisWeekTournaments, lastWeekTournaments),
      sub: "active this week",
      iconKey: "trophy",
    },
    {
      title: "Revenue",
      value: `₹${totalRevenue.toLocaleString("en-IN")}`,
      ...pctChange(thisMonthRevenue, lastMonthRevenue),
      sub: "vs last month",
      iconKey: "rupee",
    },
    {
      title: "Redeems",
      value: String(pendingRedeems),
      ...absChange(pendingRedeems, lastWeekRedeems),
      sub: "pending payouts",
      iconKey: "redeem",
    },
  ];

  // ── WEEKLY SIGNUP BAR CHART ──────────────────────────────
  // Last 7 days, one count per day
  const signupsRaw = db.prepare(`
    SELECT
      date(created_at) AS day,
      COUNT(*) AS count
    FROM users
    WHERE created_at >= datetime('now', '-7 days')
    AND is_deleted = 0 AND role != 'admin'
    GROUP BY date(created_at)
    ORDER BY day ASC
  `).all() as { day: string; count: number }[];

  // Fill in missing days with 0
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const barData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split("T")[0];
    const found = signupsRaw.find((r) => r.day === dateStr);
    return {
      day: dayLabels[d.getDay()],
      value: found ? found.count : 0,
    };
  });

  // ── RECENT TOURNAMENTS ───────────────────────────────────
  const recentTournaments = db.prepare(`
    SELECT
      title   AS name,
      map,
      mode,
      filled_slots || '/' || total_slots AS slots,
      status,
      CASE WHEN entry_fee = 0 THEN 'Free' ELSE '₹' || entry_fee END AS fee
    FROM tournaments
    ORDER BY created_at DESC
    LIMIT 5
  `).all() as any[];

  // Normalize status to match your UI
  const statusLabel: Record<string, string> = {
    open:     "Open",
    upcoming: "Open",
    full:     "Full",
    closed:   "Closed",
    live:     "Live",
  };
  const normalizedTournaments = recentTournaments.map((t) => ({
    ...t,
    status: statusLabel[t.status?.toLowerCase()] ?? t.status,
    mode: t.mode ? t.mode.charAt(0).toUpperCase() + t.mode.slice(1) : "—",
  }));

  // ── RECENT USERS ─────────────────────────────────────────
  const recentUsersRaw = db.prepare(`
    SELECT
      name,
      email,
      role,
      created_at AS joinedAt
    FROM users
    WHERE is_deleted = 0 AND role != 'admin'
    ORDER BY created_at DESC
    LIMIT 5
  `).all() as any[];

  function relativeTime(iso: string) {
    if (!iso) return "—";
    const diff = Date.now() - new Date(iso.replace(" ", "T") + "Z").getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m} min ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  const recentUsers = recentUsersRaw.map((u) => ({
    name:   u.name ?? "—",
    email:  u.email,
    joined: relativeTime(u.joinedAt),
    status: u.role === "banned" ? "Banned" : "Active",
  }));

  // ── ACTIVITY FEED ────────────────────────────────────────
  // Merge recent events from multiple tables, sorted by time
  const newUsers = db.prepare(`
    SELECT 'user' AS type, name AS label, created_at AS at
    FROM users WHERE is_deleted = 0
    ORDER BY created_at DESC LIMIT 3
  `).all() as any[];

  const newTournaments = db.prepare(`
    SELECT 'tournament' AS type, title AS label, created_at AS at
    FROM tournaments
    ORDER BY created_at DESC LIMIT 3
  `).all() as any[];

  const recentPayouts = db.prepare(`
    SELECT 'payout' AS type,
      '₹' || re.amount || ' payout to ' || u.name AS label,
      re.created_at AS at
    FROM redeems re
    JOIN users u ON u.id = re.user_id
    WHERE re.status = 'paid'
    ORDER BY re.created_at DESC LIMIT 2
  `).all() as any[];

  const bannedUsers = db.prepare(`
    SELECT 'ban' AS type, 'User ' || name || ' was banned' AS label, updated_at AS at
    FROM users WHERE role = 'banned' AND is_deleted = 0
    ORDER BY updated_at DESC LIMIT 2
  `).all() as any[];

  const allActivity = [
    ...newUsers.map((r) => ({ ...r, text: `New user ${r.label} registered`, iconKey: "users", gold: false })),
    ...newTournaments.map((r) => ({ ...r, text: `Tournament '${r.label}' created`, iconKey: "trophy", gold: true })),
    ...recentPayouts.map((r) => ({ ...r, text: r.label, iconKey: "rupee", gold: true })),
    ...bannedUsers.map((r) => ({ ...r, text: r.label, iconKey: "shield", gold: false })),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 6)
    .map((r) => ({ text: r.text, time: relativeTime(r.at), iconKey: r.iconKey, gold: r.gold }));

  return NextResponse.json({
    stats,
    barData,
    recentTournaments: normalizedTournaments,
    recentUsers,
    activity: allActivity,
  });
}