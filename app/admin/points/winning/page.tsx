"use client";

import { useEffect, useState, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrophy, faUsers, faChevronRight, faChevronLeft,
  faStar, faSkull, faCheck, faPen, faTrash, faPlus,
  faSearch, faRotateRight, faCircleCheck,
  faHourglass, faXmark,
} from "@fortawesome/free-solid-svg-icons";

// ── Points helpers — imported from lib/points ────────────
import {
  getPlacementPoints,
  getKillPoints,
  calculateMatchPoints as calcTotal,
} from "@/lib/points";

// ── Types ─────────────────────────────────────────────────

interface Tournament {
  id:            number;
  title:         string;
  mode:          string;
  status:        string;
  start_date:    string | null;
  approvedTeams: number;
  awardedTeams:  number;
  pendingTeams:  number;
}

interface Player {
  name:      string;
  playerId:  string;
  isCaptain: boolean;
}

interface Award {
  id:       number;
  position: number;
  kills:    number;
  points:   number;
}

interface Team {
  registrationId: number;
  userId:         number;
  teamName:       string;
  captain:        string;
  mode:           string;
  players:        Player[];
  awarded:        boolean;
  award:          Award | null;
}

// ── Helpers ───────────────────────────────────────────────

const MODE_LABEL: Record<string, string> = {
  solo: "Solo", duo: "Duo", squad: "Squad",
};
const MODE_COLOR: Record<string, string> = {
  solo:  "text-blue-400  border-blue-500/30  bg-blue-500/10",
  duo:   "text-purple-400 border-purple-500/30 bg-purple-500/10",
  squad: "text-green-400  border-green-500/30  bg-green-500/10",
};
const POS_LABEL: Record<number, string> = {
  1: "🥇 #1", 2: "🥈 #2", 3: "🥉 #3",
};

function posLabel(n: number) {
  return POS_LABEL[n] ?? `#${n}`;
}

// ── Toast ─────────────────────────────────────────────────

function Toast({ msg, type, onClose }: { msg: string; type: "ok" | "err"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border text-sm tracking-wide transition-all duration-300
      ${type === "ok" ? "bg-[#0b0b0b] border-[#F2AA00]/40 text-[#F2AA00]" : "bg-[#0b0b0b] border-red-500/40 text-red-400"}`}>
      <FontAwesomeIcon icon={type === "ok" ? faCheck : faXmark} />
      {msg}
      <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100"><FontAwesomeIcon icon={faXmark} /></button>
    </div>
  );
}

// ── Award Form Modal ──────────────────────────────────────

function AwardModal({
  team, onClose, onSave,
}: {
  team: Team;
  onClose: () => void;
  onSave: (registrationId: number, position: number, kills: number, existingAwardId?: number) => Promise<void>;
}) {
  const [position, setPosition] = useState(team.award?.position ?? 1);
  const [kills,    setKills]    = useState(team.award?.kills    ?? 0);
  const [saving,   setSaving]   = useState(false);

  const mode        = team.mode ?? "solo";
  const placementPts = getPlacementPoints(position, mode);
  const killPts      = getKillPoints(kills);
  const totalPts     = calcTotal(position, kills, mode);

  async function handleSave() {
    setSaving(true);
    await onSave(team.registrationId, position, kills, team.award?.id);
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#0d0d0d] border border-gray-800 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div>
            <p className="text-[10px] text-[#F2AA00]/60 tracking-[0.3em] uppercase mb-1">
              {team.award ? "Edit Award" : "Award Points"}
            </p>
            <h3 className="text-white text-lg tracking-wide">{team.teamName}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-700 text-gray-500 hover:text-white hover:border-gray-500 transition-all">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {/* Players list */}
        {team.players.length > 0 && (
          <div className="px-6 pt-4">
            <p className="text-[10px] text-gray-600 tracking-widest uppercase mb-2">Players</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {team.players.map((p, i) => (
                <span key={i} className={`text-xs px-2.5 py-1 rounded-lg border ${p.isCaptain ? "border-[#F2AA00]/40 text-[#F2AA00] bg-[#F2AA00]/5" : "border-gray-700 text-gray-400 bg-gray-800/40"}`}>
                  {p.isCaptain && <FontAwesomeIcon icon={faStar} className="mr-1.5 text-[9px]" />}
                  {p.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Inputs */}
        <div className="px-6 py-4 space-y-4">
          {/* Position */}
          <div>
            <label className="block text-[10px] text-gray-500 tracking-widest uppercase mb-2">Placement</label>
            <div className="grid grid-cols-5 gap-2">
              {[1,2,3,4,5].map((p) => (
                <button key={p} onClick={() => setPosition(p)}
                  className={`py-2 rounded-lg border text-sm font-bold transition-all duration-150 ${position === p ? "border-[#F2AA00] bg-[#F2AA00]/10 text-[#F2AA00]" : "border-gray-700 text-gray-500 hover:border-gray-500"}`}>
                  {posLabel(p)}
                </button>
              ))}
            </div>
            <div className="mt-2">
              <input
                type="number" min={1} max={100} value={position}
                onChange={(e) => setPosition(Number(e.target.value))}
                className="w-full bg-[#111] border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F2AA00]/50 transition-colors"
                placeholder="Custom position..."
              />
            </div>
          </div>

          {/* Kills */}
          <div>
            <label className="block text-[10px] text-gray-500 tracking-widest uppercase mb-2">
              Kills  <span className="text-gray-600 normal-case">(×5 pts each)</span>
            </label>
            <div className="flex items-center gap-3">
              <button onClick={() => setKills(Math.max(0, kills - 1))}
                className="w-9 h-9 flex items-center justify-center border border-gray-700 rounded-lg text-gray-400 hover:border-gray-500 hover:text-white transition-all text-lg font-bold">−</button>
              <input type="number" min={0} value={kills} onChange={(e) => setKills(Math.max(0, Number(e.target.value)))}
                className="flex-1 bg-[#111] border border-gray-700 rounded-lg px-4 py-2.5 text-white text-center text-lg font-bold focus:outline-none focus:border-[#F2AA00]/50 transition-colors" />
              <button onClick={() => setKills(kills + 1)}
                className="w-9 h-9 flex items-center justify-center border border-gray-700 rounded-lg text-gray-400 hover:border-gray-500 hover:text-white transition-all text-lg font-bold">+</button>
            </div>
          </div>

          {/* Points Breakdown */}
          <div className="bg-black border border-gray-800 rounded-xl px-4 py-3 space-y-2">
            <p className="text-[10px] text-gray-600 tracking-widest uppercase mb-1">Points Breakdown</p>
            <div className="flex justify-between text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <FontAwesomeIcon icon={faStar} className="text-[#F2AA00]/50 text-[9px]" />
                Placement ({posLabel(position)} · <span className="capitalize ml-0.5">{mode}</span>)
              </span>
              <span className="text-gray-300 font-mono">+{placementPts}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <FontAwesomeIcon icon={faSkull} className="text-gray-600 text-[9px]" />
                Kill points ({kills} × 5)
              </span>
              <span className="text-gray-300 font-mono">+{killPts}</span>
            </div>
            <div className="border-t border-gray-800 pt-2 flex justify-between items-center">
              <span className="text-[10px] text-gray-600 tracking-widest uppercase">Total</span>
              <span className="text-[#F2AA00] font-mono text-lg font-bold">+{totalPts} pts</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 border-t border-gray-800">
          <button onClick={onClose} className="flex-1 border border-gray-700 text-gray-400 py-2.5 rounded-xl text-sm tracking-wide hover:border-gray-500 hover:text-white transition-all">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 bg-[#F2AA00] text-black py-2.5 rounded-xl text-sm tracking-widest font-bold hover:bg-[#e09e00] active:scale-95 transition-all disabled:opacity-50">
            {saving ? "Saving…" : team.award ? `Update · +${totalPts} pts` : `Award +${totalPts} pts`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────

export default function AdminPointsPage() {
  // ── State: tournament list ──
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [tLoading,    setTLoading]    = useState(true);
  const [tSearch,     setTSearch]     = useState("");

  // ── State: selected tournament / teams ──
  const [selected,  setSelected]  = useState<Tournament | null>(null);
  const [teams,     setTeams]     = useState<Team[]>([]);
  const [teamsLoad, setTeamsLoad] = useState(false);
  const [teamSearch, setTeamSearch] = useState("");
  const [filter,    setFilter]    = useState<"all" | "pending" | "awarded">("all");

  // ── State: modal ──
  const [modalTeam, setModalTeam] = useState<Team | null>(null);

  // ── State: delete confirm ──
  const [deleteTarget, setDeleteTarget] = useState<{ awardId: number; teamName: string } | null>(null);

  // ── Toast ──
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const showToast = (msg: string, type: "ok" | "err" = "ok") => setToast({ msg, type });

  // ── Auth headers ──
  const ah = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  // ── Fetch tournaments ──
  const fetchTournaments = useCallback(async () => {
    setTLoading(true);
    try {
      const r = await fetch("/api/admin/points/tournaments", { headers: ah() });
      const d = await r.json();
      setTournaments(d.tournaments ?? []);
    } finally {
      setTLoading(false);
    }
  }, []);

  useEffect(() => { fetchTournaments(); }, [fetchTournaments]);

  // ── Fetch teams for selected tournament ──
  const fetchTeams = useCallback(async (tid: number) => {
    setTeamsLoad(true);
    setTeams([]);
    try {
      const r = await fetch(`/api/admin/points/tournaments/${tid}/teams`, { headers: ah() });
      const d = await r.json();
      setTeams(d.teams ?? []);
    } finally {
      setTeamsLoad(false);
    }
  }, []);

  function selectTournament(t: Tournament) {
    setSelected(t);
    setTeamSearch("");
    setFilter("all");
    fetchTeams(t.id);
  }

  function goBack() {
    setSelected(null);
    setTeams([]);
    fetchTournaments();
  }

  // ── Award / Edit ──
  async function handleAward(
    registrationId: number,
    position: number,
    kills: number,
    existingAwardId?: number,
  ) {
    try {
      if (existingAwardId) {
        // Edit existing
        const r = await fetch(`/api/admin/points/${existingAwardId}`, {
          method: "PATCH",
          headers: ah(),
          body: JSON.stringify({ position, kills }),
        });
        if (!r.ok) throw new Error();
        showToast("Award updated ✓");
      } else {
        // New award
        const r = await fetch("/api/admin/points", {
          method: "POST",
          headers: ah(),
          body: JSON.stringify({ registrationId, position, kills }),
        });
        if (!r.ok) throw new Error();
        showToast("Points awarded ✓");
      }
      setModalTeam(null);
      if (selected) fetchTeams(selected.id);
    } catch {
      showToast("Something went wrong", "err");
    }
  }

  // ── Delete ──
  async function handleDelete(awardId: number) {
    try {
      const r = await fetch(`/api/admin/points/${awardId}`, { method: "DELETE", headers: ah() });
      if (!r.ok) throw new Error();
      showToast("Award removed");
      setDeleteTarget(null);
      if (selected) fetchTeams(selected.id);
    } catch {
      showToast("Delete failed", "err");
    }
  }

  // ── Filtered teams ──
  const filteredTeams = teams.filter((t) => {
    if (teamSearch && !t.teamName.toLowerCase().includes(teamSearch.toLowerCase())) return false;
    if (filter === "pending") return !t.awarded;
    if (filter === "awarded") return  t.awarded;
    return true;
  });

  const pendingCount = teams.filter((t) => !t.awarded).length;
  const awardedCount = teams.filter((t) =>  t.awarded).length;

  // ── Filtered tournaments ──
  const filteredTournaments = tournaments.filter((t) =>
    !tSearch || t.title.toLowerCase().includes(tSearch.toLowerCase())
  );

  // ═══════════════════════════════════════════════════════
  // VIEW A: Tournament List
  // ═══════════════════════════════════════════════════════
  if (!selected) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[#F2AA00]/60 text-[10px] tracking-[0.4em] uppercase mb-1">Admin</p>
            <h1 className="text-white text-2xl tracking-widest">Award Points</h1>
          </div>
          <button onClick={fetchTournaments}
            className="flex items-center gap-2 border border-gray-700 text-gray-400 px-4 py-2 rounded-lg text-sm hover:border-gray-500 hover:text-white transition-all">
            <FontAwesomeIcon icon={faRotateRight} className={tLoading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
          <input value={tSearch} onChange={(e) => setTSearch(e.target.value)}
            placeholder="Search tournaments…"
            className="w-full bg-[#0b0b0b] border border-gray-800 rounded-xl pl-11 pr-4 py-3 text-white text-sm focus:outline-none focus:border-[#F2AA00]/40 transition-colors" />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Tournaments",   value: tournaments.length,                              icon: faTrophy,       color: "text-[#F2AA00]" },
            { label: "Pending Teams", value: tournaments.reduce((s,t) => s + t.pendingTeams, 0), icon: faHourglass, color: "text-amber-400"   },
            { label: "Awarded Teams", value: tournaments.reduce((s,t) => s + t.awardedTeams, 0), icon: faCircleCheck,color: "text-green-400"  },
          ].map((s, i) => (
            <div key={i} className="bg-[#0b0b0b] border border-gray-800 rounded-xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-800/60 flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={s.icon} className={s.color} />
              </div>
              <div>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-gray-600 text-[11px] tracking-widest uppercase">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tournament list */}
        {tLoading ? (
          <div className="space-y-3">
            {[1,2,3].map((i) => (
              <div key={i} className="bg-[#0b0b0b] border border-gray-800 rounded-xl h-20 animate-pulse" />
            ))}
          </div>
        ) : filteredTournaments.length === 0 ? (
          <div className="text-center py-20 text-gray-600">
            <FontAwesomeIcon icon={faTrophy} className="text-4xl mb-3 block" />
            No tournaments with approved registrations yet.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTournaments.map((t) => {
              const allDone  = t.pendingTeams === 0 && t.approvedTeams > 0;
              const modeCls  = MODE_COLOR[t.mode] ?? "text-gray-400 border-gray-600 bg-gray-800/40";
              return (
                <button key={t.id} onClick={() => selectTournament(t)}
                  className="w-full text-left bg-[#0b0b0b] border border-gray-800 rounded-xl px-5 py-4 hover:border-[#F2AA00]/40 hover:shadow-[0_0_20px_rgba(242,170,0,0.07)] transition-all duration-200 group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#F2AA00]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#F2AA00]/20 transition-colors">
                        <FontAwesomeIcon icon={faTrophy} className="text-[#F2AA00]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-sm tracking-wide truncate">{t.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border tracking-widest uppercase ${modeCls}`}>
                            {MODE_LABEL[t.mode] ?? t.mode}
                          </span>
                          {t.start_date && (
                            <span className="text-gray-600 text-[11px]">
                              {new Date(t.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                      {/* Progress */}
                      <div className="text-right hidden sm:block">
                        <p className="text-white text-sm font-bold">{t.awardedTeams}<span className="text-gray-600 font-normal"> / {t.approvedTeams}</span></p>
                        <p className="text-[11px] text-gray-600 tracking-widest uppercase">Awarded</p>
                      </div>

                      {/* Status badge */}
                      {allDone ? (
                        <span className="flex items-center gap-1.5 text-[10px] text-green-400 border border-green-500/30 bg-green-500/10 px-2.5 py-1 rounded-full tracking-widest uppercase">
                          <FontAwesomeIcon icon={faCircleCheck} /> Done
                        </span>
                      ) : t.pendingTeams > 0 ? (
                        <span className="flex items-center gap-1.5 text-[10px] text-amber-400 border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 rounded-full tracking-widest uppercase">
                          <FontAwesomeIcon icon={faHourglass} /> {t.pendingTeams} Pending
                        </span>
                      ) : null}

                      <FontAwesomeIcon icon={faChevronRight} className="text-gray-600 group-hover:text-[#F2AA00] transition-colors" />
                    </div>
                  </div>

                  {/* Progress bar */}
                  {t.approvedTeams > 0 && (
                    <div className="mt-3 h-1 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#F2AA00] rounded-full transition-all duration-500"
                        style={{ width: `${(t.awardedTeams / t.approvedTeams) * 100}%` }}
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // VIEW B: Teams inside a tournament
  // ═══════════════════════════════════════════════════════
  const modeCls = MODE_COLOR[selected.mode] ?? "text-gray-400 border-gray-600 bg-gray-800/40";

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <button onClick={goBack}
          className="mt-1 w-9 h-9 flex items-center justify-center border border-gray-700 rounded-lg text-gray-400 hover:border-[#F2AA00]/40 hover:text-[#F2AA00] transition-all flex-shrink-0">
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[#F2AA00]/60 text-[10px] tracking-[0.4em] uppercase mb-0.5">Award Points</p>
          <h1 className="text-white text-xl tracking-wide truncate">{selected.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[10px] px-2 py-0.5 rounded-full border tracking-widest uppercase ${modeCls}`}>
              {MODE_LABEL[selected.mode] ?? selected.mode}
            </span>
            <span className="text-gray-500 text-xs">{selected.approvedTeams} teams · {awardedCount} awarded · {pendingCount} pending</span>
          </div>
        </div>
        <button onClick={() => fetchTeams(selected.id)}
          className="flex items-center gap-2 border border-gray-700 text-gray-400 px-3 py-2 rounded-lg text-sm hover:border-gray-500 hover:text-white transition-all flex-shrink-0">
          <FontAwesomeIcon icon={faRotateRight} className={teamsLoad ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Progress bar */}
      {selected.approvedTeams > 0 && (
        <div className="mb-5">
          <div className="flex justify-between text-[11px] text-gray-600 mb-1.5">
            <span>Progress</span>
            <span>{awardedCount} / {selected.approvedTeams} teams awarded</span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-[#F2AA00] rounded-full transition-all duration-500"
              style={{ width: teams.length > 0 ? `${(awardedCount / teams.length) * 100}%` : "0%" }} />
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
          <input value={teamSearch} onChange={(e) => setTeamSearch(e.target.value)}
            placeholder="Search teams…"
            className="w-full bg-[#0b0b0b] border border-gray-800 rounded-xl pl-11 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#F2AA00]/40 transition-colors" />
        </div>
        <div className="flex gap-2">
          {(["all","pending","awarded"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl border text-xs tracking-widest uppercase transition-all ${
                filter === f
                  ? "border-[#F2AA00] bg-[#F2AA00]/10 text-[#F2AA00]"
                  : "border-gray-800 text-gray-500 hover:border-gray-600"
              }`}>
              {f === "all" ? `All (${teams.length})` : f === "pending" ? `Pending (${pendingCount})` : `Awarded (${awardedCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* Teams */}
      {teamsLoad ? (
        <div className="space-y-3">
          {[1,2,3,4].map((i) => (
            <div key={i} className="bg-[#0b0b0b] border border-gray-800 rounded-xl h-20 animate-pulse" />
          ))}
        </div>
      ) : filteredTeams.length === 0 ? (
        <div className="text-center py-20 text-gray-600">
          <FontAwesomeIcon icon={faUsers} className="text-4xl mb-3 block" />
          {teamSearch ? "No teams match your search." : "No teams found."}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTeams.map((team) => (
            <div key={team.registrationId}
              className={`bg-[#0b0b0b] border rounded-xl px-5 py-4 transition-all duration-200
                ${team.awarded ? "border-green-500/20" : "border-gray-800 hover:border-[#F2AA00]/30"}`}>
              <div className="flex items-center justify-between gap-4">
                {/* Left: team info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${team.awarded ? "bg-green-500/10" : "bg-gray-800/60"}`}>
                    <FontAwesomeIcon icon={team.awarded ? faCircleCheck : faUsers}
                      className={team.awarded ? "text-green-400" : "text-gray-500"} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-sm tracking-wide truncate">{team.teamName}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {team.players.length > 0 && (
                        <span className="text-gray-600 text-xs">{team.players.length} player{team.players.length !== 1 ? "s" : ""}</span>
                      )}
                      {team.awarded && team.award && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-[#F2AA00]">
                            <FontAwesomeIcon icon={faTrophy} className="mr-1 text-[10px]" />
                            {posLabel(team.award.position)}
                          </span>
                          <span className="text-gray-600">·</span>
                          <span className="text-red-400">
                            <FontAwesomeIcon icon={faSkull} className="mr-1 text-[10px]" />
                            {team.award.kills}K
                          </span>
                          <span className="text-gray-600">·</span>
                          <span className="text-[#F2AA00] font-bold">+{team.award.points} pts</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!team.awarded ? (
                    <button onClick={() => setModalTeam(team)}
                      className="flex items-center gap-2 bg-[#F2AA00] text-black px-4 py-2 rounded-lg text-xs tracking-widest font-bold hover:bg-[#e09e00] active:scale-95 transition-all">
                      <FontAwesomeIcon icon={faPlus} />
                      Award
                    </button>
                  ) : (
                    <>
                      <button onClick={() => setModalTeam(team)}
                        className="w-8 h-8 flex items-center justify-center border border-gray-700 rounded-lg text-gray-500 hover:border-[#F2AA00]/40 hover:text-[#F2AA00] transition-all">
                        <FontAwesomeIcon icon={faPen} className="text-xs" />
                      </button>
                      <button onClick={() => setDeleteTarget({ awardId: team.award!.id, teamName: team.teamName })}
                        className="w-8 h-8 flex items-center justify-center border border-gray-700 rounded-lg text-gray-500 hover:border-red-500/40 hover:text-red-400 transition-all">
                        <FontAwesomeIcon icon={faTrash} className="text-xs" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Players chips (expanded) */}
              {team.players.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-800/60">
                  {team.players.map((p, i) => (
                    <span key={i} className={`text-[11px] px-2 py-0.5 rounded-md border ${p.isCaptain ? "border-[#F2AA00]/30 text-[#F2AA00]/80 bg-[#F2AA00]/5" : "border-gray-800 text-gray-600"}`}>
                      {p.isCaptain && "★ "}{p.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Award Modal */}
      {modalTeam && (
        <AwardModal team={modalTeam} onClose={() => setModalTeam(null)} onSave={handleAward} />
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0d0d0d] border border-red-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-white text-lg tracking-wide mb-2">Remove Award?</h3>
            <p className="text-gray-400 text-sm mb-5">
              This will delete the award for <span className="text-white">{deleteTarget.teamName}</span> and deduct points from their balance.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 border border-gray-700 text-gray-400 py-2.5 rounded-xl text-sm hover:border-gray-500 transition-all">Cancel</button>
              <button onClick={() => handleDelete(deleteTarget.awardId)} className="flex-1 bg-red-500/10 border border-red-500/40 text-red-400 py-2.5 rounded-xl text-sm hover:bg-red-500/20 transition-all">Remove</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}