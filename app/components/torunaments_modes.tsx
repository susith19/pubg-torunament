"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faUsers,
  faUserGroup,
} from "@fortawesome/free-solid-svg-icons";

const modes = [
  {
    title: "Solo Battle",
    matches: "150 matches available",
    tag: "PC & Mobile",
    icon: faUser,
  },
  {
    title: "Duo Queue",
    matches: "85 matches available",
    tag: "PC Only",
    icon: faUsers,
  },
  {
    title: "Squad Wars",
    matches: "200+ matches available",
    tag: "Mobile Only",
    icon: faUserGroup,
  },
];

export default function TournamentModes() {
  return (
    <section className="bg-black py-16 px-6">
      <div className="w-full">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-2xl tracking-wide text-white">
              Explore Tournament Modes
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Choose your preferred battle format
            </p>
          </div>

          <button className="text-[#F2AA00] text-sm hover:underline">
            View All Modes →
          </button>
        </div>

        {/* CARDS */}
        <div className="grid md:grid-cols-3 gap-6">
          {modes.map((m, i) => (
            <div
              key={i}
              className="
                group flex items-center gap-4
                bg-[#0b0b0b]
                border border-gray-800
                rounded-xl p-5
                transition-all duration-300
                hover:border-[#F2AA00]/50
                hover:bg-[#111]
                hover:shadow-[0_0_20px_rgba(242,170,0,0.1)]
              "
            >
              {/* ICON BOX */}
              <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-[#F2AA00]/10">
                <FontAwesomeIcon
                  icon={m.icon}
                  className="text-[#F2AA00] text-lg transition-transform duration-300 group-hover:scale-110"
                />
              </div>

              {/* TEXT */}
              <div className="flex-1">
                <h3 className="text-white tracking-wide">
                  {m.title}
                </h3>

                <p className="text-gray-400 text-sm mt-1">
                  {m.matches}
                </p>

                {/* TAG */}
                <span className="inline-block mt-2 text-xs px-2 py-1 rounded bg-[#F2AA00]/10 text-[#F2AA00]">
                  {m.tag}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}