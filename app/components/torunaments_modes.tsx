"use client";

import { useEffect, useRef, useState } from "react";
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
    count: 150,
  },
  {
    title: "Duo Queue",
    matches: "85 matches available",
    tag: "PC Only",
    icon: faUsers,
    count: 85,
  },
  {
    title: "Squad Wars",
    matches: "200+ matches available",
    tag: "Mobile Only",
    icon: faUserGroup,
    count: 200,
  },
];

export default function TournamentModes() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-16 px-6">
      <div className="w-full">

        {/* HEADER */}
        <div
          className={`flex justify-between items-center mb-10 transition-all duration-500 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
          }`}
        >
          <div>
            <h2 className="text-2xl tracking-wide text-white">
              Explore Tournament Modes
            </h2>
            <p className="text-gray-500 text-sm mt-1 tracking-wide">
              Choose your preferred battle format
            </p>
          </div>

          <button className="text-[#F2AA00]/70 text-xs tracking-widest hover:text-[#F2AA00] transition-colors duration-200">
            View All Modes →
          </button>
        </div>

        {/* CARDS */}
        <div className="grid md:grid-cols-3 gap-5">
          {modes.map((m, i) => (
            <div
              key={i}
              className={`group relative flex items-center gap-4 bg-[#0b0b0b] border border-gray-800 rounded-xl p-5 overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:border-[#F2AA00]/50 hover:bg-[#0f0f0f] hover:shadow-[0_0_24px_rgba(242,170,0,0.1)] ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              {/* subtle corner glow on hover */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-[#F2AA00]/5 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -translate-y-1/2 translate-x-1/2" />

              {/* ICON BOX */}
              <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center rounded-xl bg-[#F2AA00]/10 group-hover:bg-[#F2AA00]/20 transition-colors duration-300">
                <FontAwesomeIcon
                  icon={m.icon}
                  className="text-[#F2AA00] text-lg transition-transform duration-300 group-hover:scale-110"
                />
              </div>

              {/* TEXT */}
              <div className="flex-1 min-w-0">
                <h3 className="text-white text-md tracking-widest group-hover:text-[#F2AA00] transition-colors duration-200">
                  {m.title}
                </h3>

                <p className="text-gray-500 text-xs mt-1 tracking-wide">
                  {m.matches}
                </p>

                {/* TAG */}
                <span className="inline-block mt-2 text-[10px] px-2.5 py-1 rounded-md bg-[#F2AA00]/10 text-[#F2AA00] border border-[#F2AA00]/10 tracking-widest">
                  {m.tag}
                </span>
              </div>

              {/* bottom underline sweep */}
              <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-[#F2AA00] group-hover:w-full transition-all duration-500 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}