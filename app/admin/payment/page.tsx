"use client";

import { useState, useEffect, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck, faXmark, faEye, faMagnifyingGlass, faChevronDown,
  faClock, faCircleCheck, faCircleXmark, faImage, faTrophy,
  faHashtag, faUser, faIndianRupeeSign, faShieldHalved,
  faCircleExclamation, faSpinner,
} from "@fortawesome/free-solid-svg-icons";

// ── helpers ───────────────────────────────────────────────
function relativeTime(iso: string) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso.replace(" ", "T") + "Z").getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const statusStyle: Record<string, string> = {
  Pending:  "bg-[#F2AA00]/10 text-[#F2AA00] border-[#F2AA00]/20",
  Approved: "bg-green-500/10 text-green-400 border-green-500/20",
  Rejected: "bg-red-500/10 text-red-400 border-red-500/20",
};

const statusIcon: Record<string, any> = {
  Pending: faClock, Approved: faCircleCheck, Rejected: faCircleXmark,
};

type Payment = {
  id: number;
  userName: string;
  email: string;
  tournament: string;
  fee: string;
  txnId: string;
  screenshotUrl: string | null;
  submittedAt: string;
  status: "Pending" | "Approved" | "Rejected";
};

// ── Verify Modal ──────────────────────────────────────────
function VerifyModal({ item, onClose, onAction }: {
  item: Payment;
  onClose: () => void;
  onAction: (id: number, status: "verified" | "rejected") => Promise<void>;
}) {
  const [step, setStep]           = useState<"view" | "reject">("view");
  const [rejectReason, setRejectReason] = useState("");
  const [saving, setSaving]       = useState(false);

  const handleApprove = async () => {
    setSaving(true);
    await onAction(item.id, "verified");
    onClose();
  };

  const handleReject = async () => {
    setSaving(true);
    await onAction(item.id, "rejected");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="bg-[#0e0e0e] border border-gray-800 rounded-xl w-full max-w-lg overflow-hidden">

        {/* header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-800">
          <div>
            <p className="text-sm tracking-wide text-white">Verify Payment</p>
            <p className="text-[10px] text-gray-600 mt-0.5">{item.userName} · {item.tournament}</p>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="p-6 space-y-4">

          {/* screenshot */}
          <div className="relative bg-black border border-gray-800 rounded-xl overflow-hidden">
            {item.screenshotUrl ? (
              <img
                src={item.screenshotUrl}
                alt="Payment screenshot"
                className="w-full max-h-56 object-contain"
              />
            ) : (
              <div className="h-44 flex items-center justify-center">
                <div className="text-center">
                  <FontAwesomeIcon icon={faImage} className="text-gray-700 text-3xl mb-2" />
                  <p className="text-[10px] text-gray-700 tracking-widest">NO SCREENSHOT</p>
                </div>
              </div>
            )}
            <div className="absolute top-2 right-2 bg-black/70 text-[9px] text-gray-400 px-2 py-1 rounded border border-gray-800">
              {relativeTime(item.submittedAt)}
            </div>
          </div>

          {/* payment details grid */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: faUser,            label: "User",       val: item.userName   },
              { icon: faTrophy,          label: "Tournament", val: item.tournament },
              { icon: faIndianRupeeSign, label: "Fee",        val: item.fee        },
              { icon: faHashtag,         label: "Txn ID",     val: item.txnId      },
            ].map((row, i) => (
              <div key={i} className="bg-black border border-gray-800 rounded-lg px-3 py-2.5">
                <p className="text-[10px] text-gray-600 tracking-widest uppercase mb-1">{row.label}</p>
                <div className="flex items-center gap-1.5">
                  <FontAwesomeIcon icon={row.icon} className="text-[#F2AA00] text-[10px] flex-shrink-0" />
                  <p className="text-sm text-white truncate">{row.val}</p>
                </div>
              </div>
            ))}
          </div>

          {/* warning */}
          <div className="flex items-start gap-2.5 bg-[#F2AA00]/5 border border-[#F2AA00]/15 rounded-lg px-3 py-2.5">
            <FontAwesomeIcon icon={faCircleExclamation} className="text-[#F2AA00]/60 text-sm mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-gray-500 leading-relaxed">
              Verify the transaction ID matches the screenshot before approving. Approving will{" "}
              <span className="text-white">unlock tournament access</span> for this user.
            </p>
          </div>

          {/* reject reason */}
          {step === "reject" && (
            <div>
              <p className="text-[10px] text-gray-600 tracking-widest uppercase mb-1.5">Rejection Reason (optional)</p>
              <input
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Invalid screenshot, Wrong amount..."
                className="w-full bg-black border border-red-500/20 focus:border-red-500/40 rounded-lg px-3 py-2.5 text-xs text-white placeholder-gray-600 outline-none transition-colors duration-200"
              />
            </div>
          )}

          {/* action buttons */}
          {item.status === "Pending" ? (
            step === "view" ? (
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setStep("reject")}
                  disabled={saving}
                  className="flex-1 bg-red-500/10 border border-red-500/20 text-red-400 py-2.5 text-xs tracking-widest rounded-lg hover:bg-red-500/20 active:scale-[0.97] transition-all duration-150"
                >
                  <FontAwesomeIcon icon={faXmark} className="mr-2" />
                  Reject
                </button>
                <button
                  onClick={handleApprove}
                  disabled={saving}
                  className="flex-1 bg-green-500/10 border border-green-500/20 text-green-400 py-2.5 text-xs tracking-widest rounded-lg hover:bg-green-500/20 active:scale-[0.97] transition-all duration-150 flex items-center justify-center gap-2"
                >
                  {saving
                    ? <FontAwesomeIcon icon={faSpinner} className="animate-spin w-3 h-3" />
                    : <FontAwesomeIcon icon={faCheck} className="mr-2" />
                  }
                  Approve & Unlock
                </button>
              </div>
            ) : (
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setStep("view")}
                  disabled={saving}
                  className="flex-1 border border-gray-800 text-gray-400 py-2.5 text-xs tracking-widest rounded-lg hover:border-gray-700 hover:text-white transition-all duration-150"
                >
                  Back
                </button>
                <button
                  onClick={handleReject}
                  disabled={saving}
                  className="flex-1 bg-red-500/10 border border-red-500/20 text-red-400 py-2.5 text-xs tracking-widest rounded-lg hover:bg-red-500/20 active:scale-[0.97] transition-all duration-150 flex items-center justify-center gap-2"
                >
                  {saving && <FontAwesomeIcon icon={faSpinner} className="animate-spin w-3 h-3" />}
                  Confirm Reject
                </button>
              </div>
            )
          ) : (
            <button
              onClick={onClose}
              className="w-full border border-gray-800 text-gray-400 py-2.5 text-xs tracking-widest rounded-lg hover:border-gray-700 hover:text-white transition-all duration-150"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────
export default function AdminPayments() {
  const [payments, setPayments]     = useState<Payment[]>([]);
  const [summary, setSummary]       = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading]       = useState(true);
  const [apiErr, setApiErr]         = useState("");

  const [search, setSearch]         = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewItem, setViewItem]     = useState<Payment | null>(null);
  const [visible, setVisible]       = useState(false);
  const [toast, setToast]           = useState({ msg: "", show: false });

  const showToast = (msg: string) => {
    setToast({ msg, show: true });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 2500);
  };

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setApiErr("");
    try {
      const params = new URLSearchParams({ search, status: statusFilter });
      const res = await fetch(`/api/admin/payments?${params}`, { headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },});
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      setPayments(data.payments ?? []);
      setSummary(data.summary ?? { total: 0, pending: 0, approved: 0, rejected: 0 });
    } catch (e: any) {
      setApiErr(e.message ?? "Failed to load payments");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchPayments();
    setTimeout(() => setVisible(true), 60);
  }, [fetchPayments]);

  // Approve or reject via API, then refresh
  const handleAction = async (id: number, status: "verified" | "rejected") => {
    try {
      const res = await fetch(`/api/admin/payments/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed");
      await fetchPayments();
      showToast(
        status === "verified"
          ? "Payment verified · Tournament unlocked ✓"
          : "Payment rejected · User notified"
      );
    } catch {
      showToast("Action failed. Try again.");
    }
  };

  // Quick approve/reject without modal
  const quickApprove = async (id: number) => { await handleAction(id, "verified"); };
  const quickReject  = async (id: number) => { await handleAction(id, "rejected"); };

  const pending  = summary.pending;
  const approved = summary.approved;
  const rejected = summary.rejected;

  return (
    <div className="bg-black min-h-screen text-white px-4 sm:px-6 py-10">

      {/* Toast */}
      <div className={`fixed bottom-6 right-6 z-50 bg-[#F2AA00] text-black text-xs px-5 py-3 rounded-lg shadow-lg shadow-[#F2AA00]/20 tracking-widest transition-all duration-500 ${toast.show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none"}`}>
        {toast.msg}
      </div>

      {viewItem && (
        <VerifyModal
          item={viewItem}
          onClose={() => setViewItem(null)}
          onAction={handleAction}
        />
      )}

      <div className="max-w-7xl mx-auto space-y-5">

        {/* HEADER */}
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"}`}>
          <div>
            <h1 className="text-xl tracking-widest text-white">Payment Verification</h1>
            <p className="text-gray-600 text-xs mt-1 tracking-wide">
              Review screenshots & transaction IDs to unlock tournament access
            </p>
          </div>
          {pending > 0 && (
            <div className="self-start sm:self-auto flex items-center gap-2 bg-[#F2AA00]/10 border border-[#F2AA00]/20 px-4 py-2 rounded-lg">
              <div className="w-1.5 h-1.5 rounded-full bg-[#F2AA00] animate-pulse" />
              <span className="text-[#F2AA00] text-xs tracking-widest">{pending} pending review</span>
            </div>
          )}
        </div>

        {/* API ERROR */}
        {apiErr && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-xs">
            {apiErr}
          </div>
        )}

        {/* SUMMARY */}
        <div className={`grid grid-cols-3 gap-3 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`} style={{ transitionDelay: "80ms" }}>
          {[
            { label: "Pending Review", value: pending,  color: "text-[#F2AA00]", icon: faClock,       border: "hover:border-[#F2AA00]/20" },
            { label: "Approved",       value: approved, color: "text-green-400", icon: faCircleCheck, border: "hover:border-green-500/20" },
            { label: "Rejected",       value: rejected, color: "text-red-400",   icon: faCircleXmark, border: "hover:border-red-500/20"   },
          ].map((s, i) => (
            <div key={i} className={`bg-[#0b0b0b] border border-gray-800 rounded-xl px-4 py-3 transition-colors duration-200 flex items-center gap-3 ${s.border}`}>
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#F2AA00]/10 flex-shrink-0">
                <FontAwesomeIcon icon={s.icon} className="text-[#F2AA00] text-xs" />
              </div>
              <div>
                <p className="text-gray-600 text-[9px] tracking-widest uppercase">{s.label}</p>
                <p className={`text-xl mt-0.5 font-mono ${s.color}`}>{s.value}</p>
              </div>
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
              placeholder="Search user, tournament, or Txn ID..."
              className="w-full bg-[#0b0b0b] border border-gray-800 focus:border-[#F2AA00]/40 rounded-lg pl-9 pr-4 py-2.5 text-xs text-white placeholder-gray-600 outline-none transition-colors duration-200"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none bg-[#0b0b0b] border border-gray-800 rounded-lg px-4 py-2.5 pr-8 text-xs text-gray-400 outline-none cursor-pointer"
            >
              {["All", "Pending", "Approved", "Rejected"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <FontAwesomeIcon icon={faChevronDown} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 text-[9px] pointer-events-none" />
          </div>
        </div>

        {/* PENDING BANNER */}
        {pending > 0 && statusFilter !== "Approved" && statusFilter !== "Rejected" && (
          <div className={`flex items-center gap-3 bg-[#F2AA00]/5 border border-[#F2AA00]/15 rounded-xl px-4 py-3 transition-all duration-500 ${visible ? "opacity-100" : "opacity-0"}`} style={{ transitionDelay: "240ms" }}>
            <FontAwesomeIcon icon={faShieldHalved} className="text-[#F2AA00]/60 text-sm flex-shrink-0" />
            <p className="text-xs text-gray-400">
              <span className="text-[#F2AA00]">{pending} payment{pending > 1 ? "s" : ""}</span>{" "}
              waiting for verification. Review screenshots and confirm transaction IDs before approving tournament access.
            </p>
          </div>
        )}

        {/* TABLE */}
        <div className={`bg-[#0b0b0b] border border-gray-800 rounded-xl overflow-hidden transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`} style={{ transitionDelay: "280ms" }}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-gray-800 bg-[#0f0f0f]">
                  {["User", "Tournament", "Fee", "Txn ID", "Screenshot", "Submitted", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-[14px] text-gray-600 tracking-widest uppercase px-4 py-3 text-left">{h}</th>
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
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-14 text-gray-700 text-xs tracking-widest">
                      No payments found.
                    </td>
                  </tr>
                ) : (
                  payments.map((r, i) => (
                    <tr
                      key={r.id}
                      className={`border-b border-gray-800/50 last:border-0 hover:bg-[#111] group transition-all duration-300 ${r.status === "Pending" ? "border-l-2 border-l-[#F2AA00]/30" : ""} ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
                      style={{ transitionDelay: `${360 + i * 50}ms` }}
                    >
                      {/* USER */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#F2AA00]/20 flex items-center justify-center text-[12px] text-[#F2AA00] flex-shrink-0">
                            {r.userName?.[0] ?? <FontAwesomeIcon icon={faUser} className="text-[12px]" />}
                          </div>
                          <div>
                            <p className="text-lg text-white tracking-widest font-medium group-hover:text-[#F2AA00] transition-colors duration-200">{r.userName}</p>
                            <p className="text-[14px] text-gray-600">{r.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* TOURNAMENT */}
                      <td className="px-4 py-3.5">
                        <p className="text-lg text-gray-300 max-w-[140px] truncate">{r.tournament}</p>
                      </td>

                      {/* FEE */}
                      <td className="px-4 py-3.5 text-lg text-[#F2AA00]/80">{r.fee}</td>

                      {/* TXN ID */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <FontAwesomeIcon icon={faHashtag} className="text-gray-700 text-[14px]" />
                          <span className="text-[14px] text-gray-400 font-mono">{r.txnId}</span>
                        </div>
                      </td>

                      {/* SCREENSHOT */}
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => setViewItem(r)}
                          className="flex items-center gap-1.5 text-[14px] text-gray-500 border border-gray-800 px-2 py-1 rounded-md hover:border-[#F2AA00]/40 hover:text-[#F2AA00] transition-all duration-150"
                        >
                          <FontAwesomeIcon icon={faImage} className="text-[14px]" />
                          {r.screenshotUrl ? "View" : "None"}
                        </button>
                      </td>

                      {/* SUBMITTED */}
                      <td className="px-4 py-3.5 text-[14px] text-gray-500">
                        {relativeTime(r.submittedAt)}
                      </td>

                      {/* STATUS */}
                      <td className="px-4 py-3.5">
                        <span className={`text-[14px] px-2.5 py-1 rounded-md border tracking-wide flex items-center gap-1.5 w-fit ${statusStyle[r.status]}`}>
                          <FontAwesomeIcon icon={statusIcon[r.status]} className="text-[8px]" />
                          {r.status}
                        </span>
                      </td>

                      {/* ACTIONS */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setViewItem(r)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-800 text-gray-500 hover:border-gray-600 hover:text-white transition-all duration-150"
                            title="View details"
                          >
                            <FontAwesomeIcon icon={faEye} className="text-[9px]" />
                          </button>
                          {r.status === "Pending" && (
                            <>
                              <button
                                onClick={() => quickApprove(r.id)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg border border-green-500/20 text-green-400 hover:bg-green-500/10 transition-all duration-150"
                                title="Approve"
                              >
                                <FontAwesomeIcon icon={faCheck} className="text-[9px]" />
                              </button>
                              <button
                                onClick={() => quickReject(r.id)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all duration-150"
                                title="Reject"
                              >
                                <FontAwesomeIcon icon={faXmark} className="text-[9px]" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* TABLE FOOTER */}
          <div className="px-4 py-3 border-t border-gray-800 flex justify-between items-center">
            <p className="text-[10px] text-gray-700 tracking-wide">
              Showing {payments.length} of {summary.total} payments
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}