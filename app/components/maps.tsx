"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

const MAP_IMAGES: Record<string, string> = {
  Erangel: "/maps/Erangle.jpg",
  Miramar: "/maps/miramar.jpg",
  Sanhok: "/maps/Sanhok.jpg",
  Vikendi: "/maps/Vikendi.jpg",
  Rondo: "/maps/rondo.png",
  Warehouse: "/maps/warehouse.jpg",
  Livik: "/maps/livik.png",
};

const statusStyle: Record<string, string> = {
  Live:   "bg-red-500 text-white",
  Open:   "bg-[#F2AA00] text-black",
  Full:   "bg-gray-700 text-gray-300",
  Closed: "bg-gray-800 text-gray-500",
};

export default function MapTopMatches({ data }: { data?: any[] }) {
  const router = useRouter();
  const sectionRef   = useRef<HTMLDivElement>(null);
  const [visible, setVisible]       = useState(false);
  const [barsActive, setBarsActive] = useState(false);
  const [maps, setMaps]             = useState<any[] | null>(data ?? null);

  useEffect(() => {
    if (data !== undefined) return;
    fetch("/api/home")
      .then((r) => r.json())
      .then((d) => setMaps(d.mapMatches ?? []))
      .catch(() => setMaps([]));
  }, [data]);

  useEffect(() => {
    if (data !== undefined) setMaps(data);
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

  const isLoading = maps === null;

  return (
    <section ref={sectionRef} className="py-16 px-6">
      <div className="w-full">

        <div className={`mb-10 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}>
          <h2 className="text-2xl tracking-wide text-white">Top Matches by Map</h2>
          <p className="text-gray-500 text-sm mt-1 tracking-wide">Explore tournaments across different battlegrounds</p>
        </div>

        {isLoading && (
          <div className="flex justify-center py-16">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin text-[#F2AA00] w-6 h-6" />
          </div>
        )}

        {!isLoading && maps!.length === 0 && (
          <p className="text-center py-16 text-gray-600 text-sm tracking-widest">No map matches available right now.</p>
        )}

        {!isLoading && maps!.length > 0 && (
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5">
            {maps!.map((m, i) => {
              const percent  = m.slots > 0 ? Math.round((m.filled / m.slots) * 100) : 0;
              const imgSrc   = MAP_IMAGES[m.map] ?? "/pubg-wallpaper.jpg";
              const isClosed = m.status === "Full" || m.status === "Closed";
              const isUpcoming = m.filled === 0 && m.status === "Open";

              return (
                <div
                  key={m.id}
                  className={`group relative rounded-xl overflow-hidden bg-[#0b0b0b] border border-gray-800 flex flex-col transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(242,170,0,0.14)] hover:border-[#F2AA00]/40 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
                  style={{ transitionDelay: `${i * 90}ms` }}
                >
                  {/* IMAGE */}
                  <div className="relative h-40 overflow-hidden flex-shrink-0">
                    <Image src={imgSrc} alt={m.map} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                    {/* STATUS */}
                    <div className={`absolute top-3 left-3 text-[10px] px-2.5 py-1 rounded-md tracking-widest ${statusStyle[m.status] ?? "bg-gray-700 text-gray-300"} ${m.status === "Live" ? "animate-pulse" : ""}`}>
                      {m.status === "Live" && <span className="inline-block w-1.5 h-1.5 rounded-full bg-white mr-1.5 align-middle" />}
                      {m.status}
                    </div>

                    {/* SLOTS */}
                    <div className="absolute top-3 right-3 text-[10px] px-2 py-1 rounded-md bg-black/70 text-gray-300 font-mono">
                      {m.filled}/{m.slots}
                    </div>

                    <p className="absolute bottom-2 left-3 text-[10px] tracking-[0.2em] text-white/60 uppercase">{m.map}</p>
                  </div>

                  {/* CONTENT */}
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="text-white text-md tracking-widest leading-snug group-hover:text-[#F2AA00] transition-colors duration-200">{m.title}</h3>
                    <p className="text-gray-500 text-xs mt-1.5">{m.mode} · {m.platform}</p>

                    {/* PROGRESS */}
                    <div className="mt-3">
                      <div className="h-[2px] bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${percent === 100 ? "bg-red-500" : "bg-[#F2AA00]"}`}
                          style={{ width: barsActive ? `${percent}%` : "0%", transitionDelay: `${i * 90}ms` }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between text-[11px] mt-3 flex-1 items-end pb-0.5">
                      <span className="text-[#F2AA00]/80 tracking-wide">{m.prize}</span>
                      <span className="text-gray-600 tracking-wide">{m.fee}</span>
                    </div>

                    {/* BUTTONS — Details + Join Now */}
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => router.push(`/tournaments/${m.id}`)}
                        className="flex-1 border border-gray-800 text-gray-400 py-2 text-xs tracking-widest hover:border-[#F2AA00]/50 hover:text-[#F2AA00] hover:bg-[#F2AA00]/5 transition-all duration-200"
                      >
                        Details
                      </button>
                      <button
                        disabled={isClosed}
                        onClick={() => !isClosed && router.push(`/tournaments/${m.id}/register`)}
                        className={`flex-1 py-2 text-xs tracking-widest transition-all duration-150 active:scale-[0.98] ${
                          isClosed
                            ? "border border-gray-700 text-gray-500 cursor-not-allowed"
                            : "border border-[#F2AA00]/60 text-[#F2AA00] hover:bg-[#F2AA00] hover:text-black hover:shadow-lg hover:shadow-[#F2AA00]/20"
                        }`}
                      >
                        {m.status === "Full" ? "Full" : m.status === "Closed" ? "Closed" : isUpcoming ? "Join Now" : "Join Now"}
                      </button>
                    </div>
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