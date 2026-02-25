"use client";

import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMapLocationDot,
  faUsers,
  faSackDollar,
} from "@fortawesome/free-solid-svg-icons";
import { faEnvelope, faPhone } from "@fortawesome/free-solid-svg-icons";
import TournamentModes from "./components/torunaments_modes";
import UpcomingTournaments from "./components/upcoming_matches";
import MapTopMatches from "./components/maps";
import HowItWorks from "./components/howitworks";

const matches = [
  {
    id: 1,
    title: "Elite Championship",
    type: "Squad",
    map: "Erangel",
    date: "2026-02-28T18:00:00",
    image: "/pubg-wallpaper.jpg",
    prize: "$50,000",
    slots: 100,
    filled: 87,
    mode: "BGMI",
  },
  {
    id: 2,
    title: "PC Power League",
    type: "Duo",
    map: "Miramar",
    date: "2026-02-28T19:30:00",
    image: "/pubg-wallpaper.jpg",
    prize: "$10,000",
    slots: 50,
    filled: 38,
    mode: "PUBG",
  },
];

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
  const [current, setCurrent] = useState(0);
  const [mode, setMode] = useState("PUBG");
  const [timeLeft, setTimeLeft] = useState("");
  const [heroVisible, setHeroVisible] = useState(false);
  const [cardVisible, setCardVisible] = useState(false);
  const [featuresVisible, setFeaturesVisible] = useState(false);
  const [barFill, setBarFill] = useState(false);

  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const word = "DOMINATE.";
  const [text, setText] = useState("");
  const [index, setIndex] = useState(0);

  // typewriter
  useEffect(() => {
    if (index < word.length) {
      const timeout = setTimeout(() => {
        setText((prev) => prev + word[index]);
        setIndex(index + 1);
      }, 120);
      return () => clearTimeout(timeout);
    }
  }, [index]);

  useEffect(() => {
    if (index === word.length) {
      const reset = setTimeout(() => {
        setText("");
        setIndex(0);
      }, 2000);
      return () => clearTimeout(reset);
    }
  }, [index]);

  // staggered entrance
  useEffect(() => {
    const t1 = setTimeout(() => setHeroVisible(true), 100);
    const t2 = setTimeout(() => setCardVisible(true), 350);
    const t3 = setTimeout(() => setFeaturesVisible(true), 500);
    const t4 = setTimeout(() => setBarFill(true), 800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  // autoplay slider
  useEffect(() => {
    autoPlayRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % matches.length);
    }, 5000);
    return () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); };
  }, []);

  const filteredMatches = matches.filter((m) => m.mode === mode);
  const match = filteredMatches[current % filteredMatches.length];

  // countdown
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(match.date).getTime();
      const diff = target - now;
      if (diff <= 0) { setTimeLeft("Started"); return; }
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);
      setTimeLeft(`${d}d : ${h}h : ${m}m : ${s}s`);
    }, 1000);
    return () => clearInterval(interval);
  }, [match]);

  const fillPercent = Math.round((match.filled / match.slots) * 100);

  return (
    <div className="bg-black text-white min-h-screen">

      {/* ── HERO ── */}
      <section className="relative min-h-screen overflow-hidden pb-6">

        {/* BG */}
        <Image src="/PUBG-wallpaper.jpg" alt="bg" fill className="object-cover" />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />

        {/* subtle vignette bottom */}
        <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-black to-transparent" />

        {/* CONTENT */}
        <div className="relative z-10 h-[80vh] flex items-center px-6 sm:px-10">
          <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-10">

            {/* LEFT */}
            <div
              className={`max-w-xl transition-all duration-700 ${
                heroVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
              }`}
            >
              <p
                className={`text-xs tracking-[0.4em] text-[#F2AA00]/70 mb-4 uppercase transition-all duration-500 delay-100 ${
                  heroVisible ? "opacity-100" : "opacity-0"
                }`}
              >
                Battle Royale Tournament
              </p>

              <h1 className="text-5xl sm:text-6xl tracking-wider leading-tight">
                SURVIVE. <br />
                <span className="text-[#F2AA00]">
                  {text}
                  <span className="animate-pulse">|</span>
                </span>
                <br />
                CONQUER.
              </h1>

              <p
                className={`text-gray-400 mt-4 tracking-widest text-base transition-all duration-700 delay-200 ${
                  heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
                }`}
              >
                Join the ultimate battle royale tournament and win{" "}
                <span className="text-[#F2AA00]">Prizes</span>
              </p>

              <div
                className={`flex gap-3 mt-6 transition-all duration-700 delay-300 ${
                  heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
                }`}
              >
                <button className="bg-[#F2AA00] text-black px-6 py-3 text-sm tracking-widest hover:bg-[#e09e00] hover:shadow-lg hover:shadow-[#F2AA00]/20 active:scale-95 transition-all duration-150">
                  Join Now
                </button>
                <a href="/schedule">
                <button className="border border-gray-700 text-gray-300 px-6 py-3 text-sm tracking-widest hover:border-[#F2AA00]/50 hover:text-[#F2AA00] transition-all duration-200">
                  View Schedule
                </button>
                </a>
              </div>
            </div>

            {/* RIGHT CARD */}
            <div
              className={`float-card bg-black/60 border border-[#F2AA00]/30 p-6 rounded-xl backdrop-blur-lg w-full max-w-[420px] transition-all duration-700 hover:border-[#F2AA00]/50 hover:shadow-xl hover:shadow-[#F2AA00]/10 ${
                cardVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
            >
              {/* MODE SWITCH */}
              <div className="flex justify-center items-center gap-2 mb-5 ">
                {["PUBG", "BGMI"].map((m) => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); setCurrent(0); }}
                    className={`px-5 py-1.5 text-sm border tracking-widest transition-all duration-200 ${
                      mode === m
                        ? "bg-[#F2AA00] text-black border-[#F2AA00] shadow-md shadow-[#F2AA00]/20"
                        : "border-[#F2AA00]/40 text-[#F2AA00] hover:bg-[#F2AA00]/10"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* TITLE + COUNTDOWN */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-base tracking-wide">{match.title}</h3>
                  <p className="text-xs text-gray-500 mt-1 tracking-wide">{match.map} · {match.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-500 tracking-widest uppercase">Ends in</p>
                  <p className="text-[#F2AA00] text-sm font-mono mt-0.5">{timeLeft}</p>
                </div>
              </div>

              {/* DIVIDER */}
              <div className="h-px bg-gray-800 my-4" />

              {/* PROGRESS */}
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                  <span>Players Joined</span>
                  <span>{match.filled} / {match.slots}</span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#F2AA00] rounded-full transition-all duration-700"
                    style={{ width: barFill ? `${fillPercent}%` : "0%" }}
                  />
                </div>
                <p className="text-[10px] text-gray-600 mt-1 text-right">{fillPercent}% filled</p>
              </div>

              <button className="mt-5 w-full border border-[#F2AA00]/50 py-2.5 text-sm tracking-widest hover:bg-[#F2AA00] hover:text-black hover:border-[#F2AA00] hover:shadow-lg hover:shadow-[#F2AA00]/20 active:scale-[0.98] transition-all duration-200">
                View Details
              </button>
            </div>
          </div>
        </div>

        {/* ── FEATURES ── */}
        <section className="relative z-10 px-6 pt-4">
          <div className="grid md:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {features.map((f, i) => (
              <div
                key={i}
                className={`group relative p-6 rounded-xl bg-[#0b0b0b] border border-gray-800 overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:border-[#F2AA00]/50 hover:shadow-[0_0_30px_rgba(242,170,0,0.12)] ${
                  featuresVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${500 + i * 100}ms` }}
              >
                <div className="w-11 h-11 flex items-center justify-center rounded-lg bg-[#F2AA00]/10 group-hover:bg-[#F2AA00]/20 transition-colors duration-300">
                  <FontAwesomeIcon
                    icon={f.icon}
                    className="text-[#F2AA00] text-base transition-transform duration-300 group-hover:scale-110"
                  />
                </div>

                <h3 className="mt-5 text-lg tracking-wide">{f.title}</h3>

                <p className="mt-2 text-gray-500 text-sm leading-relaxed">{f.desc}</p>

                {/* underline animation */}
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-800 overflow-hidden">
                  <div className="h-full w-8 bg-[#F2AA00] transition-all duration-500 group-hover:w-full" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </section>

      {/* ── UPCOMING TOURNAMENTS ── */}
      <section className="px-6">
        <UpcomingTournaments />
      </section>

      {/* ── MAP TOP MATCHES ── */}
      <section className="px-6">
        <MapTopMatches />
      </section>

      {/* ── TOURNAMENT MODES ── */}
      <section className="px-6">
        <TournamentModes />
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="px-6">
        <HowItWorks />
      </section>

      {/* ── FAQ / CONTACT ── */}
      <section className="bg-black py-16 px-6 sm:px-10">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-6">

          {/* LEFT */}
          <div className="relative bg-[#0b0b0b] border border-gray-800 rounded-2xl p-8 overflow-hidden hover:border-gray-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/60 transition-all duration-300">
            <h3 className="text-white text-xl tracking-wide">Have A Question?</h3>
            <p className="text-gray-500 text-sm mt-3 leading-relaxed">
              Find answers, explore tournaments, and get help from our support team anytime.
            </p>
            <button className="mt-6 px-5 py-2.5 bg-[#F2AA00] text-black text-xs tracking-widest rounded-lg hover:bg-[#e09e00] hover:shadow-lg hover:shadow-[#F2AA00]/20 active:scale-95 transition-all duration-150">
              Contact Support →
            </button>
            <div className="absolute right-6 bottom-6 text-6xl text-[#F2AA00]/8 select-none pointer-events-none">
              🎧
            </div>
          </div>

          {/* RIGHT */}
          <div className="bg-[#0b0b0b] border border-[#F2AA00]/30 rounded-2xl p-8 hover:border-[#F2AA00]/50 hover:shadow-[0_0_25px_rgba(242,170,0,0.12)] hover:-translate-y-0.5 transition-all duration-300">

            {/* EMAIL */}
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

            {/* PHONE */}
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