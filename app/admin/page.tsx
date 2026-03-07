"use client";

import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers, faTrophy, faIndianRupeeSign, faArrowRightArrowLeft,
  faArrowTrendUp, faArrowTrendDown, faShield, faGamepad, faSpinner,
  faStar,
} from "@fortawesome/free-solid-svg-icons";

// ── icon map ──────────────────────────────────────────────
const iconMap: Record<string, any> = {
  users:   faUsers,
  trophy:  faTrophy,
  rupee:   faIndianRupeeSign,
  redeem:  faArrowRightArrowLeft,
  shield:  faShield,
  gamepad: faGamepad,
  star:    faStar,
};

const statusColor: Record<string, string> = {
  live:      "bg-green-500/10 text-green-400 border-green-500/20",
  open:      "bg-[#F2AA00]/10 text-[#F2AA00] border-[#F2AA00]/20",
  upcoming:  "bg-blue-500/10 text-blue-400 border-blue-500/20",
  full:      "bg-red-500/10 text-red-400 border-red-500/20",
  closed:    "bg-gray-700/40 text-gray-500 border-gray-700",
  completed: "bg-gray-700/40 text-gray-400 border-gray-700",
  Active:    "bg-green-500/10 text-green-400 border-green-500/20",
  Banned:    "bg-red-500/10 text-red-400 border-red-500/20",
};

// ── count-up hook ─────────────────────────────────────────
function useCountUp(target: number, active: boolean, duration = 1200) {
  const [count, setCount] = useState(0);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    if (!active) return;
    let start: number | null = null;
    const animate = (ts: number) => {
      if (!start) start = ts;
      const p    = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setCount(Math.floor(ease * target));
      if (p < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [active, target, duration]);
  return count;
}

// ── StatCard ──────────────────────────────────────────────
function StatCard({ title, value, label, up, iconKey, sub, delay, visible }: any) {
  const raw      = parseInt(String(value).replace(/[^0-9]/g, "")) || 0;
  const animated = useCountUp(raw, visible, 1200);
  const display  = String(value).startsWith("₹")
    ? `₹${animated.toLocaleString("en-IN")}`
    : animated.toLocaleString("en-IN");

  return (
    <div
      className={`group bg-[#0b0b0b] border border-gray-800 rounded-xl p-5 hover:border-[#F2AA00]/40 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/60 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
      style={{ transitionDelay: delay }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-xs tracking-widest uppercase">{title}</p>
          <h3 className="text-[#F2AA00] text-2xl mt-2 font-mono">{display}</h3>
          <p className="text-gray-600 text-[10px] mt-1 tracking-widest">{sub}</p>
        </div>
        <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#F2AA00]/10 group-hover:bg-[#F2AA00]/20 transition-colors duration-300">
          <FontAwesomeIcon icon={iconMap[iconKey] ?? faTrophy} className="text-[#F2AA00]" />
        </div>
      </div>
      <div className={`flex items-center gap-1.5 mt-3 text-xs ${up ? "text-green-400" : "text-red-400"}`}>
        <FontAwesomeIcon icon={up ? faArrowTrendUp : faArrowTrendDown} className="text-[9px]" />
        <span>{label} this month</span>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────
export default function AdminDashboard() {
  const [data,       setData]       = useState<any>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [visible,    setVisible]    = useState(false);
  const [barsActive, setBarsActive] = useState(false);

  useEffect(() => {
    fetch("/api/admin/dashboard", {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((r) => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then((d) => { setData(d); setTimeout(() => setBarsActive(true), 400); })
      .catch((e) => setError(e.message ?? "Failed to load dashboard"))
      .finally(() => setLoading(false));

    setTimeout(() => setVisible(true), 60);
  }, []);

  if (loading) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center">
        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-[#F2AA00] w-7 h-7" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center">
        <p className="text-red-400 text-sm">Failed to load dashboard: {error}</p>
      </div>
    );
  }

  const { stats, barData, recentTournaments, recentUsers, activity } = data;
  const maxBar = Math.max(...barData.map((b: any) => b.value), 1);

  return (
    <div className="bg-black min-h-screen text-white px-4 sm:px-6 py-10">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* TITLE */}
        <div className={`transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"}`}>
          <h1 className="text-xl tracking-widest text-white">Admin Dashboard</h1>
          <p className="text-gray-600 text-xs mt-1 tracking-wide">Overview of platform activity</p>
        </div>

        {/* STAT CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s: any, i: number) => (
            <StatCard key={i} {...s} delay={`${i * 80}ms`} visible={visible} />
          ))}
        </div>

        {/* ROW 2 — bar chart + activity */}
        <div className="grid md:grid-cols-3 gap-4">

          {/* BAR CHART */}
          <div
            className={`md:col-span-2 bg-[#0b0b0b] border border-gray-800 rounded-xl p-5 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
            style={{ transitionDelay: "320ms" }}
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-sm tracking-widest">Weekly Signups</p>
                <p className="text-gray-500 text-xs mt-0.5">Users registered this week</p>
              </div>
              <span className="text-[10px] border border-gray-800 text-gray-500 px-2.5 py-1 rounded-full tracking-widest">
                This Week
              </span>
            </div>
            <div className="flex items-end gap-3 h-36">
              {barData.map((b: any, i: number) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group/bar">
                  <span className="text-[12px] text-gray-600 opacity-0 group-hover/bar:opacity-100 transition-opacity duration-150">
                    {b.value}
                  </span>
                  <div className="w-full bg-gray-900 rounded-sm overflow-hidden" style={{ height: "112px" }}>
                    <div
                      className="w-full bg-[#F2AA00]/80 hover:bg-[#F2AA00] rounded-sm transition-all duration-700"
                      style={{
                        height:         barsActive ? `${(b.value / maxBar) * 100}%` : "0%",
                        transitionDelay:`${i * 60}ms`,
                        marginTop:      barsActive ? `${100 - (b.value / maxBar) * 100}%` : "100%",
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-600">{b.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ACTIVITY FEED */}
          <div
            className={`bg-[#0b0b0b] border border-gray-800 rounded-xl p-5 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
            style={{ transitionDelay: "400ms" }}
          >
            <p className="text-sm tracking-widest mb-4">Recent Activity</p>
            {activity.length === 0 ? (
              <p className="text-gray-700 text-xs tracking-widest text-center py-6">No activity yet.</p>
            ) : (
              <div className="space-y-4">
                {activity.map((a: any, i: number) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 transition-all duration-500 ${visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"}`}
                    style={{ transitionDelay: `${500 + i * 70}ms` }}
                  >
                    <div className={`w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-lg ${a.gold ? "bg-[#F2AA00]/10" : "bg-gray-800"}`}>
                      <FontAwesomeIcon icon={iconMap[a.iconKey] ?? faShield} className={`text-[10px] ${a.gold ? "text-[#F2AA00]" : "text-gray-500"}`} />
                    </div>
                    <p className="text-xs text-gray-300 leading-snug tracking-wide">{a.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ROW 3 — tournaments + users */}
        <div className="grid md:grid-cols-2 gap-4">

          {/* RECENT TOURNAMENTS */}
          <div
            className={`bg-[#0b0b0b] border border-gray-800 rounded-xl overflow-hidden transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
            style={{ transitionDelay: "480ms" }}
          >
            <div className="flex justify-between items-center px-5 py-4 border-b border-gray-800">
              <p className="text-sm tracking-widest">Recent Tournaments</p>
              <a href="/admin/tournaments" className="text-[10px] text-[#F2AA00]/70 hover:text-[#F2AA00] transition-colors tracking-widest">View All →</a>
            </div>
            {recentTournaments.length === 0 ? (
              <p className="text-gray-700 text-xs tracking-widest text-center py-8">No tournaments yet.</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800/60">
                    {["Name", "Mode", "Slots", "Status", "Fee"].map((h) => (
                      <th key={h} className="text-[10px] text-gray-600 tracking-widest uppercase px-4 py-2.5 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentTournaments.map((t: any, i: number) => (
                    <tr key={i}
                      className={`border-b border-gray-800/40 last:border-0 hover:bg-[#111] transition-colors duration-150 ${visible ? "opacity-100" : "opacity-0"}`}
                      style={{ transitionDelay: `${560 + i * 60}ms` }}>
                      <td className="px-4 py-3">
                        <p className="text-xs text-white tracking-wide">{t.name}</p>
                        <p className="text-[10px] text-gray-600 mt-0.5">{t.map}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{t.mode}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 font-mono">{t.slots}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-md border tracking-widest capitalize ${statusColor[t.status] ?? "border-gray-700 text-gray-500"}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#F2AA00]/80">{t.fee}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* RECENT USERS */}
          <div
            className={`bg-[#0b0b0b] border border-gray-800 rounded-xl overflow-hidden transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
            style={{ transitionDelay: "520ms" }}
          >
            <div className="flex justify-between items-center px-5 py-4 border-b border-gray-800">
              <p className="text-sm tracking-widest">Recent Users</p>
              <a href="/admin/users" className="text-[10px] text-[#F2AA00]/70 hover:text-[#F2AA00] transition-colors tracking-widest">View All →</a>
            </div>
            {recentUsers.length === 0 ? (
              <p className="text-gray-700 text-xs tracking-widest text-center py-8">No users yet.</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800/60">
                    {["User", "Joined", "Status"].map((h) => (
                      <th key={h} className="text-[10px] text-gray-600 tracking-widest uppercase px-4 py-2.5 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.map((u: any, i: number) => (
                    <tr key={i}
                      className={`border-b border-gray-800/40 last:border-0 hover:bg-[#111] transition-colors duration-150 ${visible ? "opacity-100" : "opacity-0"}`}
                      style={{ transitionDelay: `${600 + i * 60}ms` }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#F2AA00]/20 flex items-center justify-center text-[10px] text-[#F2AA00] flex-shrink-0">
                            {u.name?.[0]?.toUpperCase() ?? "?"}
                          </div>
                          <div>
                            <p className="text-xs text-white tracking-wide">{u.name}</p>
                            <p className="text-[10px] text-gray-600">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[10px] text-gray-500">{u.joined}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-md border tracking-widest ${statusColor[u.status] ?? "border-gray-700 text-gray-500"}`}>
                          {u.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}