"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCrown,
  faPlay,
  faShield,
  faBolt,
  faGraduationCap,
  faAppleWhole,
} from "@fortawesome/free-solid-svg-icons";

const tournaments = [
  {
    title: "Pro League S4",
    prize: "$2,000",
    map: "PC • Erangel",
    desc: "Top teams qualify for finals.",
    status: "Closing Soon",
    icon: faCrown,
    slots: 100,
    filled: 90,
  },
  {
    title: "Streamer Showdown",
    prize: "$500",
    map: "Mobile • Sanhok",
    desc: "Hosted by top streamers.",
    status: "Open",
    icon: faPlay,
    slots: 100,
    filled: 40,
  },
  {
    title: "Clan Wars Weekly",
    prize: "$1,200",
    map: "Mobile • Miramar",
    desc: "Squad vs squad battles.",
    status: "Open",
    icon: faShield,
    slots: 100,
    filled: 80,
  },
  {
    title: "Blitz Mode Cup",
    prize: "$300",
    map: "PC • Livik",
    desc: "Fast-paced 15 min matches.",
    status: "Open",
    icon: faBolt,
    slots: 100,
    filled: 60,
  },
  {
    title: "Rookie Rising",
    prize: "$100",
    map: "Mobile • Erangel",
    desc: "For beginners under level 30.",
    status: "Full",
    icon: faGraduationCap,
    slots: 100,
    filled: 100,
  },
  {
    title: "iOS Championship",
    prize: "$800",
    map: "iPad • Erangel",
    desc: "Exclusive for iOS players.",
    status: "Open",
    icon: faAppleWhole,
    slots: 100,
    filled: 70,
  },
];

export default function UpcomingTournaments() {
  return (
    <section className="bg-black py-16 px-6">
      <div className="w-full">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-2xl tracking-wide text-white">
              Upcoming Tournaments
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Register now for the hottest events
            </p>
          </div>

          <button className="border border-[#F2AA00] text-[#F2AA00] px-4 py-2 text-sm hover:bg-[#F2AA00] hover:text-black transition">
            See All Events
          </button>
        </div>

        {/* GRID */}
        <div className="grid md:grid-cols-3 gap-6">
          {tournaments.map((t, i) => (
            <div
              key={i}
              className="
                group bg-[#0b0b0b]
                border border-gray-800
                rounded-xl p-5
                transition-all duration-300
                hover:-translate-y-1
                hover:border-[#F2AA00]/50
                hover:shadow-[0_0_25px_rgba(242,170,0,0.1)]
              "
            >
              {/* TOP */}
              <div className="flex justify-between items-start">

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-[#F2AA00]/10">
                    <FontAwesomeIcon
                      icon={t.icon}
                      className="text-[#F2AA00] text-lg group-hover:scale-110 transition"
                    />
                  </div>

                  <div>
                    <h3 className="text-white tracking-wide">
                      {t.title}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {t.map}
                    </p>
                  </div>
                </div>

                <span className="text-[#F2AA00] text-sm">
                  {t.prize}
                </span>
              </div>

              {/* DESC */}
              <p className="text-gray-400 text-sm mt-4">
                {t.desc}
              </p>

              {/* STATUS */}
              <div className="mt-4">
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    t.status === "Open"
                      ? "bg-green-500/10 text-green-400"
                      : t.status === "Full"
                      ? "bg-red-500/10 text-red-400"
                      : "bg-[#F2AA00]/10 text-[#F2AA00]"
                  }`}
                >
                  {t.status}
                </span>
              </div>

              {/* BUTTONS */}
              <div className="flex gap-3 mt-5">
                <button className="flex-1 border border-gray-700 text-gray-300 py-2 text-sm hover:border-[#F2AA00] hover:text-[#F2AA00] transition">
                  Details
                </button>

                <button
                  className={`flex-1 py-2 text-sm transition ${
                    t.status === "Full"
                      ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                      : "bg-[#F2AA00] text-black hover:opacity-90"
                  }`}
                >
                  {t.status === "Full" ? "Full" : "Join Now"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}