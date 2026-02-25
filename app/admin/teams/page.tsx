"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faChevronDown,
  faEye,
  faXmark,
  faUsers,
  faUser,
  faTrophy,
  faHashtag,
  faEnvelope,
  faMobileScreen,
  faDesktop,
  faCircleDot,
  faUsersSlash,
  faLock,
  faClock,
  faCircleCheck,
  faShield,
} from "@fortawesome/free-solid-svg-icons";

// ── DUMMY DATA ─────────────────────────────────────────────
const teamsData = [
  {
    id: 1,
    teamName: "Alpha Squad",
    mode: "Squad",
    platform: "BGMI",
    tournament: "Erangel Squad Battle",
    tournamentId: "t-001",
    map: "Erangel",
    fee: 50,
    upi: "alpha@upi",
    txnId: "TXN202601A",
    email: "alpha@email.com",
    registeredAt: "10 min ago",
    paymentStatus: "Approved",
    slotStatus: "Confirmed",
    captain: { name: "Susith", playerId: "BGM001" },
    players: [
      { name: "Arjun", playerId: "BGM002" },
      { name: "Karthik", playerId: "BGM003" },
      { name: "Meena", playerId: "BGM004" },
    ],
  },
  {
    id: 2,
    teamName: "Desert Wolves",
    mode: "Duo",
    platform: "PUBG",
    tournament: "Miramar Duo Clash",
    tournamentId: "t-002",
    map: "Miramar",
    fee: 30,
    upi: "wolves@upi",
    txnId: "TXN202602B",
    email: "wolves@email.com",
    registeredAt: "35 min ago",
    paymentStatus: "Pending",
    slotStatus: "Pending",
    captain: { name: "Rajan", playerId: "PUB001" },
    players: [{ name: "Priya", playerId: "PUB002" }],
  },
  {
    id: 3,
    teamName: "Solo Ghost",
    mode: "Solo",
    platform: "BGMI",
    tournament: "Sanhok Solo Rush",
    tournamentId: "t-003",
    map: "Sanhok",
    fee: 20,
    upi: "ghost@paytm",
    txnId: "TXN202603C",
    email: "ghost@email.com",
    registeredAt: "1h ago",
    paymentStatus: "Approved",
    slotStatus: "Confirmed",
    captain: { name: "Vikram", playerId: "BGM010" },
    players: [],
  },
  {
    id: 4,
    teamName: "Iron Fist",
    mode: "Squad",
    platform: "BGMI",
    tournament: "Erangel Squad Battle",
    tournamentId: "t-001",
    map: "Erangel",
    fee: 50,
    upi: "iron@phonepe",
    txnId: "TXN202604D",
    email: "ironfist@email.com",
    registeredAt: "2h ago",
    paymentStatus: "Rejected",
    slotStatus: "Rejected",
    captain: { name: "Dhruv", playerId: "BGM020" },
    players: [
      { name: "Sneha", playerId: "BGM021" },
      { name: "Rohan", playerId: "BGM022" },
      { name: "Anil", playerId: "BGM023" },
    ],
  },
  {
    id: 5,
    teamName: "Night Hunters",
    mode: "Duo",
    platform: "BGMI",
    tournament: "Miramar Duo Clash",
    tournamentId: "t-002",
    map: "Miramar",
    fee: 30,
    upi: "hunters@upi",
    txnId: "TXN202605E",
    email: "hunters@email.com",
    registeredAt: "3h ago",
    paymentStatus: "Approved",
    slotStatus: "Confirmed",
    captain: { name: "Neha", playerId: "BGM030" },
    players: [{ name: "Tejas", playerId: "BGM031" }],
  },
];

// ── helpers ───────────────────────────────────────────────
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
  Squad: faUsers,
  Duo: faUsers,
  Solo: faUser,
};

const platformColor: Record<string, string> = {
  BGMI: "bg-green-500/10 text-green-400 border-green-500/20",
  PUBG: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

// ── DETAIL MODAL ──────────────────────────────────────────
function TeamDetailModal({
  team,
  onClose,
}: {
  team: any;
  onClose: () => void;
}) {
  const allPlayers = [
    { ...team.captain, role: "Captain", idx: 1 },
    ...team.players.map((p: any, i: number) => ({
      ...p,
      role: `Player ${i + 2}`,
      idx: i + 2,
    })),
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="bg-[#0e0e0e] border border-gray-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-800 sticky top-0 bg-[#0e0e0e] z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#F2AA00]/10 flex items-center justify-center">
              <FontAwesomeIcon
                icon={faShield}
                className="text-[#F2AA00] text-xs"
              />
            </div>
            <div>
              <p className="text-sm tracking-wide text-white">
                {team.teamName}
              </p>
              <p className="text-[10px] text-gray-600 mt-0.5">
                {team.tournament}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-white transition-colors"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* STATUS ROW */}
          <div className="flex gap-2 flex-wrap">
            <span
              className={`text-[10px] px-2.5 py-1 rounded-md border flex items-center gap-1.5 ${paymentStyle[team.paymentStatus]}`}
            >
              <FontAwesomeIcon
                icon={paymentIcon[team.paymentStatus]}
                className="text-[8px]"
              />
              Payment {team.paymentStatus}
            </span>
            <span
              className={`text-[10px] px-2.5 py-1 rounded-md border flex items-center gap-1.5 ${platformColor[team.platform]}`}
            >
              {team.platform}
            </span>
            <span className="text-[10px] px-2.5 py-1 rounded-md border border-[#F2AA00]/20 bg-[#F2AA00]/10 text-[#F2AA00]">
              {team.mode}
            </span>
          </div>

          {/* TOURNAMENT INFO */}
          <div>
            <p className="text-[9px] text-gray-600 tracking-[0.2em] uppercase mb-2">
              Tournament
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Name", val: team.tournament },
                { label: "Map", val: team.map },
                { label: "Mode", val: team.mode },
                { label: "Fee", val: `₹${team.fee}` },
                { label: "Date", val: team.registeredAt },
              ].map((r, i) => (
                <div
                  key={i}
                  className="bg-black border border-gray-800 rounded-lg px-3 py-2.5"
                >
                  <p className="text-[9px] text-gray-600 tracking-widest uppercase mb-0.5">
                    {r.label}
                  </p>
                  <p className="text-xs text-white">{r.val}</p>
                </div>
              ))}
              <div className="bg-black border border-gray-800 rounded-lg px-3 py-2.5">
                <p className="text-[9px] text-gray-600 tracking-widest uppercase mb-0.5">
                  Platform
                </p>
                <p className="text-xs text-white">{team.platform}</p>
              </div>
            </div>
          </div>

          {/* CONTACT */}
          <div>
            <p className="text-[9px] text-gray-600 tracking-[0.2em] uppercase mb-2">
              Contact
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-black border border-gray-800 rounded-lg px-3 py-2.5">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <FontAwesomeIcon
                    icon={faEnvelope}
                    className="text-[#F2AA00] text-[9px]"
                  />
                  <p className="text-[9px] text-gray-600 tracking-widest uppercase">
                    Email
                  </p>
                </div>
                <p className="text-xs text-white">{team.email}</p>
              </div>
              <div className="bg-black border border-gray-800 rounded-lg px-3 py-2.5">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <FontAwesomeIcon
                    icon={faMobileScreen}
                    className="text-[#F2AA00] text-[9px]"
                  />
                  <p className="text-[9px] text-gray-600 tracking-widest uppercase">
                    UPI
                  </p>
                </div>
                <p className="text-xs text-white font-mono">{team.upi}</p>
              </div>
              <div className="bg-black border border-gray-800 rounded-lg px-3 py-2.5 col-span-2">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <FontAwesomeIcon
                    icon={faHashtag}
                    className="text-[#F2AA00] text-[9px]"
                  />
                  <p className="text-[9px] text-gray-600 tracking-widest uppercase">
                    Txn ID
                  </p>
                </div>
                <p className="text-xs text-white font-mono">{team.txnId}</p>
              </div>
            </div>
          </div>

          {/* PLAYERS */}
          <div>
            <p className="text-[9px] text-gray-600 tracking-[0.2em] uppercase mb-2">
              Players ({allPlayers.length})
            </p>
            <div className="space-y-2">
              {allPlayers.map((p, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg border ${
                    p.role === "Captain"
                      ? "border-[#F2AA00]/30 bg-[#F2AA00]/5"
                      : "border-gray-800 bg-black"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] flex-shrink-0 ${
                        p.role === "Captain"
                          ? "bg-[#F2AA00] text-black"
                          : "bg-gray-800 text-gray-400"
                      }`}
                    >
                      {p.idx}
                    </div>
                    <div>
                      <p className="text-xs text-white">{p.name}</p>
                      <p className="text-[10px] text-gray-600">{p.role}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono">
                    {p.playerId}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-gray-800 flex justify-end">
          <button
            onClick={onClose}
            className="border border-gray-800 text-gray-400 px-5 py-2 text-xs tracking-widest rounded-lg hover:border-gray-700 hover:text-white transition-all duration-150"
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
  const [teams] = useState(teamsData);
  const [search, setSearch] = useState("");
  const [tournamentFilter, setTournamentFilter] = useState("All");
  const [modeFilter, setModeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewTeam, setViewTeam] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 60);
  }, []);

  const allTournaments = [
    "All",
    ...Array.from(new Set(teams.map((t) => t.tournament))),
  ];

  const filtered = teams.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch =
      t.teamName.toLowerCase().includes(q) ||
      t.captain.name.toLowerCase().includes(q) ||
      t.tournament.toLowerCase().includes(q) ||
      t.txnId.toLowerCase().includes(q);
    const matchTournament =
      tournamentFilter === "All" || t.tournament === tournamentFilter;
    const matchMode = modeFilter === "All" || t.mode === modeFilter;
    const matchStatus =
      statusFilter === "All" || t.paymentStatus === statusFilter;
    return matchSearch && matchTournament && matchMode && matchStatus;
  });

  const total = teams.length;
  const approved = teams.filter((t) => t.paymentStatus === "Approved").length;
  const pending = teams.filter((t) => t.paymentStatus === "Pending").length;
  const rejected = teams.filter((t) => t.paymentStatus === "Rejected").length;

  return (
    <div className="bg-black min-h-screen text-white px-4 sm:px-6 py-10 text-sm">
      {viewTeam && (
        <TeamDetailModal team={viewTeam} onClose={() => setViewTeam(null)} />
      )}

      <div className="max-w-7xl mx-auto space-y-5">
        {/* HEADER */}
        <div
          className={`transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"}`}
        >
          <h1 className="text-xl tracking-widest text-white">
            Registered Teams
          </h1>
          <p className="text-gray-600 text-xs mt-1 tracking-wide">
            All team registrations with player details and payment status
          </p>
        </div>

        {/* SUMMARY CARDS */}
        <div
          className={`grid grid-cols-2 sm:grid-cols-4 gap-3 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          style={{ transitionDelay: "80ms" }}
        >
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
              className="bg-[#0b0b0b] border border-gray-800 rounded-xl px-4 py-3 hover:border-gray-700 transition-colors duration-200 flex items-center gap-3"
            >
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F2AA00]/10 flex-shrink-0">
                <FontAwesomeIcon
                  icon={s.icon}
                  className="text-[#F2AA00] text-xs"
                />
              </div>
              <div>
                <p className="text-gray-600 text-[9px] tracking-widest uppercase">
                  {s.label}
                </p>
                <p className={`text-xl font-mono mt-0.5 ${s.color}`}>
                  {s.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* SEARCH + FILTERS */}
        <div
          className={`flex flex-col sm:flex-row gap-3 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          style={{ transitionDelay: "160ms" }}
        >
          <div className="relative flex-1">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600 text-xs"
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 text-[9px] pointer-events-none"
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 text-[9px] pointer-events-none"
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 text-[9px] pointer-events-none"
            />
          </div>
        </div>

        {/* TABLE */}
        <div
          className={`bg-[#0b0b0b] border border-gray-800 rounded-xl overflow-hidden transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          style={{ transitionDelay: "240ms" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-800 bg-[#0f0f0f]">
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
                      className="text-[10px] text-gray-600 tracking-widest uppercase px-4 py-3 text-left"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="text-center py-14 text-gray-700 text-xs tracking-widest"
                    >
                      No teams found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((t, i) => (
                    <tr
                      key={t.id}
                      className={`border-b border-gray-800/50 last:border-0 hover:bg-[#111] group transition-all duration-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
                      style={{ transitionDelay: `${320 + i * 55}ms` }}
                    >
                      {/* TEAM */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#F2AA00]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#F2AA00]/20 transition-colors duration-200">
                            <FontAwesomeIcon
                              icon={modeIcon[t.mode]}
                              className="text-[#F2AA00] text-xs"
                            />
                          </div>
                          <div>
                            <p className="text-sm text-white tracking-widest group-hover:text-[#F2AA00] transition-colors duration-200">
                              {t.teamName}
                            </p>
                            <p className="text-[13px] text-gray-600 mt-0.5">
                              {t.captain.name}
                              <span className="text-gray-700">
                                {" "}
                                · {t.captain.playerId}
                              </span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* TOURNAMENT */}
                      <td className="px-4 py-3.5">
                        <p className="text-sm text-gray-300 max-w-[140px] truncate">
                          {t.tournament}
                        </p>
                        <p className="text-[10px] text-gray-600 mt-0.5">
                          {t.map}
                        </p>
                      </td>

                      {/* MODE */}
                      <td className="px-4 py-3.5">
                        <span className="text-[12px] px-2 py-0.5 rounded-md bg-[#F2AA00]/10 text-[#F2AA00] border border-[#F2AA00]/10 tracking-wide">
                          {t.mode}
                        </span>
                      </td>

                      {/* PLATFORM */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`text-[12px] px-2 py-0.5 rounded-md border tracking-wide ${platformColor[t.platform]}`}
                        >
                          {t.platform}
                        </span>
                      </td>

                      {/* PLAYERS */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center">
                          {/* Captain */}
                          <div
                            title={`${t.captain.name} (Captain)`}
                            className="w-7 h-7 rounded-full bg-[#F2AA00] flex items-center justify-center text-[10px] font-bold text-black z-20"
                          >
                            {t.captain.name[0]}
                          </div>

                          {/* Players */}
                          {t.players.slice(0, 3).map((p, idx) => (
                            <div
                              key={idx}
                              title={p.name}
                              className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center text-[10px] font-medium text-gray-200 -ml-2 z-10"
                            >
                              {p.name[0]}
                            </div>
                          ))}

                          {/* Extra count */}
                          {t.players.length > 3 && (
                            <div className="w-7 h-7 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-[10px] font-semibold text-gray-800 -ml-2">
                              +{t.players.length - 3}
                            </div>
                          )}
                        </div>

                        <p className="text-[10px] text-gray-600 mt-1">
                          {t.players.length + 1} player
                          {t.players.length + 1 > 1 ? "s" : ""}
                        </p>
                      </td>

                      {/* TXN ID */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <FontAwesomeIcon
                            icon={faHashtag}
                            className="text-gray-700 text-[9px]"
                          />
                          <span className="text-[13px] text-gray-500 font-mono">
                            {t.txnId}
                          </span>
                        </div>
                      </td>

                      {/* REGISTERED */}
                      <td className="px-4 py-3.5 text-[12px] text-gray-500">
                        {t.registeredAt}
                      </td>

                      {/* PAYMENT STATUS */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`text-[10px] px-2.5 py-1 rounded-md border flex items-center gap-1.5 w-fit ${paymentStyle[t.paymentStatus]}`}
                        >
                          <FontAwesomeIcon
                            icon={paymentIcon[t.paymentStatus]}
                            className="text-[8px]"
                          />
                          {t.paymentStatus}
                        </span>
                      </td>

                      {/* ACTION */}
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => setViewTeam(t)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-800 text-gray-500 hover:border-gray-600 hover:text-white transition-all duration-150"
                          title="View full details"
                        >
                          <FontAwesomeIcon
                            icon={faEye}
                            className="text-[9px]"
                          />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* TABLE FOOTER */}
          <div className="px-4 py-3 border-t border-gray-800 flex justify-between items-center">
            <p className="text-[10px] text-gray-700 tracking-wide">
              Showing {filtered.length} of {total} teams
            </p>
            <div className="flex gap-1.5">
              {["1", "2"].map((p) => (
                <button
                  key={p}
                  className={`w-6 h-6 text-[10px] rounded-md border transition-all duration-150 ${
                    p === "1"
                      ? "bg-[#F2AA00] text-black border-[#F2AA00]"
                      : "border-gray-800 text-gray-600 hover:border-gray-700"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
