"use client";

import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faGamepad,
  faTrophy,
} from "@fortawesome/free-solid-svg-icons";

const steps = [
  {
    id: "01",
    title: "Create Profile",
    desc: "Set up your account and get ready to compete in tournaments.",
    icon: faUser,
  },
  {
    id: "02",
    title: "Enroll in a Tournament",
    desc: "Join matches based on your skill and preferred game mode.",
    icon: faGamepad,
  },
  {
    id: "03",
    title: "Play & Win Real Money",
    desc: "Compete, dominate, and win rewards in real competitions.",
    icon: faTrophy,
  },
];

export default function HowItWorks() {
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
    <section ref={sectionRef} className="bg-black py-16 px-6 relative overflow-hidden">

      {/* bg decoration */}
      <div className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-[#F2AA00]/4 blur-[100px]" />

      <div className="max-w-9xl mx-auto grid md:grid-cols-2 gap-16 items-center relative z-10">

        {/* LEFT */}
        <div
          className={`relative transition-all duration-700 ${
            visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
          }`}
        >
          <p className="text-xs tracking-[0.4em] text-[#F2AA00]/60 uppercase mb-4">
            Getting Started
          </p>

          <h2 className="text-5xl tracking-wide text-white leading-tight">
            How It <br />
            <span className="text-[#F2AA00]">Works</span>
          </h2>

          <p className="text-gray-500 text-sm mt-4 max-w-xs leading-relaxed tracking-wide">
            Three simple steps to start competing and earning real rewards.
          </p>

          {/* abstract decorative boxes */}
          <div className="mt-10 flex gap-3 opacity-10">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="w-10 h-6 bg-[#F2AA00] rotate-12 rounded-sm"
                style={{ opacity: 1 - i * 0.12 }}
              />
            ))}
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-2">
          {steps.map((step, i) => (
            <div key={i}>
              <div
                className={`group flex items-center gap-5 p-4 rounded-xl border border-transparent hover:border-gray-800 hover:bg-[#0b0b0b] hover:translate-x-2 transition-all duration-300 ${
                  visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
                }`}
                style={{ transitionDelay: `${200 + i * 120}ms` }}
              >
                {/* NUMBER */}
                <div className="text-[#F2AA00]/30 text-3xl w-10 text-right flex-shrink-0 font-mono group-hover:text-[#F2AA00]/60 transition-colors duration-200">
                  {step.id}
                </div>

                {/* ICON */}
                <div className="w-13 h-13 flex-shrink-0 flex items-center justify-center rounded-xl bg-[#F2AA00]/10 group-hover:bg-[#F2AA00]/20 transition-colors duration-300 p-3.5">
                  <FontAwesomeIcon
                    icon={step.icon}
                    className="text-[#F2AA00] text-lg transition-transform duration-300 group-hover:scale-110"
                  />
                </div>

                {/* TEXT */}
                <div>
                  <h3 className="text-white text-sm tracking-wide group-hover:text-[#F2AA00] transition-colors duration-200">
                    {step.title}
                  </h3>
                  <p className="text-gray-500 text-xs mt-1 max-w-xs leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>

              {/* connector line between steps */}
              {i < steps.length - 1 && (
                <div
                  className={`ml-[4.75rem] w-px h-5 bg-gray-800 transition-all duration-500 ${
                    visible ? "opacity-100" : "opacity-0"
                  }`}
                  style={{ transitionDelay: `${300 + i * 120}ms` }}
                />
              )}
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}