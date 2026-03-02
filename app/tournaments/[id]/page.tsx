"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft, faGamepad, faMapLocationDot, faUsers, faUser,
  faUserGroup, faIndianRupeeSign, faTrophy, faCalendar,
  faClock, faMobileScreen, faDesktop, faShield, faCrown,
  faMedal, faSpinner, faCircle, faBolt, faChevronDown, faChevronUp,
} from "@fortawesome/free-solid-svg-icons";

// ── helpers ───────────────────────────────────────────────
const MAP_GRADIENTS: Record<string, string> = {
  Erangel:  "from-green-900/60 via-black/80 to-black",
  Miramar:  "from-yellow-900/60 via-black/80 to-black",
  Sanhok:   "from-emerald-900/60 via-black/80 to-black",
  Vikendi:  "from-blue-900/60 via-black/80 to-black",
  default:  "from-gray-900/60 via-black/80 to-black",
};

const MAP_ACCENT: Record<string, string> = {
  Erangel: "#4ade80",
  Miramar: "#F2AA00",
  Sanhok:  "#34d399",
  Vikendi: "#60a5fa",
  default: "#F2AA00",
};

const statusStyle: Record<string, string> = {
  Open:   "bg-green-500/10 text-green-400 border-green-500/20",
  Live:   "bg-red-500/10 text-red-400 border-red-500/20 animate-pulse",
  Full:   "bg-gray-700/40 text-gray-400 border-gray-700",
  Closed: "bg-gray-800/40 text-gray-500 border-gray-800",
};

const modeIcon: Record<string, any> = {
  Solo: faUser, Duo: faUsers, Squad: faUserGroup, Tdm: faBolt,
};

const positionEmoji: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉", 4: "4th", 5: "5th" };
const positionColor: Record<number, string> = {
  1: "text-[#F2AA00]", 2: "text-gray-300", 3: "text-amber-600",
  4: "text-gray-500",  5: "text-gray-500",
};

function countdown(iso: string) {
  if (!iso) return "—";
  const diff = new Date(iso.replace(" ", "T")).getTime() - Date.now();
  if (diff <= 0) return "Started";
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff / 3600000) % 24);
  const m = Math.floor((diff / 60000) % 60);
  const s = Math.floor((diff / 1000) % 60);
  return `${d}d : ${h}h : ${m}m : ${s}s`;
}

// ── main ──────────────────────────────────────────────────
export default function TournamentDetail() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [data, setData]         = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [visible, setVisible]   = useState(false);
  const [barFill, setBarFill]   = useState(false);
  const [timeLeft, setTimeLeft] = useState("—");
  const [rulesOpen, setRulesOpen] = useState(false);
  const [teamsOpen, setTeamsOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/tournaments/${id}`)
      .then((r) => { if (r.status === 404) { setNotFound(true); throw new Error("not found"); } return r.json(); })
      .then((d) => { setData(d.success ? d : { tournament: d.data ?? d.tournament, teams: d.teams ?? [], leaderboard: d.leaderboard ?? [], totalTeams: d.totalTeams ?? 0 }); setTimeout(() => setBarFill(true), 600); })
      .catch(() => {})
      .finally(() => { setLoading(false); setTimeout(() => setVisible(true), 80); });
  }, [id]);

  // live countdown tick
  useEffect(() => {
    if (!data?.tournament?.start_date) return;
    const iv = setInterval(() => setTimeLeft(countdown(data.tournament.start_date)), 1000);
    return () => clearInterval(iv);
  }, [data]);

  // ── loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center">
        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-[#F2AA00] w-8 h-8" />
      </div>
    );
  }

  // ── not found ─────────────────────────────────────────────
  if (notFound || !data) {
    return (
      <div className="bg-black min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500 text-sm tracking-widest">Tournament not found.</p>
        <button onClick={() => router.push("/tournaments")} className="text-[#F2AA00] text-xs tracking-widest hover:underline">
          ← Back to Tournaments
        </button>
      </div>
    );
  }

  const { tournament: t, teams, leaderboard, totalTeams } = data;
  const mapGrad   = MAP_GRADIENTS[t.map] ?? MAP_GRADIENTS.default;
  const accent    = MAP_ACCENT[t.map] ?? MAP_ACCENT.default;
  const ModeIcon  = modeIcon[t.mode] ?? faGamepad;
  const canJoin   = t.status === "Open" || t.status === "Live";

  const infoCards = [
    { icon: faMapLocationDot, label: "Map",       val: t.map              },
    { icon: ModeIcon,         label: "Mode",      val: t.mode             },
    { icon: t.platform === "Mobile" ? faMobileScreen : faDesktop, label: "Platform", val: t.platform },
    { icon: faIndianRupeeSign, label: "Entry Fee", val: t.fee             },
    { icon: faTrophy,          label: "Prize",    val: t.prize            },
    { icon: faCalendar,        label: "Date",     val: t.startFormatted   },
    { icon: faUsers,           label: "Slots",    val: `${t.filled} / ${t.slots}` },
    { icon: faShield,          label: "Status",   val: t.status           },
  ];

  return (
    <div className="bg-black min-h-screen text-white">

      {/* ── HERO BANNER ── */}
      <div className={`relative h-56 sm:h-72 bg-gradient-to-b ${mapGrad} overflow-hidden`}>
        {/* diagonal stripe texture */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)", backgroundSize: "14px 14px" }}
        />

        {/* map name watermark */}
        <p className="absolute right-6 bottom-4 text-[80px] font-black tracking-wide opacity-[0.04] select-none text-white leading-none">
          {t.map?.toUpperCase()}
        </p>

        {/* BACK BUTTON */}
        <button
          onClick={() => router.push("/tournaments")}
          className={`absolute top-6 left-6 flex items-center gap-2 text-xs tracking-widest text-gray-400 hover:text-white transition-all duration-200 ${visible ? "opacity-100" : "opacity-0"}`}
        >
          <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
          Back
        </button>

        {/* TITLE */}
        <div className={`absolute bottom-6 left-6 right-6 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <div className="flex items-center gap-3 mb-2">
            <span className={`text-[11px] px-2.5 py-1 rounded-md border tracking-widest ${statusStyle[t.status] ?? "border-gray-700 text-gray-500"}`}>
              {t.status}
            </span>
            <span className="text-[11px] px-2.5 py-1 rounded-md bg-black/40 border border-white/10 text-gray-300 tracking-widest">
              {t.game}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl tracking-wider" style={{ color: accent }}>
            {t.title}
          </h1>
          {t.description && (
            <p className="text-gray-400 text-sm mt-1 tracking-wide max-w-lg">{t.description}</p>
          )}
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* COUNTDOWN + JOIN */}
        <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <div>
            <p className="text-[10px] text-gray-600 tracking-widest uppercase">Tournament Starts In</p>
            <p className="text-[#F2AA00] font-mono text-2xl mt-1 tracking-wide">{timeLeft}</p>
          </div>
          <button
            disabled={!canJoin}
            onClick={() => canJoin && router.push(`/tournaments/${id}/register`)}
            className={`px-8 py-3 text-sm tracking-widest rounded-lg border transition-all duration-150 active:scale-[0.97] ${
              canJoin
                ? "bg-[#F2AA00] text-black border-[#F2AA00] hover:bg-[#e09e00] hover:shadow-xl hover:shadow-[#F2AA00]/20"
                : "bg-gray-900 text-gray-600 border-gray-800 cursor-not-allowed"
            }`}
          >
            {canJoin ? "Register Now →" : t.status === "Full" ? "Tournament Full" : "Registration Closed"}
          </button>
        </div>

        {/* SLOT PROGRESS */}
        <div className={`bg-[#0b0b0b] border border-gray-800 rounded-xl px-5 py-4 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`} style={{ transitionDelay: "80ms" }}>
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>{t.filled} teams registered</span>
            <span>{t.slots - t.filled} slots remaining</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${t.fillPercent === 100 ? "bg-red-500" : "bg-[#F2AA00]"}`}
              style={{ width: barFill ? `${t.fillPercent}%` : "0%" }}
            />
          </div>
          <p className="text-[10px] text-gray-600 mt-1 text-right">{t.fillPercent}% filled</p>
        </div>

        {/* INFO GRID */}
        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`} style={{ transitionDelay: "160ms" }}>
          {infoCards.map((card, i) => (
            <div key={i} className="bg-[#0b0b0b] border border-gray-800 rounded-xl px-4 py-3 hover:border-gray-700 transition-colors duration-200">
              <div className="flex items-center gap-2 mb-1">
                <FontAwesomeIcon icon={card.icon} className="text-[#F2AA00] text-[10px]" />
                <p className="text-[9px] text-gray-600 tracking-widest uppercase">{card.label}</p>
              </div>
              <p className="text-sm text-white tracking-wide truncate">{card.val}</p>
            </div>
          ))}
        </div>

        {/* TWO COLUMN: leaderboard + rules */}
        <div className={`grid md:grid-cols-2 gap-5 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`} style={{ transitionDelay: "240ms" }}>

          {/* LEADERBOARD */}
          <div className="bg-[#0b0b0b] border border-gray-800 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-800">
              <FontAwesomeIcon icon={faTrophy} className="text-[#F2AA00] text-xs" />
              <p className="text-sm tracking-wide">Leaderboard</p>
            </div>
            {leaderboard.length === 0 ? (
              <p className="text-center py-10 text-gray-700 text-xs tracking-widest">No results yet — tournament in progress.</p>
            ) : (
              <div className="divide-y divide-gray-800/50">
                {leaderboard.map((row: any, i: number) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3.5 hover:bg-[#111] transition-colors duration-150">
                    <div className="flex items-center gap-3">
                      <span className="text-lg w-8 text-center">{positionEmoji[i + 1] ?? `#${i + 1}`}</span>
                      <p className="text-sm text-white tracking-widest">{row.teamName}</p>
                    </div>
                    <span className={`font-mono text-sm ${positionColor[i + 1] ?? "text-gray-500"}`}>
                      +{row.points} pts
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RULES */}
          <div className="bg-[#0b0b0b] border border-gray-800 rounded-xl overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-5 py-4 border-b border-gray-800 hover:bg-[#111] transition-colors duration-150"
              onClick={() => setRulesOpen(!rulesOpen)}
            >
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faShield} className="text-[#F2AA00] text-xs" />
                <p className="text-sm tracking-wide">Rules & Guidelines</p>
              </div>
              <FontAwesomeIcon icon={rulesOpen ? faChevronUp : faChevronDown} className="text-gray-500 text-xs" />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${rulesOpen ? "max-h-96" : "max-h-32"}`}>
              <div className="px-5 py-4">
                {t.rules ? (
                  <p className="text-gray-400 text-sm leading-relaxed tracking-wide whitespace-pre-line">{t.rules}</p>
                ) : (
                  <ul className="space-y-2 text-gray-400 text-sm">
                    {[
                      "No cheating, hacking, or use of unauthorized software.",
                      "Players must join the room 10 minutes before start time.",
                      "Team captain is responsible for communication.",
                      "Room ID & password will be shared 15 mins before match.",
                      "Results are final as declared by the admin.",
                      "Prize will be credited within 24 hours of result.",
                      "Entry fee is non-refundable once the slot is confirmed.",
                    ].map((r, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <FontAwesomeIcon icon={faCircle} className="text-[#F2AA00] text-[5px] mt-1.5 flex-shrink-0" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            {!rulesOpen && (
              <div className="px-5 pb-3">
                <button onClick={() => setRulesOpen(true)} className="text-[10px] text-[#F2AA00]/70 hover:text-[#F2AA00] tracking-widest transition-colors">
                  Show more →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* REGISTERED TEAMS */}
        <div className={`bg-[#0b0b0b] border border-gray-800 rounded-xl overflow-hidden transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`} style={{ transitionDelay: "320ms" }}>
          <button
            className="w-full flex items-center justify-between px-5 py-4 border-b border-gray-800 hover:bg-[#111] transition-colors duration-150"
            onClick={() => setTeamsOpen(!teamsOpen)}
          >
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faUsers} className="text-[#F2AA00] text-xs" />
              <p className="text-sm tracking-wide">Registered Teams</p>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#F2AA00]/10 text-[#F2AA00] border border-[#F2AA00]/10 ml-1">
                {totalTeams}
              </span>
            </div>
            <FontAwesomeIcon icon={teamsOpen ? faChevronUp : faChevronDown} className="text-gray-500 text-xs" />
          </button>

          {teamsOpen && (
            <div className="divide-y divide-gray-800/50">
              {teams.length === 0 ? (
                <p className="text-center py-10 text-gray-700 text-xs tracking-widest">No teams registered yet.</p>
              ) : (
                teams.map((team: any, i: number) => (
                  <div key={team.registrationId} className="px-5 py-4 hover:bg-[#111] transition-colors duration-150">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#F2AA00]/10 flex items-center justify-center text-[11px] text-[#F2AA00] font-mono flex-shrink-0">
                          #{i + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-white tracking-widest">{team.teamName}</p>
                            {team.teamTag && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-500 tracking-widest">[{team.teamTag}]</span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            <FontAwesomeIcon icon={faCrown} className="text-[#F2AA00] text-[9px] mr-1" />
                            {team.captainName}
                          </p>
                        </div>
                      </div>

                      {/* PLAYERS */}
                      <div className="flex -space-x-1.5">
                        {team.players.slice(0, 4).map((p: any, pi: number) => (
                          <div
                            key={pi}
                            title={p.name}
                            className="w-7 h-7 rounded-full bg-[#F2AA00]/20 border border-black flex items-center justify-center text-[10px] text-[#F2AA00]"
                          >
                            {p.name?.[0] ?? "?"}
                          </div>
                        ))}
                        {team.players.length > 4 && (
                          <div className="w-7 h-7 rounded-full bg-gray-800 border border-black flex items-center justify-center text-[9px] text-gray-500">
                            +{team.players.length - 4}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* BOTTOM CTA */}
        {canJoin && (
          <div className={`bg-[#F2AA00]/5 border border-[#F2AA00]/20 rounded-xl px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`} style={{ transitionDelay: "400ms" }}>
            <div>
              <p className="text-white text-sm tracking-widest">Ready to compete?</p>
              <p className="text-gray-500 text-xs mt-0.5 tracking-wide">
                {t.slots - t.filled} slots left · Entry {t.fee} · Prize {t.prize}
              </p>
            </div>
            <button
              onClick={() => router.push(`/tournaments/${id}/register`)}
              className="bg-[#F2AA00] text-black px-8 py-3 text-sm tracking-widest rounded-lg hover:bg-[#e09e00] hover:shadow-xl hover:shadow-[#F2AA00]/20 active:scale-[0.97] transition-all duration-150 whitespace-nowrap"
            >
              Register Now →
            </button>
          </div>
        )}

      </div>
    </div>
  );
}