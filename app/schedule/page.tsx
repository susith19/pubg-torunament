"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

type Match = {
  id: number;
  name: string;
  time: string;
  mode: string;
  map: string;
  status: "Open" | "Full" | "Closed" | "Live";
  slots: number;
  filled: number;
  fee: string;
  platform: string;
};

type Group = {
  date: string;
  day: string;
  matches: Match[];
};

export default function SchedulePage() {
  const router = useRouter();

  const [schedule, setSchedule]       = useState<Group[]>([]);
  const [loading, setLoading]         = useState(true);
  const [visible, setVisible]         = useState(false);
  const [animatedBars, setAnimatedBars] = useState(false);

  const fetchSchedule = useCallback(async () => {
    try {
      const res  = await fetch("/api/schedule");
      const data = await res.json();
      setSchedule(data.schedule ?? []);
    } catch (e) {
      setSchedule([]);
    } finally {
      setLoading(false);
      setTimeout(() => setAnimatedBars(true), 400);
    }
  }, []);

  useEffect(() => {
    fetchSchedule();
    setTimeout(() => setVisible(true), 60);
  }, [fetchSchedule]);

  let cardIndex = 0;

  return (
    <div className="bg-black min-h-screen text-white overflow-x-hidden">

      {/* HEADER */}
      <div className="relative bg-[#F2AA00] text-black py-16 text-center overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)",
            backgroundSize: "12px 12px",
          }}
        />
        <div className="relative z-10">
          <h1 className={`text-3xl tracking-widest italic transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
            SCHEDULE
          </h1>
          <p className={`text-sm tracking-[0.4em] mt-1 transition-all duration-700 delay-100 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
            JOIN THE BATTLE
          </p>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">

        {/* LOADING */}
        {loading && (
          <div className="flex justify-center py-20">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin text-[#F2AA00] w-6 h-6" />
          </div>
        )}

        {/* EMPTY */}
        {!loading && schedule.length === 0 && (
          <div className="text-center py-20 text-gray-700 text-sm tracking-widest">
            No tournaments scheduled yet.
          </div>
        )}

        {/* GROUPS */}
        {!loading && schedule.map((group, i) => (
          <div key={i}>

            {/* DATE HEADER */}
            <div
              className={`flex items-center gap-3 mb-4 transition-all duration-500 ${visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div className="w-2 h-5 bg-[#F2AA00] skew-x-[-20deg] flex-shrink-0" />
              <h2 className="text-lg tracking-widest uppercase">
                {group.day}
                <span className="text-gray-500 ml-2 font-normal">| {group.date}</span>
              </h2>
              <div className="flex-1 h-px bg-gray-800 ml-2" />
            </div>

            {/* MATCHES */}
            <div className="space-y-3">
              {group.matches.map((t: Match) => {
                const percent = t.slots > 0 ? Math.round((t.filled / t.slots) * 100) : 0;
                const delay   = `${100 + cardIndex * 80}ms`;
                cardIndex++;

                return (
                  <div
                    key={t.id}
                    className={`group flex flex-col sm:flex-row sm:items-center sm:justify-between bg-[#0b0b0b] border border-gray-800 rounded-xl px-5 py-4 hover:border-[#F2AA00]/50 hover:bg-[#0f0f0f] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/60 transition-all duration-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}
                    style={{ transitionDelay: delay }}
                  >

                    {/* LEFT */}
                    <div className="flex items-center gap-5 flex-1 min-w-0">

                      {/* TIME */}
                      <div className="text-md font-mono text-gray-500 w-20 flex-shrink-0 group-hover:text-[#F2AA00] transition-colors duration-200">
                        {/* ✅ FIX: API returns "6:00 PM" - no need to add IST suffix */}
                        {t.time}
                        <span className="text-gray-700 ml-1">IST</span>
                      </div>

                      <div className="w-px h-8 bg-gray-800 flex-shrink-0" />

                      {/* INFO */}
                      <div className="min-w-0">
                        <p
                          className="text-lg tracking-widest truncate group-hover:text-[#F2AA00] transition-colors duration-200 cursor-pointer"
                          onClick={() => router.push(`/tournaments/${t.id}`)}
                        >
                          {t.name}
                        </p>
                        <p className="text-sm text-gray-500 mt-0.5 truncate">
                          {t.map}&nbsp;·&nbsp;{t.mode}&nbsp;·&nbsp;
                          <span className="text-[#F2AA00]/70">{t.fee}</span>
                          &nbsp;·&nbsp;
                          <span className="text-gray-600">{t.platform}</span>
                        </p>
                      </div>
                    </div>

                    {/* RIGHT */}
                    <div className="flex items-center gap-4 mt-3 sm:mt-0 flex-shrink-0">

                      {/* PROGRESS — desktop */}
                      <div className="hidden md:block">
                        <div className="flex justify-between text-[13px] text-gray-500 mb-1">
                          <span>{t.filled} joined</span>
                          <span>{t.slots} max</span>
                        </div>
                        <div className="w-28 h-[3px] bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${percent === 100 ? "bg-red-500" : "bg-[#F2AA00]"}`}
                            style={{ width: animatedBars ? `${percent}%` : "0%" }}
                          />
                        </div>
                        <div className="text-[10px] text-gray-600 mt-1 text-right">{percent}%</div>
                      </div>

                      {/* PROGRESS — mobile */}
                      <div className="flex md:hidden items-center gap-1.5">
                        <div className="w-16 h-[3px] bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${percent === 100 ? "bg-red-500" : "bg-[#F2AA00]"}`}
                            style={{ width: animatedBars ? `${percent}%` : "0%" }}
                          />
                        </div>
                        <span className="text-[10px] text-gray-500">{t.filled}/{t.slots}</span>
                      </div>

                      {/* ACTION */}
                      <div className="flex flex-col items-center gap-1">
                        {t.status === "Open" ? (
                          <button
                            onClick={() => router.push(`/tournaments/${t.id}/register`)}
                            className="bg-[#F2AA00] text-black text-xs px-4 py-2 rounded-lg hover:bg-[#e09e00] hover:shadow-lg hover:shadow-[#F2AA00]/20 active:scale-95 transition-all duration-150 tracking-widest"
                          >
                            JOIN NOW
                          </button>
                        ) : (
                          <span className={`text-xs px-3 py-1.5 rounded-lg tracking-wide border ${
                            t.status === "Full"
                              ? "bg-red-500/10 text-red-400 border-red-500/20"
                              : t.status === "Live"
                              ? "bg-[#F2AA00]/10 text-[#F2AA00] border-[#F2AA00]/30"
                              : "bg-gray-800/60 text-gray-500 border-gray-700"
                          }`}>
                            {t.status}
                          </span>
                        )}
                        {/* ✅ FIX: Show note for Live tournaments */}
                        {t.status === "Live" && (
                          <p className="text-[9px] text-gray-500 mt-1 tracking-widest text-center max-w-[120px] leading-tight">
                            See <span className="text-[#F2AA00]">My Matches</span> for Room ID & Password
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}