"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCrown, faPlay, faShield, faBolt,
  faGraduationCap, faAppleWhole, faSpinner,
} from "@fortawesome/free-solid-svg-icons";

const fallbackIcons = [faCrown, faPlay, faShield, faBolt, faGraduationCap, faAppleWhole];

// prop: data passed from parent (already fetched), avoids double-fetch
export default function UpcomingTournaments({ data }: { data?: any[] }) {
  const router = useRouter();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible]       = useState(false);
  const [barsActive, setBarsActive] = useState(false);
  const [tournaments, setTournaments] = useState<any[] | null>(data ?? null);

  // only fetch if parent didn't pass data
  useEffect(() => {
    if (data !== undefined) return;
    fetch("/api/home")
      .then((r) => r.json())
      .then((d) => setTournaments(d.upcoming ?? []))
      .catch(() => setTournaments([]));
  }, [data]);

  // sync when parent data arrives (data was undefined initially)
  useEffect(() => {
    if (data !== undefined) setTournaments(data);
  }, [data]);

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

  const isLoading = tournaments === null;

  return (
    <section ref={sectionRef} className="py-16 px-6">
      <div className="w-full">

        {/* HEADER */}
        <div className={`flex justify-between items-center mb-10 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}>
          <div>
            <h2 className="text-2xl tracking-wide text-white">Upcoming Tournaments</h2>
            <p className="text-gray-500 text-sm mt-1 tracking-wide">Register now for the hottest events</p>
          </div>
          <button
            onClick={() => router.push("/tournaments")}
            className="border border-[#F2AA00]/60 text-[#F2AA00] px-4 py-2 text-xs tracking-widest hover:bg-[#F2AA00] hover:text-black hover:shadow-lg hover:shadow-[#F2AA00]/20 active:scale-95 transition-all duration-200"
          >
            See All Events
          </button>
        </div>

        {/* LOADING */}
        {isLoading && (
          <div className="flex justify-center py-16">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin text-[#F2AA00] w-6 h-6" />
          </div>
        )}

        {/* EMPTY */}
        {!isLoading && tournaments!.length === 0 && (
          <p className="text-center py-16 text-gray-600 text-sm tracking-widest">No upcoming tournaments. Check back soon.</p>
        )}

        {/* GRID */}
        {!isLoading && tournaments!.length > 0 && (
          <div className="grid md:grid-cols-3 gap-5">
            {tournaments!.map((t, i) => {
              const percent = t.slots > 0 ? Math.round((t.filled / t.slots) * 100) : 0;
              const icon    = fallbackIcons[i % fallbackIcons.length];
              const isFull  = t.status === "Full";

              return (
                <div
                  key={t.id}
                  className={`group bg-[#0b0b0b] border border-gray-800 rounded-xl p-5 flex flex-col transition-all duration-500 hover:-translate-y-1.5 hover:border-[#F2AA00]/50 hover:shadow-[0_0_28px_rgba(242,170,0,0.1)] ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                  style={{ transitionDelay: `${i * 80}ms` }}
                >
                  {/* TOP ROW */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 flex items-center justify-center rounded-lg bg-[#F2AA00]/10 group-hover:bg-[#F2AA00]/20 transition-colors duration-300 flex-shrink-0">
                        <FontAwesomeIcon icon={icon} className="text-[#F2AA00] text-sm transition-transform duration-300 group-hover:scale-110" />
                      </div>
                      <div>
                        <h3 className="text-white text-md tracking-widest leading-snug">{t.title}</h3>
                        <p className="text-[11px] text-gray-500 mt-0.5 tracking-wide">{t.platform} · {t.map}</p>
                      </div>
                    </div>
                    <span className="text-[#F2AA00] text-sm tracking-wide flex-shrink-0 ml-2">{t.prize}</span>
                  </div>

                  {/* MODE + FEE TAGS */}
                  <div className="mt-3 flex gap-2">
                    <span className="text-[10px] px-2.5 py-1 rounded-md bg-[#F2AA00]/10 text-[#F2AA00] border border-[#F2AA00]/10 tracking-widest">{t.mode}</span>
                    <span className="text-[10px] px-2.5 py-1 rounded-md bg-gray-800/60 text-gray-400 border border-gray-700 tracking-widest">{t.fee}</span>
                  </div>

                  {/* PROGRESS */}
                  <div className="mt-4">
                    <div className="flex justify-between text-[10px] text-gray-600 mb-1.5">
                      <span>{t.filled} joined</span>
                      <span>{t.slots} max</span>
                    </div>
                    <div className="h-[3px] bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${percent === 100 ? "bg-red-500" : "bg-[#F2AA00]"}`}
                        style={{ width: barsActive ? `${percent}%` : "0%", transitionDelay: `${i * 80}ms` }}
                      />
                    </div>
                  </div>

                  {/* STATUS */}
                  <div className="mt-3">
                    <span className={`text-[10px] px-2.5 py-1 rounded-md tracking-widest border ${
                      t.status === "Open" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                      t.status === "Full" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                      "bg-[#F2AA00]/10 text-[#F2AA00] border-[#F2AA00]/20"
                    }`}>{t.status}</span>
                  </div>

                  {/* BUTTONS */}
                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-800/60">
                    {/* Details → /tournaments/[id] */}
                    <button
                      onClick={() => router.push(`/tournaments/${t.id}`)}
                      className="flex-1 border border-gray-800 text-gray-400 py-2 text-xs tracking-widest hover:border-[#F2AA00]/50 hover:text-[#F2AA00] hover:bg-[#F2AA00]/5 transition-all duration-200"
                    >
                      Details
                    </button>
                    {/* Join Now → /tournaments/[id]/register */}
                    <button
                      disabled={isFull}
                      onClick={() => !isFull && router.push(`/tournaments/${t.id}/register`)}
                      className={`flex-1 py-2 text-xs tracking-widest transition-all duration-150 ${
                        isFull
                          ? "bg-gray-800/60 text-gray-600 cursor-not-allowed border border-gray-800"
                          : "bg-[#F2AA00] text-black hover:bg-[#e09e00] hover:shadow-md hover:shadow-[#F2AA00]/20 active:scale-[0.97]"
                      }`}
                    >
                      {isFull ? "Full" : "Join Now"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}