"use client";

import Image from "next/image";
import { useEffect, useState, useRef } from "react";

const matches = [
  {
    id: 1,
    title: "Solo Battle Royale",
    type: "Solo",
    map: "Erangel",
    date: "2026-02-25",
    time: "6:00 PM",
    image: "/solo.jpg",
    prize: "$500",
    slots: "100",
    filled: "87",
  },
  {
    id: 2,
    title: "Duo Clash",
    type: "Duo",
    map: "Miramar",
    date: "2026-02-26",
    time: "7:30 PM",
    image: "/duo.jpg",
    prize: "$1,200",
    slots: "50",
    filled: "38",
  },
  {
    id: 3,
    title: "Squad War",
    type: "Squad",
    map: "Sanhok",
    date: "2026-02-27",
    time: "9:00 PM",
    image: "/squad.jpg",
    prize: "$3,000",
    slots: "25",
    filled: "20",
  },
];

export default function HomePage() {
  const [current, setCurrent] = useState(0);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    autoPlayRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % matches.length);
    }, 4000);

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, []);

  const match = matches[current];
  const fillPercent = Math.round((parseInt(match.filled) / parseInt(match.slots)) * 100);

  return (
      
<>

    <div className="bg-white text-white min-h-screen">

      {/* HERO */}
      <section className="relative h-[80vh] overflow-hidden">
        <Image
          src={match.image}
          alt={match.title}
          fill
          className="object-cover opacity-40"
        />

        <div className="absolute inset-0 bg-black/80" />

        <div className="relative z-10 h-full flex flex-col justify-end p-10">
          <span className="bg-[#F2AA00] text-black px-3 py-1 text-xs font-bold w-fit">
            {match.type}
          </span>

          <h1 className="text-4xl font-bold  mt-3">
            {match.title}
          </h1>

          <div className="mt-4 text-sm space-y-1">
            <p>Map: {match.map}</p>
            <p>Date: {match.date}</p>
            <p>Time: {match.time}</p>
            <p className="text-[#F2AA00] font-semibold">Prize: {match.prize}</p>
          </div>

          {/* Progress */}
          <div className="mt-4 w-[250px]">
            <div className="flex justify-between text-xs mb-1">
              <span>Slots</span>
              <span>{match.filled}/{match.slots}</span>
            </div>
            <div className="h-2 bg-gray-800 rounded">
              <div
                className="h-2 bg-[#F2AA00] rounded"
                style={{ width: `${fillPercent}%` }}
              />
            </div>
          </div>

          <button className="mt-5 bg-[#F2AA00] text-black px-6 py-2 font-bold w-fit hover:opacity-90">
            Join Match
          </button>
        </div>

        {/* Dots */}
        <div className="absolute bottom-5 right-5 flex gap-2 z-20">
          {matches.map((_, i) => (
            <div
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2 cursor-pointer rounded-full ${
                i === current ? "w-6 bg-[#F2AA00]" : "w-2 bg-gray-500"
              }`}
            />
          ))}
        </div>
      </section>

      {/* MATCH CARDS */}
      <section className="p-8 text-black">
        <h2 className="text-2xl font-bold mb-6 text-black">
          Recently Added Matches
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {matches.map((m) => {
            const fp = Math.round((parseInt(m.filled) / parseInt(m.slots)) * 100);

            return (
              <div key={m.id} className="bg-white border border-gray-200">
                <div className="relative h-48">
                  <Image
                    src={m.image}
                    alt={m.title}
                    fill
                    className="object-cover opacity-60"
                  />
                  <div className="absolute inset-0 bg-black/60" />
                </div>

                <div className="p-4">
                  <span className="text-xs bg-[#F2AA00] text-black px-2 py-1">
                    {m.type}
                  </span>

                  <h3 className="text-lg font-semibold mt-2">
                    {m.title}
                  </h3>

                  <div className="text-sm text-gray-600 mt-2 space-y-1">
                    <p>Map: {m.map}</p>
                    <p>{m.date} • {m.time}</p>
                  </div>

                  {/* Progress */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Players</span>
                      <span>{m.filled}/{m.slots}</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded">
                      <div
                        className="h-2 bg-[#F2AA00] rounded"
                        style={{ width: `${fp}%` }}
                      />
                    </div>
                  </div>

                  <button className="mt-4 w-full border border-[#F2AA00] text-[#F2AA00] py-2 hover:bg-[#F2AA00] hover:text-black transition">
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

    </div></>
  );
}
