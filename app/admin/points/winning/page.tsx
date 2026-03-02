"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrophy, faPlus, faXmark, faMagnifyingGlass,
  faChevronDown, faUsers, faUser, faSpinner, faCheck,
} from "@fortawesome/free-solid-svg-icons";

// ── constants ─────────────────────────────────────────────
const POSITION_POINTS: Record<number, number> = { 1: 150, 2: 80, 3: 40, 4: 20, 5: 10 };
const POSITION_LABEL:  Record<number, string>  = { 1: "1st", 2: "2nd", 3: "3rd", 4: "4th", 5: "5th" };
const POSITION_EMOJI:  Record<number, string>  = { 1: "🥇", 2: "🥈", 3: "🥉", 4: "4th", 5: "5th" };

const positionColor: Record<number, string> = {
  1: "bg-[#F2AA00]/10 border-[#F2AA00]/30 text-[#F2AA00]",
  2: "bg-gray-300/10 border-gray-300/20 text-gray-300",
  3: "bg-amber-700/10 border-amber-700/20 text-amber-600",
  4: "bg-gray-800/40 border-gray-700 text-gray-500",
  5: "bg-gray-800/40 border-gray-700 text-gray-500",
};

function relativeTime(iso: string) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso.replace(" ", "T") + "Z").getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso.replace(" ", "T")).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

type Team  = { registrationId: number; teamName: string; captain: string; tournament: string; mode: string; players: number; slotStatus?: string };
type Award = { id: number; teamName: string; tournament: string; position: string; points: number; awardedAt: string };

// ── Custom Dropdown ───────────────────────────────────────
function TeamDropdown({ teams, selected, onSelect }: {
  teams: Team[];
  selected: Team | null;
  onSelect: (t: Team | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between bg-[#0a0a0a] border border-gray-700 hover:border-[#F2AA00]/40 rounded-lg px-4 py-3 text-sm text-left transition-colors duration-150"
      >
        <span className={selected ? "text-white" : "text-gray-500"}>
          {selected ? `${selected.teamName} — ${selected.tournament}` : "Choose a team..."}
        </span>
        <FontAwesomeIcon
          icon={faChevronDown}
          className={`text-gray-500 text-[10px] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown list */}
      {open && (
        <div className="absolute z-50 top-full mt-1 w-full bg-[#0f0f0f] border border-gray-700 rounded-lg overflow-hidden shadow-xl shadow-black/60">
          {teams.length === 0 ? (
            <p className="text-gray-600 text-xs px-4 py-3 tracking-widest">No teams found</p>
          ) : (
            <ul className="max-h-52 overflow-y-auto">
              {teams.map((t) => (
                <li
                  key={t.registrationId}
                  onClick={() => { onSelect(t); setOpen(false); }}
                  className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors duration-100 hover:bg-[#F2AA00]/10 ${selected?.registrationId === t.registrationId ? "bg-[#F2AA00]/5 text-[#F2AA00]" : "text-gray-300"}`}
                >
                  <div>
                    <p className="text-sm font-medium">{t.teamName}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{t.tournament} · {t.mode} · {t.players}P</p>
                  </div>
                  {selected?.registrationId === t.registrationId && (
                    <FontAwesomeIcon icon={faCheck} className="text-[#F2AA00] text-xs" />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ── ADD POINTS MODAL ──────────────────────────────────────
function AddPointsModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [teams, setTeams]               = useState<Team[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [position, setPosition]         = useState(1);
  const [customPts, setCustomPts]       = useState(POSITION_POINTS[1]);
  const [useCustom, setUseCustom]       = useState(false);
  const [saving, setSaving]             = useState(false);
  const [err, setErr]                   = useState("");

  const pts   = useCustom ? customPts : POSITION_POINTS[position];
  const valid = selectedTeam !== null && pts > 0;

  useEffect(() => {
    fetch("/api/admin/winning-points/teams", { 
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
      },
     })
      .then((r) => r.json())
      .then((d) => setTeams(d.teams ?? []))
      .catch(() => setErr("Failed to load teams"))
      .finally(() => setLoadingTeams(false));
  }, []);

  const handleSave = async () => {
    if (!valid || !selectedTeam) return;
    setSaving(true);
    setErr("");
    try {
      const res = await fetch("/api/admin/winning-points", {
        method: "POST",
        credentials: "include",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ registrationId: selectedTeam.registrationId, position, points: pts }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      onSave();
    } catch (e: any) {
      setErr(e.message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="bg-[#0e0e0e] border border-gray-800 rounded-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>

        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-800">
          <p className="text-lg tracking-wide text-white">Add Winning Points</p>
          <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="p-6 space-y-4">

          {err && (
            <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{err}</p>
          )}

          {/* team selector */}
          <div>
            <p className="text-[12px] text-gray-600 tracking-widest uppercase mb-1.5">Select Team</p>
            {loadingTeams ? (
              <div className="flex items-center gap-2 bg-black border border-gray-800 rounded-lg px-4 py-3 text-xs text-gray-600">
                <FontAwesomeIcon icon={faSpinner} className="animate-spin w-3 h-3" />
                Loading teams...
              </div>
            ) : (
              <TeamDropdown teams={teams} selected={selectedTeam} onSelect={setSelectedTeam} />
            )}

            {/* selected team preview */}
            {selectedTeam && (
              <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-black border border-gray-800 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-[#F2AA00]/20 flex items-center justify-center text-[10px] text-[#F2AA00]">
                  {selectedTeam.captain?.[0] ?? "?"}
                </div>
                <p className="text-[14px] text-gray-400">
                  Captain: <span className="text-white">{selectedTeam.captain}</span>
                  &nbsp;·&nbsp;
                  {selectedTeam.mode ? selectedTeam.mode.charAt(0).toUpperCase() + selectedTeam.mode.slice(1) : "—"}
                  &nbsp;·&nbsp;{selectedTeam.players}P
                </p>
              </div>
            )}
          </div>

          {/* position buttons */}
          <div>
            <p className="text-[12px] text-gray-600 tracking-widest uppercase mb-1.5">Finishing Position</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((p) => (
                <button
                  key={p}
                  onClick={() => { setPosition(p); setUseCustom(false); setCustomPts(POSITION_POINTS[p]); }}
                  className={`flex-1 py-2 text-sm rounded-lg border transition-all duration-150 ${position === p && !useCustom ? positionColor[p] : "border-gray-800 text-gray-600 hover:border-gray-700"}`}
                >
                  <div>{POSITION_EMOJI[p]}</div>
                  <div className="text-[12px] mt-0.5">{POSITION_LABEL[p]}</div>
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
            onClick={handleSave}
            disabled={!valid || saving}
            className={`w-full py-3 text-sm tracking-widest rounded-lg border transition-all duration-150 active:scale-[0.97] flex items-center justify-center gap-2 ${valid && !saving ? "bg-[#F2AA00] text-black border-[#F2AA00] hover:bg-[#e09e00]" : "bg-gray-900 text-gray-600 border-gray-800 cursor-not-allowed"}`}
          >
            {saving && <FontAwesomeIcon icon={faSpinner} className="animate-spin w-3 h-3" />}
            Award {pts} Points
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN ─────────────────────────────────────────────────
export default function AdminWinningPoints() {
  const [awards, setAwards]           = useState<Award[]>([]);
  const [summary, setSummary]         = useState({ totalPoints: 0, totalAwards: 0 });
  const [tournamentList, setTournamentList] = useState<string[]>([]);
  const [loading, setLoading]         = useState(true);
  const [apiErr, setApiErr]           = useState("");
  const [showModal, setShowModal]     = useState(false);
  const [search, setSearch]           = useState("");
  const [filter, setFilter]           = useState("All");
  const [visible, setVisible]         = useState(false);
  const [toast, setToast]             = useState({ msg: "", show: false });

  const pop = (msg: string) => {
    setToast({ msg, show: true });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 2500);
  };

  const fetchAwards = useCallback(async () => {
    setLoading(true);
    setApiErr("");
    try {
      const params = new URLSearchParams({ search, tournament: filter });
      const res  = await fetch(`/api/admin/winning-points?${params}`, { headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },});
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      setAwards(data.awards ?? []);
      setSummary(data.summary ?? { totalPoints: 0, totalAwards: 0 });
      setTournamentList(data.tournaments ?? []);
    } catch (e: any) {
      setApiErr(e.message ?? "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [search, filter]);

  useEffect(() => {
    fetchAwards();
    setTimeout(() => setVisible(true), 60);
  }, [fetchAwards]);

  const handleSaved = () => {
    setShowModal(false);
    fetchAwards();
    pop("Points awarded successfully!");
  };

  const tournaments = ["All", ...tournamentList];

  return (
    <div className="bg-black min-h-screen text-white px-4 sm:px-6 py-10">

      {/* toast */}
      <div className={`fixed bottom-6 right-6 z-50 bg-[#F2AA00] text-black text-xs px-5 py-3 rounded-lg shadow-lg shadow-[#F2AA00]/20 tracking-widest transition-all duration-500 ${toast.show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none"}`}>
        {toast.msg}
      </div>

      {showModal && <AddPointsModal onClose={() => setShowModal(false)} onSave={handleSaved} />}

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

        {apiErr && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-xs">{apiErr}</div>
        )}

        {/* SUMMARY */}
        <div className={`grid grid-cols-3 gap-3 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`} style={{ transitionDelay: "80ms" }}>
          {[
            { label: "Total Awarded", value: `${summary.totalPoints} pts`, color: "text-[#F2AA00]" },
            { label: "Awards Given",  value: summary.totalAwards,          color: "text-white"     },
            { label: "Tournaments",   value: tournamentList.length,        color: "text-gray-300"  },
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
              className="w-full bg-[#0b0b0b] border border-gray-800 focus:border-[#F2AA00]/40 rounded-lg pl-9 pr-4 py-2.5 text-md text-white placeholder-gray-600 outline-none"
            />
          </div>
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="appearance-none bg-[#0b0b0b] border border-gray-800 rounded-lg px-4 py-2.5 pr-8 text-xs text-gray-400 outline-none cursor-pointer"
            >
              {tournaments.map((t) => <option key={t} style={{ background: "#0b0b0b", color: "#ccc" }}>{t}</option>)}
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
                    <th key={h} className="text-[12px] text-gray-600 tracking-widest uppercase px-4 py-3 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-14"><FontAwesomeIcon icon={faSpinner} className="animate-spin text-gray-600 w-5 h-5" /></td></tr>
                ) : awards.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-14 text-gray-700 text-xs tracking-widest">No awards yet.</td></tr>
                ) : (
                  awards.map((a, i) => {
                    const pos = Number(a.position);
                    return (
                      <tr key={a.id} className="border-b border-gray-800/50 last:border-0 hover:bg-[#111] group transition-colors duration-150">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-[#F2AA00]/10 flex items-center justify-center flex-shrink-0">
                              <FontAwesomeIcon icon={pos <= 2 ? faUsers : faUser} className="text-[#F2AA00] text-[9px]" />
                            </div>
                            <p className="text-lg text-white group-hover:text-[#F2AA00] transition-colors duration-200">{a.teamName}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-lg text-gray-400 max-w-[160px] truncate">{a.tournament}</td>
                        <td className="px-4 py-3.5">
                          <span className={`text-[14px] px-2.5 py-1 rounded-md border flex items-center gap-1.5 w-fit ${positionColor[pos] ?? "border-gray-700 text-gray-500"}`}>
                            {POSITION_EMOJI[pos] ?? pos} {POSITION_LABEL[pos] ?? `#${pos}`}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-[#F2AA00] font-mono text-lg">+{a.points}</span>
                          <span className="text-gray-600 text-[12px] ml-1">pts</span>
                        </td>
                        <td className="px-4 py-3.5 text-[14px] text-gray-500">{relativeTime(a.awardedAt)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-800">
            <p className="text-[10px] text-gray-700 tracking-wide">Showing {awards.length} of {summary.totalAwards} awards</p>
          </div>
        </div>

      </div>
    </div>
  );
}