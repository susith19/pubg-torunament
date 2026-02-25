"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMobileScreen, faDesktop } from "@fortawesome/free-solid-svg-icons";

const tournaments = [
  {
    id: 1,
    name: "Erangel Squad Battle",
    date: "Today",
    time: "9:00 - 9:30",
    mode: "Squad",
    map: "Erangel",
    status: "Open",
    slots: 100,
    filled: 45,
    fee: "₹50",
    platform: "Mobile",
  },
  {
    id: 2,
    name: "Miramar Duo Clash",
    date: "Tomorrow",
    time: "9:50 - 10:00",
    mode: "Duo",
    map: "Miramar",
    status: "Open",
    slots: 50,
    filled: 38,
    fee: "₹30",
    platform: "PC",
  },
  {
    id: 3,
    name: "Sanhok Solo Rush",
    date: "This Week",
    time: "8:00 - 8:20",
    mode: "Solo",
    map: "Sanhok",
    status: "Full",
    slots: 25,
    filled: 25,
    fee: "₹20",
    platform: "Mobile",
  },
  {
    id: 4,
    name: "TDM Arena",
    date: "Next Week",
    time: "7:00 - 7:15",
    mode: "TDM",
    map: "Warehouse",
    status: "Closed",
    slots: 10,
    filled: 9,
    fee: "Free",
    platform: "PC",
  },
];

export default function TournamentsPage() {
  const [filter, setFilter] = useState("All");
  const [visible, setVisible] = useState(false);
  const [animatedBars, setAnimatedBars] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 60);
    const t2 = setTimeout(() => setAnimatedBars(true), 500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // re-animate bars when filter changes
  useEffect(() => {
    setAnimatedBars(false);
    const t = setTimeout(() => setAnimatedBars(true), 200);
    return () => clearTimeout(t);
  }, [filter]);

  const getActionButton = (status: string) => {
    switch (status) {
      case "Open":
        return {
          text: "Join Now",
          className:
            "bg-[#F2AA00] text-black hover:bg-[#e09e00] hover:shadow-md hover:shadow-[#F2AA00]/20 active:scale-95",
          disabled: false,
        };
      case "Upcoming":
        return {
          text: "Register",
          className:
            "bg-[#F2AA00] text-black hover:bg-[#e09e00] active:scale-95",
          disabled: false,
        };
      case "Full":
        return {
          text: "Full",
          className: "bg-red-500/10 text-red-400 border border-red-500/20 cursor-not-allowed",
          disabled: true,
        };
      case "Closed":
        return {
          text: "Closed",
          className: "bg-gray-800/60 text-gray-500 border border-gray-700 cursor-not-allowed",
          disabled: true,
        };
      default:
        return {
          text: "View",
          className: "border border-gray-700 text-gray-300",
          disabled: false,
        };
    }
  };

  const filtered = tournaments.filter(
    (t) => filter === "All" || t.date.toLowerCase() === filter.toLowerCase()
  );

  return (
    <div className="bg-black min-h-screen text-white overflow-x-hidden">

      {/* HEADER */}
      <div className="relative bg-[#F2AA00] text-black py-16 text-center overflow-hidden">
        {/* diagonal stripe texture */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)",
            backgroundSize: "12px 12px",
          }}
        />
        <div className="relative z-10">
          <h1
            className={`text-3xl tracking-widest italic transition-all duration-700 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"
            }`}
          >
            Tournaments
          </h1>
          <p
            className={`text-sm mt-1 tracking-widest transition-all duration-700 delay-100 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            }`}
          >
            Browse and join upcoming matches
          </p>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* FILTERS */}
        <div
          className={`flex flex-wrap gap-2 mb-6 transition-all duration-500 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ transitionDelay: "150ms" }}
        >
          {["All", "Today", "Tomorrow", "This Week", "Next Week"].map((f, i) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 text-xs tracking-wider border rounded-lg transition-all duration-200 ${
                filter === f
                  ? "bg-[#F2AA00] text-black border-[#F2AA00] shadow-md shadow-[#F2AA00]/20"
                  : "border-gray-800 text-gray-400 hover:border-gray-600 hover:text-white"
              }`}
              style={{ transitionDelay: `${i * 40}ms` }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* TABLE WRAPPER */}
        <div
          className={`rounded-xl border border-gray-800 overflow-hidden bg-[#0b0b0b] transition-all duration-600 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
          style={{ transitionDelay: "250ms" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">

              {/* THEAD */}
              <thead>
                <tr className="border-b border-gray-800 bg-[#0f0f0f]">
                  {["Tournament", "Date", "Time", "Platform", "Mode", "Prize", "Slots", "Status"].map((h) => (
                    <th
                      key={h}
                      className="text-center text-xs text-gray-500 uppercase tracking-widest px-5 py-3"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* TBODY */}
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className={`text-center py-16 text-gray-600 text-sm tracking-widest transition-all duration-500 ${
                        visible ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      No tournaments found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((t, idx) => {
                    const action = getActionButton(t.status);
                    const percent = Math.round((t.filled / t.slots) * 100);

                    return (
                      <tr
                        key={t.id}
                        className={`border-b border-gray-800/60 last:border-0 hover:bg-[#111] group text-center transition-all duration-300 ${
                          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                        }`}
                        style={{ transitionDelay: `${300 + idx * 70}ms` }}
                      >

                        {/* NAME */}
                        <td className="px-5 py-4 text-left">
                          <p className="text-lg tracking-widest group-hover:text-[#F2AA00] transition-colors duration-200">
                            {t.name}
                          </p>
                          <p className="text-sm text-gray-600 mt-0.5 tracking-wider">{t.map}</p>
                        </td>

                        {/* DATE */}
                        <td className="px-5 py-4 text-md text-gray-400 tracking-wide">
                          {t.date}
                        </td>

                        {/* TIME */}
                        <td className="px-5 py-4 text-md text-gray-400 font-mono">
                          {t.time}
                        </td>

                        {/* PLATFORM */}
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <FontAwesomeIcon
                              icon={t.platform === "Mobile" ? faMobileScreen : faDesktop}
                              className={`text-base ${
                                t.platform === "Mobile" ? "text-green-400" : "text-blue-400"
                              }`}
                            />
                            <span className="text-md text-gray-400 tracking-wide">
                              {t.platform === "Mobile" ? "BGMI" : "PUBG"}
                            </span>
                          </div>
                        </td>

                        {/* MODE */}
                        <td className="px-5 py-4">
                          <span className="text-md px-2.5 py-1 rounded-md bg-[#F2AA00]/10 text-[#F2AA00] border border-[#F2AA00]/10 tracking-wide">
                            {t.mode}
                          </span>
                        </td>

                        {/* PRIZE */}
                        <td className="px-5 py-4 text-md text-gray-400 tracking-wide">
                          {t.fee}
                        </td>

                        {/* SLOTS */}
                        <td className="px-5 py-4">
                          <div className="flex flex-col items-center gap-1">
                            <div className="flex justify-between w-20 text-[13px] text-gray-500">
                              <span>{t.filled}</span>
                              <span>{t.slots}</span>
                            </div>
                            <div className="w-20 bg-gray-800 rounded-full h-[4px] overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-700 ${
                                  percent === 100 ? "bg-red-500" : "bg-[#F2AA00]"
                                }`}
                                style={{ width: animatedBars ? `${percent}%` : "0%" }}
                              />
                            </div>
                            <span className="text-[12px] text-gray-600">{percent}%</span>
                          </div>
                        </td>

                        {/* STATUS */}
                        <td className="px-5 py-4">
                          <button
                            disabled={action.disabled}
                            className={`text-sm px-4 py-2 rounded-lg tracking-widest transition-all duration-150 ${action.className}`}
                          >
                            {action.text}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Row count */}
        <p
          className={`text-sm text-gray-700 mt-3 tracking-wider transition-all duration-500 ${
            visible ? "opacity-100" : "opacity-0"
          }`}
          style={{ transitionDelay: "500ms" }}
        >
          Showing {filtered.length} tournament{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}