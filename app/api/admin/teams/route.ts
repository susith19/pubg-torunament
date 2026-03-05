import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const tournament = searchParams.get("tournament") || "All";
  const mode = searchParams.get("mode") || "All";
  const status = searchParams.get("status") || "All";

  // ── STATUS MAP ───────────────────────
  const statusMap: Record<string, string> = {
    approved: "verified",
    pending: "pending",
    rejected: "rejected",
  };

  const dbStatus =
    status !== "All"
      ? (statusMap[status.toLowerCase()] ?? status.toLowerCase())
      : undefined;

  // ── WHERE ───────────────────────────
  const where: any = {
    ...(search && {
      OR: [
        { team_name: { contains: search, mode: "insensitive" } },
        { captain_name: { contains: search, mode: "insensitive" } },
        {
          tournament: {
            title: { contains: search, mode: "insensitive" },
          },
        },
        {
          payment: {
            transaction_id: { contains: search, mode: "insensitive" },
          },
        },
      ],
    }),

    ...(tournament !== "All" && {
      tournament: { title: tournament },
    }),

    ...(mode !== "All" && {
      tournament: { mode },
    }),

    ...(dbStatus && {
      payment: { status: dbStatus },
    }),
  };

  // ── FETCH ───────────────────────────
  const registrations = await prisma.registration.findMany({
    where,
    include: {
      tournament: true,
      user: true,
      payment: true,
      players: true,
    },
    orderBy: {
      created_at: "desc",
    },
  });

  // ── FORMAT ──────────────────────────
  const payStatusMap: Record<string, string> = {
    verified: "Approved",
    pending: "Pending",
    rejected: "Rejected",
  };

  const teams = registrations.map((r) => {
    const captainPlayer = r.players.find((p) => p.is_captain);

    const captain = {
      // try all common field name variants — use whichever matches your schema
      name: captainPlayer?.player_name ?? r.captain_name, // fallback from registration
      playerId: captainPlayer?.player_id ?? r.captain_player_id, // fallback from registration
    };

    const members = r.players
      .filter((p) => !p.is_captain)
      .map((p) => ({
        name: p.player_name ?? "—",
        playerId: p.player_id ?? "—",
      }));

    return {
      id: r.id,
      teamName: r.team_name,
      teamTag: r.team_tag,
      mode: r.tournament?.mode,
      platform: r.tournament?.game,
      tournament: r.tournament?.title,
      tournamentId: r.tournament?.id,
      map: r.tournament?.map,
      fee: r.tournament?.entry_fee,
      email: r.user?.email,
      txnId: r.payment?.transaction_id ?? "—",
      screenshotUrl: r.payment?.screenshot_url,
      registeredAt: r.created_at,
      paymentStatus: payStatusMap[r.payment?.status || "pending"],
      slotStatus:
        r.status === "approved"
          ? "Confirmed"
          : r.status === "rejected"
            ? "Rejected"
            : "Pending",
      captain,
      players: members,
    };
  });

  // ── SUMMARY ─────────────────────────
  const [total, approved, pending, rejected] = await Promise.all([
    prisma.registration.count(),
    prisma.registration.count({
      where: { payment: { status: "verified" } },
    }),
    prisma.registration.count({
      where: { payment: { status: "pending" } },
    }),
    prisma.registration.count({
      where: { payment: { status: "rejected" } },
    }),
  ]);

  const summary = { total, approved, pending, rejected };

  // ── TOURNAMENT LIST ─────────────────
  const tournamentsRaw = await prisma.tournament.findMany({
    select: { title: true },
    distinct: ["title"],
    orderBy: { title: "asc" },
  });

  const tournaments = tournamentsRaw.map((t) => t.title);

  return NextResponse.json({ teams, summary, tournaments });
}
