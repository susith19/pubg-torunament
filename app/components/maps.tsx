"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const maps = [
  {
    name: "Erangel",
    title: "Erangel Pro League",
    desc: "Classic 5v5 battle on Erangel terrain.",
    prize: "$12,000",
    date: "Oct 29, 2026",
    status: "LIVE",
    slots: 64,
    filled: 32,
    image: "/Erangle.jpg",
  },
  {
    name: "Miramar",
    title: "Desert Storm Cup",
    desc: "Survive the harsh desert battles.",
    prize: "$5,000",
    date: "Nov 02, 2026",
    status: "REGISTRATION",
    slots: 200,
    filled: 120,
    image: "/miramar.jpg",
  },
  {
    name: "Sanhok",
    title: "Jungle Clash",
    desc: "Fast-paced jungle combat mode.",
    prize: "$25,000",
    date: "Nov 15, 2026",
    status: "UPCOMING",
    slots: 50,
    filled: 0,
    image: "/Sanhok.jpg",
  },
  {
    name: "Vikendi",
    title: "Snow Warfare",
    desc: "Battle in icy survival conditions.",
    prize: "$8,000",
    date: "Dec 01, 2026",
    status: "REGISTRATION",
    slots: 100,
    filled: 60,
    image: "/Vikendi.jpg",
  },
];

const statusStyle: Record<string, string> = {
  LIVE: "bg-red-500 text-white",
  REGISTRATION: "bg-[#F2AA00] text-black",
  UPCOMING: "bg-gray-700 text-gray-300",
};

export default function MapTopMatches() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [barsActive, setBarsActive] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          setTimeout(() => setBarsActive(true), 300);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-16 px-6">
      <div className="w-full">

        {/* HEADER */}
        <div
          className={`mb-10 transition-all duration-500 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
          }`}
        >
          <h2 className="text-2xl tracking-wide text-white">
            Top Matches by Map
          </h2>
          <p className="text-gray-500 text-sm mt-1 tracking-wide">
            Explore tournaments across different battlegrounds
          </p>
        </div>

        {/* GRID */}
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5">
          {maps.map((m, i) => {
            const percent = Math.round((m.filled / m.slots) * 100);

            return (
              <div
                key={i}
                className={`group relative rounded-xl overflow-hidden bg-[#0b0b0b] border border-gray-800 flex flex-col transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(242,170,0,0.14)] hover:border-[#F2AA00]/40 ${
                  visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                }`}
                style={{ transitionDelay: `${i * 90}ms` }}
              >

                {/* IMAGE */}
                <div className="relative h-40 overflow-hidden flex-shrink-0">
                  <Image
                    src={m.image}
                    alt={m.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />

                  {/* gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                  {/* STATUS badge */}
                  <div
                    className={`absolute top-3 left-3 text-[10px] px-2.5 py-1 rounded-md tracking-widest ${
                      statusStyle[m.status] ?? "bg-gray-700 text-gray-300"
                    } ${m.status === "LIVE" ? "animate-pulse" : ""}`}
                  >
                    {m.status === "LIVE" && (
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-white mr-1.5 align-middle" />
                    )}
                    {m.status}
                  </div>

                  {/* SLOTS badge */}
                  <div className="absolute top-3 right-3 text-[10px] px-2 py-1 rounded-md bg-black/70 text-gray-300 font-mono">
                    {m.filled}/{m.slots}
                  </div>

                  {/* map name bottom-left */}
                  <p className="absolute bottom-2 left-3 text-[10px] tracking-[0.2em] text-white/60 uppercase">
                    {m.name}
                  </p>
                </div>

                {/* CONTENT */}
                <div className="p-4 flex flex-col flex-1">

                  <h3 className="text-white text-md tracking-widest leading-snug group-hover:text-[#F2AA00] transition-colors duration-200">
                    {m.title}
                  </h3>

                  <p className="text-gray-500 text-xs mt-1.5 leading-relaxed">
                    {m.desc}
                  </p>

                  {/* PROGRESS */}
                  {m.slots > 0 && (
                    <div className="mt-3">
                      <div className="h-[2px] bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            percent === 100 ? "bg-red-500" : "bg-[#F2AA00]"
                          }`}
                          style={{
                            width: barsActive ? `${percent}%` : "0%",
                            transitionDelay: `${i * 90}ms`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* FOOTER */}
                  <div className="flex justify-between text-[11px] mt-3 flex-1 items-end pb-0.5">
                    <span className="text-[#F2AA00]/80 tracking-wide">{m.prize}</span>
                    <span className="text-gray-600 tracking-wide">{m.date}</span>
                  </div>

                  {/* BUTTON */}
                  <button
                    className={`mt-4 w-full py-2 text-xs tracking-widest transition-all duration-150 active:scale-[0.98] ${
                      m.status === "UPCOMING"
                        ? "border border-gray-700 text-gray-400 hover:border-[#F2AA00]/50 hover:text-[#F2AA00] hover:bg-[#F2AA00]/5"
                        : "border border-[#F2AA00]/60 text-[#F2AA00] hover:bg-[#F2AA00] hover:text-black hover:shadow-lg hover:shadow-[#F2AA00]/20"
                    }`}
                  >
                    {m.status === "UPCOMING" ? "Notify Me" : "Join Now"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}