"use client";

import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMapLocationDot,
  faUsers,
  faSackDollar,
} from "@fortawesome/free-solid-svg-icons";
import TournamentModes from "./components/torunaments_modes";
import UpcomingTournaments from "./components/upcoming_matches";
import MapTopMatches from "./components/maps";

const matches = [
  {
    id: 1,
    title: "Elite Championship",
    type: "Squad",
    map: "Erangel",
    date: "2026-02-28T18:00:00",
    image: "/pubg-wallpaper.jpg", // your PUBG wallpaper
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

  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  // autoplay slider
  useEffect(() => {
    autoPlayRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % matches.length);
    }, 5000);

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, []);

  const filteredMatches = matches.filter((m) => m.mode === mode);
  const match = filteredMatches[current % filteredMatches.length];

  // countdown logic
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(match.date).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft("Started");
        return;
      }

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);

      setTimeLeft(`${d}d : ${h}h : ${m}m`);
    }, 1000);

    return () => clearInterval(interval);
  }, [match]);

  const fillPercent = Math.round((match.filled / match.slots) * 100);

  return (
    <div className="bg-black text-white min-h-screen">
      <>
        {/* HERO */}
        <section className="relative min-h-screen overflow-hidden pb-6">

          {/* BACKGROUND */}
          <Image
            src="/PUBG-wallpaper.jpg"
            alt="bg"
            fill
            className="object-cover opacity-30"
          />

          <div className="absolute inset-0 bg-gradient-to-r via-black/50" />

          {/* CONTENT */}
          <div className="relative z-10 h-[80vh] flex items-center px-10">

            <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-10">

              {/* LEFT */}
              <div className="max-w-xl">
                <h1 className="text-6xl tracking-wider leading-tight">
                  SURVIVE. <br />
                  <span className="text-[#F2AA00]">DOMINATE.</span> <br />
                  CONQUER.
                </h1>

                <p className="text-gray-300 mt-4 tracking-widest text-lg">
                  Join the ultimate battle royale tournament and win{" "}
                  <span className="text-[#F2AA00]">Prizes</span>
                </p>

                <button className="mt-6 bg-[#F2AA00] text-black px-6 py-3 hover:opacity-90 transition">
                  Join Now
                </button>
              </div>

              {/* RIGHT CARD */}
              <div className="bg-black/60 border border-[#F2AA00]/30 p-6 rounded-xl backdrop-blur-lg w-[420px]">

                {/* MODE SWITCH */}
                <div className="flex justify-center gap-3 mb-4">
                  {["PUBG", "BGMI"].map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        setMode(m);
                        setCurrent(0);
                      }}
                      className={`px-5 py-1.5 text-sm border transition ${mode === m
                        ? "bg-[#F2AA00] text-black"
                        : "border-[#F2AA00] text-[#F2AA00]"
                        }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                {/* TITLE + COUNTDOWN */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg tracking-wide">{match.title}</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      {match.map} • {match.type}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-gray-400">Ends</p>
                    <p className="text-[#F2AA00] text-sm">{timeLeft}</p>
                  </div>
                </div>

                {/* PROGRESS */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Players</span>
                    <span>{match.filled}/{match.slots}</span>
                  </div>

                  <div className="h-2 bg-gray-800 rounded">
                    <div
                      className="h-2 bg-[#F2AA00]"
                      style={{ width: `${fillPercent}%` }}
                    />
                  </div>
                </div>

                <button className="mt-5 w-full border border-[#F2AA00] py-2 text-sm hover:bg-[#F2AA00] hover:text-black transition">
                  View Details
                </button>
              </div>

            </div>
          </div>
          {/* FEATURES BELOW HERO */}
          <section className="bg-black px-6">

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {features.map((f, i) => (
                <div
                  key={i}
                  className="
            group relative p-6 rounded-xl
            bg-[#0b0b0b]
            border border-gray-800
            transition-all duration-500 ease-out
            hover:-translate-y-2
            hover:border-[#F2AA00]/50
            hover:shadow-[0_0_30px_rgba(242,170,0,0.15)]
          "
                >
                  <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-[#F2AA00]/10">
                    <FontAwesomeIcon
                      icon={f.icon}
                      className="text-[#F2AA00] text-lg transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>

                  <h3 className="mt-6 text-xl tracking-wide">
                    {f.title}
                  </h3>

                  <p className="mt-3 text-gray-400 text-sm leading-relaxed">
                    {f.desc}
                  </p>

                  {/* UNDERLINE ANIMATION */}
                  <div className="absolute bottom-3 mx-6 left-0 w-80 h-[4px] rounded bg-gray-800 overflow-hidden">
                    <div
                      className="
                  h-full w-22 bg-[#F2AA00]
                  transition-all duration-500
                  group-hover:w-full
                "
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </section>
      </>

      {/* UPCOMING TOURNAMENTS */}
      <section className="px-6">
        <UpcomingTournaments />
      </section>

      {/* MAP TOP MATCHES */}
      <section className="px-6">
        <MapTopMatches />
      </section>

      {/* CARDS */}
      <section className="px-6">
        <TournamentModes />
      </section>
      
    </div>
  );
}