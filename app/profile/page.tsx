"use client";

import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faCopy, faCheck } from "@fortawesome/free-solid-svg-icons";

// ── useCountUp ────────────────────────────────────────────
function useCountUp(target: number, duration = 1000) {
  const [count, setCount] = useState(0);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    let start: number | null = null;
    const animate = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(ease * target));
      if (progress < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration]);
  return count;
}

export default function ProfilePage() {
  const [data, setData]         = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [visible, setVisible]   = useState(false);
  const [copied, setCopied]     = useState(false);
  const [toast, setToast]       = useState({ msg: "", show: false });

  // edit state
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [saving, setSaving]     = useState(false);

  const profile = data?.profile;
  const stats   = data?.stats ?? {};

  const animatedMatches   = useCountUp(stats.matchesPlayed   ?? 0);
  const animatedUpcoming  = useCountUp(stats.upcomingMatches ?? 0);
  const animatedPoints    = useCountUp(stats.totalPoints     ?? 0);

  const showToast = (msg: string) => {
    setToast({ msg, show: true });
    setTimeout(() => setToast({ msg: "", show: false }), 2500);
  };

  // ── FETCH ─────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("/api/profile", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setEditName(d.profile?.name ?? "");
        setEditPhone(d.profile?.phone ?? "");
      })
      .catch(console.error)
      .finally(() => { setLoading(false); setTimeout(() => setVisible(true), 50); });
  }, []);

  const handleCopy = () => {
    navigator.clipboard?.writeText(profile?.referralCode ?? "");
    setCopied(true);
    showToast("Referral code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: editName, phone: editPhone }),
      });
      if (res.ok) {
        setData((prev: any) => ({ ...prev, profile: { ...prev.profile, name: editName, phone: editPhone } }));
        setEditMode(false);
        showToast("Profile updated ✓");
      }
    } catch (e) {
      showToast("Update failed");
    } finally {
      setSaving(false);
    }
  };

  const cardBase = "bg-[#0b0b0b] border border-gray-800 rounded-xl transition-all duration-700";
  const inputCls = "w-full bg-black border border-gray-800 focus:border-[#F2AA00]/50 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-colors duration-200";

  // ── LOADING ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center">
        <FontAwesomeIcon icon={faSpinner} className="animate-spin text-[#F2AA00] w-6 h-6" />
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen text-white px-4 sm:px-6 py-10 relative overflow-x-hidden">

      {/* Ambient glow */}
      <div className="pointer-events-none fixed top-0 right-0 w-[500px] h-[500px] rounded-full bg-[#F2AA00]/5 blur-[120px] -translate-y-1/2 translate-x-1/3" />
      <div className="pointer-events-none fixed bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[#F2AA00]/4 blur-[100px] translate-y-1/2 -translate-x-1/3" />

      {/* Toast */}
      <div className={`fixed bottom-6 right-6 z-50 bg-[#F2AA00] text-black text-sm px-5 py-3 rounded-lg shadow-lg shadow-[#F2AA00]/30 transition-all duration-500 ${toast.show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8 pointer-events-none"}`}>
        {toast.msg}
      </div>

      <div className="max-w-3xl mx-auto space-y-5 relative z-10">

        {/* HEADER CARD */}
        <div
          className={`${cardBase} p-5 sm:p-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          {!editMode ? (
            <>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#F2AA00] to-[#c47f00] flex items-center justify-center text-black text-lg flex-shrink-0 shadow-lg shadow-[#F2AA00]/20">
                  {profile?.name?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div>
                  <h2 className="text-lg tracking-wide">{profile?.name ?? "—"}</h2>
                  <p className="text-gray-500 text-sm font-mono">{profile?.email ?? "—"}</p>
                  {profile?.phone && <p className="text-gray-600 text-xs mt-0.5">{profile.phone}</p>}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setEditMode(true)}
                  className="border border-gray-700 px-4 py-1.5 text-sm rounded-lg text-gray-300 hover:border-[#F2AA00] hover:text-[#F2AA00] hover:bg-[#F2AA00]/5 transition-all duration-200"
                >
                  Edit Profile
                </button>
              </div>
            </>
          ) : (
            <div className="w-full space-y-3">
              <p className="text-xs text-gray-500 tracking-widest uppercase">Edit Profile</p>
              <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Name" className={inputCls} />
              <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="Phone" className={inputCls} />
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={saving} className="bg-[#F2AA00] text-black px-5 py-2 text-sm rounded-lg hover:bg-[#e09e00] active:scale-95 transition-all duration-150 tracking-widest">
                  {saving ? "Saving..." : "Save"}
                </button>
                <button onClick={() => setEditMode(false)} className="border border-gray-700 text-gray-400 px-5 py-2 text-sm rounded-lg hover:border-gray-600 hover:text-white transition-all duration-150">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Matches Played",   value: animatedMatches,  gold: false, delay: "100ms" },
            { label: "Upcoming Matches", value: animatedUpcoming, gold: false, delay: "150ms" },
            { label: "Total Points",     value: animatedPoints,   gold: true,  delay: "200ms" },
          ].map(({ label, value, gold, delay }) => (
            <div
              key={label}
              className={`${cardBase} p-5 group hover:border-gray-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/50 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
              style={{ transitionDelay: delay }}
            >
              <p className="text-gray-500 text-xs tracking-widest uppercase">{label}</p>
              <h3 className={`text-2xl mt-2 ${gold ? "text-[#F2AA00]" : "text-white"}`}>
                {value}
                {gold && <span className="text-sm font-normal text-gray-500 ml-1">pts</span>}
              </h3>
              {gold && <div className="mt-2 h-0.5 w-8 bg-[#F2AA00]/40 rounded-full group-hover:w-full transition-all duration-500" />}
            </div>
          ))}
        </div>

        {/* REFERRAL */}
        <div
          className={`${cardBase} p-5 sm:p-6 hover:border-gray-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          style={{ transitionDelay: "250ms" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="tracking-wide">Referral Code</h3>
            <span className="text-xs text-gray-500 border border-gray-800 px-2 py-0.5 rounded-full">Earn 1–100 pts per use</span>
          </div>
          <div className="flex items-center justify-between bg-black border border-gray-800 px-4 py-3 rounded-lg hover:border-[#F2AA00]/30 transition-colors duration-200">
            <span className="text-[#F2AA00] font-mono tracking-widest text-sm">
              {profile?.referralCode ?? "—"}
            </span>
            <button
              onClick={handleCopy}
              className={`text-xs px-3 py-1.5 rounded-md border transition-all duration-200 flex items-center gap-1.5 ${copied ? "border-[#F2AA00] bg-[#F2AA00]/10 text-[#F2AA00]" : "border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white"}`}
            >
              <FontAwesomeIcon icon={copied ? faCheck : faCopy} className="text-[9px]" />
              {copied ? "Copied ✓" : "Copy"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}