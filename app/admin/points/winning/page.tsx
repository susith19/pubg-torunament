"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrophy, faPlus, faXmark, faCheck, faMagnifyingGlass,
  faChevronDown, faMedal, faCrown, faUsers, faUser,
} from "@fortawesome/free-solid-svg-icons";

// ── dummy teams with registered tournament ─────────────────
const TEAMS = [
  { id: 1, teamName: "Alpha Squad",   mode: "Squad", tournament: "Erangel Squad Battle", captain: "Susith",  players: 4 },
  { id: 2, teamName: "Desert Wolves", mode: "Duo",   tournament: "Miramar Duo Clash",    captain: "Rajan",   players: 2 },
  { id: 3, teamName: "Solo Ghost",    mode: "Solo",  tournament: "Sanhok Solo Rush",     captain: "Vikram",  players: 1 },
  { id: 4, teamName: "Iron Fist",     mode: "Squad", tournament: "Erangel Squad Battle", captain: "Dhruv",   players: 4 },
  { id: 5, teamName: "Night Hunters", mode: "Duo",   tournament: "Miramar Duo Clash",    captain: "Neha",    players: 2 },
];

const POSITION_POINTS: Record<number, number> = { 1: 150, 2: 80, 3: 40, 4: 20, 5: 10 };
const POSITION_LABEL: Record<number, string>  = { 1: "1st", 2: "2nd", 3: "3rd", 4: "4th", 5: "5th" };
const POSITION_EMOJI: Record<number, string>  = { 1: "🥇", 2: "🥈", 3: "🥉", 4: "4th", 5: "5th" };

const positionColor: Record<number, string> = {
  1: "bg-[#F2AA00]/10 border-[#F2AA00]/30 text-[#F2AA00]",
  2: "bg-gray-300/10 border-gray-300/20 text-gray-300",
  3: "bg-amber-700/10 border-amber-700/20 text-amber-600",
  4: "bg-gray-800/40 border-gray-700 text-gray-500",
  5: "bg-gray-800/40 border-gray-700 text-gray-500",
};

type Award = { id: number; teamName: string; tournament: string; position: number; points: number; awardedAt: string };

// ── ADD POINTS MODAL ──────────────────────────────────────
function AddPointsModal({ onClose, onSave }: {
  onClose: () => void;
  onSave: (award: Omit<Award, "id" | "awardedAt">) => void;
}) {
  const [selectedTeam, setSelectedTeam] = useState<typeof TEAMS[0] | null>(null);
  const [position, setPosition]         = useState(1);
  const [customPts, setCustomPts]       = useState(POSITION_POINTS[1]);
  const [useCustom, setUseCustom]       = useState(false);

  const pts = useCustom ? customPts : POSITION_POINTS[position];
  const valid = selectedTeam !== null && pts > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="bg-[#0e0e0e] border border-gray-800 rounded-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>

        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-800">
          <p className="text-sm tracking-wide text-white">Add Winning Points</p>
          <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="p-6 space-y-4">

          {/* select team */}
          <div>
            <p className="text-[10px] text-gray-600 tracking-widest uppercase mb-1.5">Select Team</p>
            <div className="relative">
              <select
                onChange={(e) => {
                  const t = TEAMS.find((t) => t.id === Number(e.target.value));
                  setSelectedTeam(t ?? null);
                }}
                defaultValue=""
                className="w-full appearance-none bg-black border border-gray-800 focus:border-[#F2AA00]/40 rounded-lg px-4 py-3 text-sm text-white outline-none cursor-pointer"
              >
                <option value="" disabled>Choose a team...</option>
                {TEAMS.map((t) => (
                  <option key={t.id} value={t.id}>{t.teamName} — {t.tournament}</option>
                ))}
              </select>
              <FontAwesomeIcon icon={faChevronDown} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 text-[9px] pointer-events-none" />
            </div>
            {selectedTeam && (
              <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-black border border-gray-800 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-[#F2AA00]/20 flex items-center justify-center text-[10px] text-[#F2AA00] ">
                  {selectedTeam.captain[0]}
                </div>
                <p className="text-[12px] text-gray-400 tracking-widest">
                  Captain: <span className="text-white">{selectedTeam.captain}</span>
                  &nbsp;·&nbsp; {selectedTeam.mode}
                  &nbsp;·&nbsp; {selectedTeam.players}P
                </p>
              </div>
            )}
          </div>

          {/* position buttons */}
          <div>
            <p className="text-[9px] text-gray-600 tracking-widest uppercase mb-1.5">Finishing Position</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((p) => (
                <button
                  key={p}
                  onClick={() => { setPosition(p); setUseCustom(false); setCustomPts(POSITION_POINTS[p]); }}
                  className={`flex-1 py-2 text-sm rounded-lg border transition-all duration-150 ${position === p && !useCustom ? positionColor[p] : "border-gray-800 text-gray-600 hover:border-gray-700"}`}
                >
                  <div>{POSITION_EMOJI[p]}</div>
                  <div className="text-[9px] mt-0.5">{POSITION_LABEL[p]}</div>
                </button>
              ))}
            </div>
          </div>

          {/* points display */}
          <div className="flex items-center justify-between bg-black border border-gray-800 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2">
              <p className="text-[10px] text-gray-600 tracking-widest uppercase">Points to Award</p>
              <button
                onClick={() => setUseCustom(!useCustom)}
                className="text-[10px] text-gray-700 hover:text-[#F2AA00] transition-colors tracking-widest"
              >
                {useCustom ? "(preset)" : "(custom)"}
              </button>
            </div>
            {useCustom ? (
              <input
                type="number"
                value={customPts}
                onChange={(e) => setCustomPts(Number(e.target.value))}
                className="w-20 bg-transparent text-[#F2AA00] font-mono text-xl text-right outline-none border-b border-[#F2AA00]/30 focus:border-[#F2AA00]"
              />
            ) : (
              <p className="text-[#F2AA00] font-mono text-xl">+{pts}</p>
            )}
          </div>

          <button
            onClick={() => valid && selectedTeam && onSave({ teamName: selectedTeam.teamName, tournament: selectedTeam.tournament, position, points: pts })}
            className={`w-full py-3 text-sm tracking-widest rounded-lg border transition-all duration-150 active:scale-[0.97] ${valid ? "bg-[#F2AA00] text-black border-[#F2AA00] hover:bg-[#e09e00] hover:shadow-lg hover:shadow-[#F2AA00]/20" : "bg-gray-900 text-gray-600 border-gray-800 cursor-not-allowed"}`}
          >
            Award {pts} Points
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN ─────────────────────────────────────────────────
export default function AdminWinningPoints() {
  const [awards, setAwards]         = useState<Award[]>([
    { id: 1, teamName: "Alpha Squad",   tournament: "Erangel Squad Battle", position: 1, points: 150, awardedAt: "Nov 28, 2026" },
    { id: 2, teamName: "Desert Wolves", tournament: "Miramar Duo Clash",    position: 2, points: 80,  awardedAt: "Nov 20, 2026" },
    { id: 3, teamName: "Solo Ghost",    tournament: "Sanhok Solo Rush",     position: 3, points: 40,  awardedAt: "Nov 15, 2026" },
  ]);
  const [showModal, setShowModal]   = useState(false);
  const [search, setSearch]         = useState("");
  const [filter, setFilter]         = useState("All");
  const [visible, setVisible]       = useState(false);
  const [toast, setToast]           = useState({ msg: "", show: false });

  useEffect(() => { setTimeout(() => setVisible(true), 60); }, []);

  const pop = (msg: string) => {
    setToast({ msg, show: true });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 2500);
  };

  const handleSave = (data: Omit<Award, "id" | "awardedAt">) => {
    setAwards((prev) => [
      { ...data, id: Date.now(), awardedAt: "Just now" },
      ...prev,
    ]);
    setShowModal(false);
    pop(`+${data.points} pts awarded to ${data.teamName}!`);
  };

  const tournaments = ["All", ...Array.from(new Set(awards.map((a) => a.tournament)))];

  const filtered = awards.filter((a) => {
    const q = search.toLowerCase();
    return (
      (a.teamName.toLowerCase().includes(q) || a.tournament.toLowerCase().includes(q)) &&
      (filter === "All" || a.tournament === filter)
    );
  });

  const totalPtsAwarded = awards.reduce((s, a) => s + a.points, 0);

  return (
    <div className="bg-black min-h-screen text-white px-4 sm:px-6 py-10">

      {/* toast */}
      <div className={`fixed bottom-6 right-6 z-50 bg-[#F2AA00] text-black text-xs px-5 py-3 rounded-lg shadow-lg shadow-[#F2AA00]/20 tracking-widest transition-all duration-500 ${toast.show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none"}`}>
        {toast.msg}
      </div>

      {showModal && <AddPointsModal onClose={() => setShowModal(false)} onSave={handleSave} />}

      <div className="max-w-7xl mx-auto space-y-5">

        {/* HEADER */}
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"}`}>
          <div>
            <h1 className="text-xl tracking-widest text-white">Winning Points</h1>
            <p className="text-gray-600 text-xs mt-1 tracking-wide">Award points to winning teams — auto-added to their wallet</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="self-start sm:self-auto bg-[#F2AA00] text-black px-5 py-2.5 text-xs tracking-widest rounded-lg hover:bg-[#e09e00] hover:shadow-lg hover:shadow-[#F2AA00]/20 active:scale-[0.97] transition-all duration-150 flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faPlus} className="text-xs" />
            Award Points
          </button>
        </div>

        {/* SUMMARY */}
        <div className={`grid grid-cols-3 gap-3 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`} style={{ transitionDelay: "80ms" }}>
          {[
            { label: "Total Awarded",    value: `${totalPtsAwarded} pts`, color: "text-[#F2AA00]" },
            { label: "Awards Given",     value: awards.length,            color: "text-white"     },
            { label: "Tournaments",      value: tournaments.length - 1,   color: "text-gray-300"  },
          ].map((s, i) => (
            <div key={i} className="bg-[#0b0b0b] border border-gray-800 rounded-xl px-4 py-3 hover:border-gray-700 transition-colors duration-200">
              <p className="text-gray-600 text-[9px] tracking-widest uppercase">{s.label}</p>
              <p className={`text-xl font-mono mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* FILTERS */}
        <div className={`flex gap-3 flex-col sm:flex-row transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`} style={{ transitionDelay: "160ms" }}>
          <div className="relative flex-1">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600 text-xs" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search team or tournament..."
              className="w-full bg-[#0b0b0b] border border-gray-800 focus:border-[#F2AA00]/40 rounded-lg pl-9 pr-4 py-2.5 text-xs text-white placeholder-gray-600 outline-none"
            />
          </div>
          <div className="relative">
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="appearance-none bg-[#0b0b0b] border border-gray-800 rounded-lg px-4 py-2.5 pr-8 text-xs text-gray-400 outline-none cursor-pointer">
              {tournaments.map((t) => <option key={t}>{t}</option>)}
            </select>
            <FontAwesomeIcon icon={faChevronDown} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 text-[9px] pointer-events-none" />
          </div>
        </div>

        {/* TABLE */}
        <div className={`bg-[#0b0b0b] border border-gray-800 rounded-xl overflow-hidden transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`} style={{ transitionDelay: "240ms" }}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-b border-gray-800 bg-[#0f0f0f]">
                  {["Team", "Tournament", "Position", "Points Awarded", "When"].map((h) => (
                    <th key={h} className="text-[10px] text-gray-600 tracking-widest uppercase px-4 py-3 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-14 text-gray-700 text-xs tracking-widest">No awards yet.</td></tr>
                ) : (
                  filtered.map((a, i) => (
                    <tr key={a.id} className={`border-b border-gray-800/50 last:border-0 hover:bg-[#111] group transition-all duration-300 ${visible ? "opacity-100" : "opacity-0"}`} style={{ transitionDelay: `${320 + i * 50}ms` }}>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[#F2AA00]/10 flex items-center justify-center flex-shrink-0">
                            <FontAwesomeIcon icon={a.position <= 2 ? faUsers : faUser} className="text-[#F2AA00] text-[9px]" />
                          </div>
                          <p className="text-xs text-white group-hover:text-[#F2AA00] transition-colors duration-200">{a.teamName}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-400 max-w-[160px] truncate">{a.tournament}</td>
                      <td className="px-4 py-3.5">
                        <span className={`text-[10px] px-2.5 py-1 rounded-md border flex items-center gap-1.5 w-fit ${positionColor[a.position] ?? "border-gray-700 text-gray-500"}`}>
                          {POSITION_EMOJI[a.position]} {POSITION_LABEL[a.position]}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-[#F2AA00] font-mono text-sm">+{a.points}</span>
                        <span className="text-gray-600 text-[10px] ml-1">pts</span>
                      </td>
                      <td className="px-4 py-3.5 text-[10px] text-gray-500">{a.awardedAt}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-800 flex justify-between items-center">
            <p className="text-[10px] text-gray-700 tracking-wide">Showing {filtered.length} of {awards.length} awards</p>
          </div>
        </div>

      </div>
    </div>
  );
}