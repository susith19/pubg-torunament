import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const now = new Date();

  const last30 = new Date(now); last30.setDate(now.getDate() - 30);
  const last60 = new Date(now); last60.setDate(now.getDate() - 60);
  const last7  = new Date(now); last7.setDate(now.getDate() - 7);
  const last14 = new Date(now); last14.setDate(now.getDate() - 14);

  // ── USERS ─────────────────────────────

  const totalUsers = await prisma.user.count({
    where: { is_deleted: 0, role: { not: "admin" } },
  });

  const lastMonthUsers = await prisma.user.count({
    where: { is_deleted: 0, created_at: { gte: last60, lt: last30 } },
  });

  const thisMonthUsers = await prisma.user.count({
    where: { is_deleted: 0, created_at: { gte: last30 } },
  });

  // ── TOURNAMENTS ───────────────────────

  const activeTournaments = await prisma.tournament.count({
    where: { status: { in: ["open", "upcoming"] } },
  });

  const lastWeekTournaments = await prisma.tournament.count({
    where: { status: { in: ["open", "upcoming"] }, created_at: { gte: last14, lt: last7 } },
  });

  const thisWeekTournaments = await prisma.tournament.count({
    where: { status: { in: ["open", "upcoming"] }, created_at: { gte: last7 } },
  });

  // ── REVENUE ───────────────────────────

  const totalRevenueAgg = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: { status: "verified" },
  });

  const lastMonthRevenueAgg = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: { status: "verified", created_at: { gte: last60, lt: last30 } },
  });

  const thisMonthRevenueAgg = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: { status: "verified", created_at: { gte: last30 } },
  });

  const totalRevenue     = totalRevenueAgg._sum.amount     ?? 0;
  const lastMonthRevenue = lastMonthRevenueAgg._sum.amount ?? 0;
  const thisMonthRevenue = thisMonthRevenueAgg._sum.amount ?? 0;

  // ── REDEEMS ───────────────────────────

  const pendingRedeems = await prisma.redeem.count({
    where: { status: "pending" },
  });

  const lastWeekRedeems = await prisma.redeem.count({
    where: { status: "pending", created_at: { gte: last14, lt: last7 } },
  });

  // ── POINTS AWARDED ────────────────────

  const totalPointsAgg = await prisma.point.aggregate({
    _sum: { points: true },
    where: { type: "match_win" },
  });

  const lastMonthPointsAgg = await prisma.point.aggregate({
    _sum: { points: true },
    where: { type: "match_win", created_at: { gte: last60, lt: last30 } },
  });

  const thisMonthPointsAgg = await prisma.point.aggregate({
    _sum: { points: true },
    where: { type: "match_win", created_at: { gte: last30 } },
  });

  const totalPoints     = totalPointsAgg._sum.points     ?? 0;
  const lastMonthPoints = lastMonthPointsAgg._sum.points ?? 0;
  const thisMonthPoints = thisMonthPointsAgg._sum.points ?? 0;

  // ── HELPERS ───────────────────────────

  const pctChange = (curr: number, prev: number) => {
    if (prev === 0) return { label: curr > 0 ? `+${curr}` : "—", up: curr >= 0 };
    const diff = ((curr - prev) / prev) * 100;
    return { label: `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}%`, up: diff >= 0 };
  };

  const absChange = (curr: number, prev: number) => {
    const diff = curr - prev;
    return { label: `${diff >= 0 ? "+" : ""}${diff}`, up: diff >= 0 };
  };

  // ── STATS ─────────────────────────────

  const stats = [
    {
      title:   "Total Users",
      value:   totalUsers.toLocaleString("en-IN"),
      ...pctChange(thisMonthUsers, lastMonthUsers),
      sub:     "vs last month",
      iconKey: "users",
    },
    {
      title:   "Tournaments",
      value:   String(activeTournaments),
      ...absChange(thisWeekTournaments, lastWeekTournaments),
      sub:     "active this week",
      iconKey: "trophy",
    },
    {
      title:   "Revenue",
      value:   `₹${totalRevenue.toLocaleString("en-IN")}`,
      ...pctChange(thisMonthRevenue, lastMonthRevenue),
      sub:     "vs last month",
      iconKey: "rupee",
    },
    {
      title:   "Points Awarded",
      value:   totalPoints.toLocaleString("en-IN"),
      ...pctChange(thisMonthPoints, lastMonthPoints),
      sub:     "vs last month",
      iconKey: "star",
    },
  ];

  // ── RECENT TOURNAMENTS ───────────────

  const recentTournaments = await prisma.tournament.findMany({
    orderBy: { created_at: "desc" },
    take: 5,
  });

  const normalizedTournaments = recentTournaments.map((t: any) => ({
    name:   t.title,
    map:    t.map,
    mode:   t.mode ? t.mode.charAt(0).toUpperCase() + t.mode.slice(1) : "—",
    slots:  `${t.filled_slots}/${t.total_slots}`,
    status: t.status,
    fee:    t.entry_fee === 0 ? "Free" : `₹${t.entry_fee}`,
  }));

  // ── RECENT USERS ─────────────────────

  const recentUsersRaw = await prisma.user.findMany({
    where: { is_deleted: 0, role: { not: "admin" } },
    orderBy: { created_at: "desc" },
    take: 5,
  });

  function relativeTime(date: Date) {
    const diff = Date.now() - new Date(date).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return "just now";
    if (m < 60) return `${m} min ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  const recentUsers = recentUsersRaw.map((u: any) => ({
    name:   u.name ?? "—",
    email:  u.email,
    joined: relativeTime(u.created_at),
    status: u.role === "banned" ? "Banned" : "Active",
  }));

  // ── WEEKLY SIGNUP BAR ─────────────────

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const startWeek = new Date();
  startWeek.setDate(now.getDate() - 6);
  startWeek.setHours(0, 0, 0, 0);

  const usersWeek = await prisma.user.findMany({
    where: { is_deleted: 0, created_at: { gte: startWeek } },
    select: { created_at: true },
  });

  const counts: Record<number, number> = {};
  usersWeek.forEach((u) => {
    const d = new Date(u.created_at).getDay();
    counts[d] = (counts[d] ?? 0) + 1;
  });

  const barData = days.map((day, i) => ({ day, value: counts[i] ?? 0 }));

  // ── ACTIVITY FEED ─────────────────────

  const activity = [
    { text: `${thisMonthUsers} new users registered this month`, iconKey: "users",  gold: false },
    { text: `${activeTournaments} tournaments currently active`,  iconKey: "trophy", gold: true  },
    { text: `₹${totalRevenue.toLocaleString("en-IN")} total revenue collected`, iconKey: "rupee", gold: true },
    { text: `${totalPoints.toLocaleString("en-IN")} pts awarded to players`,    iconKey: "star",  gold: true },
    { text: `${pendingRedeems} redeem requests pending`,          iconKey: "redeem", gold: false },
  ];

  return NextResponse.json({
    stats,
    barData,
    activity,
    recentTournaments: normalizedTournaments,
    recentUsers,
  });
}