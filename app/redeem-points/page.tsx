"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCoins, faTrophy, faXmark, faCopy, faCheck,
  faIndianRupeeSign, faMobileScreen, faBuildingColumns,
  faLock, faGift, faHeadset, faArrowRight, faSpinner,
} from "@fortawesome/free-solid-svg-icons";

const badgeStyle: Record<string, string> = {
  gold:    "text-[#F2AA00] bg-[#F2AA00]/10 border-[#F2AA00]/20",
  silver:  "text-gray-300 bg-gray-300/10 border-gray-300/20",
  bronze:  "text-amber-600 bg-amber-600/10 border-amber-600/20",
  default: "text-gray-500 bg-gray-800/40 border-gray-800",
};
const badgeEmoji: Record<string, string> = { gold: "🥇", silver: "🥈", bronze: "🥉", default: "🏅" };
const posLabel: Record<number, string>   = { 1: "1st", 2: "2nd", 3: "3rd", 4: "4th" };
const statusStyle: Record<string, string> = {
  approved: "bg-green-500/10 text-green-400 border-green-500/20",
  pending:  "bg-[#F2AA00]/10 text-[#F2AA00] border-[#F2AA00]/20",
  rejected: "bg-red-500/10 text-red-400 border-red-500/20",
};

function useCountUp(target: number, active: boolean, dur = 900) {
  const [n, setN] = useState(0);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    if (!active) return;
    let start: number | null = null;
    const tick = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setN(Math.floor(e * target));
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else setN(target);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [active, target, dur]);
  return n;
}

function RedeemModal({ available, onClose, onSubmit }: {
  available: number;
  onClose: () => void;
  onSubmit: (pts: number, method: string, detail: string) => Promise<void>;
}) {
  const MIN = 200;
  const [pts, setPts]       = useState(MIN);
  const [method, setMethod] = useState("UPI");
  const [detail, setDetail] = useState("");
  const [loading, setLoading] = useState(false);

  const over  = pts > available;
  const under = pts < MIN;
  const valid = !over && !under && detail.trim() !== "";
  const barW  = Math.min(Math.max((pts / available) * 100, 0), 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" onClick={onClose}>
      <div className="bg-[#0e0e0e] border border-gray-800 rounded-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-800">
          <p className="text-sm tracking-wide text-white">Redeem Points</p>
          <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between bg-black border border-[#F2AA00]/20 rounded-xl px-4 py-3">
            <p className="text-[10px] text-gray-600 tracking-widest uppercase">Available Balance</p>
            <p className="text-[#F2AA00] font-mono text-xl">{available} pts</p>
          </div>
          <div>
            <p className="text-[9px] text-gray-600 tracking-widest uppercase mb-1.5">Points to Redeem</p>
            <div className="relative">
              <input
                type="number" value={pts} min={MIN} max={available}
                onChange={(e) => setPts(Number(e.target.value))}
                className="w-full bg-black border border-gray-800 focus:border-[#F2AA00]/40 rounded-lg px-4 py-3 text-sm text-white font-mono outline-none transition-colors duration-200 pr-16"
              />
              <button onClick={() => setPts(available)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#F2AA00] hover:text-[#F2AA00]/70 tracking-widest transition-colors">
                MAX
              </button>
            </div>
            <div className="mt-2 h-1.5 bg-gray-900 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-300 ${over || under ? "bg-red-500" : "bg-[#F2AA00]"}`} style={{ width: `${barW}%` }} />
            </div>
            <div className="flex justify-between text-[9px] mt-1">
              <span className="text-gray-700">Min: {MIN} pts</span>
              <span className={over ? "text-red-400" : "text-gray-600"}>
                {over ? "Exceeds balance" : `${available - pts} remaining after`}
              </span>
            </div>
          </div>
          <div className={`transition-opacity duration-300 ${valid ? "opacity-100" : "opacity-40"}`}>
            <div className="flex items-baseline gap-2">
              <span className="text-gray-500 text-xs">You receive</span>
              <span className="text-[#F2AA00] font-mono text-2xl">&#8377;{pts}</span>
              <span className="text-gray-600 text-[10px]">· 1 pt = &#8377;1</span>
            </div>
          </div>
          <div>
            <p className="text-[9px] text-gray-600 tracking-widest uppercase mb-2">Payout To</p>
            <div className="flex gap-2 mb-3">
              {["UPI", "Bank"].map((m) => (
                <button key={m} onClick={() => setMethod(m)}
                  className={`flex-1 py-2 text-xs tracking-widest rounded-lg border transition-all duration-150 ${method === m ? "bg-[#F2AA00] text-black border-[#F2AA00]" : "border-gray-800 text-gray-400 hover:border-gray-700"}`}
                >
                  <FontAwesomeIcon icon={m === "UPI" ? faMobileScreen : faBuildingColumns} className="mr-1.5 text-[9px]" />
                  {m}
                </button>
              ))}
            </div>
            <input
              value={detail} onChange={(e) => setDetail(e.target.value)}
              placeholder={method === "UPI" ? "Your UPI ID (e.g. name@upi)" : "Account No. / IFSC"}
              className="w-full bg-black border border-gray-800 focus:border-[#F2AA00]/40 rounded-lg px-4 py-3 text-xs text-white placeholder-gray-600 outline-none transition-colors duration-200"
            />
          </div>
          <button
            onClick={async () => { if (!valid || loading) return; setLoading(true); await onSubmit(pts, method, detail); setLoading(false); }}
            className={`w-full py-3 text-xs tracking-widest rounded-lg border transition-all duration-150 active:scale-[0.97] flex items-center justify-center gap-2 ${valid ? "bg-[#F2AA00] text-black border-[#F2AA00] hover:bg-[#e09e00] hover:shadow-lg hover:shadow-[#F2AA00]/20" : "bg-gray-900 text-gray-600 border-gray-800 cursor-not-allowed"}`}
          >
            {loading ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
              : valid ? "Confirm Redeem"
              : under ? `Need ${MIN - pts} more pts`
              : over ? "Exceeds balance"
              : "Enter payout details"}
          </button>
          <a href="/contact" className="flex items-center justify-center gap-2 text-[10px] text-gray-600 hover:text-[#F2AA00] transition-colors duration-200 tracking-wide mt-1">
            <FontAwesomeIcon icon={faHeadset} className="text-[9px]" />
            Need help? Contact Customer Service
            <FontAwesomeIcon icon={faArrowRight} className="text-[8px]" />
          </a>
        </div>
      </div>
    </div>
  );
}

export default function PointsPage() {
  const router = useRouter();

  // ── AUTH GUARD ─────────────────────────────────────────────
  // null = checking | true = ok | false = no token → redirect
  const [authChecked, setAuthChecked] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login?message=Please login to continue&redirect=/points");
    } else {
      setAuthChecked(true);
    }
  }, []);

  // ── PAGE STATE ─────────────────────────────────────────────
  const [data, setData]             = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [visible, setVisible]       = useState(false);
  const [copied, setCopied]         = useState(false);
  const [showRedeem, setShowRedeem] = useState(false);
  const [tab, setTab]               = useState<"winning" | "referral" | "redeem">("winning");
  const [toast, setToast]           = useState({ msg: "", show: false });

  const pts           = data?.points ?? { total: 0, winning: 0, referral: 0, redeemed: 0 };
  const winHistory    = data?.winningHistory  ?? [];
  const refHistory    = data?.referralHistory ?? [];
  const redeemHistory = data?.redeemHistory   ?? [];
  const referralCode  = data?.referralCode    ?? "—";

  const aniTotal    = useCountUp(pts.total,    visible);
  const aniReferral = useCountUp(pts.referral, visible, 1100);
  const aniWinning  = useCountUp(pts.winning,  visible, 1200);

  const pop = (msg: string) => {
    setToast({ msg, show: true });
    setTimeout(() => setToast((t) => ({ ...t, show: false })), 2500);
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      // Token disappeared mid-session
      if (!token) { router.replace("/login?message=Session expired. Please login again."); return; }

      const res  = await fetch("/api/points", { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json().catch(() => null);

      if (res.status === 401) {
        localStorage.removeItem("token");
        router.replace("/login?message=Session expired. Please login again.");
        return;
      }

      if (!res.ok) throw new Error(json?.error || "Failed to fetch");
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setTimeout(() => setVisible(true), 80);
    }
  };

  // Only fetch after auth confirmed
  useEffect(() => {
    if (authChecked) fetchData();
  }, [authChecked]);

  const handleCopy = () => {
    navigator.clipboard?.writeText(referralCode).catch(() => {});
    setCopied(true);
    pop("Referral code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRedeem = async (amount: number, method: string, detail: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/points/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ points: amount, method, detail }),
      });
      const result = await res.json();

      if (res.status === 401) {
        localStorage.removeItem("token");
        router.replace("/login?message=Session expired. Please login again.");
        return;
      }

      if (!res.ok) { pop(result.error ?? "Redeem failed"); return; }
      setShowRedeem(false);
      pop(`₹${amount} redeem request submitted!`);
      fetchData();
    } catch (e) {
      pop("Something went wrong");
    }
  };

  const available = pts.total - (pts.redeemed ?? 0);

  // ── GUARD: still checking or redirecting ──────────────────
  if (authChecked === null) return <div className="bg-black min-h-screen" />;

  // ── LOADING DATA ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center">
        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-[#F2AA00] w-6 h-6" />
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen text-white px-4 sm:px-6 py-10 relative overflow-x-hidden">
      <div className="pointer-events-none fixed top-0 right-0 w-[500px] h-[500px] rounded-full bg-[#F2AA00]/5 blur-[120px] -translate-y-1/3 translate-x-1/4" />
      <div className="pointer-events-none fixed bottom-0 left-0 w-[380px] h-[380px] rounded-full bg-[#F2AA00]/4 blur-[100px] translate-y-1/3 -translate-x-1/4" />

      {/* Toast */}
      <div className={`fixed bottom-6 right-6 z-50 bg-[#F2AA00] text-black text-sm px-5 py-3 rounded-lg shadow-lg shadow-[#F2AA00]/20 tracking-widest transition-all duration-500 ${toast.show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none"}`}>
        {toast.msg}
      </div>

      {showRedeem && <RedeemModal available={available} onClose={() => setShowRedeem(false)} onSubmit={handleRedeem} />}

      <div className="max-w-4xl mx-auto space-y-5 relative z-10">

        {/* HEADER */}
        <div className={`flex items-start justify-between transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
          <div>
            <p className="text-[10px] tracking-[0.4em] text-[#F2AA00]/60 uppercase mb-1">Wallet</p>
            <h1 className="text-2xl tracking-wide">Points & Rewards</h1>
            <p className="text-gray-600 text-sm mt-1 tracking-wide">Earn by winning · Earn by referring · Redeem for cash</p>
          </div>
          <a href="/contact" className="hidden sm:flex items-center gap-2 text-[10px] text-gray-600 hover:text-[#F2AA00] border border-gray-800 hover:border-[#F2AA00]/30 px-3 py-2 rounded-lg transition-all duration-200 tracking-wide flex-shrink-0 mt-1">
            <FontAwesomeIcon icon={faHeadset} className="text-[9px]" />
            Customer Service
          </a>
        </div>

        {/* TOTAL HERO */}
        <div
          className={`bg-[#0b0b0b] border border-[#F2AA00]/30 rounded-xl p-6 relative overflow-hidden hover:border-[#F2AA00]/50 hover:shadow-xl hover:shadow-[#F2AA00]/10 transition-all duration-400 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          style={{ transitionDelay: "80ms" }}
        >
          <div className="absolute right-0 top-0 w-52 h-52 rounded-full bg-[#F2AA00]/6 blur-3xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
            <div>
              <p className="text-[10px] text-gray-600 tracking-[0.2em] uppercase mb-1">Total Balance</p>
              <div className="flex items-end gap-3">
                <p className="text-5xl text-[#F2AA00] font-mono leading-none">{aniTotal}</p>
                <p className="text-gray-500 text-sm mb-0.5 tracking-wide">pts</p>
              </div>
              <p className="text-sm text-gray-600 mt-2 tracking-wide">
                = <span className="text-gray-400">&#8377;{aniTotal}</span> redeemable &nbsp;·&nbsp;
                <span className="text-gray-600">{pts.redeemed} pts redeemed</span>
              </p>
            </div>
            <button
              onClick={() => setShowRedeem(true)}
              disabled={available < 200}
              className={`self-start sm:self-auto flex items-center gap-2 px-6 py-3 text-sm tracking-widest rounded-xl border transition-all duration-200 active:scale-[0.97] ${available >= 200 ? "bg-[#F2AA00] text-black border-[#F2AA00] hover:bg-[#e09e00] hover:shadow-lg hover:shadow-[#F2AA00]/20" : "border-gray-800 text-gray-600 bg-black/20 cursor-not-allowed"}`}
            >
              {available >= 200
                ? <> Redeem Points <FontAwesomeIcon icon={faArrowRight} className="text-sm" /></>
                : <><FontAwesomeIcon icon={faLock} className="text-sm" /> Need {200 - available} more pts</>}
            </button>
          </div>
        </div>

        {/* BREAKDOWN */}
        <div className={`grid sm:grid-cols-2 gap-4 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`} style={{ transitionDelay: "160ms" }}>
          <div className="bg-[#0b0b0b] border border-gray-800 rounded-xl p-5 group hover:border-[#F2AA00]/30 hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#F2AA00]/10 flex items-center justify-center group-hover:bg-[#F2AA00]/20 transition-colors duration-200">
                  <FontAwesomeIcon icon={faTrophy} className="text-[#F2AA00] text-sm" />
                </div>
                <div>
                  <p className="text-sm text-white tracking-widest">Winning Points</p>
                  <p className="text-[13px] text-gray-600 mt-0.5">Added by admin when you win</p>
                </div>
              </div>
              <p className="text-[#F2AA00] font-mono text-xl">{aniWinning}</p>
            </div>
            <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden">
              <div className="h-full bg-[#F2AA00] rounded-full transition-all duration-700" style={{ width: visible ? `${(pts.winning / (pts.total || 1)) * 100}%` : "0%" }} />
            </div>
            <p className="text-[9px] text-gray-700 mt-1.5 tracking-wide">{Math.round((pts.winning / (pts.total || 1)) * 100)}% of total</p>
          </div>

          <div className="bg-[#0b0b0b] border border-gray-800 rounded-xl p-5 group hover:border-[#F2AA00]/30 hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#F2AA00]/10 flex items-center justify-center group-hover:bg-[#F2AA00]/20 transition-colors duration-200">
                  <FontAwesomeIcon icon={faGift} className="text-[#F2AA00] text-sm" />
                </div>
                <div>
                  <p className="text-sm text-white tracking-widest">Referral Points</p>
                  <p className="text-[13px] text-gray-600 mt-0.5">1–100 pts per referral, auto-added</p>
                </div>
              </div>
              <p className="text-[#F2AA00] font-mono text-xl">{aniReferral}</p>
            </div>
            <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden">
              <div className="h-full bg-[#F2AA00]/70 rounded-full transition-all duration-700" style={{ width: visible ? `${(pts.referral / (pts.total || 1)) * 100}%` : "0%" }} />
            </div>
            <p className="text-[9px] text-gray-700 mt-1.5 tracking-wide">{Math.round((pts.referral / (pts.total || 1)) * 100)}% of total · {refHistory.length} referrals</p>
          </div>
        </div>

        {/* REFERRAL CODE */}
        <div className={`bg-[#0b0b0b] border border-gray-800 rounded-xl p-5 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`} style={{ transitionDelay: "240ms" }}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-white tracking-wide">Refer to Earn Points</p>
              <p className="text-[10px] text-gray-600 mt-0.5 tracking-wide">
                Share your code — earn <span className="text-[#F2AA00]">1 to 100 points</span> per referral, auto-added
              </p>
            </div>
            <span className="text-[10px] text-gray-600 border border-gray-800 px-2.5 py-1 rounded-full tracking-widest flex-shrink-0 ml-3">{refHistory.length} used</span>
          </div>
          <div className="flex items-center justify-between bg-black border border-gray-800 hover:border-[#F2AA00]/30 rounded-xl px-4 py-3.5 mb-3 transition-colors duration-200">
            <p className="text-[#F2AA00] font-mono tracking-[0.35em] text-sm">{referralCode}</p>
            <button onClick={handleCopy} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all duration-200 ${copied ? "border-[#F2AA00]/50 bg-[#F2AA00]/10 text-[#F2AA00]" : "border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white"}`}>
              <FontAwesomeIcon icon={copied ? faCheck : faCopy} className="text-[9px]" />
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <div className="space-y-1.5">
            {refHistory.slice(0, 3).map((r: any) => (
              <div key={r.id} className="flex items-center justify-between px-3 py-2 bg-black/40 rounded-lg border border-gray-800/50 hover:border-gray-800 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#F2AA00]/20 flex items-center justify-center text-[8px] text-[#F2AA00]">{r.userName?.[0] ?? "?"}</div>
                  <p className="text-[14px] text-gray-500">{r.userName} used your code</p>
                </div>
                <div className="text-right">
                  <p className="text-[14px] text-[#F2AA00]">+{r.earned} pts</p>
                  <p className="text-[11px] text-gray-700">{r.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* HISTORY TABS */}
        <div className={`bg-[#0b0b0b] border border-gray-800 rounded-xl overflow-hidden transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`} style={{ transitionDelay: "320ms" }}>
          <div className="flex border-b border-gray-800">
            {([
              { key: "winning",  label: "Winning",   icon: faTrophy },
              { key: "referral", label: "Referrals", icon: faGift   },
              { key: "redeem",   label: "Redeems",   icon: faCoins  },
            ] as const).map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-[12px] tracking-widest border-b-2 transition-all duration-200 ${tab === t.key ? "border-[#F2AA00] text-[#F2AA00] bg-[#F2AA00]/5" : "border-transparent text-gray-600 hover:text-gray-400"}`}
              >
                <FontAwesomeIcon icon={t.icon} className="text-[9px]" />
                {t.label}
              </button>
            ))}
          </div>

          {tab === "winning" && (
            <div className="p-4 space-y-2">
              {winHistory.length === 0
                ? <p className="text-center py-10 text-gray-700 text-xs tracking-widest">No winning points yet.</p>
                : winHistory.map((w: any, i: number) => (
                  <div key={w.id} className={`flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all duration-300 hover:-translate-x-0.5 ${badgeStyle[w.badge] ?? badgeStyle.default}`} style={{ transitionDelay: `${i * 50}ms` }}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl flex-shrink-0">{badgeEmoji[w.badge] ?? "🏅"}</span>
                      <div>
                        <p className="text-xs text-white tracking-wide">{w.tournament ?? w.note ?? "Tournament"}</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">{posLabel[w.position] ?? `#${w.position}`} Place · {w.date}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className="text-[#F2AA00] font-mono text-sm">+{w.points}</p>
                      <p className="text-[10px] text-gray-600">points</p>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {tab === "referral" && (
            <div className="p-4 space-y-2">
              {refHistory.length === 0
                ? <p className="text-center py-10 text-gray-700 text-xs tracking-widest">No referrals yet.</p>
                : refHistory.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between px-4 py-3 bg-black border border-gray-800 rounded-xl hover:border-gray-700 transition-colors duration-150">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#F2AA00]/20 flex items-center justify-center text-xs text-[#F2AA00]">{r.userName?.[0] ?? "?"}</div>
                      <div>
                        <p className="text-xs text-white">{r.userName}</p>
                        <p className="text-[10px] text-gray-600">{r.date}</p>
                      </div>
                    </div>
                    <p className="text-[#F2AA00] font-mono">+{r.earned} pts</p>
                  </div>
                ))}
            </div>
          )}

          {tab === "redeem" && (
            <div className="p-4 space-y-2">
              {redeemHistory.length === 0
                ? <p className="text-center py-10 text-gray-700 text-xs tracking-widest">No redeem requests yet.</p>
                : redeemHistory.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between px-4 py-3.5 bg-black border border-gray-800 rounded-xl hover:border-gray-700 transition-colors duration-150">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#F2AA00]/10 flex items-center justify-center flex-shrink-0">
                        <FontAwesomeIcon icon={faIndianRupeeSign} className="text-[#F2AA00] text-xs" />
                      </div>
                      <div>
                        <p className="text-xs text-white font-mono">&#8377;{r.amount}</p>
                        <p className="text-[10px] text-gray-600 mt-0.5">{r.method} · {r.detail} · {r.date}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] px-2.5 py-1 rounded-md border tracking-wide flex-shrink-0 ${statusStyle[r.status?.toLowerCase()] ?? statusStyle.pending}`}>
                      {r.status}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#0b0b0b] border border-gray-800 rounded-xl px-5 py-4 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`} style={{ transitionDelay: "400ms" }}>
          <div className="flex items-center gap-2.5">
            <FontAwesomeIcon icon={faLock} className="text-gray-600 text-xs flex-shrink-0" />
            <p className="text-[10px] text-gray-500 tracking-wide">
              Minimum redeem: <span className="text-white">200 points</span>
              &nbsp;·&nbsp; 1 pt = <span className="text-[#F2AA00]">&#8377;1</span>
              &nbsp;·&nbsp; Processed in 2–24 hrs
            </p>
          </div>
          <div className="flex items-center gap-3">
            {available >= 200
              ? <button onClick={() => setShowRedeem(true)} className="text-[10px] text-[#F2AA00] hover:text-[#F2AA00]/70 tracking-widest transition-colors flex items-center gap-1.5">
                  Redeem Now <FontAwesomeIcon icon={faArrowRight} className="text-[8px]" />
                </button>
              : <p className="text-[10px] text-gray-700">{200 - available} pts to unlock</p>}
            <a href="/contact" className="flex items-center gap-1.5 text-[10px] text-gray-600 hover:text-[#F2AA00] transition-colors duration-200 tracking-wide border-l border-gray-800 pl-3">
              <FontAwesomeIcon icon={faHeadset} className="text-[9px]" />
              Customer Service
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}