"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrophy, faPlus, faXmark, faMagnifyingGlass,
  faChevronDown, faUsers, faUser, faSpinner, faCheck,
  faStar, faSkull, faPencil, faTrash, faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";

// ── points helpers (mirrors lib/points.ts exactly) ────────
function getPlacementPoints(position: number, mode: string): number {
  // normalize: "squad" is stored in DB but logic uses "team"
  const m = mode === "squad" ? "team" : mode;
  if (m === "solo") {
    if (position === 1) return 500;
    if (position === 2) return 400;
    if (position === 3) return 300;
    if (position === 4) return 200;
    if (position === 5) return 100;
    if (position <= 10) return 75;
    if (position <= 15) return 50;
    if (position <= 20) return 30;
    return 0;
  }
  if (m === "duo") {
    if (position === 1) return 500;
    if (position === 2) return 400;
    if (position === 3) return 300;
    if (position === 4) return 200;
    if (position <= 10) return 100;
    if (position <= 15) return 50;
    return 0;
  }
  if (m === "team") {
    if (position === 1) return 500;
    if (position === 2) return 400;
    if (position === 3) return 300;
    if (position === 4) return 200;
    if (position === 5) return 180;
    if (position <= 10) return 75;
    return 0;
  }
  return 0;
}
function getKillPoints(kills: number): number { return kills * 5; }
function calculateMatchPoints(position: number, kills: number, mode: string): number {
  return getPlacementPoints(position, mode) + getKillPoints(kills);
}

const KILL_POINTS_PER_KILL = 5;

const POSITION_LABEL: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd", 4: "4th", 5: "5th" };
const POSITION_EMOJI: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉", 4: "4th", 5: "5th" };

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
  return new Date(iso.replace(" ", "T")).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

type Team = {
  registrationId: number;
  userId: number;
  tournamentId: number;
  teamName: string;
  captain: string;
  tournament: string;
  mode: string;
  players: number;
};

type Award = {
  id: number;
  teamName: string;
  tournament: string;
  position: number;
  kills: number;
  mode: string;
  points: number;        // total (placement + kills) stored in DB
  awardedAt: string;
};

// ── Custom Dropdown ───────────────────────────────────────
function TeamDropdown({ teams, selected, onSelect }: {
  teams: Team[];
  selected: Team | null;
  onSelect: (t: Team | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = query
    ? teams.filter(
        (t) =>
          t.teamName.toLowerCase().includes(query.toLowerCase()) ||
          t.tournament.toLowerCase().includes(query.toLowerCase()),
      )
    : teams;

  return (
    <div ref={ref} className="relative">
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

      {open && (
        <div className="absolute z-50 top-full mt-1 w-full bg-[#0f0f0f] border border-gray-700 rounded-lg overflow-hidden shadow-xl shadow-black/60">
          <div className="px-3 py-2 border-b border-gray-800">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search teams..."
              className="w-full bg-transparent text-xs text-white placeholder-gray-600 outline-none"
            />
          </div>
          {filtered.length === 0 ? (
            <p className="text-gray-600 text-xs px-4 py-3 tracking-widest">No teams found</p>
          ) : (
            <ul className="max-h-52 overflow-y-auto">
              {filtered.map((t) => (
                <li
                  key={t.registrationId}
                  onClick={() => { onSelect(t); setOpen(false); setQuery(""); }}
                  className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors duration-100 hover:bg-[#F2AA00]/10 ${selected?.registrationId === t.registrationId ? "bg-[#F2AA00]/5 text-[#F2AA00]" : "text-gray-300"}`}
                >
                  <div>
                    <p className="text-sm font-medium">{t.teamName}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {t.tournament} · {t.mode} · {t.players}P
                    </p>
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
  // kills is required by backend: totalPoints = placementPoints + kills * 5
  const [kills, setKills]               = useState(0);
  const [customPos, setCustomPos]       = useState(false);
  const [manualPos, setManualPos]       = useState(6);
  const [saving, setSaving]             = useState(false);
  const [err, setErr]                   = useState("");

  const valid = selectedTeam !== null && kills >= 0;

  const effectivePos    = customPos ? manualPos : position;
  const mode            = selectedTeam?.mode ?? "solo";
  const placementPts    = getPlacementPoints(effectivePos, mode);
  const killPts         = getKillPoints(kills);
  const totalPts        = calculateMatchPoints(effectivePos, kills, mode);

  useEffect(() => {
    fetch("/api/admin/winning-points/teams", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
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
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        // Backend requires: registrationId, position, kills
        // Points are computed server-side: getPlacementPoints(position, mode) + kills * 5
        body: JSON.stringify({
          registrationId: selectedTeam.registrationId,
          position: effectivePos,
          kills,
        }),
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="bg-[#0e0e0e] border border-gray-800 rounded-xl w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faTrophy} className="text-[#F2AA00] text-sm" />
            <p className="text-lg tracking-wide text-white">Award Winning Points</p>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {err && (
            <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {err}
            </p>
          )}

          {/* Team selector */}
          <div>
            <p className="text-[11px] text-gray-600 tracking-widest uppercase mb-1.5">Select Team</p>
            {loadingTeams ? (
              <div className="flex items-center gap-2 bg-black border border-gray-800 rounded-lg px-4 py-3 text-xs text-gray-600">
                <FontAwesomeIcon icon={faSpinner} className="animate-spin w-3 h-3" />
                Loading teams...
              </div>
            ) : (
              <TeamDropdown teams={teams} selected={selectedTeam} onSelect={setSelectedTeam} />
            )}

            {selectedTeam && (
              <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-black border border-gray-800 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-[#F2AA00]/20 flex items-center justify-center text-[10px] text-[#F2AA00]">
                  {selectedTeam.captain?.[0] ?? "?"}
                </div>
                <p className="text-[13px] text-gray-400">
                  Captain: <span className="text-white">{selectedTeam.captain}</span>
                  &nbsp;·&nbsp;
                  <span className="capitalize">{selectedTeam.mode ?? "—"}</span>
                  &nbsp;·&nbsp;{selectedTeam.players}P
                </p>
              </div>
            )}
          </div>

          {/* Position */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[11px] text-gray-600 tracking-widest uppercase">Finishing Position</p>
              <button
                onClick={() => { setCustomPos((c) => !c); }}
                className="text-[10px] text-gray-700 hover:text-[#F2AA00] transition-colors tracking-widest"
              >
                {customPos ? "← presets" : "custom +"}
              </button>
            </div>
            {customPos ? (
              <div className="flex items-center gap-3 bg-black border border-gray-800 rounded-xl px-4 py-3">
                <span className="text-gray-600 text-xs tracking-widest">Position #</span>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={manualPos}
                  onChange={(e) => setManualPos(Math.max(1, Number(e.target.value)))}
                  className="w-16 bg-transparent text-white font-mono text-xl outline-none border-b border-[#F2AA00]/30 focus:border-[#F2AA00] text-center"
                />
                <span className="text-gray-600 text-xs ml-auto">
                  = <span className="text-gray-300 font-mono">{getPlacementPoints(manualPos, selectedTeam?.mode ?? "solo")} placement pts</span>
                </span>
              </div>
            ) : (
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPosition(p)}
                    className={`flex-1 py-2 text-sm rounded-lg border transition-all duration-150 ${
                      position === p
                        ? positionColor[p]
                        : "border-gray-800 text-gray-600 hover:border-gray-700"
                    }`}
                  >
                    <div>{POSITION_EMOJI[p]}</div>
                    <div className="text-[11px] mt-0.5">{POSITION_LABEL[p]}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Kills input — required by backend */}
          <div>
            <p className="text-[11px] text-gray-600 tracking-widest uppercase mb-1.5">
              Kill Count
              <span className="ml-1 text-gray-700 normal-case tracking-normal">(+{KILL_POINTS_PER_KILL} pts each)</span>
            </p>
            <div className="flex items-center bg-black border border-gray-800 rounded-xl overflow-hidden">
              <button
                onClick={() => setKills((k) => Math.max(0, k - 1))}
                className="px-4 py-3 text-gray-500 hover:text-white hover:bg-gray-900 transition-colors text-lg font-light select-none"
              >
                −
              </button>
              <div className="flex-1 flex items-center justify-center gap-2 py-3">
                <FontAwesomeIcon icon={faSkull} className="text-gray-600 text-xs" />
                <input
                  type="number"
                  min={0}
                  value={kills}
                  onChange={(e) => setKills(Math.max(0, Number(e.target.value)))}
                  className="w-14 bg-transparent text-white font-mono text-xl text-center outline-none"
                />
                <span className="text-gray-600 text-xs">kills</span>
              </div>
              <button
                onClick={() => setKills((k) => k + 1)}
                className="px-4 py-3 text-gray-500 hover:text-white hover:bg-gray-900 transition-colors text-lg font-light select-none"
              >
                +
              </button>
            </div>
          </div>

          {/* Points preview — exact values mirrored from lib/points.ts */}
          <div className="bg-black border border-gray-800 rounded-xl px-4 py-3 space-y-1.5">
            <p className="text-[10px] text-gray-600 tracking-widest uppercase mb-2">Points Breakdown</p>
            <div className="flex justify-between text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <FontAwesomeIcon icon={faStar} className="text-[#F2AA00]/50 text-[9px]" />
                Placement ({POSITION_LABEL[effectivePos] ?? `#${effectivePos}`}
                {selectedTeam && <span className="text-gray-600 ml-1 capitalize">· {mode}</span>})
              </span>
              <span className="text-gray-300 font-mono">+{placementPts}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <FontAwesomeIcon icon={faSkull} className="text-gray-600 text-[9px]" />
                Kill points ({kills} × {KILL_POINTS_PER_KILL})
              </span>
              <span className="text-gray-300 font-mono">+{killPts}</span>
            </div>
            <div className="border-t border-gray-800 pt-1.5 flex justify-between items-center">
              <span className="text-[10px] text-gray-600 tracking-widest uppercase">Total</span>
              <span className="text-[#F2AA00] font-mono text-lg">+{totalPts} pts</span>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={!valid || saving}
            className={`w-full py-3 text-sm tracking-widest rounded-lg border transition-all duration-150 active:scale-[0.97] flex items-center justify-center gap-2 ${
              valid && !saving
                ? "bg-[#F2AA00] text-black border-[#F2AA00] hover:bg-[#e09e00]"
                : "bg-gray-900 text-gray-600 border-gray-800 cursor-not-allowed"
            }`}
          >
            {saving && <FontAwesomeIcon icon={faSpinner} className="animate-spin w-3 h-3" />}
            Award {totalPts} Points
          </button>
        </div>
      </div>
    </div>
  );
}

// ── EDIT POINTS MODAL ────────────────────────────────────
function EditPointsModal({ award, onClose, onSave }: {
  award: Award;
  onClose: () => void;
  onSave: () => void;
}) {
  const mode                          = award.mode ?? "solo";
  const [position, setPosition]       = useState(Number(award.position));
  const [kills, setKills]             = useState(award.kills ?? 0);
  const [customPos, setCustomPos]     = useState(Number(award.position) > 5);
  const [manualPos, setManualPos]     = useState(Number(award.position) > 5 ? Number(award.position) : 6);
  const [saving, setSaving]           = useState(false);
  const [err, setErr]                 = useState("");

  const effectivePos = customPos ? manualPos : position;
  const placementPts = getPlacementPoints(effectivePos, mode);
  const killPts      = getKillPoints(kills);
  const totalPts     = calculateMatchPoints(effectivePos, kills, mode);

  const handleSave = async () => {
    setSaving(true);
    setErr("");
    try {
      const res = await fetch(`/api/admin/winning-points/${award.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ position: effectivePos, kills }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update");
      onSave();
    } catch (e: any) {
      setErr(e.message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="bg-[#0e0e0e] border border-gray-800 rounded-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faPencil} className="text-[#F2AA00] text-sm" />
            <p className="text-base tracking-wide text-white">Edit Award</p>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {err && (
            <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{err}</p>
          )}

          {/* Team info (read-only) */}
          <div className="flex items-center gap-3 px-3 py-2.5 bg-black border border-gray-800 rounded-lg">
            <div className="w-7 h-7 rounded-lg bg-[#F2AA00]/10 flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon icon={faUsers} className="text-[#F2AA00] text-[9px]" />
            </div>
            <div>
              <p className="text-sm text-white">{award.teamName}</p>
              <p className="text-[10px] text-gray-600 mt-0.5">{award.tournament} · <span className="capitalize">{mode}</span></p>
            </div>
          </div>

          {/* Position */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[11px] text-gray-600 tracking-widest uppercase">Finishing Position</p>
              <button
                onClick={() => setCustomPos((c) => !c)}
                className="text-[10px] text-gray-700 hover:text-[#F2AA00] transition-colors tracking-widest"
              >
                {customPos ? "← presets" : "custom +"}
              </button>
            </div>
            {customPos ? (
              <div className="flex items-center gap-3 bg-black border border-gray-800 rounded-xl px-4 py-3">
                <span className="text-gray-600 text-xs tracking-widest">Position #</span>
                <input
                  type="number" min={1} max={99} value={manualPos}
                  onChange={(e) => setManualPos(Math.max(1, Number(e.target.value)))}
                  className="w-16 bg-transparent text-white font-mono text-xl outline-none border-b border-[#F2AA00]/30 focus:border-[#F2AA00] text-center"
                />
                <span className="text-gray-600 text-xs ml-auto">
                  = <span className="text-gray-300 font-mono">{getPlacementPoints(manualPos, mode)} pts</span>
                </span>
              </div>
            ) : (
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPosition(p)}
                    className={`flex-1 py-2 text-sm rounded-lg border transition-all duration-150 ${position === p ? positionColor[p] : "border-gray-800 text-gray-600 hover:border-gray-700"}`}
                  >
                    <div>{POSITION_EMOJI[p]}</div>
                    <div className="text-[11px] mt-0.5">{POSITION_LABEL[p]}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Kills */}
          <div>
            <p className="text-[11px] text-gray-600 tracking-widest uppercase mb-1.5">
              Kill Count <span className="ml-1 text-gray-700 normal-case tracking-normal">(+{KILL_POINTS_PER_KILL} pts each)</span>
            </p>
            <div className="flex items-center bg-black border border-gray-800 rounded-xl overflow-hidden">
              <button
                onClick={() => setKills((k) => Math.max(0, k - 1))}
                className="px-4 py-3 text-gray-500 hover:text-white hover:bg-gray-900 transition-colors text-lg font-light select-none"
              >−</button>
              <div className="flex-1 flex items-center justify-center gap-2 py-3">
                <FontAwesomeIcon icon={faSkull} className="text-gray-600 text-xs" />
                <input
                  type="number" min={0} value={kills}
                  onChange={(e) => setKills(Math.max(0, Number(e.target.value)))}
                  className="w-14 bg-transparent text-white font-mono text-xl text-center outline-none"
                />
                <span className="text-gray-600 text-xs">kills</span>
              </div>
              <button
                onClick={() => setKills((k) => k + 1)}
                className="px-4 py-3 text-gray-500 hover:text-white hover:bg-gray-900 transition-colors text-lg font-light select-none"
              >+</button>
            </div>
          </div>

          {/* Breakdown */}
          <div className="bg-black border border-gray-800 rounded-xl px-4 py-3 space-y-1.5">
            <p className="text-[10px] text-gray-600 tracking-widest uppercase mb-2">Updated Breakdown</p>
            <div className="flex justify-between text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <FontAwesomeIcon icon={faStar} className="text-[#F2AA00]/50 text-[9px]" />
                Placement ({POSITION_LABEL[effectivePos] ?? `#${effectivePos}`} · <span className="capitalize ml-0.5">{mode}</span>)
              </span>
              <span className="text-gray-300 font-mono">+{placementPts}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <FontAwesomeIcon icon={faSkull} className="text-gray-600 text-[9px]" />
                Kill points ({kills} × {KILL_POINTS_PER_KILL})
              </span>
              <span className="text-gray-300 font-mono">+{killPts}</span>
            </div>
            <div className="border-t border-gray-800 pt-1.5 flex justify-between items-center">
              <span className="text-[10px] text-gray-600 tracking-widest uppercase">New Total</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-600 font-mono text-sm line-through">+{award.points}</span>
                <span className="text-[#F2AA00] font-mono text-lg">+{totalPts} pts</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full py-3 text-sm tracking-widest rounded-lg border transition-all duration-150 active:scale-[0.97] flex items-center justify-center gap-2 ${
              !saving ? "bg-[#F2AA00] text-black border-[#F2AA00] hover:bg-[#e09e00]" : "bg-gray-900 text-gray-600 border-gray-800 cursor-not-allowed"
            }`}
          >
            {saving && <FontAwesomeIcon icon={faSpinner} className="animate-spin w-3 h-3" />}
            Save Changes · {totalPts} pts
          </button>
        </div>
      </div>
    </div>
  );
}

// ── DELETE CONFIRM MODAL ──────────────────────────────────
function DeleteConfirmModal({ award, onClose, onDeleted }: {
  award: Award;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [err, setErr]           = useState("");

  const handleDelete = async () => {
    setDeleting(true);
    setErr("");
    try {
      const res = await fetch(`/api/admin/winning-points/${award.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to delete");
      onDeleted();
    } catch (e: any) {
      setErr(e.message);
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="bg-[#0e0e0e] border border-gray-800 rounded-xl w-full max-w-xs" onClick={(e) => e.stopPropagation()}>

        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faTriangleExclamation} className="text-red-400 text-sm" />
            <p className="text-base tracking-wide text-white">Delete Award</p>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {err && (
            <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{err}</p>
          )}

          <div className="bg-red-500/5 border border-red-500/15 rounded-lg px-4 py-3 space-y-1">
            <p className="text-white text-sm">{award.teamName}</p>
            <p className="text-gray-500 text-xs">{award.tournament}</p>
            <p className="text-red-400 font-mono text-sm mt-1">−{award.points} pts will be deducted</p>
          </div>

          <p className="text-gray-500 text-xs leading-relaxed">
            This will permanently delete this award and deduct <span className="text-white font-mono">{award.points} pts</span> from the team's wallet. This action cannot be undone.
          </p>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 text-xs tracking-widest rounded-lg border border-gray-800 text-gray-400 hover:bg-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 py-2.5 text-xs tracking-widest rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleting
                ? <FontAwesomeIcon icon={faSpinner} className="animate-spin w-3 h-3" />
                : <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
              }
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MAIN ─────────────────────────────────────────────────
export default function AdminWinningPoints() {
  const [awards, setAwards]               = useState<Award[]>([]);
  const [summary, setSummary]             = useState({ totalPoints: 0, totalAwards: 0 });
  const [tournamentList, setTournamentList] = useState<string[]>([]);
  const [loading, setLoading]             = useState(true);
  const [apiErr, setApiErr]               = useState("");
  const [showModal, setShowModal]         = useState(false);
  const [editAward, setEditAward]         = useState<Award | null>(null);
  const [deleteAward, setDeleteAward]     = useState<Award | null>(null);
  const [search, setSearch]               = useState("");
  const [filter, setFilter]               = useState("All");
  const [visible, setVisible]             = useState(false);
  const [toast, setToast]                 = useState({ msg: "", show: false });

  const pop = (msg: string) => {
    setToast({ msg, show: true });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 2500);
  };

  const fetchAwards = useCallback(async () => {
    setLoading(true);
    setApiErr("");
    try {
      const params = new URLSearchParams({ search, tournament: filter });
      const res = await fetch(`/api/admin/winning-points?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
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

      {/* Toast */}
      <div
        className={`fixed bottom-6 right-6 z-50 bg-[#F2AA00] text-black text-xs px-5 py-3 rounded-lg shadow-lg shadow-[#F2AA00]/20 tracking-widest transition-all duration-500 ${
          toast.show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none"
        }`}
      >
        {toast.msg}
      </div>

      {showModal && <AddPointsModal onClose={() => setShowModal(false)} onSave={handleSaved} />}
      {editAward && (
        <EditPointsModal
          award={editAward}
          onClose={() => setEditAward(null)}
          onSave={() => { setEditAward(null); fetchAwards(); pop("Award updated successfully!"); }}
        />
      )}
      {deleteAward && (
        <DeleteConfirmModal
          award={deleteAward}
          onClose={() => setDeleteAward(null)}
          onDeleted={() => { setDeleteAward(null); fetchAwards(); pop("Award deleted."); }}
        />
      )}

      <div className="max-w-7xl mx-auto space-y-5">

        {/* HEADER */}
        <div
          className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-500 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"
          }`}
        >
          <div>
            <h1 className="text-xl tracking-widest text-white">Winning Points</h1>
            <p className="text-gray-600 text-xs mt-1 tracking-wide">
              Award placement + kill points — auto-added to team wallet
            </p>
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
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-xs">
            {apiErr}
          </div>
        )}

        {/* SUMMARY */}
        <div
          className={`grid grid-cols-3 gap-3 transition-all duration-500 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ transitionDelay: "80ms" }}
        >
          {[
            { label: "Total Awarded",  value: `${summary.totalPoints} pts`, color: "text-[#F2AA00]" },
            { label: "Awards Given",   value: summary.totalAwards,          color: "text-white"     },
            { label: "Tournaments",    value: tournamentList.length,        color: "text-gray-300"  },
          ].map((s, i) => (
            <div
              key={i}
              className="bg-[#0b0b0b] border border-gray-800 rounded-xl px-4 py-3 hover:border-gray-700 transition-colors duration-200"
            >
              <p className="text-gray-600 text-[9px] tracking-widest uppercase">{s.label}</p>
              <p className={`text-xl font-mono mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* FILTERS */}
        <div
          className={`flex gap-3 flex-col sm:flex-row transition-all duration-500 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
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
              placeholder="Search team or tournament..."
              className="w-full bg-[#0b0b0b] border border-gray-800 focus:border-[#F2AA00]/40 rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none"
            />
          </div>
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="appearance-none bg-[#0b0b0b] border border-gray-800 rounded-lg px-4 py-2.5 pr-8 text-xs text-gray-400 outline-none cursor-pointer"
            >
              {tournaments.map((t) => (
                <option key={t} style={{ background: "#0b0b0b", color: "#ccc" }}>
                  {t}
                </option>
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
          className={`bg-[#0b0b0b] border border-gray-800 rounded-xl overflow-hidden transition-all duration-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
          style={{ transitionDelay: "240ms" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead>
                <tr className="border-b border-gray-800 bg-[#0f0f0f]">
                  {["Team", "Tournament", "Position", "Placement Pts", "Kill Pts", "Total", "When", "Actions"].map((h) => (
                    <th
                      key={h}
                      className="text-[11px] text-gray-600 tracking-widest uppercase px-4 py-3 text-left"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-14">
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin text-gray-600 w-5 h-5" />
                    </td>
                  </tr>
                ) : awards.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-14 text-gray-700 text-xs tracking-widest">
                      No awards yet.
                    </td>
                  </tr>
                ) : (
                  awards.map((a) => {
                    const pos          = Number(a.position);
                    const mode         = a.mode ?? "solo";
                    const kills        = a.kills ?? 0;
                    const placementPts = getPlacementPoints(pos, mode);
                    const killPts      = getKillPoints(kills);
                    return (
                      <tr
                        key={a.id}
                        className="border-b border-gray-800/50 last:border-0 hover:bg-[#111] group transition-colors duration-150"
                      >
                        {/* Team */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-[#F2AA00]/10 flex items-center justify-center flex-shrink-0">
                              <FontAwesomeIcon
                                icon={pos <= 2 ? faUsers : faUser}
                                className="text-[#F2AA00] text-[9px]"
                              />
                            </div>
                            <p className="text-sm text-white group-hover:text-[#F2AA00] transition-colors duration-200">
                              {a.teamName}
                            </p>
                          </div>
                        </td>

                        {/* Tournament */}
                        <td className="px-4 py-3.5 text-sm text-gray-400 max-w-[140px] truncate">
                          {a.tournament}
                        </td>

                        {/* Position */}
                        <td className="px-4 py-3.5">
                          <span
                            className={`text-[13px] px-2.5 py-1 rounded-md border flex items-center gap-1.5 w-fit ${
                              positionColor[pos] ?? "border-gray-700 text-gray-500"
                            }`}
                          >
                            {POSITION_EMOJI[pos] ?? `#${pos}`}&nbsp;{POSITION_LABEL[pos] ?? `#${pos}`}
                          </span>
                        </td>

                        {/* Placement pts */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <FontAwesomeIcon icon={faStar} className="text-[#F2AA00]/40 text-[9px]" />
                            <span className="text-gray-300 font-mono text-sm">+{placementPts}</span>
                            <span className="text-gray-700 text-[10px] capitalize">{mode}</span>
                          </div>
                        </td>

                        {/* Kill pts */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <FontAwesomeIcon icon={faSkull} className="text-gray-600 text-[9px]" />
                            <span className="text-gray-300 font-mono text-sm">+{killPts}</span>
                            <span className="text-gray-700 text-[10px]">{kills}×5</span>
                          </div>
                        </td>

                        {/* Total */}
                        <td className="px-4 py-3.5">
                          <span className="text-[#F2AA00] font-mono text-base font-semibold">+{a.points}</span>
                          <span className="text-gray-600 text-[11px] ml-1">pts</span>
                        </td>

                        {/* When */}
                        <td className="px-4 py-3.5 text-[13px] text-gray-500 whitespace-nowrap">
                          {relativeTime(a.awardedAt)}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setEditAward(a)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-800 text-gray-500 hover:border-[#F2AA00]/40 hover:text-[#F2AA00] transition-all duration-150"
                              title="Edit award"
                            >
                              <FontAwesomeIcon icon={faPencil} className="text-[10px]" />
                            </button>
                            <button
                              onClick={() => setDeleteAward(a)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-800 text-gray-500 hover:border-red-500/30 hover:text-red-400 transition-all duration-150"
                              title="Delete award"
                            >
                              <FontAwesomeIcon icon={faTrash} className="text-[10px]" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-800">
            <p className="text-[10px] text-gray-700 tracking-wide">
              Showing {awards.length} of {summary.totalAwards} awards
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}