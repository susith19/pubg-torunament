"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck, faCloudArrowUp, faCircleExclamation,
  faUser, faHashtag, faEnvelope, faMobileScreen, faShield,
} from "@fortawesome/free-solid-svg-icons";

// All tournaments are data-driven. Replace with API fetch.
const TOURNAMENTS_DATA: Record<string, any> = {
  Squad: {
    id: "t-001",
    name: "Erangel Squad Battle",
    map: "Erangel",
    mode: "Squad",
    platform: "BGMI",
    playerCount: 4,
    fee: 50,
    slots: 100,
    filled: 45,
    date: "Dec 1, 2026",
    time: "18:00",
    mapImage: "/Erangle.jpg",
    prizes: [
      { place: "1st Place", emoji: "gold",   amount: "15,000" },
      { place: "2nd Place", emoji: "silver", amount: "7,000"  },
      { place: "3rd Place", emoji: "bronze", amount: "3,000"  },
    ],
  },
  Duo: {
    id: "t-002",
    name: "Miramar Duo Clash",
    map: "Miramar",
    mode: "Duo",
    platform: "PUBG",
    playerCount: 2,
    fee: 30,
    slots: 50,
    filled: 38,
    date: "Dec 3, 2026",
    time: "19:00",
    mapImage: "/miramar.jpg",
    prizes: [
      { place: "1st Place", emoji: "gold",   amount: "6,000" },
      { place: "2nd Place", emoji: "silver", amount: "2,500" },
      { place: "3rd Place", emoji: "bronze", amount: "1,500" },
    ],
  },
  Solo: {
    id: "t-003",
    name: "Sanhok Solo Rush",
    map: "Sanhok",
    mode: "Solo",
    platform: "BGMI",
    playerCount: 1,
    fee: 20,
    slots: 25,
    filled: 18,
    date: "Dec 5, 2026",
    time: "17:00",
    mapImage: "/Sanhok.jpg",
    prizes: [
      { place: "1st Place", emoji: "gold",   amount: "3,000" },
      { place: "2nd Place", emoji: "silver", amount: "1,200" },
      { place: "3rd Place", emoji: "bronze", amount: "800"   },
    ],
  },
};

const ALL_MAPS = [
  { name: "Erangel", src: "/Erangle.jpg" },
  { name: "Miramar", src: "/miramar.jpg" },
  { name: "Sanhok",  src: "/Sanhok.jpg"  },
  { name: "Vikendi", src: "/Vikendi.jpg" },
];

const medalColors: Record<string, string> = {
  gold:   "text-[#F2AA00]",
  silver: "text-gray-300",
  bronze: "text-amber-600",
};

const medalEmoji: Record<string, string> = {
  gold: "gold", silver: "silver", bronze: "bronze"
};

const inputCls = "w-full bg-black border border-gray-800 focus:border-[#F2AA00]/50 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition-colors duration-200";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-0.5 h-4 bg-[#F2AA00] rounded-full" />
      <p className="text-[10px] text-gray-500 tracking-[0.2em] uppercase">{children}</p>
    </div>
  );
}

function PlayerSlot({ index, value, onChange, isCaptain = false }: any) {
  return (
    <div
      className={`p-4 rounded-xl border transition-all duration-200 ${
        isCaptain
          ? "border-[#F2AA00]/30 bg-[#F2AA00]/5"
          : "border-gray-800 bg-black/30 hover:border-gray-700"
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] flex-shrink-0 ${
            isCaptain ? "bg-[#F2AA00] text-black" : "bg-gray-800 text-gray-400"
          }`}
        >
          {isCaptain ? "C" : index}
        </div>
        <span className="text-[10px] text-gray-500 tracking-widest uppercase">
          {isCaptain ? "Captain (You)" : `Player ${index}`}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="relative">
          <FontAwesomeIcon icon={faUser} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-xs pointer-events-none" />
          <input
            placeholder="In-game Name"
            value={value.name}
            onChange={(e) => onChange("name", e.target.value)}
            className={inputCls + " pl-8"}
          />
        </div>
        <div className="relative">
          <FontAwesomeIcon icon={faHashtag} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-xs pointer-events-none" />
          <input
            placeholder="Player ID"
            value={value.id}
            onChange={(e) => onChange("id", e.target.value)}
            className={inputCls + " pl-8"}
          />
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const [mode, setMode] = useState<"Squad" | "Duo" | "Solo">("Squad");
  const [visible, setVisible] = useState(false);

  const tournament = TOURNAMENTS_DATA[mode];
  const slotPercent = Math.round((tournament.filled / tournament.slots) * 100);
  const slotsLeft = tournament.slots - tournament.filled;

  const [captain, setCaptain]       = useState({ name: "", id: "" });
  const [email, setEmail]           = useState("");
  const [teamName, setTeamName]     = useState("");
  const [upi, setUpi]               = useState("");
  const [txn, setTxn]               = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [players, setPlayers]       = useState<{ name: string; id: string }[]>([]);
  const [submitted, setSubmitted]   = useState(false);

  useEffect(() => {
    const count = tournament.playerCount - 1;
    setPlayers(Array(count).fill(null).map(() => ({ name: "", id: "" })));
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, [mode, tournament.playerCount]);

  useEffect(() => { setTimeout(() => setVisible(true), 80); }, []);

  const updatePlayer = (idx: number, field: "name" | "id", val: string) => {
    setPlayers((p) => p.map((pl, i) => (i === idx ? { ...pl, [field]: val } : pl)));
  };

  const playersValid = () => {
    if (!captain.name || !captain.id) return false;
    return players.every((p) => p.name && p.id);
  };

  const isValid =
    (tournament.playerCount > 1 ? teamName.trim() !== "" : true) &&
    playersValid() &&
    email.trim() !== "" &&
    upi.trim() !== "" &&
    txn.trim() !== "" &&
    screenshot !== null;

  const handleSubmit = () => {
    if (!isValid) return;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto">
            <FontAwesomeIcon icon={faCheck} className="text-green-400 text-2xl" />
          </div>
          <h2 className="text-xl tracking-wide text-white">Registration Submitted</h2>
          <p className="text-gray-500 text-md leading-relaxed">
            Your payment is under review. Admin will verify and confirm your slot for <span className="text-[#F2AA00]">{tournament.name}</span>.
          </p>
          <p className="text-[10px] text-gray-700 tracking-widest uppercase">Txn ID: {txn}</p>
          <button onClick={() => { setSubmitted(false); }} className="mt-4 border border-gray-800 text-gray-400 px-6 py-2 text-xs tracking-widest rounded-lg hover:border-gray-700 hover:text-white transition-all duration-150">
            Register Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen px-4 py-10 md:px-6 relative overflow-hidden">

      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-[#F2AA00]/5 blur-[120px]" />
        <div className="absolute bottom-0 right-1/3 w-[400px] h-[400px] rounded-full bg-[#F2AA00]/4 blur-[100px]" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">

        {/* HEADER */}
        <div className={`mb-8 transition-all duration-600 ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
          <p className="text-[10px] tracking-[0.4em] text-[#F2AA00]/100 uppercase mb-2">Registration</p>
          <h1 className="text-3xl sm:text-4xl tracking-wide">Tournament Registration</h1>
          <p className="text-gray-500 text-sm mt-1 tracking-wide">Select mode — all details are filled from tournament data</p>
        </div>

        {/* MODE TABS */}
        <div
          className={`flex gap-2 mb-8 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          style={{ transitionDelay: "80ms" }}
        >
          {(["Squad", "Duo", "Solo"] as const).map((m) => {
            const t = TOURNAMENTS_DATA[m];
            const active = mode === m;
            return (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 sm:flex-none px-5 py-3 rounded-xl border text-xs tracking-widest transition-all duration-200 active:scale-[0.97] ${
                  active
                    ? "bg-[#F2AA00] text-black border-[#F2AA00] shadow-lg shadow-[#F2AA00]/20"
                    : "border-gray-800 text-gray-400 hover:border-gray-700 hover:text-white bg-[#0b0b0b]"
                }`}
              >
                <div className="tracking-wide">{m}</div>
                <div className={`text-[9px] mt-0.5 ${active ? "text-black/60" : "text-gray-600"}`}>
                  {t.playerCount}P · ₹{t.fee}
                </div>
              </button>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* LEFT FORM */}
          <div
            className={`lg:col-span-2 space-y-5 transition-all duration-600 ${visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-6"}`}
            style={{ transitionDelay: "160ms" }}
          >

            {/* TEAM NAME — only for squad/duo */}
            {tournament.playerCount > 1 && (
              <div className="bg-[#0b0b0b] border border-gray-800 rounded-xl p-5">
                <SectionLabel>Team Info</SectionLabel>
                <div className="relative">
                  <FontAwesomeIcon icon={faShield} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600 text-xs pointer-events-none" />
                  <input
                    placeholder="Team Name"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className={inputCls + " pl-9"}
                  />
                </div>
              </div>
            )}

            {/* PLAYERS — dynamic slots from data */}
            <div className="bg-[#0b0b0b] border border-gray-800 rounded-xl p-5">
              <SectionLabel>
                {tournament.playerCount === 1
                  ? "Player Info"
                  : `Players — ${tournament.mode} (${tournament.playerCount} required)`}
              </SectionLabel>
              <div className="space-y-3">
                <PlayerSlot
                  index={1}
                  isCaptain
                  value={captain}
                  onChange={(field: "name" | "id", val: string) =>
                    setCaptain((c) => ({ ...c, [field]: val }))
                  }
                />
                {players.map((player, idx) => (
                  <PlayerSlot
                    key={idx}
                    index={idx + 2}
                    value={player}
                    onChange={(field: "name" | "id", val: string) =>
                      updatePlayer(idx, field, val)
                    }
                  />
                ))}
              </div>
              <div className="relative mt-4">
                <FontAwesomeIcon icon={faEnvelope} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600 text-xs pointer-events-none" />
                <input
                  type="email"
                  placeholder="Contact Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputCls + " pl-9"}
                />
              </div>
            </div>

            {/* PAYMENT */}
            <div className="bg-[#0b0b0b] border border-gray-800 rounded-xl p-5">
              <SectionLabel>Payment</SectionLabel>

              {/* fee from data */}
              <div className="flex items-center justify-between bg-black border border-gray-800 rounded-xl px-4 py-3.5 mb-4">
                <div>
                  <p className="text-[10px] text-gray-600 tracking-widest uppercase mb-0.5">Entry Fee</p>
                  <p className="text-sm text-gray-500">{tournament.name}</p>
                </div>
                <p className="text-2xl text-[#F2AA00] font-mono">&#8377;{tournament.fee}</p>
              </div>

              <div className="flex items-start gap-2.5 text-[10px] text-gray-500 mb-4 bg-[#F2AA00]/5 border border-[#F2AA00]/10 rounded-lg px-3 py-2.5">
                <FontAwesomeIcon icon={faCircleExclamation} className="text-[#F2AA00]/60 flex-shrink-0 mt-0.5" />
                <span>Pay &#8377;{tournament.fee} via UPI, upload your payment screenshot and enter the transaction ID. Admin will verify and approve your slot.</span>
              </div>

              {/* UPI — only user-entered field */}
              <div className="relative mb-3">
                <FontAwesomeIcon icon={faMobileScreen} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600 text-md pointer-events-none" />
                <input
                  placeholder="Your UPI ID (e.g. name@upi)"
                  value={upi}
                  onChange={(e) => setUpi(e.target.value)}
                  className={inputCls + " pl-9"}
                />
              </div>

              {/* screenshot upload */}
              <label className="block mb-3 cursor-pointer">
                <div
                  className={`border-2 border-dashed rounded-xl p-5 text-center transition-all duration-300 ${
                    screenshot
                      ? "border-green-500/40 bg-green-500/5"
                      : "border-gray-800 hover:border-[#F2AA00]/30 hover:bg-[#F2AA00]/3"
                  }`}
                >
                  {screenshot ? (
                    <div className="flex items-center justify-center gap-2 text-green-400">
                      <FontAwesomeIcon icon={faCheck} className="text-sm" />
                      <span className="text-xs tracking-wide">{screenshot.name}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <FontAwesomeIcon icon={faCloudArrowUp} className="text-gray-600 text-xl" />
                      <p className="text-xs text-gray-500 tracking-wide">Upload payment screenshot</p>
                      <p className="text-[10px] text-gray-700">PNG, JPG, up to 5MB</p>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => setScreenshot(e.target.files?.[0] ?? null)}
                />
              </label>

              {/* txn id */}
              <div className="relative">
                <FontAwesomeIcon icon={faHashtag} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600 text-xs pointer-events-none" />
                <input
                  placeholder="Transaction ID"
                  value={txn}
                  onChange={(e) => setTxn(e.target.value)}
                  className={inputCls + " pl-9 font-mono"}
                />
              </div>
            </div>

            {/* SUBMIT */}
            <button
              onClick={handleSubmit}
              disabled={!isValid}
              className={`w-full py-4 rounded-xl text-sm tracking-widest transition-all duration-200 ${
                isValid
                  ? "bg-[#F2AA00] text-black hover:bg-[#e09e00] hover:shadow-xl hover:shadow-[#F2AA00]/20 active:scale-[0.98]"
                  : "bg-[#0b0b0b] text-gray-600 border border-gray-800 cursor-not-allowed"
              }`}
            >
              {isValid ? "Submit Registration" : "Complete all fields to register"}
            </button>
          </div>

          {/* RIGHT SIDEBAR */}
          <div
            className={`space-y-5 transition-all duration-600 ${visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-6"}`}
            style={{ transitionDelay: "240ms" }}
          >

            {/* TOURNAMENT SUMMARY — all from data */}
            <div className="bg-[#0b0b0b] border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors duration-200">
              <div className="relative h-32 overflow-hidden">
                <Image
                  src={tournament.mapImage}
                  alt={tournament.map}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                <div className="absolute bottom-3 left-4">
                  <p className="text-[10px] text-gray-400 tracking-widest uppercase">{tournament.map}</p>
                  <p className="text-white text-sm tracking-wide mt-0.5">{tournament.name}</p>
                </div>
                <div className="absolute top-3 right-3 bg-black/60 border border-[#F2AA00]/30 text-[#F2AA00] text-[10px] px-2 py-0.5 rounded-md tracking-widest">
                  {tournament.platform}
                </div>
              </div>
              <div className="p-4 space-y-3">
                {[
                  { label: "Mode",     val: `${tournament.mode} · ${tournament.playerCount} Players` },
                  { label: "Date",     val: `${tournament.date} · ${tournament.time}` },
                  { label: "Entry Fee",val: `₹${tournament.fee}` },
                ].map((r, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-gray-600">{r.label}</span>
                    <span className={r.label === "Entry Fee" ? "text-[#F2AA00] font-mono" : "text-gray-300"}>{r.val}</span>
                  </div>
                ))}

                {/* slots progress */}
                <div>
                  <div className="flex justify-between text-[10px] text-gray-600 mb-1.5">
                    <span>Slots</span>
                    <span>{tournament.filled}/{tournament.slots} · {slotsLeft} left</span>
                  </div>
                  <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${slotPercent >= 90 ? "bg-red-500" : "bg-[#F2AA00]"}`}
                      style={{ width: `${slotPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* MAP POOL — active map highlighted from data */}
            <div className="bg-[#0b0b0b] border border-gray-800 rounded-xl p-4">
              <SectionLabel>Map Pool</SectionLabel>
              <div className="grid grid-cols-2 gap-2">
                {ALL_MAPS.map((map) => {
                  const isSelected = map.name === tournament.map;
                  return (
                    <div
                      key={map.name}
                      className={`relative rounded-lg overflow-hidden border transition-all duration-300 ${
                        isSelected
                          ? "border-[#F2AA00] shadow-md shadow-[#F2AA00]/20"
                          : "border-gray-800 opacity-50"
                      }`}
                    >
                      <Image
                        src={map.src}
                        alt={map.name}
                        width={200}
                        height={120}
                        className="w-full h-20 object-cover"
                      />
                      <div className={`absolute inset-0 transition-all duration-300 ${isSelected ? "bg-black/20" : "bg-black/50"}`} />
                      {/* always show map name */}
                      <div className="absolute bottom-0 inset-x-0 bg-black/70 py-1 px-2 flex items-center justify-between">
                        <span className="text-[10px] text-white tracking-wide">{map.name}</span>
                        {isSelected && (
                          <span className="text-[8px] text-[#F2AA00] tracking-widest uppercase">Active</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* PRIZE POOL — from data */}
            <div className="bg-[#0b0b0b] border border-gray-800 rounded-xl p-4">
              <SectionLabel>Prize Pool</SectionLabel>
              <div className="space-y-2">
                {tournament.prizes.map((prize: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3 py-2.5 bg-black border border-gray-800 rounded-lg hover:border-gray-700 transition-colors duration-150"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">
                        {prize.emoji === "gold" ? "🥇" : prize.emoji === "silver" ? "🥈" : "🥉"}
                      </span>
                      <span className="text-xs text-gray-400">{prize.place}</span>
                    </div>
                    <span className={`text-sm font-mono ${medalColors[prize.emoji]}`}>
                      &#8377;{prize.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}