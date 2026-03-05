"use client";

import { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass, faChevronDown, faEye, faBan, faUnlock,
  faXmark, faEnvelope, faPhone, faTrophy, faIndianRupeeSign,
  faShield, faCircle, faSpinner, faCoins, faCrown,
  faUserShield, faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { getAuth } from "firebase/auth";

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso.replace(" ", "T")).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

const statusStyle: Record<string, string> = {
  Active: "bg-green-500/10 text-green-400 border-green-500/20",
  Banned: "bg-red-500/10  text-red-400  border-red-500/20",
  Admin:  "bg-[#F2AA00]/10 text-[#F2AA00] border-[#F2AA00]/30",
};

type User = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: "Active" | "Banned" | "Admin";
  tournaments: number;
  spent: string;
  referrals: number;
  points: number;
  joinedAt: string;
};

// ── MAKE ADMIN CONFIRM MODAL ──────────────────────────────
function MakeAdminModal({
  user,
  action,  // "promote" | "demote"
  onConfirm,
  onClose,
  saving,
}: {
  user: User;
  action: "promote" | "demote";
  onConfirm: () => void;
  onClose: () => void;
  saving: boolean;
}) {
  const isPromote = action === "promote";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="bg-[#0e0e0e] border border-gray-800 rounded-xl w-full max-w-xs p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon
              icon={isPromote ? faCrown : faTriangleExclamation}
              className={isPromote ? "text-[#F2AA00]" : "text-orange-400"}
            />
            <p className="text-sm text-white tracking-wide">
              {isPromote ? "Make Admin" : "Remove Admin"}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="flex items-center gap-3 bg-black border border-gray-800 rounded-lg px-3 py-2.5 mb-4">
          <div className="w-8 h-8 rounded-full bg-[#F2AA00]/20 flex items-center justify-center text-[#F2AA00] flex-shrink-0">
            {user.name?.[0] ?? "?"}
          </div>
          <div>
            <p className="text-xs text-white">{user.name}</p>
            <p className="text-[10px] text-gray-500">{user.email}</p>
          </div>
        </div>

        <p className="text-xs text-gray-500 leading-relaxed mb-4">
          {isPromote
            ? <>This will give <span className="text-white">{user.name}</span> full admin access to the control panel. They will be able to manage tournaments, teams, users, and points.</>
            : <>This will remove admin access from <span className="text-white">{user.name}</span> and revert them to a regular user.</>
          }
        </p>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 border border-gray-800 text-gray-400 py-2 text-xs tracking-widest rounded-lg hover:border-gray-700 hover:text-white transition-all duration-150">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={saving}
            className={`flex-1 py-2 text-xs tracking-widest rounded-lg border transition-all duration-150 active:scale-[0.97] flex items-center justify-center gap-1.5 ${
              isPromote
                ? "bg-[#F2AA00]/10 border-[#F2AA00]/30 text-[#F2AA00] hover:bg-[#F2AA00]/20"
                : "bg-orange-500/10 border-orange-500/20 text-orange-400 hover:bg-orange-500/20"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {saving && <FontAwesomeIcon icon={faSpinner} className="animate-spin w-3 h-3" />}
            {isPromote ? "Make Admin" : "Remove Admin"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── USER DETAIL MODAL ─────────────────────────────────────
function UserModal({
  user, onClose, onToggleBan, onToggleAdmin, saving,
}: {
  user: User;
  onClose: () => void;
  onToggleBan: (id: number, action: "ban" | "unban") => Promise<void>;
  onToggleAdmin: (id: number, action: "promote" | "demote") => void;
  saving: boolean;
}) {
  const isBanned  = user.status === "Banned";
  const isAdmin   = user.role === "admin";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="bg-[#0e0e0e] border border-gray-800 rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>

        <div className="flex justify-between items-start mb-5">
          <p className="text-sm tracking-wide text-white">User Details</p>
          <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {/* Avatar + badge */}
        <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-800">
          <div className="relative">
            <div className="w-14 h-14 rounded-full bg-[#F2AA00]/20 flex items-center justify-center text-2xl text-[#F2AA00]">
              {user.name?.[0] ?? "?"}
            </div>
            {isAdmin && (
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#F2AA00] flex items-center justify-center shadow-lg shadow-[#F2AA00]/30">
                <FontAwesomeIcon icon={faCrown} className="text-black text-[8px]" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-white tracking-wide">{user.name ?? "—"}</p>
              {isAdmin && (
                <span className="text-[9px] px-1.5 py-0.5 rounded border bg-[#F2AA00]/10 border-[#F2AA00]/30 text-[#F2AA00] tracking-widest uppercase">
                  Admin
                </span>
              )}
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-md border mt-1 inline-block ${statusStyle[user.status]}`}>
              {user.status}
            </span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[
            { icon: faEnvelope,        label: "Email",       val: user.email },
            { icon: faPhone,           label: "Phone",       val: user.phone || "—" },
            { icon: faTrophy,          label: "Tournaments", val: user.tournaments },
            { icon: faIndianRupeeSign, label: "Total Spent", val: user.spent },
            { icon: faCoins,           label: "Points",      val: user.points },
            { icon: faShield,          label: "Referrals",   val: user.referrals },
            { icon: faCircle,          label: "Joined",      val: formatDate(user.joinedAt) },
            { icon: faUserShield,      label: "Role",        val: user.role },
          ].map((row, i) => (
            <div key={i} className="bg-black border border-gray-800 rounded-lg px-3 py-2.5">
              <p className="text-[9px] text-gray-600 tracking-widest uppercase mb-1">{row.label}</p>
              <div className="flex items-center gap-1.5">
                <FontAwesomeIcon icon={row.icon} className="text-[#F2AA00] text-[9px] flex-shrink-0" />
                <p className="text-xs text-white truncate">{String(row.val)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 border border-gray-800 text-gray-400 py-2 text-xs tracking-widest rounded-lg hover:border-gray-700 hover:text-white transition-all duration-150">
            Close
          </button>

          {/* Make / Remove Admin */}
          <button
            onClick={() => onToggleAdmin(user.id, isAdmin ? "demote" : "promote")}
            disabled={saving}
            className={`flex-1 py-2 text-xs tracking-widest rounded-lg border transition-all duration-150 active:scale-[0.97] flex items-center justify-center gap-1.5 ${
              isAdmin
                ? "bg-orange-500/10 border-orange-500/20 text-orange-400 hover:bg-orange-500/20"
                : "bg-[#F2AA00]/10 border-[#F2AA00]/30 text-[#F2AA00] hover:bg-[#F2AA00]/20"
            } disabled:opacity-50`}
          >
            <FontAwesomeIcon icon={faCrown} className="text-[9px]" />
            {isAdmin ? "Remove Admin" : "Make Admin"}
          </button>

          {/* Ban / Unban — disabled for admins */}
          {!isAdmin && (
            <button
              onClick={() => onToggleBan(user.id, isBanned ? "unban" : "ban")}
              disabled={saving}
              className={`flex-1 py-2 text-xs tracking-widest rounded-lg border transition-all duration-150 active:scale-[0.97] flex items-center justify-center gap-1.5 ${
                isBanned
                  ? "bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20"
                  : "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
              } disabled:opacity-50`}
            >
              {saving && <FontAwesomeIcon icon={faSpinner} className="animate-spin w-3 h-3" />}
              {isBanned ? "Unban" : "Ban"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────
export default function AdminUsers() {
  const [users,        setUsers]        = useState<User[]>([]);
  const [summary,      setSummary]      = useState({ total: 0, active: 0, banned: 0, admins: 0 });
  const [loading,      setLoading]      = useState(true);
  const [apiErr,       setApiErr]       = useState("");
  const [saving,       setSaving]       = useState(false);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewUser,     setViewUser]     = useState<User | null>(null);
  const [adminModal,   setAdminModal]   = useState<{ user: User; action: "promote" | "demote" } | null>(null);
  const [visible,      setVisible]      = useState(false);
  const [toast,        setToast]        = useState({ msg: "", show: false });

  const showToast = (msg: string) => {
    setToast({ msg, show: true });
    setTimeout(() => setToast({ msg: "", show: false }), 2500);
  };

  const getToken = async () => {
    const auth = getAuth();
    return await auth.currentUser?.getIdToken(true) ?? localStorage.getItem("token") ?? "";
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setApiErr("");
    try {
      const params = new URLSearchParams({ search, status: statusFilter });
      const token  = await getToken();
      const res    = await fetch(`/api/admin/users?${params}`, {
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      setUsers(data.users ?? []);
      setSummary(data.summary ?? { total: 0, active: 0, banned: 0, admins: 0 });
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

  // ── BAN / UNBAN ───────────────────────────────────────
  const toggleBan = async (id: number, action: "ban" | "unban") => {
    setSaving(true);
    try {
      const u     = users.find((u) => u.id === id);
      const token = await getToken();
      const res   = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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

  // ── MAKE / REMOVE ADMIN ───────────────────────────────
  const toggleAdmin = async (id: number, action: "promote" | "demote") => {
    setSaving(true);
    try {
      const u     = users.find((u) => u.id === id);
      const token = await getToken();
      const res   = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed"); }
      await fetchUsers();
      showToast(action === "promote" ? `${u?.name} is now an admin` : `${u?.name} is no longer an admin`);
      setViewUser(null);
      setAdminModal(null);
    } catch (e: any) {
      showToast(e.message ?? "Action failed");
    } finally {
      setSaving(false);
    }
  };

  // ── openAdminConfirm — called from table row or detail modal ──
  const openAdminConfirm = (user: User, action: "promote" | "demote") => {
    setViewUser(null); // close detail modal first
    setAdminModal({ user, action });
  };

  return (
    <div className="bg-black min-h-screen text-white px-4 sm:px-6 py-10">

      {/* TOAST */}
      <div className={`fixed bottom-6 right-6 z-50 bg-[#F2AA00] text-black text-xs px-5 py-3 rounded-lg shadow-lg shadow-[#F2AA00]/20 tracking-widest transition-all duration-500 ${toast.show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none"}`}>
        {toast.msg}
      </div>

      {/* MODALS */}
      {viewUser && (
        <UserModal
          user={viewUser}
          onClose={() => setViewUser(null)}
          onToggleBan={toggleBan}
          onToggleAdmin={(id, action) => openAdminConfirm(viewUser, action)}
          saving={saving}
        />
      )}
      {adminModal && (
        <MakeAdminModal
          user={adminModal.user}
          action={adminModal.action}
          onConfirm={() => toggleAdmin(adminModal.user.id, adminModal.action)}
          onClose={() => setAdminModal(null)}
          saving={saving}
        />
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
        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`} style={{ transitionDelay: "80ms" }}>
          {[
            { label: "Total Users", value: summary.total,  color: "text-white"      },
            { label: "Active",      value: summary.active, color: "text-green-400"  },
            { label: "Banned",      value: summary.banned, color: "text-red-400"    },
            { label: "Admins",      value: summary.admins ?? 0, color: "text-[#F2AA00]" },
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
              className="appearance-none bg-[#0b0b0b] border border-gray-800 rounded-lg px-4 py-2.5 pr-8 text-xs text-gray-400 outline-none cursor-pointer"
            >
              {["All", "Active", "Banned", "Admin"].map((s) => (
                <option key={s} style={{ background: "#0b0b0b", color: "#ccc" }}>{s}</option>
              ))}
            </select>
            <FontAwesomeIcon icon={faChevronDown} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 text-[9px] pointer-events-none" />
          </div>
        </div>

        {/* TABLE */}
        <div className={`bg-[#0b0b0b] border border-gray-800 rounded-xl overflow-hidden transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`} style={{ transitionDelay: "240ms" }}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px]">
              <thead>
                <tr className="border-b border-gray-800 bg-[#0f0f0f]">
                  {["User", "Phone", "Joined", "Tournaments", "Spent", "Points", "Referrals", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-[11px] text-gray-600 tracking-widest uppercase px-4 py-3 text-left font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="text-center py-14"><FontAwesomeIcon icon={faSpinner} className="animate-spin text-gray-600 w-5 h-5" /></td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-14 text-gray-700 text-xs tracking-widest">No users found.</td></tr>
                ) : (
                  users.map((u, i) => {
                    const isAdmin  = u.role === "admin";
                    const isBanned = u.status === "Banned";
                    return (
                      <tr
                        key={u.id}
                        className={`border-b border-gray-800/50 last:border-0 hover:bg-[#111] group transition-all duration-300 ${
                          isAdmin ? "bg-[#F2AA00]/[0.02]" : ""
                        } ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
                        style={{ transitionDelay: `${320 + i * 50}ms` }}
                      >
                        {/* USER */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="relative flex-shrink-0">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${isAdmin ? "bg-[#F2AA00]/30 text-[#F2AA00] ring-1 ring-[#F2AA00]/40" : "bg-[#F2AA00]/20 text-[#F2AA00]"}`}>
                                {u.name?.[0] ?? "?"}
                              </div>
                              {/* crown badge for admins */}
                              {isAdmin && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#F2AA00] flex items-center justify-center shadow-md shadow-[#F2AA00]/40">
                                  <FontAwesomeIcon icon={faCrown} className="text-black text-[7px]" />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm text-white group-hover:text-[#F2AA00] transition-colors duration-200">
                                  {u.name ?? "—"}
                                </p>
                                {isAdmin && (
                                  <span className="text-[8px] px-1.5 py-0.5 rounded border bg-[#F2AA00]/10 border-[#F2AA00]/30 text-[#F2AA00] tracking-widest uppercase leading-none">
                                    Admin
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-gray-600">{u.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 text-xs text-gray-500 font-mono">{u.phone || "—"}</td>
                        <td className="px-4 py-3.5 text-xs text-gray-500">{formatDate(u.joinedAt)}</td>
                        <td className="px-4 py-3.5 text-sm text-white font-mono">{u.tournaments}</td>
                        <td className="px-4 py-3.5 text-sm text-[#F2AA00]/80">{u.spent}</td>
                        <td className="px-4 py-3.5 text-sm text-gray-400 font-mono">{u.points}</td>
                        <td className="px-4 py-3.5 text-sm text-gray-400">{u.referrals}</td>

                        {/* STATUS */}
                        <td className="px-4 py-3.5">
                          <span className={`text-[11px] px-2.5 py-1 rounded-md border tracking-wide ${
                            isAdmin ? statusStyle.Admin : statusStyle[u.status]
                          }`}>
                            {isAdmin ? "Admin" : u.status}
                          </span>
                        </td>

                        {/* ACTIONS */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            {/* View */}
                            <button
                              onClick={() => setViewUser(u)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-800 text-gray-500 hover:border-gray-600 hover:text-white transition-all duration-150"
                              title="View details"
                            >
                              <FontAwesomeIcon icon={faEye} className="text-[9px]" />
                            </button>

                            {/* Make / Remove Admin */}
                            <button
                              onClick={() => openAdminConfirm(u, isAdmin ? "demote" : "promote")}
                              disabled={saving}
                              className={`w-7 h-7 flex items-center justify-center rounded-lg border transition-all duration-150 ${
                                isAdmin
                                  ? "border-orange-500/20 text-orange-400 hover:bg-orange-500/10"
                                  : "border-[#F2AA00]/20 text-[#F2AA00]/60 hover:border-[#F2AA00]/40 hover:text-[#F2AA00]"
                              } disabled:opacity-40`}
                              title={isAdmin ? "Remove admin" : "Make admin"}
                            >
                              <FontAwesomeIcon icon={faCrown} className="text-[9px]" />
                            </button>

                            {/* Ban / Unban — hidden for admins */}
                            {!isAdmin && (
                              <button
                                onClick={() => toggleBan(u.id, isBanned ? "unban" : "ban")}
                                disabled={saving}
                                className={`w-7 h-7 flex items-center justify-center rounded-lg border transition-all duration-150 ${
                                  isBanned
                                    ? "border-green-500/20 text-green-400 hover:bg-green-500/10"
                                    : "border-red-500/20 text-red-400 hover:bg-red-500/10"
                                } disabled:opacity-40`}
                                title={isBanned ? "Unban" : "Ban"}
                              >
                                <FontAwesomeIcon icon={isBanned ? faUnlock : faBan} className="text-[9px]" />
                              </button>
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
          <div className="px-4 py-3 border-t border-gray-800">
            <p className="text-[10px] text-gray-700 tracking-wide">Showing {users.length} of {summary.total} users</p>
          </div>
        </div>
      </div>
    </div>
  );
}