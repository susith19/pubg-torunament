"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner, faTrophy, faCalendar, faGamepad,
  faUsers, faKey, faLock, faCopy, faCheck,
  faChevronDown, faChevronUp, faCircleDot,
  faHourglassHalf, faXmarkCircle, faArrowRight,
} from "@fortawesome/free-solid-svg-icons";

// ── COUNTDOWN ─────────────────────────────────────────────
function useCountdown(isoDate: string | null) {
  const calc = () => {
    if (!isoDate) return null;
    const diff = new Date(isoDate).getTime() - Date.now();
    if (diff <= 0) return { started: true, d: 0, h: 0, m: 0, s: 0 };
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { started: false, d, h, m, s };
  };
  const [tick, setTick] = useState(calc);
  useEffect(() => {
    if (!isoDate) return;
    const t = setInterval(() => setTick(calc()), 1000);
    return () => clearInterval(t);
  }, [isoDate]);
  return tick;
}

// ── COUNTDOWN DISPLAY ─────────────────────────────────────
function Countdown({ isoDate }: { isoDate: string | null }) {
  const t = useCountdown(isoDate);
  if (!t) return <span className="text-gray-700 text-xs">TBA</span>;
  if (t.started) return (
    <span className="text-[#F2AA00] text-xs tracking-widest animate-pulse">STARTED</span>
  );
  return (
    <div className="flex items-center gap-1.5">
      {[
        { v: t.d, l: "d" },
        { v: t.h, l: "h" },
        { v: t.m, l: "m" },
        { v: t.s, l: "s" },
      ].map(({ v, l }) => (
        <div key={l} className="flex flex-col items-center">
          <span className="bg-[#F2AA00]/10 border border-[#F2AA00]/20 text-[#F2AA00] font-mono text-xs px-2 py-0.5 rounded-md min-w-[2rem] text-center">
            {String(v).padStart(2, "0")}
          </span>
          <span className="text-[8px] text-gray-700 mt-0.5 tracking-widest">{l}</span>
        </div>
      ))}
    </div>
  );
}

// ── STATUS BADGES ─────────────────────────────────────────
const regStatusStyle: Record<string, string> = {
  approved: "bg-green-500/10 text-green-400 border-green-500/20",
  pending:  "bg-[#F2AA00]/10 text-[#F2AA00] border-[#F2AA00]/20",
  rejected: "bg-red-500/10 text-red-400 border-red-500/20",
};
const regStatusIcon: Record<string, any> = {
  approved: faCircleDot,
  pending:  faHourglassHalf,
  rejected: faXmarkCircle,
};
const tStatusStyle: Record<string, string> = {
  Open:   "text-green-400 border-green-500/20 bg-green-500/10",
  Live:   "text-[#F2AA00] border-[#F2AA00]/20 bg-[#F2AA00]/10",
  Full:   "text-red-400 border-red-500/20 bg-red-500/10",
  Closed: "text-gray-500 border-gray-700 bg-gray-800/30",
};

const MAP_IMAGES: Record<string, string> = {
  erangel: "/Erangle.jpg",
  miramar: "/miramar.jpg",
  sanhok:  "/Sanhok.jpg",
  vikendi: "/Vikendi.jpg",
};
const MAP_GRADIENTS: Record<string, string> = {
  erangel: "from-green-900/60",
  miramar: "from-yellow-900/60",
  sanhok:  "from-emerald-900/60",
  vikendi: "from-blue-900/60",
};

// ── ROOM REVEAL ────────────────────────────────────────────
function RoomReveal({ room }: { room: { id: string; pass: string } | null }) {
  const [copiedId,   setCopiedId]   = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  const copy = (text: string, which: "id" | "pass") => {
    navigator.clipboard?.writeText(text).catch(() => {});
    if (which === "id")   { setCopiedId(true);   setTimeout(() => setCopiedId(false),   1800); }
    if (which === "pass") { setCopiedPass(true);  setTimeout(() => setCopiedPass(false), 1800); }
  };

  if (!room) return (
    <div className="flex items-center gap-2 bg-black/40 border border-gray-800 rounded-xl px-4 py-3">
      <FontAwesomeIcon icon={faLock} className="text-gray-600 text-sm flex-shrink-0" />
      <div>
        <p className="text-xs text-gray-500 tracking-wide">Room details locked</p>
        <p className="text-[10px] text-gray-700 mt-0.5">Revealed once admin approves your slot</p>
      </div>
    </div>
  );

  return (
    <div className="bg-[#F2AA00]/5 border border-[#F2AA00]/20 rounded-xl px-4 py-3.5 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <FontAwesomeIcon icon={faKey} className="text-[#F2AA00] text-sm" />
        <p className="text-[10px] text-[#F2AA00] tracking-widest uppercase">Room Info</p>
      </div>
      {[
        { label: "Room ID",   val: room.id,   which: "id"   as const, copied: copiedId   },
        { label: "Password",  val: room.pass, which: "pass" as const, copied: copiedPass },
      ].map(({ label, val, which, copied }) => (
        <div key={label} className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[9px] text-gray-600 tracking-widest uppercase mb-0.5">{label}</p>
            <p className="text-sm text-white font-mono tracking-widest">{val || "—"}</p>
          </div>
          {val && (
            <button
              onClick={() => copy(val, which)}
              className={`flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg border transition-all duration-150 ${copied ? "border-[#F2AA00]/50 bg-[#F2AA00]/10 text-[#F2AA00]" : "border-gray-700 text-gray-500 hover:border-gray-600 hover:text-white"}`}
            >
              <FontAwesomeIcon icon={copied ? faCheck : faCopy} className="text-[8px]" />
              {copied ? "Copied!" : "Copy"}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// ── MATCH CARD ─────────────────────────────────────────────
function MatchCard({ m, index }: { m: any; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const t        = m.tournament;
  const mapKey   = t.map?.toLowerCase() ?? "erangel";
  const mapImg   = MAP_IMAGES[mapKey]    ?? "/miramar.jpg";
  const mapGrad  = MAP_GRADIENTS[mapKey] ?? "from-gray-900/60";
  const isLive   = t.status === "Live";
  const isApproved = m.regStatus === "approved";

  return (
    <div
      className="bg-[#0b0b0b] border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-all duration-300"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* MAP BANNER */}
      <div className="relative h-28 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={mapImg} alt={t.map} className="w-full h-full object-cover" />
        <div className={`absolute inset-0 bg-gradient-to-r ${mapGrad} to-black/80`} />

        {/* map watermark */}
        <p className="absolute bottom-2 left-4 text-white/5 text-4xl font-black uppercase tracking-widest pointer-events-none select-none">
          {t.map}
        </p>

        {/* top badges */}
        <div className="absolute top-3 left-4 flex items-center gap-2">
          <span className={`text-[10px] px-2.5 py-1 rounded-md border tracking-widest ${tStatusStyle[t.status] ?? tStatusStyle.Closed}`}>
            {isLive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#F2AA00] mr-1.5 animate-pulse" />}
            {t.status}
          </span>
          <span className={`text-[10px] px-2.5 py-1 rounded-md border flex items-center gap-1.5 ${regStatusStyle[m.regStatus] ?? regStatusStyle.pending}`}>
            <FontAwesomeIcon icon={regStatusIcon[m.regStatus] ?? faHourglassHalf} className="text-[8px]" />
            {m.regStatus.charAt(0).toUpperCase() + m.regStatus.slice(1)}
          </span>
        </div>

        {/* prize top-right */}
        <div className="absolute top-3 right-4 text-right">
          <p className="text-[9px] text-gray-500 tracking-widest">PRIZE</p>
          <p className="text-sm text-[#F2AA00] font-mono">{t.prize}</p>
        </div>

        {/* title bottom */}
        <div className="absolute bottom-3 left-4 right-4">
          <p className="text-white text-sm tracking-wide truncate">{t.name}</p>
          <p className="text-gray-400 text-[10px] mt-0.5">{t.map} · {t.mode} · {t.platform}</p>
        </div>
      </div>

      {/* BODY */}
      <div className="p-4 space-y-4">

        {/* INFO ROW */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Entry Fee", val: t.fee },
            { label: "Team",      val: m.teamName },
            { label: "Txn ID",    val: m.payment?.transactionId ?? "—" },
          ].map((r, i) => (
            <div key={i} className="bg-black border border-gray-800 rounded-lg px-3 py-2">
              <p className="text-[9px] text-gray-600 tracking-widest uppercase mb-1">{r.label}</p>
              <p className="text-[11px] text-white truncate">{r.val}</p>
            </div>
          ))}
        </div>

        {/* COUNTDOWN */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] text-gray-600 tracking-widest uppercase mb-1.5">Match Starts In</p>
            <Countdown isoDate={t.startDate} />
          </div>
          <div className="text-right">
            <p className="text-[9px] text-gray-600 tracking-widest uppercase mb-1">Scheduled</p>
            <p className="text-[11px] text-gray-400">{t.startFormatted}</p>
          </div>
        </div>

        {/* ROOM — only approved */}
        {isApproved && <RoomReveal room={m.room} />}

        {/* PENDING message */}
        {m.regStatus === "pending" && (
          <div className="flex items-start gap-2 bg-[#F2AA00]/5 border border-[#F2AA00]/10 rounded-xl px-4 py-3">
            <FontAwesomeIcon icon={faHourglassHalf} className="text-[#F2AA00]/60 text-sm flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-400">Payment under review</p>
              <p className="text-[10px] text-gray-600 mt-0.5">Admin will verify your payment and approve your slot. Room details will appear here once approved.</p>
            </div>
          </div>
        )}

        {/* REJECTED message */}
        {m.regStatus === "rejected" && (
          <div className="flex items-start gap-2 bg-red-500/5 border border-red-500/10 rounded-xl px-4 py-3">
            <FontAwesomeIcon icon={faXmarkCircle} className="text-red-400/60 text-sm flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-red-400">Registration rejected</p>
              <p className="text-[10px] text-gray-600 mt-0.5">Contact support if you believe this is a mistake.</p>
            </div>
          </div>
        )}

        {/* EXPAND — players */}
        <button
          onClick={() => setExpanded((p) => !p)}
          className="w-full flex items-center justify-between text-[10px] text-gray-600 hover:text-gray-400 transition-colors duration-150 pt-1 border-t border-gray-800/50"
        >
          <span className="tracking-widest uppercase">Players ({m.players?.length ?? 0})</span>
          <FontAwesomeIcon icon={expanded ? faChevronUp : faChevronDown} className="text-[9px]" />
        </button>

        {expanded && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            {(m.players ?? []).map((p: any, i: number) => (
              <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${p.isCaptain ? "border-[#F2AA00]/20 bg-[#F2AA00]/5" : "border-gray-800 bg-black/30"}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] flex-shrink-0 ${p.isCaptain ? "bg-[#F2AA00] text-black" : "bg-gray-800 text-gray-400"}`}>
                  {p.isCaptain ? "C" : i + 1}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-white truncate">{p.name}</p>
                  <p className="text-[9px] text-gray-600 font-mono truncate">{p.playerId}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────
export default function MyMatchesPage() {
  const router = useRouter();

  // ── AUTH GUARD ─────────────────────────────────────────────
  const [authChecked, setAuthChecked] = useState<boolean | null>(null);
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login?message=Please login to continue&redirect=/my-matches");
    } else {
      setAuthChecked(true);
    }
  }, []);

  const [matches,    setMatches]    = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState<"all" | "approved" | "pending" | "rejected">("all");
  const [visible,    setVisible]    = useState(false);

  const fetchMatches = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res   = await fetch("/api/my-matches", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        localStorage.removeItem("token");
        router.replace("/login?message=Session expired. Please login again.");
        return;
      }

      // Safely parse — body may be empty on 500
      const text = await res.text();
      if (!text) {
        console.error("[my-matches] Empty response body, status:", res.status);
        setMatches([]);
        return;
      }

      let data: any;
      try { data = JSON.parse(text); }
      catch (parseErr) {
        console.error("[my-matches] JSON parse error:", parseErr, "\nRaw:", text.slice(0, 200));
        setMatches([]);
        return;
      }

      if (!res.ok) {
        console.error("[my-matches] API error:", data?.error, data?.detail);
        setMatches([]);
        return;
      }

      setMatches(data.matches ?? []);
    } catch (e) {
      console.error("[my-matches] Fetch error:", e);
      setMatches([]);
    } finally {
      setLoading(false);
      setTimeout(() => setVisible(true), 80);
    }
  }, []);

  useEffect(() => {
    if (authChecked) fetchMatches();
  }, [authChecked]);

  const filtered = filter === "all"
    ? matches
    : matches.filter((m) => m.regStatus === filter);

  const counts = {
    all:      matches.length,
    approved: matches.filter((m) => m.regStatus === "approved").length,
    pending:  matches.filter((m) => m.regStatus === "pending").length,
    rejected: matches.filter((m) => m.regStatus === "rejected").length,
  };

  // ── GUARDS ────────────────────────────────────────────────
  if (authChecked === null) return <div className="bg-black min-h-screen" />;

  if (loading) return (
    <div className="bg-black min-h-screen flex items-center justify-center">
      <FontAwesomeIcon icon={faSpinner} className="animate-spin text-[#F2AA00] w-6 h-6" />
    </div>
  );

  return (
    <div className="bg-black min-h-screen text-white px-4 sm:px-6 py-10 relative overflow-x-hidden">
      {/* ambient */}
      <div className="pointer-events-none fixed top-0 right-0 w-[500px] h-[500px] rounded-full bg-[#F2AA00]/5 blur-[120px] -translate-y-1/3 translate-x-1/4" />
      <div className="pointer-events-none fixed bottom-0 left-0 w-[380px] h-[380px] rounded-full bg-[#F2AA00]/4 blur-[100px] translate-y-1/3 -translate-x-1/4" />

      <div className="max-w-4xl mx-auto space-y-6 relative z-10">

        {/* HEADER */}
        <div className={`transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
          <p className="text-[10px] tracking-[0.4em] text-[#F2AA00]/60 uppercase mb-1">Player</p>
          <h1 className="text-2xl tracking-wide">My Matches</h1>
          <p className="text-gray-600 text-sm mt-1">
            {counts.approved} confirmed · {counts.pending} pending · {counts.rejected} rejected
          </p>
        </div>

        {/* FILTER PILLS */}
        <div className={`flex gap-2 flex-wrap transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`} style={{ transitionDelay: "80ms" }}>
          {(["all", "approved", "pending", "rejected"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 text-xs tracking-widest rounded-lg border transition-all duration-150 ${filter === f ? "bg-[#F2AA00] text-black border-[#F2AA00]" : "border-gray-800 text-gray-500 hover:border-gray-700 hover:text-gray-300"}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span className={`ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full ${filter === f ? "bg-black/20" : "bg-gray-800"}`}>
                {counts[f]}
              </span>
            </button>
          ))}
        </div>

        {/* EMPTY */}
        {filtered.length === 0 && (
          <div className={`text-center py-20 transition-all duration-500 ${visible ? "opacity-100" : "opacity-0"}`}>
            <FontAwesomeIcon icon={faTrophy} className="text-gray-800 text-4xl mb-4" />
            <p className="text-gray-600 text-sm tracking-wide">No matches {filter !== "all" ? `with status "${filter}"` : "yet"}.</p>
            <button
              onClick={() => router.push("/tournaments")}
              className="mt-5 flex items-center gap-2 text-[#F2AA00] text-xs tracking-widest mx-auto hover:text-[#F2AA00]/70 transition-colors"
            >
              Browse Tournaments <FontAwesomeIcon icon={faArrowRight} className="text-[9px]" />
            </button>
          </div>
        )}

        {/* CARDS GRID */}
        <div className={`grid sm:grid-cols-2 gap-5 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`} style={{ transitionDelay: "160ms" }}>
          {filtered.map((m, i) => (
            <MatchCard key={m.registrationId} m={m} index={i} />
          ))}
        </div>

      </div>
    </div>
  );
}