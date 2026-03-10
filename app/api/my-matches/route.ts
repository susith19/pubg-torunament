import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/requireAuth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth(req);
  if (error) return error;

  try {
    const rows = await prisma.registration.findMany({
      where: {
        user_id: Number(user.id),
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
      open:     "Open",
      upcoming: "Open",
      full:     "Full",
      closed:   "Closed",
      live:     "Live",
    };

    // ── HELPER: Format start date without timezone conversion ──
    // ✅ FIX: Extract date/time directly from ISO string, don't convert
    const formatStartDate = (isoDate: Date | null): string => {
      if (!isoDate) return "TBA";
      
      const isoString = new Date(isoDate).toISOString();
      const dateStr = isoString.split("T")[0]; // "2025-03-29"
      const timeStr = isoString.split("T")[1]?.slice(0, 5); // "11:30"
      
      if (!dateStr || !timeStr) return "TBA";
      
      // Parse: "2025-03-29" → "29 MAR 2025"
      const [year, month, day] = dateStr.split("-");
      const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
      const monthName = monthNames[Number(month) - 1];
      const dateFormatted = `${Number(day)} ${monthName} ${year}`;
      
      // Parse: "11:30" → "11:30 AM" or "11:30 PM"
      const [hours, minutes] = timeStr.split(":").map(Number);
      const period = hours >= 12 ? "PM" : "AM";
      const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      const timeFormatted = `${String(displayHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${period}`;
      
      return `${dateFormatted} · ${timeFormatted} IST`;
    };

    const matches = rows.map((r) => {
      const t = r.tournament;
      const p = r.payment;

      const startDate = t?.start_date ?? null;

      // ✅ FIX: Use new helper that doesn't convert timezone
      const startFormatted = formatStartDate(startDate);

      return {
        registrationId:  r.id,
        teamName:        r.team_name        ?? "—",
        teamTag:         r.team_tag         ?? "",
        captainName:     r.captain_name     ?? "",
        captainPlayerId: r.captain_player_id ?? "",
        regStatus:       r.status           ?? "pending",
        registeredAt:    r.created_at       ?? "",

        payment: {
          transactionId: p?.transaction_id ?? "—",
          method:        p?.method         ?? "—",
          amount:        p?.amount         ?? 0,
          status:        p?.status         ?? "pending",
        },

        tournament: {
          id:       t?.id,
          name:     t?.title ?? "—",
          map:      t?.map   ?? "—",
          mode:     t?.mode
            ? t.mode.charAt(0).toUpperCase() + t.mode.slice(1)
            : "—",
          platform:       t?.game === "BGMI" ? "BGMI" : "PUBG",
          game:           t?.game ?? "",
          fee:            t?.entry_fee ? `₹${t.entry_fee}` : "Free",
          prize:          t?.prize_pool
            ? `₹${Number(t.prize_pool).toLocaleString("en-IN")}`
            : "TBA",
          slots:          t?.total_slots  ?? 0,
          filled:         t?.filled_slots ?? 0,
          status:
            STATUS_MAP[String(t?.status).toLowerCase()] ??
            t?.status ??
            "—",
          startDate:      startDate ? startDate.toISOString() : null, // raw UTC ISO for countdown
          startFormatted,                                              // ✅ Display string (no conversion)
        },

        room:
          r.status === "approved" && t?.room_id
            ? {
                id:   String(t.room_id),
                pass: t.room_pass ? String(t.room_pass) : "",
              }
            : null,

        players: r.players.map((pl) => ({
          name:      pl.player_name,
          playerId:  pl.player_id,
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
        error:   "Failed to fetch matches",
        detail:  err?.message ?? "unknown",
      },
      { status: 500 },
    );
  }
}