import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/requireAuth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth(req);
  if (error) return error;

  try {
    const rows = await prisma.registration.findMany({
      where: {
        user_id: user.id,
      },
      include: {
        tournament: true,
        payment: true,
        players: {
          orderBy: {
            is_captain: "desc",
          },
        },
      },
      orderBy: {
        tournament: {
          start_date: "desc",
        },
      },
    });

    const STATUS_MAP: Record<string, string> = {
      open: "Open",
      upcoming: "Open",
      full: "Full",
      closed: "Closed",
      live: "Live",
    };

    const matches = rows.map((r) => {
      const t = r.tournament;
      const p = r.payment;

      const startDate = t?.start_date ?? null;

      return {
        registrationId: r.id,
        teamName: r.team_name ?? "—",
        teamTag: r.team_tag ?? "",
        captainName: r.captain_name ?? "",
        captainPlayerId: r.captain_player_id ?? "",
        regStatus: r.status ?? "pending",
        registeredAt: r.created_at ?? "",

        payment: {
          transactionId: p?.transaction_id ?? "—",
          method: p?.method ?? "—",
          amount: p?.amount ?? 0,
          status: p?.status ?? "pending",
        },

        tournament: {
          id: t?.id,
          name: t?.title ?? "—",
          map: t?.map ?? "—",
          mode: t?.mode
            ? t.mode.charAt(0).toUpperCase() + t.mode.slice(1)
            : "—",
          platform: t?.game === "BGMI" ? "BGMI" : "PUBG",
          game: t?.game ?? "",
          fee: t?.entry_fee ? `₹${t.entry_fee}` : "Free",
          prize: t?.prize_pool
            ? `₹${Number(t.prize_pool).toLocaleString("en-IN")}`
            : "TBA",
          slots: t?.total_slots ?? 0,
          filled: t?.filled_slots ?? 0,
          status:
            STATUS_MAP[String(t?.status).toLowerCase()] ??
            t?.status ??
            "—",
          startDate: startDate ? startDate.toISOString() : null,
          startFormatted: startDate
            ? new Date(startDate).toLocaleString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })
            : "TBA",
        },

        room:
          r.status === "approved" && t?.room_id
            ? {
                id: String(t.room_id),
                pass: t.room_pass ? String(t.room_pass) : "",
              }
            : null,

        players: r.players.map((pl) => ({
          name: pl.player_name,
          playerId: pl.player_id,
          isCaptain: pl.is_captain,
        })),
      };
    });

    return NextResponse.json({ success: true, matches });

  } catch (err: any) {
    console.error("[my-matches] Error:", err?.message, err);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch matches",
        detail: err?.message ?? "unknown",
      },
      { status: 500 }
    );
  }
}