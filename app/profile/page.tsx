"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner, faCopy, faCheck, faTrophy,
  faArrowRight, faCalendarDays, faCoins,
  faShield, faUser, faPhone,
} from "@fortawesome/free-solid-svg-icons";

// ── useCountUp ────────────────────────────────────────────
function useCountUp(target: number, duration = 1000) {
  const [count, setCount] = useState(0);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    let start: number | null = null;
    const animate = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const ease     = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(ease * target));
      if (progress < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration]);
  return count;
}

export default function ProfilePage() {
  const router = useRouter();

  // ── AUTH GUARD ─────────────────────────────────────────────
  const [authChecked, setAuthChecked] = useState<boolean | null>(null);
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login?message=Please login to continue&redirect=/profile");
    } else {
      setAuthChecked(true);
    }
  }, []);

  // ── STATE ──────────────────────────────────────────────────
  const [data,       setData]      = useState<any>(null);
  const [loading,    setLoading]   = useState(true);
  const [visible,    setVisible]   = useState(false);
  const [copied,     setCopied]    = useState(false);
  const [toast,      setToast]     = useState({ msg: "", show: false });
  const [editMode,   setEditMode]  = useState(false);
  const [editName,   setEditName]  = useState("");
  const [editPhone,  setEditPhone] = useState("");
  const [saving,     setSaving]    = useState(false);

  const profile = data?.profile;
  const stats   = data?.stats ?? {};

  const animatedMatches  = useCountUp(stats.matchesPlayed   ?? 0);
  const animatedUpcoming = useCountUp(stats.upcomingMatches ?? 0);
  const animatedPoints   = useCountUp(stats.totalPoints     ?? 0);

  const showToast = (msg: string) => {
    setToast({ msg, show: true });
    setTimeout(() => setToast({ msg: "", show: false }), 2500);
  };

  // ── FETCH — only after auth confirmed ─────────────────────
  useEffect(() => {
    if (!authChecked) return;
    const token = localStorage.getItem("token");
    fetch("/api/profile", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        if (r.status === 401) {
          localStorage.removeItem("token");
          router.replace("/login?message=Session expired. Please login again.");
          return null;
        }
        return r.json();
      })
      .then((d) => {
        if (!d) return;
        setData(d);
        setEditName(d.profile?.name   ?? "");
        setEditPhone(d.profile?.phone ?? "");
      })
      .catch(console.error)
      .finally(() => { setLoading(false); setTimeout(() => setVisible(true), 50); });
  }, [authChecked]);

  const handleCopy = () => {
    navigator.clipboard?.writeText(profile?.referralCode ?? "").catch(() => {});
    setCopied(true);
    showToast("Referral code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res   = await fetch("/api/profile", {
        method:  "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ name: editName, phone: editPhone }),
      });
      if (res.status === 401) {
        localStorage.removeItem("token");
        router.replace("/login?message=Session expired. Please login again.");
        return;
      }
      if (res.ok) {
        setData((prev: any) => ({
          ...prev,
          profile: { ...prev.profile, name: editName, phone: editPhone },
        }));
        setEditMode(false);
        showToast("Profile updated ✓");
      }
    } catch { showToast("Update failed"); }
    finally  { setSaving(false); }
  };

  const cardBase = "bg-[#0b0b0b] border border-gray-800 rounded-xl transition-all duration-500";
  const inputCls = "w-full bg-black border border-gray-800 focus:border-[#F2AA00]/50 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-colors duration-200";

  // ── GUARDS ────────────────────────────────────────────────
  if (authChecked === null) return <div className="bg-black min-h-screen" />;

  if (loading) return (
    <div className="bg-black min-h-screen flex items-center justify-center">
      <FontAwesomeIcon icon={faSpinner} className="animate-spin text-[#F2AA00] w-6 h-6" />
    </div>
  );

  return (
    <div className="bg-black min-h-screen text-white px-4 sm:px-6 py-10 relative overflow-x-hidden">

      {/* Ambient glow */}
      <div className="pointer-events-none fixed top-0 right-0 w-[500px] h-[500px] rounded-full bg-[#F2AA00]/5 blur-[120px] -translate-y-1/2 translate-x-1/3" />
      <div className="pointer-events-none fixed bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[#F2AA00]/4 blur-[100px] translate-y-1/2 -translate-x-1/3" />

      {/* Toast */}
      <div className={`fixed bottom-6 right-6 z-50 bg-[#F2AA00] text-black text-sm px-5 py-3 rounded-lg shadow-lg shadow-[#F2AA00]/30 tracking-widest transition-all duration-500 ${toast.show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8 pointer-events-none"}`}>
        {toast.msg}
      </div>

      <div className="max-w-3xl mx-auto space-y-5 relative z-10">

        {/* PAGE LABEL */}
        <div className={`transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
          <p className="text-[10px] tracking-[0.4em] text-[#F2AA00]/60 uppercase mb-1">Account</p>
          <h1 className="text-2xl tracking-wide">My Profile</h1>
        </div>

        {/* HEADER CARD */}
        <div className={`${cardBase} p-5 sm:p-6 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`} style={{ transitionDelay: "60ms" }}>
          {!editMode ? (
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#F2AA00] to-[#c47f00] flex items-center justify-center text-black text-xl shadow-lg shadow-[#F2AA00]/20">
                    {profile?.name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  {/* online dot */}
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-[#0b0b0b]" />
                </div>
                <div>
                  <h2 className="text-lg tracking-wide">{profile?.name ?? "—"}</h2>
                  <p className="text-gray-500 text-sm font-mono mt-0.5">{profile?.email ?? "—"}</p>
                  {profile?.phone
                    ? <p className="text-gray-600 text-xs mt-0.5 flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faPhone} className="text-[9px]" />
                        {profile.phone}
                      </p>
                    : <p className="text-gray-700 text-xs mt-0.5 italic">No phone added</p>}
                  <p className="text-gray-700 text-[10px] mt-1 tracking-wide">
                    Member since {profile?.joinedAt
                      ? new Date(profile.joinedAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
                      : "—"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditMode(true)}
                className="self-start sm:self-auto flex items-center gap-2 border border-gray-700 px-4 py-2 text-sm rounded-lg text-gray-300 hover:border-[#F2AA00] hover:text-[#F2AA00] hover:bg-[#F2AA00]/5 transition-all duration-200 tracking-wide"
              >
                <FontAwesomeIcon icon={faUser} className="text-[10px]" />
                Edit Profile
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[9px] text-gray-500 tracking-[0.3em] uppercase mb-2">Edit Profile</p>
              <div className="relative">
                <FontAwesomeIcon icon={faUser} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600 text-xs pointer-events-none" />
                <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Display Name" className={inputCls + " pl-9"} />
              </div>
              <div className="relative">
                <FontAwesomeIcon icon={faPhone} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600 text-xs pointer-events-none" />
                <input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="Phone Number" className={inputCls + " pl-9"} />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 bg-[#F2AA00] text-black px-5 py-2 text-sm rounded-lg hover:bg-[#e09e00] active:scale-95 transition-all duration-150 tracking-widest"
                >
                  {saving && <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs" />}
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={() => { setEditMode(false); setEditName(profile?.name ?? ""); setEditPhone(profile?.phone ?? ""); }}
                  className="border border-gray-700 text-gray-400 px-5 py-2 text-sm rounded-lg hover:border-gray-600 hover:text-white transition-all duration-150"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Matches Played",   value: animatedMatches,  gold: false, icon: faShield,       delay: "120ms" },
            { label: "Upcoming Matches", value: animatedUpcoming, gold: false, icon: faCalendarDays, delay: "180ms" },
            { label: "Total Points",     value: animatedPoints,   gold: true,  icon: faCoins,        delay: "240ms" },
          ].map(({ label, value, gold, icon, delay }) => (
            <div
              key={label}
              className={`${cardBase} p-5 group hover:border-gray-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/50 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
              style={{ transitionDelay: delay }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-gray-500 text-[10px] tracking-widest uppercase">{label}</p>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${gold ? "bg-[#F2AA00]/10" : "bg-gray-800"}`}>
                  <FontAwesomeIcon icon={icon} className={`text-xs ${gold ? "text-[#F2AA00]" : "text-gray-500"}`} />
                </div>
              </div>
              <h3 className={`text-3xl font-mono ${gold ? "text-[#F2AA00]" : "text-white"}`}>
                {value}
                {gold && <span className="text-sm font-normal text-gray-500 ml-1">pts</span>}
              </h3>
              {gold && (
                <div className="mt-2 h-0.5 w-8 bg-[#F2AA00]/40 rounded-full group-hover:w-full transition-all duration-500" />
              )}
            </div>
          ))}
        </div>

        {/* MY MATCHES QUICK LINK */}
        <div
          className={`${cardBase} p-5 hover:border-[#F2AA00]/20 group cursor-pointer transition-all duration-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          style={{ transitionDelay: "300ms" }}
          onClick={() => router.push("/my-matches")}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#F2AA00]/10 flex items-center justify-center group-hover:bg-[#F2AA00]/20 transition-colors duration-200">
                <FontAwesomeIcon icon={faTrophy} className="text-[#F2AA00] text-sm" />
              </div>
              <div>
                <p className="text-sm text-white tracking-wide">My Matches</p>
                <p className="text-[11px] text-gray-600 mt-0.5">
                  {stats.matchesPlayed ?? 0} registered ·&nbsp;
                  <span className="text-[#F2AA00]">{stats.upcomingMatches ?? 0} upcoming</span>
                  &nbsp;· Room info &amp; countdown
                </p>
              </div>
            </div>
            <FontAwesomeIcon
              icon={faArrowRight}
              className="text-gray-600 group-hover:text-[#F2AA00] group-hover:translate-x-1 transition-all duration-200"
            />
          </div>
        </div>

        {/* REFERRAL */}
        <div
          className={`${cardBase} p-5 sm:p-6 hover:border-gray-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          style={{ transitionDelay: "360ms" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm tracking-wide text-white">Referral Code</h3>
              <p className="text-[10px] text-gray-600 mt-0.5">Earn 1–100 pts every time someone signs up with your code</p>
            </div>
            <span className="text-[10px] text-gray-500 border border-gray-800 px-2.5 py-1 rounded-full tracking-widest flex-shrink-0 ml-3">
              {stats.referralCount ?? 0} used
            </span>
          </div>
          <div className="flex items-center justify-between bg-black border border-gray-800 px-4 py-3.5 rounded-xl hover:border-[#F2AA00]/30 transition-colors duration-200">
            <span className="text-[#F2AA00] font-mono tracking-[0.35em] text-sm">
              {profile?.referralCode ?? "—"}
            </span>
            <button
              onClick={handleCopy}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all duration-200 flex items-center gap-1.5 ${copied ? "border-[#F2AA00]/50 bg-[#F2AA00]/10 text-[#F2AA00]" : "border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white"}`}
            >
              <FontAwesomeIcon icon={copied ? faCheck : faCopy} className="text-[9px]" />
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          {/* Points breakdown mini */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              { label: "Winning",  val: stats.winningPoints  ?? 0 },
              { label: "Referral", val: stats.referralPoints ?? 0 },
              { label: "Redeemed", val: stats.redeemedPoints ?? 0 },
            ].map((s) => (
              <div key={s.label} className="bg-black border border-gray-800 rounded-lg px-3 py-2.5 text-center">
                <p className="text-[9px] text-gray-600 tracking-widest uppercase mb-1">{s.label}</p>
                <p className="text-sm text-[#F2AA00] font-mono">{s.val}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => router.push("/redeem-points")}
            className="mt-3 w-full flex items-center justify-center gap-2 text-[10px] text-gray-600 hover:text-[#F2AA00] border border-gray-800 hover:border-[#F2AA00]/20 rounded-lg py-2.5 transition-all duration-200 tracking-widest"
          >
            View Points & Redeem
            <FontAwesomeIcon icon={faArrowRight} className="text-[8px]" />
          </button>
        </div>

      </div>
    </div>
  );
}