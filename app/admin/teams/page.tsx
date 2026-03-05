"use client";

import { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faChevronDown,
  faEye,
  faXmark,
  faUsers,
  faUser,
  faClock,
  faCircleCheck,
  faShield,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";

// ── helpers ──────────────────────────────────────────────
const paymentStyle: Record<string, string> = {
  Approved: "bg-green-500/10 text-green-400 border-green-500/20",
  Pending: "bg-[#F2AA00]/10 text-[#F2AA00] border-[#F2AA00]/20",
  Rejected: "bg-red-500/10 text-red-400 border-red-500/20",
};

const paymentIcon: Record<string, any> = {
  Approved: faCircleCheck,
  Pending: faClock,
  Rejected: faXmark,
};

const modeIcon: Record<string, any> = {
  squad: faUsers,
  duo: faUsers,
  solo: faUser,
};

const platformColor: Record<string, string> = {
  BGMI: "bg-green-500/10 text-green-400 border-green-500/20",
  PUBG: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  PUBG_PC: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

// relative time helper — handles SQLite "2026-02-26 12:08:32" format
function relativeTime(iso: string) {
  if (!iso) return "—";

  // Normalize space → T, then only add Z if no timezone already present
  const normalized = iso.replace(" ", "T");
  const hasTimezone = normalized.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(normalized);
  const dateStr = hasTimezone ? normalized : normalized + "Z";

  const diff = Date.now() - new Date(dateStr).getTime();
  if (isNaN(diff) || diff < 0) return "just now";

  const s = Math.floor(diff / 1000);
  if (s < 60)  return "just now";
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30)  return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

// ── DETAIL MODAL ─────────────────────────────────────────
function TeamDetailModal({
  team,
  onClose,
}: {
  team: any;
  onClose: () => void;
}) {
  // Normalize mode display (DB stores lowercase: "squad", "duo", "solo")
  const displayMode = team.mode
    ? team.mode.charAt(0).toUpperCase() + team.mode.slice(1).toLowerCase()
    : "—";

  const allPlayers = [
    {
      name: team.captain?.name ?? "—",
      playerId: team.captain?.playerId ?? "—",
      role: "Captain",
      idx: 1,
    },
    ...team.players.map((p: any, i: number) => ({
      name: p.name ?? "—",
      playerId: p.playerId ?? "—",
      role: `Player ${i + 2}`,
      idx: i + 2,
    })),
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#111] border border-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-start justify-between p-5 border-b border-gray-800">
          <div>
            <h2 className="text-white text-base text-lg tracking-widest">
              {team.teamName}
            </h2>
            <p className="text-gray-500 text-md mt-0.5">{team.tournament}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-white transition-colors"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="p-5 space-y-5 ">
          {/* STATUS ROW */}
          <div className="flex flex-wrap gap-2">
            <span
              className={`text-sm px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${paymentStyle[team.paymentStatus]}`}
            >
              <FontAwesomeIcon
                icon={paymentIcon[team.paymentStatus]}
                className="w-3 h-3"
              />
              Payment {team.paymentStatus}
            </span>
            <span
              className={`text-xs px-2.5 py-1 rounded-full border ${platformColor[team.platform] ?? "bg-gray-800 text-gray-400 border-gray-700"}`}
            >
              {team.platform}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full border bg-gray-800/40 text-gray-400 border-gray-700 flex items-center gap-1.5">
              <FontAwesomeIcon
                icon={modeIcon[team.mode?.toLowerCase()] ?? faUsers}
                className="w-3 h-3"
              />
              {displayMode}
            </span>
          </div>

          {/* TOURNAMENT INFO */}
          <div>
            <p className="text-gray-500 text-lg uppercase tracking-widest mb-2">
              Tournament
            </p>
            <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-md">
              {[
                { label: "Name", val: team.tournament },
                { label: "Map", val: team.map },
                { label: "Mode", val: displayMode },
                { label: "Fee", val: `₹${team.fee}` },
                { label: "Date", val: relativeTime(team.registeredAt) },
              ].map((r, i) => (
                <div
                  key={i}
                  className="flex justify-between border-b border-gray-800 pb-1.5"
                >
                  <span className="text-gray-500">{r.label}</span>
                  <span className="text-white">{r.val}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-md border-b border-gray-800 pb-1.5">
              <span className="text-gray-500">Platform</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[14px] border ${platformColor[team.platform] ?? "bg-gray-800 text-gray-400 border-gray-700"}`}
              >
                {team.platform}
              </span>
            </div>
          </div>

          {/* CONTACT */}
          <div>
            <p className="text-gray-500 text-md uppercase tracking-widest mb-2">
              Contact
            </p>
            <div className="space-y-1.5 text-md">
              <div className="flex justify-between">
                <span className="text-gray-500">Email</span>
                <span className="text-white">{team.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Txn ID</span>
                <span className="text-white font-mono">{team.txnId}</span>
              </div>
              {team.screenshotUrl && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Screenshot</span>
                  <a
                    href={team.screenshotUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#F2AA00] underline"
                  >
                    View
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* PLAYERS */}
          <div>
            <p className="text-gray-500 text-md uppercase tracking-widest mb-2">
              Players ({allPlayers.length})
            </p>
            <div className="space-y-2">
              {allPlayers.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-[#0b0b0b] rounded-lg px-3 py-2"
                >
                  <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-[13px] text-gray-400  shrink-0">
                    {p.idx}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm  truncate">
                      {p.name}
                    </p>
                    <p className="text-gray-500 text-[10px]">{p.role}</p>
                  </div>
                  <span className="text-gray-500 text-[10px] font-mono shrink-0">
                    {p.playerId}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-5 pb-5">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-lg bg-gray-800 text-gray-300 text-xs hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN ─────────────────────────────────────────────────
export default function AdminTeams() {
  const [teams, setTeams] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  });
  const [allTournaments, setAllTournaments] = useState<string[]>(["All"]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [tournamentFilter, setTournamentFilter] = useState("All");
  const [modeFilter, setModeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewTeam, setViewTeam] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  // Fetch data from API
  const fetchTeams = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        search,
        tournament: tournamentFilter,
        mode: modeFilter,
        status: statusFilter,
      });
      const res = await fetch(`/api/admin/teams?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setTeams(data.teams);
      setSummary(data.summary);
      setAllTournaments(["All", ...data.tournaments]);
    } catch (e: any) {
      setError(e.message ?? "Failed to load teams");
    } finally {
      setLoading(false);
    }
  }, [search, tournamentFilter, modeFilter, statusFilter]);

  useEffect(() => {
    fetchTeams();
    setTimeout(() => setVisible(true), 60);
  }, [fetchTeams]);

  const total = summary.total;
  const approved = summary.approved;
  const pending = summary.pending;
  const rejected = summary.rejected;

  return (
    <div
      className={`min-h-screen bg-[#0b0b0b] text-white px-4 py-8 md:px-8 transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      {viewTeam && (
        <TeamDetailModal team={viewTeam} onClose={() => setViewTeam(null)} />
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <div>
          <h1 className="text-xl text-white flex items-center gap-2">
            <FontAwesomeIcon
              icon={faShield}
              className="text-[#F2AA00] w-4 h-4"
            />
            Registered Teams
          </h1>
          <p className="text-gray-500 text-xs mt-1">
            All team registrations with player details and payment status
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Total Teams",
              value: total,
              color: "text-white",
              icon: faUsers,
            },
            {
              label: "Confirmed",
              value: approved,
              color: "text-green-400",
              icon: faCircleCheck,
            },
            {
              label: "Pending",
              value: pending,
              color: "text-[#F2AA00]",
              icon: faClock,
            },
            {
              label: "Rejected",
              value: rejected,
              color: "text-red-400",
              icon: faXmark,
            },
          ].map((s, i) => (
            <div
              key={i}
              className="bg-[#111] border border-gray-800 rounded-xl p-4 flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-gray-800/60 flex items-center justify-center">
                <FontAwesomeIcon
                  icon={s.icon}
                  className={`w-3.5 h-3.5 ${s.color}`}
                />
              </div>
              <div>
                <p className="text-gray-500 text-[10px] uppercase tracking-widest">
                  {s.label}
                </p>
                <p className={`text-xl ${s.color}`}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* SEARCH + FILTERS */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 w-3 h-3"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search team, captain, tournament, Txn ID..."
              className="w-full bg-[#0b0b0b] border border-gray-800 focus:border-[#F2AA00]/40 rounded-lg pl-9 pr-4 py-2.5 text-xs text-white placeholder-gray-600 outline-none transition-colors duration-200"
            />
          </div>

          {/* tournament filter */}
          <div className="relative">
            <select
              value={tournamentFilter}
              onChange={(e) => setTournamentFilter(e.target.value)}
              className="appearance-none bg-[#0b0b0b] border border-gray-800 rounded-lg px-4 py-2.5 pr-8 text-xs text-gray-400 outline-none cursor-pointer"
            >
              {allTournaments.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <FontAwesomeIcon
              icon={faChevronDown}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-600 w-2.5 h-2.5 pointer-events-none"
            />
          </div>

          {/* mode filter */}
          <div className="relative">
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="appearance-none bg-[#0b0b0b] border border-gray-800 rounded-lg px-4 py-2.5 pr-8 text-xs text-gray-400 outline-none cursor-pointer"
            >
              {["All", "Squad", "Duo", "Solo"].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
            <FontAwesomeIcon
              icon={faChevronDown}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-600 w-2.5 h-2.5 pointer-events-none"
            />
          </div>

          {/* payment status filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-[#0b0b0b] border border-gray-800 rounded-lg px-4 py-2.5 pr-8 text-xs text-gray-400 outline-none cursor-pointer"
            >
              {["All", "Approved", "Pending", "Rejected"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <FontAwesomeIcon
              icon={faChevronDown}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-600 w-2.5 h-2.5 pointer-events-none"
            />
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-[#111] border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-lg">
              <thead>
                <tr className="border-b border-gray-800">
                  {[
                    "Team",
                    "Tournament",
                    "Mode",
                    "Platform",
                    "Players",
                    "Txn ID",
                    "Registered",
                    "Payment",
                    "Action",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left text-gray-500 px-4 py-3 text-sm tracking-widest uppercase"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-gray-600">
                      <FontAwesomeIcon
                        icon={faSpinner}
                        className="w-5 h-5 animate-spin mx-auto"
                      />
                    </td>
                  </tr>
                ) : teams.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-gray-600">
                      No teams found.
                    </td>
                  </tr>
                ) : (
                  teams.map((t, i) => (
                    <tr
                      key={t.id}
                      className="border-b border-gray-800/50 hover:bg-white/[0.02] transition-colors duration-100"
                    >
                      {/* TEAM */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-white">{t.teamName}</p>
                        <p className="text-gray-500 mt-0.5">
                          {t.captain?.name ?? "—"}{" "}
                          <span className="text-gray-700">·</span>{" "}
                          {t.captain?.playerId ?? "—"}
                        </p>
                      </td>

                      {/* TOURNAMENT */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-white">{t.tournament}</p>
                        <p className="text-gray-500 mt-0.5">{t.map}</p>
                      </td>

                      {/* MODE */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="flex items-center gap-1.5 text-gray-400">
                          <FontAwesomeIcon
                            icon={modeIcon[t.mode?.toLowerCase()] ?? faUsers}
                            className="w-3 h-3"
                          />
                          {t.mode
                            ? t.mode.charAt(0).toUpperCase() + t.mode.slice(1)
                            : "—"}
                        </span>
                      </td>

                      {/* PLATFORM */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded border text-[14px] ${platformColor[t.platform] ?? "bg-gray-800 text-gray-400 border-gray-700"}`}
                        >
                          {t.platform}
                        </span>
                      </td>

                      {/* PLAYERS */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center -space-x-1.5 mb-1">
                          {/* Captain */}
                          <div className="w-6 h-6 rounded-full bg-[#F2AA00]/20 border border-[#F2AA00]/30 flex items-center justify-center text-[9px] text-[#F2AA00] z-10">
                            {t.captain?.name?.[0] ?? "?"}
                          </div>
                          {/* Players */}
                          {t.players.slice(0, 3).map((p: any, idx: number) => (
                            <div
                              key={idx}
                              className="w-6 h-6 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center text-[9px] text-gray-300 font-medium"
                              style={{ zIndex: 9 - idx }}
                            >
                              {p.name?.[0] ?? "?"}
                            </div>
                          ))}
                          {t.players.length > 3 && (
                            <div className="w-6 h-6 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-[9px] text-gray-500">
                              +{t.players.length - 3}
                            </div>
                          )}
                        </div>
                        <p className="text-gray-500 text-[10px]">
                          {t.players.length + 1} player
                          {t.players.length + 1 > 1 ? "s" : ""}
                        </p>
                      </td>

                      {/* TXN ID */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-gray-400 font-mono text-[14px]">
                          {t.txnId}
                        </span>
                      </td>

                      {/* REGISTERED */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-gray-500">
                          {relativeTime(t.registeredAt)}
                        </span>
                      </td>

                      {/* PAYMENT STATUS */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] w-fit ${paymentStyle[t.paymentStatus]}`}
                        >
                          <FontAwesomeIcon
                            icon={paymentIcon[t.paymentStatus]}
                            className="w-2.5 h-2.5"
                          />
                          {t.paymentStatus}
                        </span>
                      </td>

                      {/* ACTION */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={() => setViewTeam(t)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-800 text-gray-500 hover:border-gray-600 hover:text-white transition-all duration-150"
                          title="View full details"
                        >
                          <FontAwesomeIcon icon={faEye} className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* TABLE FOOTER */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
            <p className="text-gray-600 text-xs">
              Showing {teams.length} of {total} teams
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
