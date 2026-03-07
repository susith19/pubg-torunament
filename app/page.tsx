"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMapLocationDot,
  faUsers,
  faSackDollar,
} from "@fortawesome/free-solid-svg-icons";
import { faYoutube, faInstagram } from "@fortawesome/free-brands-svg-icons";
import TournamentModes from "./components/torunaments_modes";
import UpcomingTournaments from "./components/upcoming_matches";
import MapTopMatches from "./components/maps";
import HowItWorks from "./components/howitworks";
import { auth } from "@/lib/firebase";

// ── TYPES ────────────────────────────────────────────────
type SocialLink = {
  id: number;
  platform: "youtube" | "instagram";
  label: string;
  url: string;
  is_live: boolean;
};

// ── FOUNDERS / DEVS DATA ─────────────────────────────────
const TEAM = [
  {
    role: "Founder",
    name: "Ashwin",
    handle: "@ashwin",
    avatar: "/ashwin.png",
    bio: "Visionary behind the platform. Building the future of competitive mobile gaming in India.",
    color: "bg-[#F2AA00]/20 text-[#F2AA00] ring-[#F2AA00]/30",
  },
  {
    role: "Co-Founder",
    name: "Vijay Titus",
    handle: "@vijayTitus",
    avatar: "/vijay.PNG",
    bio: "Strategy & operations. Making sure every tournament runs flawlessly.",
    color: "bg-purple-500/20 text-purple-400 ring-purple-500/30",
  },
  {
    role: "Developer",
    name: "Susith K",
    handle: "susithkannan@gmail.com",
    avatar: "SK",
    bio: "Full-stack engineer. Built this platform from the ground up. Github-susith19",
    color: "bg-blue-500/20 text-blue-400 ring-blue-500/30",
  },
];

const features = [
  {
    title: "Multiple Maps",
    desc: "Master Erangel, Miramar, Sanhok, and Vikendi. Prove your tactical adaptability.",
    icon: faMapLocationDot,
  },
  {
    title: "Squad Battles",
    desc: "4-player squad format. Coordinate, communicate, and execute strategies to outlive all other teams.",
    icon: faUsers,
  },
  {
    title: "Huge Rewards",
    desc: "Prize pool distributed among top teams. MVP awards and exclusive in-game skins.",
    icon: faSackDollar,
  },
];

// ── MAIN PAGE ─────────────────────────────────────────────
export default function HomePage() {
  const router = useRouter();

  const [homeData, setHomeData] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);
  const [cardVisible, setCardVisible] = useState(false);
  const [featuresVisible, setFeaturesVisible] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  // typewriter
  const word = "DOMINATE.";
  const [text, setText] = useState("");
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (index < word.length) {
      const t = setTimeout(() => {
        setText((p) => p + word[index]);
        setIndex(index + 1);
      }, 120);
      return () => clearTimeout(t);
    }
  }, [index]);
  useEffect(() => {
    if (index === word.length) {
      const t = setTimeout(() => {
        setText("");
        setIndex(0);
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [index]);

  // animations
  useEffect(() => {
    const ts = [
      setTimeout(() => setHeroVisible(true), 100),
      setTimeout(() => setCardVisible(true), 350),
      setTimeout(() => setFeaturesVisible(true), 500),
    ];
    return () => ts.forEach(clearTimeout);
  }, []);

  // auth state
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => setIsLoggedIn(!!user));
    return () => unsub();
  }, []);

  // fetch home data
  useEffect(() => {
    fetch("/api/home")
      .then((r) => r.json())
      .then(setHomeData)
      .catch(console.error)
      .finally(() => setDataLoading(false));
  }, []);
  useEffect(() => {
  // Singleton — reuse the same instance if already created
  if (audio) return;

  const music = new Audio("/bg_music.mp3");
  music.loop   = true;
  music.volume = 0.4;

  const tryPlay = () => {
    music.play().catch(() => {
      // If still blocked, wait for next interaction
      window.addEventListener("click", tryPlay, { once: true });
    });
  };

  // Try immediately (works if user already interacted, e.g. clicked nav link)
  music.play().catch(() => {
    // Blocked by browser — wait for first user interaction
    window.addEventListener("click", tryPlay, { once: true });
  });

  setAudio(music);

  return () => {
    music.pause();
    music.currentTime = 0;
    window.removeEventListener("click", tryPlay);
  };
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  // ── Join Now handler ──────────────────────────────────
  const handleJoinNow = () => {
    if (!isLoggedIn) {
      router.push("/login");
    } else {
      router.push("/tournaments");
    }
  };

  // social links from API
  const socialLinks: SocialLink[] = homeData?.social ?? [];
  const ytLinks = socialLinks.filter((l) => l.platform === "youtube");
  const igLinks = socialLinks.filter((l) => l.platform === "instagram");
  const hasSocial = ytLinks.length > 0 || igLinks.length > 0;

  return (
    <div className="bg-black text-white min-h-screen">
      {/* ── HERO ── */}
      <section className="relative min-h-screen overflow-hidden pb-6">
        <Image
          src="/PUBG-wallpaper.jpg"
          alt="bg"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-black to-transparent" />

        <div className="relative z-10 h-[80vh] flex items-center px-6 sm:px-10">
          <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-10">
            {/* LEFT */}
            <div
              className={`max-w-xl transition-all duration-700 ${heroVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"}`}
            >
              <p className="text-xs tracking-[0.4em] text-[#F2AA00]/70 mb-4 uppercase">
                Battle Royale Tournament
              </p>
              <h1 className="text-5xl sm:text-6xl tracking-wider leading-tight">
                SURVIVE. <br />
                <span className="text-[#F2AA00]">
                  {text}
                  <span className="animate-pulse">|</span>
                </span>
                <br />
                CONQUER.
              </h1>
              <p className="text-gray-400 mt-4 tracking-widest text-base">
                Join the ultimate battle royale tournament and win{" "}
                <span className="text-[#F2AA00]">Prizes</span>
              </p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleJoinNow}
                  className="bg-[#F2AA00] text-black px-6 py-3 text-sm tracking-widest hover:bg-[#e09e00] hover:shadow-lg hover:shadow-[#F2AA00]/20 active:scale-95 transition-all duration-150"
                >
                  Join Now
                </button>
                <a href="/tournaments">
                  <button className="border border-gray-700 text-gray-300 px-6 py-3 text-sm tracking-widest hover:border-[#F2AA00]/50 hover:text-[#F2AA00] transition-all duration-200">
                    View Schedule
                  </button>
                </a>
              </div>
            </div>

            {/* RIGHT — LIVE STREAMS CARD */}
            <div
              className={`bg-black/60 border border-[#F2AA00]/30 p-6 rounded-xl backdrop-blur-lg w-full max-w-[420px] transition-all duration-700 hover:border-[#F2AA00]/50 hover:shadow-xl hover:shadow-[#F2AA00]/10 ${cardVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            >
              <div className="mb-5">
                <p className="text-[10px] tracking-[0.4em] text-[#F2AA00]/60 uppercase mb-1">
                  Follow & Watch
                </p>
                <h3 className="text-white text-base tracking-wide">
                  Live Streams & Updates
                </h3>
              </div>
              <div className="h-px bg-gray-800 mb-5" />

              {dataLoading && (
                <div className="flex items-center justify-center py-10">
                  <div className="w-5 h-5 border-2 border-[#F2AA00]/30 border-t-[#F2AA00] rounded-full animate-spin" />
                </div>
              )}

              {!dataLoading && !hasSocial && (
                <div className="text-center py-10">
                  <p className="text-gray-600 text-xs tracking-widest">
                    No social links available
                  </p>
                  <p className="text-gray-700 text-[10px] mt-2">
                    Check back soon for live streams
                  </p>
                </div>
              )}

              {!dataLoading && hasSocial && (
                <div className="flex flex-col gap-3">
                  {ytLinks.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center gap-4 bg-black/40 border border-red-500/20 rounded-xl px-4 py-3 hover:border-red-500/40 hover:bg-red-500/5 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(239,68,68,0.1)] transition-all duration-200"
                    >
                      <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-red-500/20 transition-colors">
                        <FontAwesomeIcon
                          icon={faYoutube}
                          className="text-red-500 text-lg"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-white text-sm tracking-wide">
                            {link.label}
                          </p>
                          {link.is_live && (
                            <span className="flex items-center gap-1 text-[9px] text-red-400 border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 rounded-full tracking-widest">
                              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse inline-block" />
                              LIVE
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 text-[11px] mt-0.5 truncate">
                          {link.url}
                        </p>
                      </div>
                      <span className="text-red-400/0 group-hover:text-red-400/80 text-xs transition-all duration-200">
                        →
                      </span>
                    </a>
                  ))}

                  {igLinks.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center gap-4 bg-black/40 border border-pink-500/20 rounded-xl px-4 py-3 hover:border-pink-500/40 hover:bg-pink-500/5 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(236,72,153,0.1)] transition-all duration-200"
                    >
                      <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-pink-500/20 transition-colors">
                        <FontAwesomeIcon
                          icon={faInstagram}
                          className="text-pink-500 text-lg"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-white text-sm tracking-wide">
                            {link.label}
                          </p>
                          {link.is_live && (
                            <span className="flex items-center gap-1 text-[9px] text-pink-400 border border-pink-500/30 bg-pink-500/10 px-1.5 py-0.5 rounded-full tracking-widest">
                              <span className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-pulse inline-block" />
                              LIVE
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 text-[11px] mt-0.5 truncate">
                          {link.url}
                        </p>
                      </div>
                      <span className="text-pink-400/0 group-hover:text-pink-400/80 text-xs transition-all duration-200">
                        →
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FEATURES */}
        <section className="relative z-10 px-6 pt-4">
          <div className="grid md:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {features.map((f, i) => (
              <div
                key={i}
                className={`group relative p-6 rounded-xl bg-[#0b0b0b] border border-gray-800 overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:border-[#F2AA00]/50 hover:shadow-[0_0_30px_rgba(242,170,0,0.12)] ${featuresVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                style={{ transitionDelay: `${500 + i * 100}ms` }}
              >
                <div className="w-11 h-11 flex items-center justify-center rounded-lg bg-[#F2AA00]/10 group-hover:bg-[#F2AA00]/20 transition-colors">
                  <FontAwesomeIcon
                    icon={f.icon}
                    className="text-[#F2AA00] text-base transition-transform group-hover:scale-110"
                  />
                </div>
                <h3 className="mt-5 text-lg tracking-wide">{f.title}</h3>
                <p className="mt-2 text-gray-500 text-sm leading-relaxed">
                  {f.desc}
                </p>
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-800 overflow-hidden">
                  <div className="h-full w-8 bg-[#F2AA00] transition-all duration-500 group-hover:w-full" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </section>

      {/* OTHER SECTIONS */}
      <section className="px-6">
        <UpcomingTournaments data={homeData?.upcoming} />
      </section>
      <section className="px-6">
        <MapTopMatches data={homeData?.mapMatches} />
      </section>
      <section className="px-6">
        <TournamentModes data={homeData?.modes} />
      </section>
      <section className="px-6">
        <HowItWorks />
      </section>

      {/* ── FOUNDERS & DEVELOPERS ── */}
      <section className="bg-black py-20 px-6 sm:px-10">
        <div className="max-w-9xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#F2AA00]/60 text-xs tracking-[0.4em] uppercase mb-3">
              The People Behind It
            </p>
            <h2 className="text-3xl tracking-widest text-white">
              Founders & Developers
            </h2>
            <div className="w-12 h-0.5 bg-[#F2AA00] mx-auto mt-4" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {TEAM.map((member, i) => (
              <div
                key={i}
                className="group bg-[#0b0b0b] border border-gray-800 rounded-2xl p-6 hover:border-[#F2AA00]/30 hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(242,170,0,0.08)] transition-all duration-300"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className={`w-14 h-14 rounded-full ${member.color} ring-2 flex items-center justify-center text-2xl font-bold flex-shrink-0 overflow-hidden`}
                  >
                    {member.avatar?.includes(".") ? (
                      <Image
                        src={member.avatar}
                        alt={member.name}
                        width={56}
                        height={56}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      member.avatar
                    )}
                  </div>
                  <div>
                    <p className="text-white tracking-wide text-sm">
                      {member.name}
                    </p>
                    <p className="text-gray-600 text-[11px] mt-0.5">
                      {member.handle}
                    </p>
                    <span className="text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full border border-[#F2AA00]/30 text-[#F2AA00] bg-[#F2AA00]/5 mt-1 inline-block">
                      {member.role}
                    </span>
                  </div>
                </div>
                <p className="text-gray-500 text-xs leading-relaxed">
                  {member.bio}
                </p>
                <div className="h-px bg-gray-800 group-hover:bg-[#F2AA00]/20 mt-4 transition-colors duration-300" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}