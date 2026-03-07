"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCoins, faCheck, faXmark, faClock, faSpinner,
  faIndianRupeeSign, faMobileScreen, faBuildingColumns,
  faFilter, faArrowLeft, faArrowRight, faRotateRight,
  faUser, faEnvelope, faPhone, faWallet, faChevronDown,
  faCircleCheck, faCircleXmark, faHourglass,
} from "@fortawesome/free-solid-svg-icons";

// ── Types ─────────────────────────────────────────────────
type RedeemRow = {
  id:           number;
  status:       "pending" | "approved" | "rejected";
  points_used:  number;
  amount:       number;
  method:       string;
  detail:       string;
  created_at:   string;
  processed_at: string | null;
  user: {
    id:           number;
    name:         string;
    email:        string;
    phone:        string;
    total_points: number;
  };
};

type Stats = {
  pending:     number;
  approvedSum: number;
  rejected:    number;
  total:       number;
};

// ── Helpers ───────────────────────────────────────────────
const statusConfig = {
  pending:  { label: "Pending",  color: "text-amber-400",  bg: "bg-amber-400/10 border-amber-400/25",  icon: faHourglass    },
  approved: { label: "Approved", color: "text-emerald-400",bg: "bg-emerald-400/10 border-emerald-400/25",icon: faCircleCheck  },
  rejected: { label: "Rejected", color: "text-red-400",    bg: "bg-red-400/10 border-red-400/25",       icon: faCircleXmark  },
} as const;

function fmtDate(d: string) {
  return new Date(d).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function fmtShort(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// ── Confirm Modal ─────────────────────────────────────────
function ConfirmModal({
  row, action, onConfirm, onClose, loading,
}: {
  row: RedeemRow;
  action: "approve" | "reject";
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
}) {
  const isApprove = action === "approve";
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="bg-[#0e0e0e] border border-gray-800 rounded-2xl w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-6 py-5 border-b border-gray-800 flex items-center gap-3`}>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isApprove ? "bg-emerald-400/10" : "bg-red-400/10"}`}>
            <FontAwesomeIcon
              icon={isApprove ? faCircleCheck : faCircleXmark}
              className={isApprove ? "text-emerald-400" : "text-red-400"}
            />
          </div>
          <div>
            <p className="text-sm text-white font-medium tracking-wide">
              {isApprove ? "Approve Redeem Request" : "Reject Redeem Request"}
            </p>
            <p className="text-[10px] text-gray-600 mt-0.5 tracking-widest">Request #{row.id}</p>
          </div>
          <button onClick={onClose} className="ml-auto text-gray-700 hover:text-white transition-colors">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* User info */}
          <div className="bg-black border border-gray-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#F2AA00]/20 flex items-center justify-center text-[#F2AA00] text-sm font-bold">
                {row.user.name?.[0]?.toUpperCase() ?? "?"}
              </div>
              <div>
                <p className="text-sm text-white">{row.user.name ?? "—"}</p>
                <p className="text-[10px] text-gray-600 font-mono">{row.user.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="bg-gray-900/50 rounded-lg px-3 py-2">
                <p className="text-[9px] text-gray-600 tracking-widest uppercase">Amount</p>
                <p className="text-[#F2AA00] font-mono text-sm mt-0.5">₹{row.amount}</p>
              </div>
              <div className="bg-gray-900/50 rounded-lg px-3 py-2">
                <p className="text-[9px] text-gray-600 tracking-widest uppercase">Payout To</p>
                <p className="text-white text-xs mt-0.5 font-mono truncate">{row.detail}</p>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className={`flex items-start gap-2.5 rounded-xl px-4 py-3 border text-xs leading-relaxed ${
            isApprove
              ? "bg-emerald-400/5 border-emerald-400/20 text-emerald-300"
              : "bg-red-400/5 border-red-400/20 text-red-300"
          }`}>
            <FontAwesomeIcon icon={isApprove ? faCircleCheck : faCircleXmark} className="mt-0.5 flex-shrink-0" />
            {isApprove
              ? `Mark as approved. Ensure you've transferred ₹${row.amount} to ${row.method} — ${row.detail} before confirming.`
              : `This will reject the request and refund ${row.points_used} pts back to ${row.user.name ?? "user"}'s wallet.`
            }
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 border border-gray-800 text-gray-500 py-2.5 rounded-xl text-xs tracking-widest hover:border-gray-700 hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs tracking-widest font-medium transition-all active:scale-[0.97] ${
                isApprove
                  ? "bg-emerald-500 text-white hover:bg-emerald-400"
                  : "bg-red-500 text-white hover:bg-red-400"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading && <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs" />}
              {isApprove ? "Confirm Approve" : "Confirm Reject"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Row Card ──────────────────────────────────────────────
function RedeemCard({
  row,
  onAction,
  actioning,
}: {
  row: RedeemRow;
  onAction: (row: RedeemRow, action: "approve" | "reject") => void;
  actioning: number | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = statusConfig[row.status];
  const isActioning = actioning === row.id;

  return (
    <div className={`bg-[#0b0b0b] border rounded-xl overflow-hidden transition-all duration-200 ${
      row.status === "pending" ? "border-gray-700 hover:border-gray-600" : "border-gray-800"
    }`}>
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3.5">

        {/* Status dot */}
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
          row.status === "pending" ? "bg-amber-400 animate-pulse" :
          row.status === "approved" ? "bg-emerald-400" : "bg-red-400"
        }`} />

        {/* ID + date */}
        <div className="w-16 flex-shrink-0">
          <p className="text-[11px] text-gray-500 font-mono">#{row.id}</p>
          <p className="text-[9px] text-gray-700 mt-0.5">{fmtShort(row.created_at)}</p>
        </div>

        {/* User */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white truncate">{row.user.name ?? "—"}</p>
          <p className="text-[10px] text-gray-600 font-mono truncate">{row.user.email}</p>
        </div>

        {/* Amount */}
        <div className="text-right flex-shrink-0 w-20">
          <p className="text-[#F2AA00] font-mono text-sm">₹{row.amount}</p>
          <p className="text-[9px] text-gray-600">{row.points_used} pts</p>
        </div>

        {/* Method */}
        <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0 w-20">
          <FontAwesomeIcon
            icon={row.method === "Bank" ? faBuildingColumns : faMobileScreen}
            className="text-gray-600 text-[10px]"
          />
          <span className="text-[11px] text-gray-500">{row.method}</span>
        </div>

        {/* Status badge */}
        <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] tracking-wide flex-shrink-0 ${cfg.bg} ${cfg.color}`}>
          <FontAwesomeIcon icon={cfg.icon} className="text-[9px]" />
          {cfg.label}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {row.status === "pending" && (
            <>
              <button
                onClick={() => onAction(row, "approve")}
                disabled={isActioning}
                title="Approve"
                className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all flex items-center justify-center disabled:opacity-40"
              >
                {isActioning ? <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs" /> : <FontAwesomeIcon icon={faCheck} className="text-xs" />}
              </button>
              <button
                onClick={() => onAction(row, "reject")}
                disabled={isActioning}
                title="Reject"
                className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all flex items-center justify-center disabled:opacity-40"
              >
                <FontAwesomeIcon icon={faXmark} className="text-xs" />
              </button>
            </>
          )}

          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-8 h-8 rounded-lg border border-gray-800 text-gray-600 hover:border-gray-700 hover:text-white transition-all flex items-center justify-center"
          >
            <FontAwesomeIcon
              icon={faChevronDown}
              className={`text-[10px] transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-800 px-4 py-4 bg-black/30 grid sm:grid-cols-2 gap-4">
          {/* User details */}
          <div className="space-y-2">
            <p className="text-[9px] text-gray-600 tracking-[0.2em] uppercase mb-2">User Details</p>
            {[
              { icon: faUser,   label: "Name",    val: row.user.name   ?? "—" },
              { icon: faEnvelope,label: "Email",  val: row.user.email  ?? "—" },
              { icon: faPhone,  label: "Phone",   val: row.user.phone  ?? "—" },
              { icon: faWallet, label: "Current Balance", val: `${row.user.total_points} pts` },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-2.5">
                <FontAwesomeIcon icon={f.icon} className="text-gray-700 text-[10px] w-3 flex-shrink-0" />
                <span className="text-[10px] text-gray-600 w-24 flex-shrink-0">{f.label}</span>
                <span className="text-xs text-gray-300 font-mono truncate">{f.val}</span>
              </div>
            ))}
          </div>

          {/* Payout details */}
          <div className="space-y-2">
            <p className="text-[9px] text-gray-600 tracking-[0.2em] uppercase mb-2">Payout Details</p>
            {[
              { label: "Method",     val: row.method },
              { label: "Account",    val: row.detail },
              { label: "Points",     val: `${row.points_used} pts` },
              { label: "Amount",     val: `₹${row.amount}` },
              { label: "Requested",  val: fmtDate(row.created_at) },
              ...(row.processed_at ? [{ label: "Processed", val: fmtDate(row.processed_at) }] : []),
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-2.5">
                <span className="text-[10px] text-gray-600 w-24 flex-shrink-0">{f.label}</span>
                <span className="text-xs text-gray-300 font-mono break-all">{f.val}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────
export default function AdminRedeemPage() {
  const router = useRouter();

  const [authChecked, setAuthChecked] = useState<boolean | null>(null);
  const [redeems,     setRedeems]     = useState<RedeemRow[]>([]);
  const [stats,       setStats]       = useState<Stats>({ pending: 0, approvedSum: 0, rejected: 0, total: 0 });
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [filter,      setFilter]      = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [page,        setPage]        = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);
  const [toast,       setToast]       = useState({ msg: "", type: "ok", show: false });
  const [confirm,     setConfirm]     = useState<{ row: RedeemRow; action: "approve" | "reject" } | null>(null);
  const [actioning,   setActioning]   = useState<number | null>(null);
  const [visible,     setVisible]     = useState(false);

  // Auth guard
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
    } else {
      setAuthChecked(true);
    }
  }, []);

  const pop = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type, show: true });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 3000);
  };

  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res   = await fetch(`/api/admin/redeems?status=${filter}&page=${page}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { localStorage.removeItem("token"); router.replace("/login"); return; }
      if (res.status === 403) { router.replace("/"); return; }
      const data = await res.json();
      setRedeems(data.redeems ?? []);
      setStats(data.stats ?? {});
      setTotalPages(data.pagination?.pages ?? 1);
      setTimeout(() => setVisible(true), 50);
    } catch (e) {
      pop("Failed to load data", "err");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter, page]);

  useEffect(() => {
    if (authChecked) fetchData();
  }, [authChecked, fetchData]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [filter]);

  const handleAction = async (row: RedeemRow, action: "approve" | "reject") => {
    setConfirm({ row, action });
  };

  const handleConfirm = async () => {
    if (!confirm) return;
    setActioning(confirm.row.id);
    try {
      const token = localStorage.getItem("token");
      const res   = await fetch("/api/admin/redeems", {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ redeemId: confirm.row.id, action: confirm.action }),
      });
      const data = await res.json();
      if (!res.ok) { pop(data.error ?? "Action failed", "err"); return; }
      pop(
        confirm.action === "approve"
          ? `✓ Request #${confirm.row.id} approved`
          : `✗ Request #${confirm.row.id} rejected — ${confirm.row.points_used} pts refunded`,
        "ok",
      );
      setConfirm(null);
      fetchData(true);
    } catch {
      pop("Something went wrong", "err");
    } finally {
      setActioning(null);
    }
  };

  if (authChecked === null) return <div className="bg-black min-h-screen" />;

  return (
    <div className="bg-black min-h-screen text-white px-4 sm:px-6 py-8 relative overflow-x-hidden">

      {/* Ambient */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-[#F2AA00]/4 blur-[140px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-emerald-500/3 blur-[120px] translate-y-1/2 -translate-x-1/3" />
      </div>

      {/* Toast */}
      <div className={`fixed bottom-6 right-6 z-50 text-sm px-5 py-3 rounded-xl shadow-2xl tracking-wide transition-all duration-400 ${
        toast.show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none"
      } ${toast.type === "ok" ? "bg-[#F2AA00] text-black" : "bg-red-500 text-white"}`}>
        {toast.msg}
      </div>

      {/* Confirm modal */}
      {confirm && (
        <ConfirmModal
          row={confirm.row}
          action={confirm.action}
          onConfirm={handleConfirm}
          onClose={() => setConfirm(null)}
          loading={actioning === confirm.row.id}
        />
      )}

      <div className="max-w-7xl mx-auto relative z-10 space-y-6">

        {/* ── Header ── */}
        <div className={`transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] tracking-[0.4em] text-[#F2AA00]/60 uppercase mb-1">Admin Panel</p>
              <h1 className="text-2xl tracking-wide flex items-center gap-3">
                <FontAwesomeIcon icon={faCoins} className="text-[#F2AA00] text-xl" />
                Redeem Requests
              </h1>
            </div>
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="flex items-center gap-2 border border-gray-800 text-gray-500 hover:border-gray-700 hover:text-white px-4 py-2 rounded-xl text-xs tracking-widest transition-all"
            >
              <FontAwesomeIcon icon={faRotateRight} className={`text-[10px] ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* ── Stats cards ── */}
        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`} style={{ transitionDelay: "80ms" }}>
          {[
            { label: "Pending",       val: stats.pending,                    color: "text-amber-400",   bg: "border-amber-400/20",   icon: faClock         },
            { label: "Total Paid Out",val: `₹${stats.approvedSum}`,          color: "text-emerald-400", bg: "border-emerald-400/20", icon: faIndianRupeeSign},
            { label: "Rejected",      val: stats.rejected,                   color: "text-red-400",     bg: "border-red-400/20",     icon: faXmark         },
            { label: "All Requests",  val: stats.total,                      color: "text-[#F2AA00]",   bg: "border-[#F2AA00]/20",   icon: faCoins         },
          ].map((s, i) => (
            <div key={s.label} className={`bg-[#0b0b0b] border ${s.bg} rounded-xl p-4`} style={{ transitionDelay: `${80 + i * 40}ms` }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[9px] text-gray-600 tracking-[0.2em] uppercase">{s.label}</p>
                <FontAwesomeIcon icon={s.icon} className={`text-[10px] ${s.color}`} />
              </div>
              <p className={`font-mono text-xl ${s.color}`}>{s.val}</p>
            </div>
          ))}
        </div>

        {/* ── Filter tabs ── */}
        <div className={`flex items-center gap-1 bg-[#0b0b0b] border border-gray-800 rounded-xl p-1 transition-all duration-500 ${visible ? "opacity-100" : "opacity-0"}`} style={{ transitionDelay: "200ms" }}>
          <FontAwesomeIcon icon={faFilter} className="text-gray-700 text-[10px] ml-2 mr-1 flex-shrink-0" />
          {(["pending", "approved", "rejected", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-2 text-[11px] tracking-widest rounded-lg capitalize transition-all duration-150 ${
                filter === f
                  ? "bg-[#F2AA00] text-black font-semibold"
                  : "text-gray-500 hover:text-white"
              }`}
            >
              {f}
              {f === "pending" && stats.pending > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] ${filter === "pending" ? "bg-black/20 text-black" : "bg-amber-400/20 text-amber-400"}`}>
                  {stats.pending}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Table / List ── */}
        <div className={`space-y-2 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`} style={{ transitionDelay: "260ms" }}>

          {/* Column headers — desktop */}
          <div className="hidden sm:grid grid-cols-[auto_1fr_80px_80px_80px_100px_auto] gap-3 px-4 pb-1">
            {["#ID", "User", "Amount", "Method", "Status", "", ""].map((h, i) => (
              <p key={i} className="text-[9px] text-gray-700 tracking-[0.2em] uppercase">{h}</p>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <FontAwesomeIcon icon={faSpinner} className="animate-spin text-[#F2AA00] text-xl" />
            </div>
          ) : redeems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center">
                <FontAwesomeIcon icon={faCoins} className="text-gray-700 text-lg" />
              </div>
              <p className="text-gray-600 text-sm tracking-widest">No {filter === "all" ? "" : filter} requests</p>
            </div>
          ) : (
            redeems.map((row) => (
              <RedeemCard
                key={row.id}
                row={row}
                onAction={handleAction}
                actioning={actioning}
              />
            ))
          )}
        </div>

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className={`flex items-center justify-between transition-all duration-500 ${visible ? "opacity-100" : "opacity-0"}`}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-2 border border-gray-800 text-gray-500 hover:border-gray-700 hover:text-white px-4 py-2 rounded-xl text-xs tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="text-[10px]" />
              Previous
            </button>
            <p className="text-[11px] text-gray-600 font-mono">
              Page {page} of {totalPages}
            </p>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-2 border border-gray-800 text-gray-500 hover:border-gray-700 hover:text-white px-4 py-2 rounded-xl text-xs tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
              <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}