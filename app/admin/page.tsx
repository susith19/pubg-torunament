"use client";

import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faTrophy,
  faIndianRupeeSign,
  faArrowRightArrowLeft,
  faArrowTrendUp,
  faArrowTrendDown,
  faCircle,
  faEllipsisVertical,
  faShield,
  faGamepad,
} from "@fortawesome/free-solid-svg-icons";

// ── mock data ──────────────────────────────────────────────
const stats = [
  {
    title: "Total Users",
    value: "1,200",
    change: "+12%",
    up: true,
    icon: faUsers,
    sub: "vs last month",
  },
  {
    title: "Tournaments",
    value: "32",
    change: "+4",
    up: true,
    icon: faTrophy,
    sub: "active this week",
  },
  {
    title: "Revenue",
    value: "₹50,000",
    change: "+8.3%",
    up: true,
    icon: faIndianRupeeSign,
    sub: "vs last month",
  },
  {
    title: "Redeems",
    value: "12",
    change: "-2",
    up: false,
    icon: faArrowRightArrowLeft,
    sub: "pending payouts",
  },
];

const recentTournaments = [
  { name: "Erangel Squad Battle", map: "Erangel", mode: "Squad", slots: "87/100", status: "Live", fee: "₹50" },
  { name: "Miramar Duo Clash",    map: "Miramar", mode: "Duo",   slots: "50/50",  status: "Full", fee: "₹30" },
  { name: "Sanhok Solo Rush",     map: "Sanhok",  mode: "Solo",  slots: "18/25",  status: "Open", fee: "₹20" },
  { name: "TDM Arena",            map: "Warehouse",mode: "TDM",  slots: "9/10",   status: "Closed",fee:"Free"},
];

const recentUsers = [
  { name: "Susith",   email: "susith@email.com",  joined: "2h ago",  status: "Active" },
  { name: "Arjun",    email: "arjun@email.com",   joined: "5h ago",  status: "Active" },
  { name: "Priya",    email: "priya@email.com",   joined: "1d ago",  status: "Banned" },
  { name: "Karthik",  email: "karthik@email.com", joined: "2d ago",  status: "Active" },
];

const activity = [
  { icon: faUsers,   text: "New user Arjun registered",          time: "2 min ago",  gold: false },
  { icon: faTrophy,  text: "Tournament 'Erangel Battle' started", time: "15 min ago", gold: true  },
  { icon: faIndianRupeeSign, text: "₹500 payout processed to Susith", time: "1h ago", gold: true },
  { icon: faShield,  text: "User Priya was banned",              time: "3h ago",  gold: false },
  { icon: faGamepad, text: "New tournament 'TDM Arena' created",  time: "5h ago",  gold: true  },
];

const barData = [
  { day: "Mon", value: 65 },
  { day: "Tue", value: 82 },
  { day: "Wed", value: 54 },
  { day: "Thu", value: 91 },
  { day: "Fri", value: 73 },
  { day: "Sat", value: 88 },
  { day: "Sun", value: 60 },
];

// ── helpers ────────────────────────────────────────────────
function useCountUp(target: number, active: boolean, duration = 1000) {
  const [count, setCount] = useState(0);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    if (!active) return;
    let start: number | null = null;
    const animate = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setCount(Math.floor(ease * target));
      if (p < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [active, target, duration]);
  return count;
}

const statusColor: Record<string, string> = {
  Live:   "bg-green-500/10 text-green-400 border-green-500/20",
  Open:   "bg-[#F2AA00]/10 text-[#F2AA00] border-[#F2AA00]/20",
  Full:   "bg-red-500/10 text-red-400 border-red-500/20",
  Closed: "bg-gray-700/40 text-gray-500 border-gray-700",
  Active: "bg-green-500/10 text-green-400 border-green-500/20",
  Banned: "bg-red-500/10 text-red-400 border-red-500/20",
};

// ── components ─────────────────────────────────────────────
function StatCard({ title, value, change, up, icon, sub, delay, visible }: any) {
  const raw = parseInt(value.replace(/[^0-9]/g, "")) || 0;
  const animated = useCountUp(raw, visible, 1200);
  const display = value.startsWith("₹")
    ? `₹${animated.toLocaleString("en-IN")}`
    : animated.toLocaleString("en-IN");

  return (
    <div
      className={`group bg-[#0b0b0b] border border-gray-800 rounded-xl p-5 hover:border-[#F2AA00]/40 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/60 transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
      style={{ transitionDelay: delay }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-500 text-xs tracking-widest uppercase">{title}</p>
          <h3 className="text-[#F2AA00] text-2xl mt-2 font-mono">{display}</h3>
          <p className="text-gray-600 text-[10px] mt-1 tracking-wide">{sub}</p>
        </div>
        <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-[#F2AA00]/10 group-hover:bg-[#F2AA00]/20 transition-colors duration-300">
          <FontAwesomeIcon icon={icon} className="text-[#F2AA00] text-sm" />
        </div>
      </div>
      <div className={`flex items-center gap-1 mt-3 text-xs ${up ? "text-green-400" : "text-red-400"}`}>
        <FontAwesomeIcon icon={up ? faArrowTrendUp : faArrowTrendDown} className="text-[10px]" />
        <span>{change} this month</span>
      </div>
    </div>
  );
}

// ── main ──────────────────────────────────────────────────
export default function AdminDashboard() {
  const [visible, setVisible] = useState(false);
  const [barsActive, setBarsActive] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 60);
    const t2 = setTimeout(() => setBarsActive(true), 600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const maxBar = Math.max(...barData.map((b) => b.value));

  return (
    <div className="bg-black min-h-screen text-white px-4 sm:px-6 py-10">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* PAGE TITLE */}
        <div
          className={`transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"}`}
        >
          <h1 className="text-xl tracking-widest text-white">Admin Dashboard</h1>
          <p className="text-gray-600 text-xs mt-1 tracking-wide">Overview of platform activity</p>
        </div>

        {/* STAT CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <StatCard key={i} {...s} delay={`${i * 80}ms`} visible={visible} />
          ))}
        </div>

        {/* ROW 2 — bar chart + activity */}
        <div className="grid md:grid-cols-3 gap-4">

          {/* BAR CHART */}
          <div
            className={`md:col-span-2 bg-[#0b0b0b] border border-gray-800 rounded-xl p-5 transition-all duration-700 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
            style={{ transitionDelay: "320ms" }}
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-sm tracking-wide">Weekly Signups</p>
                <p className="text-gray-500 text-xs mt-0.5">Users registered this week</p>
              </div>
              <span className="text-[10px] border border-gray-800 text-gray-500 px-2.5 py-1 rounded-full tracking-widest">
                This Week
              </span>
            </div>

            <div className="flex items-end gap-3 h-36">
              {barData.map((b, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group/bar">
                  <span className="text-[9px] text-gray-600 opacity-0 group-hover/bar:opacity-100 transition-opacity duration-150">
                    {b.value}
                  </span>
                  <div className="w-full bg-gray-900 rounded-sm overflow-hidden" style={{ height: "112px" }}>
                    <div
                      className="w-full bg-[#F2AA00]/80 hover:bg-[#F2AA00] rounded-sm transition-all duration-700 mt-auto"
                      style={{
                        height: barsActive ? `${(b.value / maxBar) * 100}%` : "0%",
                        transitionDelay: `${i * 60}ms`,
                        marginTop: barsActive ? `${100 - (b.value / maxBar) * 100}%` : "100%",
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
            className={`bg-[#0b0b0b] border border-gray-800 rounded-xl p-5 transition-all duration-700 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
            style={{ transitionDelay: "400ms" }}
          >
            <p className="text-sm tracking-wide mb-4">Recent Activity</p>
            <div className="space-y-4">
              {activity.map((a, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 transition-all duration-500 ${
                    visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
                  }`}
                  style={{ transitionDelay: `${500 + i * 70}ms` }}
                >
                  <div className={`w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-lg mt-0.5 ${a.gold ? "bg-[#F2AA00]/10" : "bg-gray-800"}`}>
                    <FontAwesomeIcon icon={a.icon} className={`text-[10px] ${a.gold ? "text-[#F2AA00]" : "text-gray-500"}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-300 leading-snug tracking-widest">{a.text}</p>
                    <p className="text-[10px] text-gray-600 mt-0.5">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ROW 3 — tournaments table + users table */}
        <div className="grid md:grid-cols-2 gap-4">

          {/* TOURNAMENTS */}
          <div
            className={`bg-[#0b0b0b] border border-gray-800 rounded-xl overflow-hidden transition-all duration-700 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
            style={{ transitionDelay: "480ms" }}
          >
            <div className="flex justify-between items-center px-5 py-4 border-b border-gray-800">
              <p className="text-sm tracking-wide">Recent Tournaments</p>
              <button className="text-[10px] text-[#F2AA00]/70 hover:text-[#F2AA00] transition-colors tracking-widest">
                View All →
              </button>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800/60">
                  {["Name", "Mode", "Slots", "Status", "Fee"].map((h) => (
                    <th key={h} className="text-[10px] text-gray-600 tracking-widest uppercase px-4 py-2.5 text-left">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentTournaments.map((t, i) => (
                  <tr
                    key={i}
                    className={`border-b border-gray-800/40 last:border-0 hover:bg-[#111] transition-colors duration-150 ${
                      visible ? "opacity-100" : "opacity-0"
                    }`}
                    style={{ transitionDelay: `${560 + i * 60}ms` }}
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm text-white tracking-widest">{t.name}</p>
                      <p className="text-[10px] text-gray-600 mt-0.5">{t.map}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{t.mode}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 font-mono">{t.slots}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md border tracking-wide ${statusColor[t.status]}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#F2AA00]/80">{t.fee}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* USERS */}
          <div
            className={`bg-[#0b0b0b] border border-gray-800 rounded-xl overflow-hidden transition-all duration-700 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
            style={{ transitionDelay: "520ms" }}
          >
            <div className="flex justify-between items-center px-5 py-4 border-b border-gray-800">
              <p className="text-sm tracking-wide">Recent Users</p>
              <button className="text-[10px] text-[#F2AA00]/70 hover:text-[#F2AA00] transition-colors tracking-widest">
                View All →
              </button>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800/60">
                  {["User", "Joined", "Status"].map((h, i) => (
                    <th key={i} className="text-[10px] text-gray-600 tracking-widest uppercase px-4 py-2.5 text-left">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u, i) => (
                  <tr
                    key={i}
                    className={`border-b border-gray-800/40 last:border-0 hover:bg-[#111] transition-colors duration-150 ${
                      visible ? "opacity-100" : "opacity-0"
                    }`}
                    style={{ transitionDelay: `${600 + i * 60}ms` }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#F2AA00]/20 flex items-center justify-center text-[10px] text-[#F2AA00] flex-shrink-0">
                          {u.name[0]}
                        </div>
                        <div>
                          <p className="text-sm text-white tracking-widest">{u.name}</p>
                          <p className="text-[10px] text-gray-600">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[10px] text-gray-500">{u.joined}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md border tracking-wide ${statusColor[u.status]}`}>
                        {u.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* BOTTOM ROW — quick actions */}
        <div
          className={`grid grid-cols-2 sm:grid-cols-4 gap-3 transition-all duration-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
          style={{ transitionDelay: "680ms" }}
        >
          {[
            { label: "Create Tournament", gold: true },
            { label: "Add User",          gold: false },
            { label: "Process Redeems",   gold: false },
            { label: "Export Report",     gold: false },
          ].map((btn, i) => (
            <button
              key={i}
              className={`py-2.5 text-xs tracking-widest rounded-lg border transition-all duration-150 active:scale-[0.97] ${
                btn.gold
                  ? "bg-[#F2AA00] text-black border-[#F2AA00] hover:bg-[#e09e00] hover:shadow-lg hover:shadow-[#F2AA00]/20"
                  : "bg-transparent text-gray-400 border-gray-800 hover:border-gray-700 hover:text-white"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}