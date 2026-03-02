"use client";

import { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass, faChevronDown, faEye, faBan, faUnlock,
  faXmark, faEnvelope, faPhone, faTrophy, faIndianRupeeSign,
  faShield, faCircle, faSpinner, faCoins,
} from "@fortawesome/free-solid-svg-icons";

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso.replace(" ", "T")).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

const statusStyle: Record<string, string> = {
  Active: "bg-green-500/10 text-green-400 border-green-500/20",
  Banned: "bg-red-500/10  text-red-400  border-red-500/20",
};

type User = {
  id: number; name: string; email: string; phone: string;
  role: string; status: "Active" | "Banned";
  tournaments: number; spent: string; referrals: number;
  points: number; joinedAt: string;
};

function UserModal({ user, onClose, onToggleBan, saving }: {
  user: User; onClose: () => void;
  onToggleBan: (id: number, action: "ban" | "unban") => Promise<void>;
  saving: boolean;
}) {
  const isBanned = user.status === "Banned";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-[#0e0e0e] border border-gray-800 rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-start mb-5">
          <p className="text-sm tracking-wide text-white">User Details</p>
          <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
        <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-800">
          <div className="w-14 h-14 rounded-full bg-[#F2AA00]/20 flex items-center justify-center text-2xl text-[#F2AA00]">
            {user.name?.[0] ?? "?"}
          </div>
          <div>
            <p className="text-white tracking-wide">{user.name ?? "—"}</p>
            <span className={`text-[10px] px-2 py-0.5 rounded-md border mt-1 inline-block ${statusStyle[user.status]}`}>
              {user.status}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[
            { icon: faEnvelope,        label: "Email",       val: user.email              },
            { icon: faPhone,           label: "Phone",       val: user.phone || "—"       },
            { icon: faTrophy,          label: "Tournaments", val: user.tournaments        },
            { icon: faIndianRupeeSign, label: "Total Spent", val: user.spent              },
            { icon: faCoins,           label: "Points",      val: user.points             },
            { icon: faShield,          label: "Referrals",   val: user.referrals          },
            { icon: faCircle,          label: "Joined",      val: formatDate(user.joinedAt) },
            { icon: faShield,          label: "Role",        val: user.role               },
          ].map((row, i) => (
            <div key={i} className="bg-black border border-gray-800 rounded-lg px-3 py-2.5">
              <p className="text-[9px] text-gray-600 tracking-widest uppercase mb-1">{row.label}</p>
              <div className="flex items-center gap-1.5">
                <FontAwesomeIcon icon={row.icon} className="text-[#F2AA00] text-[9px] flex-shrink-0" />
                <p className="text-xs text-white truncate">{row.val}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border border-gray-800 text-gray-400 py-2 text-xs tracking-widest rounded-lg hover:border-gray-700 hover:text-white transition-all duration-150">
            Close
          </button>
          <button
            onClick={() => onToggleBan(user.id, isBanned ? "unban" : "ban")}
            disabled={saving}
            className={`flex-1 py-2 text-xs tracking-widest rounded-lg border transition-all duration-150 active:scale-[0.97] flex items-center justify-center gap-2 ${isBanned ? "bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20" : "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"}`}
          >
            {saving && <FontAwesomeIcon icon={faSpinner} className="animate-spin w-3 h-3" />}
            {isBanned ? "Unban User" : "Ban User"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const [users, setUsers]     = useState<User[]>([]);
  const [summary, setSummary] = useState({ total: 0, active: 0, banned: 0 });
  const [loading, setLoading] = useState(true);
  const [apiErr, setApiErr]   = useState("");
  const [saving, setSaving]   = useState(false);
  const [search, setSearch]   = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [visible, setVisible] = useState(false);
  const [toast, setToast]     = useState({ msg: "", show: false });

  const showToast = (msg: string) => {
    setToast({ msg, show: true });
    setTimeout(() => setToast({ msg: "", show: false }), 2500);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setApiErr("");
    try {
      const params = new URLSearchParams({ search, status: statusFilter });
      const res = await fetch(`/api/admin/users?${params}`, { 
        credentials: "include",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      setUsers(data.users ?? []);
      setSummary(data.summary ?? { total: 0, active: 0, banned: 0 });
    } catch (e: any) {
      setApiErr(e.message ?? "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchUsers();
    setTimeout(() => setVisible(true), 60);
  }, [fetchUsers]);

  const toggleBan = async (id: number, action: "ban" | "unban") => {
    setSaving(true);
    try {
      const u = users.find((u) => u.id === id);
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
         },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed"); }
      await fetchUsers();
      showToast(action === "ban" ? `${u?.name} banned` : `${u?.name} unbanned`);
      setViewUser(null);
    } catch (e: any) {
      showToast(e.message ?? "Action failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-black min-h-screen text-white px-4 sm:px-6 py-10">
      <div className={`fixed bottom-6 right-6 z-50 bg-[#F2AA00] text-black text-lg px-5 py-3 rounded-lg shadow-lg shadow-[#F2AA00]/20 tracking-widest transition-all duration-500 ${toast.show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none"}`}>
        {toast.msg}
      </div>

      {viewUser && (
        <UserModal user={viewUser} onClose={() => setViewUser(null)} onToggleBan={toggleBan} saving={saving} />
      )}

      <div className="max-w-7xl mx-auto space-y-5">

        {/* HEADER */}
        <div className={`transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"}`}>
          <h1 className="text-xl tracking-widest text-white">Manage Users</h1>
          <p className="text-gray-600 text-xs mt-1 tracking-wide">{summary.total} registered users</p>
        </div>

        {apiErr && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-xs">{apiErr}</div>
        )}

        {/* SUMMARY */}
        <div className={`grid grid-cols-3 gap-3 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`} style={{ transitionDelay: "80ms" }}>
          {[
            { label: "Total Users", value: summary.total,  color: "text-white"     },
            { label: "Active",      value: summary.active, color: "text-green-400" },
            { label: "Banned",      value: summary.banned, color: "text-red-400"   },
          ].map((s, i) => (
            <div key={i} className="bg-[#0b0b0b] border border-gray-800 rounded-xl px-4 py-3 hover:border-gray-700 transition-colors duration-200">
              <p className="text-gray-600 text-[10px] tracking-widest uppercase">{s.label}</p>
              <p className={`text-2xl mt-1 font-mono ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* SEARCH + FILTER */}
        <div className={`flex flex-col sm:flex-row gap-3 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`} style={{ transitionDelay: "160ms" }}>
          <div className="relative flex-1">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600 text-xs" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or phone..."
              className="w-full bg-[#0b0b0b] border border-gray-800 focus:border-[#F2AA00]/40 rounded-lg pl-9 pr-4 py-2.5 text-xs text-white placeholder-gray-600 outline-none transition-colors duration-200"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-[#0b0b0b] border border-gray-800 focus:border-[#F2AA00]/40 rounded-lg px-4 py-2.5 pr-8 text-xs text-gray-400 outline-none cursor-pointer"
            >
              {["All", "Active", "Banned"].map((s) => (
                <option key={s} style={{ background: "#0b0b0b", color: "#ccc" }}>{s}</option>
              ))}
            </select>
            <FontAwesomeIcon icon={faChevronDown} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 text-[9px] pointer-events-none" />
          </div>
        </div>

        {/* TABLE */}
        <div className={`bg-[#0b0b0b] border border-gray-800 rounded-xl overflow-hidden transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`} style={{ transitionDelay: "240ms" }}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-800 bg-[#0f0f0f]">
                  {["User", "Phone", "Joined", "Tournaments", "Spent", "Points", "Referrals", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-[13px] text-gray-600 tracking-widest uppercase px-4 py-3 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="text-center py-14"><FontAwesomeIcon icon={faSpinner} className="animate-spin text-gray-600 w-5 h-5" /></td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-14 text-gray-700 text-xs tracking-widest">No users found.</td></tr>
                ) : (
                  users.map((u, i) => (
                    <tr key={u.id} className={`border-b border-gray-800/50 last:border-0 hover:bg-[#111] group transition-all duration-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`} style={{ transitionDelay: `${320 + i * 50}ms` }}>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#F2AA00]/20 flex items-center justify-center text-lg text-[#F2AA00] flex-shrink-0">
                            {u.name?.[0] ?? "?"}
                          </div>
                          <div>
                            <p className="text-md text-white group-hover:text-[#F2AA00] transition-colors duration-200 tracking-widest">{u.name ?? "—"}</p>
                            <p className="text-[12px] text-gray-600">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-[14px] text-gray-500 font-mono">{u.phone || "—"}</td>
                      <td className="px-4 py-3.5 text-[14px] text-gray-500">{formatDate(u.joinedAt)}</td>
                      <td className="px-4 py-3.5 text-lg text-white font-mono">{u.tournaments}</td>
                      <td className="px-4 py-3.5 text-lg text-[#F2AA00]/80">{u.spent}</td>
                      <td className="px-4 py-3.5 text-lg text-gray-400 font-mono">{u.points}</td>
                      <td className="px-4 py-3.5 text-lg text-gray-400">{u.referrals}</td>
                      <td className="px-4 py-3.5">
                        <span className={`text-[14px] px-2.5 py-1 rounded-md border tracking-wide ${statusStyle[u.status]}`}>{u.status}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setViewUser(u)} className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-800 text-gray-500 hover:border-gray-600 hover:text-white transition-all duration-150" title="View">
                            <FontAwesomeIcon icon={faEye} className="text-[9px]" />
                          </button>
                          <button
                            onClick={() => toggleBan(u.id, u.status === "Banned" ? "unban" : "ban")}
                            disabled={saving}
                            className={`w-7 h-7 flex items-center justify-center rounded-lg border transition-all duration-150 ${u.status === "Banned" ? "border-green-500/20 text-green-400 hover:bg-green-500/10" : "border-red-500/20 text-red-400 hover:bg-red-500/10"}`}
                            title={u.status === "Banned" ? "Unban" : "Ban"}
                          >
                            <FontAwesomeIcon icon={u.status === "Banned" ? faUnlock : faBan} className="text-[9px]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-800">
            <p className="text-[10px] text-gray-700 tracking-wide">Showing {users.length} of {summary.total} users</p>
          </div>
        </div>
      </div>
    </div>
  );
}