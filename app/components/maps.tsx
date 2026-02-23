"use client";

import Image from "next/image";

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

export default function MapTopMatches() {
  return (
    <section className="bg-black py-16 px-6">
      <div className="w-full">

        {/* HEADER */}
        <div className="mb-10">
          <h2 className="text-2xl tracking-wide text-white">
            Top Matches by Map
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Explore tournaments across different battlegrounds
          </p>
        </div>

        {/* GRID */}
        <div className="grid md:grid-cols-4 gap-6">
          {maps.map((m, i) => {
            const percent = Math.round((m.filled / m.slots) * 100);

            return (
              <div
                key={i}
                className="
                  group relative rounded-2xl overflow-hidden
                  bg-[#0b0b0b]
                  border border-gray-800
                  transition-all duration-300
                  hover:-translate-y-2
                  hover:shadow-[0_0_30px_rgba(242,170,0,0.15)]
                  hover:border-[#F2AA00]/40
                "
              >
                {/* IMAGE */}
                <div className="relative h-40">
                  <Image
                    src={m.image}
                    alt={m.name}
                    fill
                    className="object-cover group-hover:scale-105 transition duration-500"
                  />

                  {/* DARK OVERLAY */}
                  <div className="absolute inset-0 bg-black/50" />

                  {/* STATUS */}
                  <div className="absolute top-3 left-3 text-xs px-2 py-1 rounded bg-[#F2AA00] text-black">
                    {m.status}
                  </div>

                  {/* SLOTS */}
                  <div className="absolute top-3 right-3 text-xs px-2 py-1 rounded bg-black/60 text-white">
                    {m.filled}/{m.slots}
                  </div>
                </div>

                {/* CONTENT */}
                <div className="p-4">

                  <h3 className="text-white tracking-wide">
                    {m.title}
                  </h3>

                  <p className="text-gray-400 text-sm mt-2">
                    {m.desc}
                  </p>

                  {/* FOOTER */}
                  <div className="flex justify-between text-xs text-gray-400 mt-4">
                    <span>{m.prize}</span>
                    <span>{m.date}</span>
                  </div>

                  {/* BUTTON */}
                  <button className="mt-4 w-full border border-[#F2AA00] py-2 text-sm hover:bg-[#F2AA00] hover:text-black transition">
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