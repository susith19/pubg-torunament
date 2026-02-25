"use client";
import { useState, useEffect, useRef } from "react";

function useCountUp(target, duration = 1000) {
  const [count, setCount] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    let start = null;
    const animate = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(ease * target));
      if (progress < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return count;
}

export default function ProfilePage() {
  const totalPoints = 420;
  const [redeemPoints, setRedeemPoints] = useState(200);
  const [upi, setUpi] = useState("");
  const [account, setAccount] = useState("");
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState({ msg: "", show: false });
  const [visible, setVisible] = useState(false);

  const animatedMatches = useCountUp(24);
  const animatedUpcoming = useCountUp(5);
  const animatedPoints = useCountUp(totalPoints);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const showToast = (msg) => {
    setToast({ msg, show: true });
    setTimeout(() => setToast({ msg: "", show: false }), 2500);
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText("SUSITH123");
    setCopied(true);
    showToast("Referral code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRedeem = () => {
    if (redeemPoints < 200) return showToast("Minimum 200 points required");
    if (redeemPoints > totalPoints) return showToast("Not enough points");
    if (!upi && !account) return showToast("Enter UPI ID");
    showToast(`₹${redeemPoints} redemption submitted ✓`);
  };

  const remaining = totalPoints - redeemPoints;
  const barWidth = Math.min(Math.max((redeemPoints / totalPoints) * 100, 0), 100);
  const isValid = redeemPoints >= 200 && redeemPoints <= totalPoints;

  const cardBase =
    "bg-[#0b0b0b] border border-gray-800 rounded-xl transition-all duration-700";

  return (
    <div className="bg-black min-h-screen text-white px-4 sm:px-6 py-10 relative overflow-x-hidden">

      {/* Ambient glow */}
      <div className="pointer-events-none fixed top-0 right-0 w-[500px] h-[500px] rounded-full bg-[#F2AA00]/5 blur-[120px] -translate-y-1/2 translate-x-1/3" />
      <div className="pointer-events-none fixed bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[#F2AA00]/4 blur-[100px] translate-y-1/2 -translate-x-1/3" />

      {/* Toast */}
      <div
        className={`fixed bottom-6 right-6 z-50 bg-[#F2AA00] text-black text-sm px-5 py-3 rounded-lg shadow-lg shadow-[#F2AA00]/30 transition-all duration-500 ${
          toast.show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8 pointer-events-none"
        }`}
      >
        {toast.msg}
      </div>

      <div className="max-w-3xl mx-auto space-y-5 relative z-10">

        {/* HEADER */}
        <div
          className={`${cardBase} p-5 sm:p-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
          style={{ transitionDelay: "0ms" }}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#F2AA00] to-[#c47f00] flex items-center justify-center text-black text-lg flex-shrink-0 shadow-lg shadow-[#F2AA00]/20">
              S
            </div>
            <div>
              <h2 className="text-lg tracking-wide">Susith</h2>
              <p className="text-gray-500 text-sm font-mono">susith@email.com</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button className="border border-gray-700 px-4 py-1.5 text-sm rounded-lg text-gray-300 hover:border-[#F2AA00] hover:text-[#F2AA00] hover:bg-[#F2AA00]/5 transition-all duration-200">
              Edit Profile
            </button>
            <button className="border border-gray-700 px-4 py-1.5 text-sm rounded-lg text-gray-300 hover:border-[#F2AA00] hover:text-[#F2AA00] hover:bg-[#F2AA00]/5 transition-all duration-200">
              Change Password
            </button>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Matches Played", value: animatedMatches, gold: false, delay: "100ms" },
            { label: "Upcoming Matches", value: animatedUpcoming, gold: false, delay: "150ms" },
            { label: "Total Points", value: animatedPoints, gold: true, delay: "200ms" },
          ].map(({ label, value, gold, delay }) => (
            <div
              key={label}
              className={`${cardBase} p-5 group hover:border-gray-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/50 ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
              style={{ transitionDelay: delay }}
            >
              <p className="text-gray-500 text-xs tracking-widest uppercase">{label}</p>
              <h3 className={`text-2xl mt-2 ${gold ? "text-[#F2AA00]" : "text-white"}`}>
                {value}
                {gold && <span className="text-sm font-normal text-gray-500 ml-1">pts</span>}
              </h3>
              {gold && (
                <div className="mt-2 h-0.5 w-8 bg-[#F2AA00]/40 rounded-full group-hover:w-full transition-all duration-500" />
              )}
            </div>
          ))}
        </div>

        {/* REFERRAL */}
        <div
          className={`${cardBase} p-5 sm:p-6 hover:border-gray-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
          style={{ transitionDelay: "250ms" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="tracking-wide ">Referral Code</h3>
            <span className="text-xs text-gray-500 border border-gray-800 px-2 py-0.5 rounded-full">
              Earn 1–10 pts per use
            </span>
          </div>
          <div className="flex items-center justify-between bg-black border border-gray-800 px-4 py-3 rounded-lg hover:border-[#F2AA00]/30 transition-colors duration-200">
            <span className="text-[#F2AA00] font-mono  tracking-widest text-sm">
              SUSITH123
            </span>
            <button
              onClick={handleCopy}
              className={`text-xs px-3 py-1.5 rounded-md border transition-all duration-200 ${
                copied
                  ? "border-[#F2AA00] bg-[#F2AA00]/10 text-[#F2AA00]"
                  : "border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white"
              }`}
            >
              {copied ? "Copied ✓" : "Copy"}
            </button>
          </div>
        </div>

        {/* REDEEM */}
        <div
          className={`${cardBase} p-5 sm:p-6 hover:border-gray-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
          style={{ transitionDelay: "300ms" }}
        >
          <div className="flex items-start justify-between mb-1">
            <h3 className="tracking-wide">Redeem Points</h3>
            <span className="text-xs font-mono text-[#F2AA00] bg-[#F2AA00]/10 px-2.5 py-1 rounded-full border border-[#F2AA00]/20">
              {totalPoints} pts available
            </span>
          </div>
          <p className="text-gray-500 text-xs mb-5">Minimum redeem: 200 points · 1 pt = ₹1</p>

          {/* Progress bar */}
          <div className="mb-5">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-gray-500">Redeeming</span>
              <span className={remaining < 0 ? "text-red-400" : "text-gray-400"}>
                {remaining >= 0 ? `${remaining} pts remaining` : "Exceeds balance"}
              </span>
            </div>
            <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  !isValid && redeemPoints > 0 ? "bg-red-500" : "bg-[#F2AA00]"
                }`}
                style={{ width: `${barWidth}%` }}
              />
            </div>
          </div>

          {/* Points input */}
          <div className="relative mb-3">
            <input
              type="number"
              value={redeemPoints}
              min={200}
              max={totalPoints}
              onChange={(e) => setRedeemPoints(Number(e.target.value))}
              className="w-full bg-black border border-gray-800 focus:border-[#F2AA00]/50 px-4 py-3 outline-none rounded-lg text-white font-mono transition-colors duration-200 pr-20"
            />
            <button
              onClick={() => setRedeemPoints(totalPoints)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#F2AA00] hover:text-[#F2AA00]/70  transition-colors"
            >
              MAX
            </button>
          </div>

          {/* Conversion */}
          <div className={`flex items-center gap-2 mb-5 transition-all duration-300 ${isValid ? "opacity-100" : "opacity-40"}`}>
            <span className="text-gray-500 text-sm">You receive</span>
            <span className="text-[#F2AA00]  text-2xl font-mono">
              ₹{isValid ? redeemPoints : 0}
            </span>
          </div>

          {/* Bank Details */}
          <div className="grid grid-cols-1 sm:grid-cols-1 gap-3 mb-5">
            <input
              value={upi}
              onChange={(e) => setUpi(e.target.value)}
              placeholder="UPI ID"
              className="bg-black border border-gray-800 focus:border-[#F2AA00]/50 px-4 py-3 outline-none rounded-lg text-sm placeholder-gray-600 transition-colors duration-200"
            />
          </div>

          <button
            onClick={handleRedeem}
            className={`w-full sm:w-auto bg-[#F2AA00] text-black  px-8 py-3 rounded-lg transition-all duration-200 text-sm tracking-wide ${
              isValid
                ? "opacity-100 hover:bg-[#e09e00] hover:shadow-lg hover:shadow-[#F2AA00]/20 active:scale-95"
                : "opacity-40 cursor-not-allowed"
            }`}
          >
            Redeem Now →
          </button>
          <p className="text-gray-600 text-xs mt-3">
            You will receive money within 2–24 hours.
          </p>
        </div>

      </div>
    </div>
  );
}