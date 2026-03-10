"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

function getActionButton(status: string) {
  switch (status) {
    case "Open":    return { text: "Join Now",  cls: "bg-[#F2AA00] text-black hover:bg-[#e09e00] hover:shadow-md hover:shadow-[#F2AA00]/20 active:scale-95", disabled: false };
    case "Full":    return { text: "Full",      cls: "bg-red-500/10 text-red-400 border border-red-500/20 cursor-not-allowed", disabled: true };
    case "Closed":  return { text: "Closed",    cls: "bg-gray-800/60 text-gray-500 border border-gray-700 cursor-not-allowed", disabled: true };
    case "Live":    return { text: "Live",      cls: "bg-[#F2AA00]/10 text-[#F2AA00] border border-[#F2AA00]/30 cursor-not-allowed", disabled: true };
    default:        return { text: "View",      cls: "border border-gray-700 text-gray-300", disabled: false };
  }
}

function TournamentsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize mode filter from URL param (?mode=solo etc.)
  const urlMode = searchParams.get("mode") ?? "All";

  const [filter, setFilter]           = useState(urlMode);
  const [modeFilter, setModeFilter]   = useState(
    ["solo","duo","squad","tdm"].includes(urlMode.toLowerCase()) ? urlMode.toLowerCase() : "all"
  );
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [visible, setVisible]         = useState(false);
  const [animatedBars, setAnimatedBars] = useState(false);

  useEffect(() => { setTimeout(() => setVisible(true), 60); }, []);

  const fetchTournaments = useCallback(async () => {
    setLoading(true);
    setAnimatedBars(false);
    try {
      const params = new URLSearchParams();
      if (modeFilter !== "all") params.set("mode", modeFilter);
      if (filter !== "All") params.set("date", filter);
      const res = await fetch(`/api/tournaments?${params}`);
      const data = await res.json();
      setTournaments(data.tournaments ?? []);
    } catch (e) {
      setTournaments([]);
    } finally {
      setLoading(false);
      setTimeout(() => setAnimatedBars(true), 200);
    }
  }, [modeFilter, filter]);

  useEffect(() => { fetchTournaments(); }, [fetchTournaments]);

  const handleModeFilter = (m: string) => {
    setModeFilter(m);
    // update URL without navigation
    const newParams = new URLSearchParams(searchParams.toString());
    if (m === "all") newParams.delete("mode"); else newParams.set("mode", m);
    window.history.replaceState(null, "", `?${newParams.toString()}`);
  };


  const MODE_FILTERS = [
    { key: "all",   label: "All Modes" },
    { key: "solo",  label: "Solo"      },
    { key: "duo",   label: "Duo"       },
    { key: "squad", label: "Squad"     },
    { key: "tdm",   label: "TDM"       },
  ];

  return (
    <div className="bg-black min-h-screen text-white overflow-x-hidden">

      {/* HEADER */}
      <div className="relative bg-[#F2AA00] text-black py-16 text-center overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)", backgroundSize: "12px 12px" }}
        />
        <div className="relative z-10">
          <h1 className={`text-3xl tracking-widest italic transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
            Tournaments
          </h1>
          <p className={`text-sm mt-1 tracking-widest transition-all duration-700 delay-100 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
            Browse and join upcoming matches
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* MODE FILTER PILLS */}
        <div className={`flex flex-wrap gap-2 mb-3 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          {MODE_FILTERS.map((m, i) => (
            <button
              key={m.key}
              onClick={() => handleModeFilter(m.key)}
              className={`px-4 py-1.5 text-xs tracking-wider border rounded-lg transition-all duration-200 ${modeFilter === m.key ? "bg-[#F2AA00] text-black border-[#F2AA00] shadow-md shadow-[#F2AA00]/20" : "border-gray-800 text-gray-400 hover:border-gray-600 hover:text-white"}`}
              style={{ transitionDelay: `${i * 40}ms` }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* TABLE */}
        <div className={`rounded-xl border border-gray-800 overflow-hidden bg-[#0b0b0b] transition-all duration-600 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`} style={{ transitionDelay: "250ms" }}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-800 bg-[#0f0f0f]">
                  {["Tournament", "Date", "Time", "Platform", "Mode", "Fee", "Slots", "Action"].map((h) => (
                    <th key={h} className="text-center text-xs text-gray-500 uppercase tracking-widest px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16">
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin text-[#F2AA00] w-5 h-5" />
                    </td>
                  </tr>
                ) : tournaments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-gray-600 text-sm tracking-widest">No tournaments found.</td>
                  </tr>
                ) : (
                  tournaments.map((t, idx) => {
                    const action  = getActionButton(t.status);
                    const percent = t.slots > 0 ? Math.round((t.filled / t.slots) * 100) : 0;
                    return (
                      <tr
                        key={t.id}
                        className={`border-b border-gray-800/60 last:border-0 hover:bg-[#111] group text-center transition-all duration-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                        style={{ transitionDelay: `${300 + idx * 70}ms` }}
                      >
                        {/* NAME */}
                        <td className="px-5 py-4 text-left">
                          <p
                            className="text-lg tracking-widest group-hover:text-[#F2AA00] transition-colors duration-200 cursor-pointer"
                            onClick={() => router.push(`/tournaments/${t.id}`)}
                          >
                            {t.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-0.5 tracking-wider">{t.map}</p>
                        </td>

                        {/* DATE */}
                        <td className="px-5 py-4 text-md text-gray-400 tracking-wide whitespace-nowrap">{t.dateLabel}</td>

                        {/* TIME */}
                        <td className="px-5 py-4 text-md text-gray-400 font-mono whitespace-nowrap">
                          {/* ✅ FIX: API returns "6:00 PM" - just display it with IST suffix */}
                          {t.timeLabel} IST
                        </td>

                        {/* PLATFORM */}
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="text-md text-gray-400 tracking-wide">{t.platform === "BGMI" ? "BGMI" : "PUBG"}</span>
                          </div>
                        </td>

                        {/* MODE */}
                        <td className="px-5 py-4">
                          <span className="text-md px-2.5 py-1 rounded-md bg-[#F2AA00]/10 text-[#F2AA00] border border-[#F2AA00]/10 tracking-wide">
                            {t.mode}
                          </span>
                        </td>

                        {/* FEE */}
                        <td className="px-5 py-4 text-md text-gray-400 tracking-wide">{t.fee}</td>

                        {/* SLOTS */}
                        <td className="px-5 py-4">
                          <div className="flex flex-col items-center gap-1">
                            <div className="flex justify-between w-20 text-[13px] text-gray-500">
                              <span>{t.filled}</span>
                              <span>{t.slots}</span>
                            </div>
                            <div className="w-20 bg-gray-800 rounded-full h-[4px] overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-700 ${percent === 100 ? "bg-red-500" : "bg-[#F2AA00]"}`}
                                style={{ width: animatedBars ? `${percent}%` : "0%" }}
                              />
                            </div>
                            <span className="text-[12px] text-gray-600">{percent}%</span>
                          </div>
                        </td>

                        {/* ACTION */}
                        <td className="px-5 py-4">
                          <div className="flex flex-col items-center gap-1.5">
                            <button
                              disabled={action.disabled}
                              onClick={() => !action.disabled && router.push(`/tournaments/${t.id}/register`)}
                              className={`text-sm px-4 py-2 rounded-lg tracking-widest transition-all duration-150 ${action.cls}`}
                            >
                              {action.text}
                            </button>
                            {/* ✅ FIX: Show note for Live tournaments */}
                            {t.status === "Live" && (
                              <p className="text-[9px] text-gray-500 mt-1 tracking-widest text-center max-w-[140px] leading-tight">
                                See <span className="text-[#F2AA00]">My Matches</span> for Room ID & Password
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className={`text-sm text-gray-700 mt-3 tracking-wider transition-all duration-500 ${visible ? "opacity-100" : "opacity-0"}`} style={{ transitionDelay: "500ms" }}>
          Showing {tournaments.length} tournament{tournaments.length !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}

export default function TournamentsPage() {
  return (
    <Suspense>
      <TournamentsContent />
    </Suspense>
  );
}