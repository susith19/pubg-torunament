"use client";

import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMapLocationDot, faUsers, faSackDollar,
  faEnvelope, faPhone, faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import TournamentModes from "./components/torunaments_modes";
import UpcomingTournaments from "./components/upcoming_matches";
import MapTopMatches from "./components/maps";
import HowItWorks from "./components/howitworks";

const features = [
  {
    title: "Multiple Maps",
    desc: "Master Erangel, Miramar, Sanhok, and Vikendi. Prove your tactical adaptability across diverse terrains.",
    icon: faMapLocationDot,
  },
  {
    title: "Squad Battles",
    desc: "4-player squad format. Coordinate, communicate, and execute strategies to outlive 24 other teams.",
    icon: faUsers,
  },
  {
    title: "Huge Rewards",
    desc: "Prize pool distributed among top teams. MVP awards and exclusive in-game skins.",
    icon: faSackDollar,
  },
];

export default function HomePage() {
  const router = useRouter();

  // ── API ───────────────────────────────────────────────────
  const [homeData, setHomeData] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    fetch("/api/home")
      .then((r) => r.json())
      .then(setHomeData)
      .catch(console.error)
      .finally(() => setDataLoading(false));
  }, []);

  // ── HERO STATE ────────────────────────────────────────────
  const [mode, setMode] = useState<"PUBG" | "BGMI">("PUBG");
  const [timeLeft, setTimeLeft] = useState("");
  const [heroVisible, setHeroVisible] = useState(false);
  const [cardVisible, setCardVisible] = useState(false);
  const [featuresVisible, setFeaturesVisible] = useState(false);
  const [barFill, setBarFill] = useState(false);

  const word = "DOMINATE.";
  const [text, setText] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < word.length) {
      const t = setTimeout(() => { setText((p) => p + word[index]); setIndex(index + 1); }, 120);
      return () => clearTimeout(t);
    }
  }, [index]);
  useEffect(() => {
    if (index === word.length) {
      const t = setTimeout(() => { setText(""); setIndex(0); }, 2000);
      return () => clearTimeout(t);
    }
  }, [index]);

  useEffect(() => {
    const t1 = setTimeout(() => setHeroVisible(true), 100);
    const t2 = setTimeout(() => setCardVisible(true), 350);
    const t3 = setTimeout(() => setFeaturesVisible(true), 500);
    const t4 = setTimeout(() => setBarFill(true), 800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  // Decide initial mode: prefer PUBG, fall back to whichever exists
  useEffect(() => {
    if (!homeData) return;
    if (homeData.hero?.pubg) setMode("PUBG");
    else if (homeData.hero?.bgmi) setMode("BGMI");
  }, [homeData]);

  const hasPUBG = !!homeData?.hero?.pubg;
  const hasBGMI = !!homeData?.hero?.bgmi;
  const heroMatch = mode === "PUBG" ? homeData?.hero?.pubg : homeData?.hero?.bgmi;
  const fillPercent = heroMatch ? Math.round((heroMatch.filled / heroMatch.slots) * 100) : 0;

  // countdown
  useEffect(() => {
    if (!heroMatch?.start_date) return;
    const interval = setInterval(() => {
      const diff = new Date(heroMatch.start_date.replace(" ", "T")).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Started"); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff / 3600000) % 24);
      const m = Math.floor((diff / 60000) % 60);
      const s = Math.floor((diff / 1000) % 60);
      setTimeLeft(`${d}d : ${h}h : ${m}m : ${s}s`);
    }, 1000);
    return () => clearInterval(interval);
  }, [heroMatch]);

  return (
    <div className="bg-black text-white min-h-screen">

      {/* ── HERO ── */}
      <section className="relative min-h-screen overflow-hidden pb-6">
        <Image src="/PUBG-wallpaper.jpg" alt="bg" fill className="object-cover" />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-black to-transparent" />

        <div className="relative z-10 h-[80vh] flex items-center px-6 sm:px-10">
          <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-10">

            {/* LEFT */}
            <div className={`max-w-xl transition-all duration-700 ${heroVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"}`}>
              <p className={`text-xs tracking-[0.4em] text-[#F2AA00]/70 mb-4 uppercase transition-all duration-500 delay-100 ${heroVisible ? "opacity-100" : "opacity-0"}`}>
                Battle Royale Tournament
              </p>
              <h1 className="text-5xl sm:text-6xl tracking-wider leading-tight">
                SURVIVE. <br />
                <span className="text-[#F2AA00]">{text}<span className="animate-pulse">|</span></span>
                <br />CONQUER.
              </h1>
              <p className={`text-gray-400 mt-4 tracking-widest text-base transition-all duration-700 delay-200 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
                Join the ultimate battle royale tournament and win <span className="text-[#F2AA00]">Prizes</span>
              </p>
              <div className={`flex gap-3 mt-6 transition-all duration-700 delay-300 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
                <button
                  onClick={() => heroMatch && router.push(`/tournaments/${heroMatch.id}/register`)}
                  className="bg-[#F2AA00] text-black px-6 py-3 text-sm tracking-widest hover:bg-[#e09e00] hover:shadow-lg hover:shadow-[#F2AA00]/20 active:scale-95 transition-all duration-150"
                >
                  Join Now
                </button>
                <a href="/tournaments">
                  <button className="border border-gray-700 text-gray-300 px-6 py-3 text-sm tracking-widest hover:border-[#F2AA00]/50 hover:text-[#F2AA00] transition-all duration-200">
                    View Schedule
                  </button>
                </a>
              </div>
            </div>

            {/* RIGHT CARD */}
            <div className={`float-card bg-black/60 border border-[#F2AA00]/30 p-6 rounded-xl backdrop-blur-lg w-full max-w-[420px] transition-all duration-700 hover:border-[#F2AA00]/50 hover:shadow-xl hover:shadow-[#F2AA00]/10 ${cardVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>

              {/* MODE SWITCH — only render tabs that have data */}
              {!dataLoading && (hasPUBG || hasBGMI) && (
                <div className="flex justify-center items-center gap-2 mb-5">
                  {(["PUBG", "BGMI"] as const).map((m) => {
                    const exists = m === "PUBG" ? hasPUBG : hasBGMI;
                    if (!exists) return null;
                    return (
                      <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={`px-5 py-1.5 text-sm border tracking-widest transition-all duration-200 ${mode === m ? "bg-[#F2AA00] text-black border-[#F2AA00] shadow-md shadow-[#F2AA00]/20" : "border-[#F2AA00]/40 text-[#F2AA00] hover:bg-[#F2AA00]/10"}`}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* LOADING */}
              {dataLoading && (
                <div className="flex items-center justify-center py-10">
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin text-[#F2AA00] w-5 h-5" />
                </div>
              )}

              {/* NO MATCH FOR THIS MODE */}
              {!dataLoading && !heroMatch && (
                <div className="text-center py-8">
                  <p className="text-gray-600 text-xs tracking-widest">No {mode} tournaments open right now</p>
                  <button onClick={() => router.push("/tournaments")} className="mt-4 text-[#F2AA00] text-xs tracking-widest hover:underline">
                    Browse All →
                  </button>
                </div>
              )}

              {/* MATCH CARD CONTENT */}
              {!dataLoading && heroMatch && (
                <>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-base tracking-wide">{heroMatch.title}</h3>
                      <p className="text-xs text-gray-500 mt-1 tracking-wide">{heroMatch.map} · {heroMatch.mode}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-500 tracking-widest uppercase">Ends in</p>
                      <p className="text-[#F2AA00] text-sm font-mono mt-0.5">{timeLeft || "—"}</p>
                    </div>
                  </div>

                  <div className="h-px bg-gray-800 my-4" />

                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                      <span>Players Joined</span>
                      <span>{heroMatch.filled} / {heroMatch.slots}</span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#F2AA00] rounded-full transition-all duration-700"
                        style={{ width: barFill ? `${fillPercent}%` : "0%" }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-600 mt-1 text-right">{fillPercent}% filled</p>
                  </div>

                  <button
                    onClick={() => router.push(`/tournaments/${heroMatch.id}`)}
                    className="mt-5 w-full border border-[#F2AA00]/50 py-2.5 text-sm tracking-widest hover:bg-[#F2AA00] hover:text-black hover:border-[#F2AA00] hover:shadow-lg hover:shadow-[#F2AA00]/20 active:scale-[0.98] transition-all duration-200"
                  >
                    View Details
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── FEATURES ── */}
        <section className="relative z-10 px-6 pt-4">
          <div className="grid md:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {features.map((f, i) => (
              <div
                key={i}
                className={`group relative p-6 rounded-xl bg-[#0b0b0b] border border-gray-800 overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:border-[#F2AA00]/50 hover:shadow-[0_0_30px_rgba(242,170,0,0.12)] ${featuresVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                style={{ transitionDelay: `${500 + i * 100}ms` }}
              >
                <div className="w-11 h-11 flex items-center justify-center rounded-lg bg-[#F2AA00]/10 group-hover:bg-[#F2AA00]/20 transition-colors duration-300">
                  <FontAwesomeIcon icon={f.icon} className="text-[#F2AA00] text-base transition-transform duration-300 group-hover:scale-110" />
                </div>
                <h3 className="mt-5 text-lg tracking-wide">{f.title}</h3>
                <p className="mt-2 text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-800 overflow-hidden">
                  <div className="h-full w-8 bg-[#F2AA00] transition-all duration-500 group-hover:w-full" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </section>

      {/* sections receive data so they don't make a 2nd fetch */}
      <section className="px-6">
        <UpcomingTournaments data={homeData?.upcoming} />
      </section>

      <section className="px-6">
        <MapTopMatches data={homeData?.mapMatches} />
      </section>

      <section className="px-6">
        <TournamentModes data={homeData?.modes} />
      </section>

      <section className="px-6">
        <HowItWorks />
      </section>

      {/* ── CONTACT ── */}
      <section className="bg-black py-16 px-6 sm:px-10">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-6">
          <div className="relative bg-[#0b0b0b] border border-gray-800 rounded-2xl p-8 overflow-hidden hover:border-gray-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/60 transition-all duration-300">
            <h3 className="text-white text-xl tracking-wide">Have A Question?</h3>
            <p className="text-gray-500 text-sm mt-3 leading-relaxed">Find answers, explore tournaments, and get help from our support team anytime.</p>
            <button className="mt-6 px-5 py-2.5 bg-[#F2AA00] text-black text-xs tracking-widest rounded-lg hover:bg-[#e09e00] hover:shadow-lg hover:shadow-[#F2AA00]/20 active:scale-95 transition-all duration-150">
              Contact Support →
            </button>
            <div className="absolute right-6 bottom-6 text-6xl text-[#F2AA00]/8 select-none pointer-events-none">🎧</div>
          </div>
          <div className="bg-[#0b0b0b] border border-[#F2AA00]/30 rounded-2xl p-8 hover:border-[#F2AA00]/50 hover:shadow-[0_0_25px_rgba(242,170,0,0.12)] hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 flex items-center justify-center rounded-lg bg-[#F2AA00]/10 flex-shrink-0">
                <FontAwesomeIcon icon={faEnvelope} className="text-[#F2AA00] text-sm" />
              </div>
              <div>
                <p className="text-gray-500 text-xs tracking-widest uppercase">Email Us</p>
                <p className="text-white tracking-wide text-sm mt-0.5">hello@yourapp.com</p>
                <p className="text-xs text-[#F2AA00]/70 mt-0.5">Response within 20 minutes</p>
              </div>
            </div>
            <div className="h-px bg-gray-800 my-5" />
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 flex items-center justify-center rounded-lg bg-[#F2AA00]/10 flex-shrink-0">
                <FontAwesomeIcon icon={faPhone} className="text-[#F2AA00] text-sm" />
              </div>
              <div>
                <p className="text-gray-500 text-xs tracking-widest uppercase">Call Us</p>
                <p className="text-white tracking-wide text-sm mt-0.5">+91 98765 43210</p>
                <p className="text-xs text-gray-600 mt-0.5">Available 8 AM – 9 PM</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}