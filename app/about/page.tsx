"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faYoutube,
  faInstagram,
  faWhatsapp,
} from "@fortawesome/free-brands-svg-icons";
import {
  faEnvelope,
  faPhone,
  faLocationDot,
  faShield,
  faTrophy,
  faUsers,
  faHeadset,
  faChevronDown,
  faGamepad,
  faStar,
  faGlobe,
} from "@fortawesome/free-solid-svg-icons";

// ── DATA ──────────────────────────────────────────────────

const TEAM = [
    {
    name:    "Ashwin",
    role:    "Founder & CEO",
    bio:     "Strategy, operations, and player relations. Ashwin ensures every tournament runs with military precision — from slot management to prize distribution. The backbone that keeps the platform reliable and community-first.",
    avatar:  "AS",
    color:   "from-purple-500 to-purple-700",
    ring:    "ring-purple-500/40",
    contacts: [
      { label: "India",  value: "+91 75399 93019",  href: "tel:+917539993019",   flag: "🇮🇳" },
      { label: "Dubai",  value: "+971 504211486",   href: "tel:+971504211486",   flag: "🇦🇪" },
    ],
  },
  {
    name:    "Viju Titus",
    role:    "Founder & CEO",
    bio:     "The visionary behind KingPUBG Tournaments. With a passion for competitive gaming and community building, Viju built this platform from scratch to give players across India and UAE a professional arena to compete, grow, and win.",
    avatar:  "VT",
    color:   "from-[#F2AA00] to-amber-600",
    ring:    "ring-[#F2AA00]/40",
    contacts: [
      { label: "India",  value: "+91 7418270710",  href: "tel:+917418270710",   flag: "🇮🇳" },
      { label: "Dubai",  value: "+971 588340270",   href: "tel:+971588340270",   flag: "🇦🇪" },
    ],
  },
  
];

const STATS = [
  { value: "500+",  label: "Tournaments Hosted",  icon: faTrophy },
  { value: "10K+",  label: "Registered Players",  icon: faUsers  },
  { value: "2",     label: "Countries",            icon: faGlobe  },
  { value: "24/7",  label: "Support",              icon: faHeadset },
];

const FAQS = [
  {
    q: "How do I register for a tournament?",
    a: "Create a free account, browse upcoming tournaments, and click 'Join Now'. Select your game (PUBG/BGMI), complete the entry fee payment if applicable, and you're registered. Room ID and password are shared 15 minutes before the match starts.",
  },
  {
    q: "How are prize pools distributed?",
    a: "Prize money is transferred directly to the winner's registered UPI ID or bank account within 24–48 hours after the tournament concludes. Top 3 teams typically receive 50%, 30%, and 20% of the prize pool respectively.",
  },
  {
    q: "What happens if I face technical issues during a match?",
    a: "Contact our support team immediately via WhatsApp or Instagram DM with your game ID and a screenshot. Genuine technical issues are reviewed case-by-case. Reconnecting mid-match is allowed within the standard game rules.",
  },
  {
    q: "Can players from UAE participate?",
    a: "Absolutely. KingPUBG Tournaments actively supports players from both India and the UAE. PUBG (PC/Console) is available in UAE, and BGMI for Indian players. Prize transfers are supported internationally.",
  },
  {
    q: "Is there an age restriction?",
    a: "Players must be 13 years or older to register. Players under 18 should have parental consent. We follow fair play guidelines strictly — any use of hacks or cheats results in a permanent ban.",
  },
  {
    q: "How do I report a cheater or dispute a result?",
    a: "Submit a report via email at kingopubgtournaments@gmail.com with your match ID, the suspect's in-game name, and any screenshots or recordings. All reports are reviewed within 48 hours.",
  },
];

const VALUES = [
  { icon: faShield,  title: "Fair Play",       desc: "Zero tolerance for hacks, cheats, or unsportsmanlike conduct. Every match is monitored." },
  { icon: faTrophy,  title: "Competitive Edge", desc: "Professional tournament formats designed to challenge and reward skilled players." },
  { icon: faUsers,   title: "Community First",  desc: "Built by gamers, for gamers. Your feedback shapes every feature and decision." },
  { icon: faGamepad, title: "Multi-Platform",   desc: "PUBG PC, BGMI Mobile — we support the full battle royale ecosystem." },
];

// ── FAQ ITEM ──────────────────────────────────────────────
function FAQItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`border rounded-xl overflow-hidden transition-all duration-300 ${open ? "border-[#F2AA00]/40 bg-[#F2AA00]/5" : "border-gray-800 bg-[#0b0b0b] hover:border-gray-700"}`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-5 text-left gap-4"
      >
        <div className="flex items-center gap-3">
          <span className="text-[#F2AA00]/50 text-xs font-mono tracking-widest">0{index + 1}</span>
          <span className="text-white text-sm tracking-wide">{q}</span>
        </div>
        <FontAwesomeIcon
          icon={faChevronDown}
          className={`text-[#F2AA00] text-xs flex-shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? "max-h-48 opacity-100" : "max-h-0 opacity-0"}`}>
        <p className="px-6 pb-5 text-gray-400 text-sm leading-relaxed border-t border-gray-800/60 pt-4">
          {a}
        </p>
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────
export default function AboutPage() {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 80); }, []);

  return (
    <div className="bg-black text-white min-h-screen">

      {/* ── HERO BANNER ── */}
      <section className="relative py-28 px-6 overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "linear-gradient(#F2AA00 1px, transparent 1px), linear-gradient(90deg, #F2AA00 1px, transparent 1px)", backgroundSize: "60px 60px" }}
        />
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#F2AA00]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-black to-transparent" />

        <div className={`relative z-10 max-w-4xl mx-auto text-center transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="inline-flex items-center gap-2 border border-[#F2AA00]/30 bg-[#F2AA00]/5 px-4 py-1.5 rounded-full mb-6">
            <FontAwesomeIcon icon={faStar} className="text-[#F2AA00] text-[10px]" />
            <span className="text-[#F2AA00] text-[10px] tracking-[0.3em] uppercase">Est. by Gamers, for Gamers</span>
          </div>
          <h1 className="text-5xl sm:text-6xl tracking-wider leading-tight mb-6">
            About <span className="text-[#F2AA00]">KingPUBG</span>
            <br />Tournaments
          </h1>
          <p className="text-gray-400 text-base leading-relaxed max-w-2xl mx-auto tracking-wide">
            We are South Asia's and UAE's premier PUBG & BGMI tournament platform — built to give every player, from bedroom warrior to pro contender, a fair, exciting, and rewarding competitive experience.
          </p>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="px-6 py-10 max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((s, i) => (
            <div
              key={i}
              className={`group bg-[#0b0b0b] border border-gray-800 rounded-2xl p-6 text-center hover:border-[#F2AA00]/40 hover:shadow-[0_0_25px_rgba(242,170,0,0.08)] transition-all duration-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
              style={{ transitionDelay: `${200 + i * 80}ms` }}
            >
              <div className="w-10 h-10 rounded-lg bg-[#F2AA00]/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-[#F2AA00]/20 transition-colors">
                <FontAwesomeIcon icon={s.icon} className="text-[#F2AA00] text-sm" />
              </div>
              <p className="text-3xl font-bold text-white tracking-wider">{s.value}</p>
              <p className="text-gray-500 text-[11px] tracking-widest mt-1 uppercase">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── MISSION ── */}
      <section className="px-6 py-16 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-[#F2AA00]/60 text-xs tracking-[0.4em] uppercase mb-3">Our Mission</p>
            <h2 className="text-3xl tracking-widest mb-5">Why We Built This</h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              KingPUBG Tournaments was born from a simple frustration — competitive PUBG players in India and the UAE had no reliable, transparent platform to test their skills and win real prizes without worrying about scams or mismanagement.
            </p>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              We set out to change that. Every feature on this platform — from automatic slot tracking to instant prize transfers — is designed with one goal: give players a trustworthy home for competition.
            </p>
            <p className="text-gray-500 text-sm leading-relaxed">
              Whether you're a casual squad looking for weekend fun or a team grinding toward pro-level play, KingPUBG Tournaments is your arena.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {VALUES.map((v, i) => (
              <div key={i} className="bg-[#0b0b0b] border border-gray-800 rounded-xl p-5 hover:border-[#F2AA00]/30 hover:-translate-y-1 transition-all duration-300">
                <div className="w-9 h-9 rounded-lg bg-[#F2AA00]/10 flex items-center justify-center mb-3">
                  <FontAwesomeIcon icon={v.icon} className="text-[#F2AA00] text-xs" />
                </div>
                <p className="text-white text-xs tracking-wide mb-1">{v.title}</p>
                <p className="text-gray-600 text-[11px] leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEAM ── */}
      <section className="px-6 py-16 bg-[#080808]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#F2AA00]/60 text-xs tracking-[0.4em] uppercase mb-3">The People Behind It</p>
            <h2 className="text-3xl tracking-widest">Founders & Leadership</h2>
            <div className="w-12 h-0.5 bg-[#F2AA00] mx-auto mt-4" />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {TEAM.map((member, i) => (
              <div key={i} className="group bg-[#0b0b0b] border border-gray-800 rounded-2xl p-7 hover:border-[#F2AA00]/30 hover:shadow-[0_0_30px_rgba(242,170,0,0.07)] transition-all duration-300">
                {/* Avatar + Name */}
                <div className="flex items-center gap-4 mb-5">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${member.color} ring-2 ${member.ring} flex items-center justify-center text-black font-bold text-lg flex-shrink-0`}>
                    {member.avatar}
                  </div>
                  <div>
                    <h3 className="text-white text-lg tracking-wide">{member.name}</h3>
                    <span className="text-[10px] tracking-widest uppercase px-2.5 py-1 rounded-full border border-[#F2AA00]/30 text-[#F2AA00] bg-[#F2AA00]/5 mt-1 inline-block">
                      {member.role}
                    </span>
                  </div>
                </div>

                {/* Bio */}
                <p className="text-gray-400 text-sm leading-relaxed mb-5">{member.bio}</p>

                <div className="h-px bg-gray-800 mb-5" />

                {/* Contact Numbers */}
                <div className="space-y-2">
                  {member.contacts.map((c, j) => (
                    <a
                      key={j}
                      href={c.href}
                      className="flex items-center gap-3 group/link"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#F2AA00]/10 flex items-center justify-center flex-shrink-0 group-hover/link:bg-[#F2AA00]/20 transition-colors text-sm">
                        {c.flag}
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] text-gray-600 tracking-widest uppercase">{c.label}</p>
                        <p className="text-white text-sm tracking-wide group-hover/link:text-[#F2AA00] transition-colors">{c.value}</p>
                      </div>
                      <FontAwesomeIcon icon={faPhone} className="text-gray-700 text-xs group-hover/link:text-[#F2AA00] transition-colors" />
                    </a>
                  ))}
                </div>

                {/* WhatsApp quick link */}
                <a
                  href={`https://wa.me/${member.contacts[0].href.replace("tel:+", "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 w-full flex items-center justify-center gap-2 border border-green-500/20 bg-green-500/5 text-green-400 py-2.5 rounded-xl text-xs tracking-widest hover:bg-green-500/10 hover:border-green-500/30 transition-all duration-200"
                >
                  <FontAwesomeIcon icon={faWhatsapp} />
                  WhatsApp
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT / SUPPORT ── */}
      <section className="px-6 py-20 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-[#F2AA00]/60 text-xs tracking-[0.4em] uppercase mb-3">Get In Touch</p>
          <h2 className="text-3xl tracking-widest">Support & Contact</h2>
          <p className="text-gray-600 text-sm mt-3 max-w-xl mx-auto">
            Have a question, dispute, or just want to say hi? We're reachable across multiple channels — pick what works best for you.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">

          {/* Email */}
          <a
            href="mailto:kingopubgtournaments@gmail.com"
            className="group flex flex-col gap-4 bg-[#0b0b0b] border border-gray-800 rounded-2xl p-6 hover:border-[#F2AA00]/40 hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(242,170,0,0.08)] transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-xl bg-[#F2AA00]/10 flex items-center justify-center group-hover:bg-[#F2AA00]/20 transition-colors">
              <FontAwesomeIcon icon={faEnvelope} className="text-[#F2AA00] text-lg" />
            </div>
            <div>
              <p className="text-[10px] text-gray-600 tracking-widest uppercase mb-1">Email Support</p>
              <p className="text-white text-sm tracking-wide break-all">kingopubgtournaments@gmail.com</p>
              <p className="text-gray-600 text-[11px] mt-2">Response within 24–48 hours</p>
            </div>
          </a>

          {/* YouTube */}
          <a
            href="https://youtube.com/@kingopislive-pubg?si=otxVmf6dE-EJCYtS"
            target="_blank"
            rel="noreferrer"
            className="group flex flex-col gap-4 bg-[#0b0b0b] border border-red-500/20 rounded-2xl p-6 hover:border-red-500/40 hover:bg-red-500/5 hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(239,68,68,0.08)] transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
              <FontAwesomeIcon icon={faYoutube} className="text-red-500 text-lg" />
            </div>
            <div>
              <p className="text-[10px] text-gray-600 tracking-widest uppercase mb-1">YouTube</p>
              <p className="text-white text-sm tracking-wide">@kingopislive-pubg</p>
              <p className="text-gray-600 text-[11px] mt-2">Live streams · Match replays · Highlights</p>
            </div>
          </a>

          {/* Instagram */}
          <a
            href="https://www.instagram.com/kingpubg_tournaments.co?utm_source=qr&igsh=MWprNjE4aWJuYjI1Yw=="
            target="_blank"
            rel="noreferrer"
            className="group flex flex-col gap-4 bg-[#0b0b0b] border border-pink-500/20 rounded-2xl p-6 hover:border-pink-500/40 hover:bg-pink-500/5 hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(236,72,153,0.08)] transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center group-hover:bg-pink-500/20 transition-colors">
              <FontAwesomeIcon icon={faInstagram} className="text-pink-500 text-lg" />
            </div>
            <div>
              <p className="text-[10px] text-gray-600 tracking-widest uppercase mb-1">Instagram</p>
              <p className="text-white text-sm tracking-wide">@kingpubg_tournaments.co</p>
              <p className="text-gray-600 text-[11px] mt-2">Winners · Announcements · Updates</p>
            </div>
          </a>
          {/* WhatsApp — Ashwin */}
          <a
            href="https://wa.me/917539993019"
            target="_blank"
            rel="noreferrer"
            className="group flex flex-col gap-4 bg-[#0b0b0b] border border-green-500/20 rounded-2xl p-6 hover:border-green-500/40 hover:bg-green-500/5 hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(34,197,94,0.08)] transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
              <FontAwesomeIcon icon={faWhatsapp} className="text-green-500 text-lg" />
            </div>
            <div>
              <p className="text-[10px] text-gray-600 tracking-widest uppercase mb-1">WhatsApp 🇮🇳 Founder</p>
              <p className="text-white text-sm tracking-wide">+91 75399 93019</p>
              <p className="text-gray-600 text-[11px] mt-2">Ashwin · India</p>
            </div>
          </a>

          {/* WhatsApp — Viju (India) */}
          <a
            href="https://wa.me/917418270710"
            target="_blank"
            rel="noreferrer"
            className="group flex flex-col gap-4 bg-[#0b0b0b] border border-green-500/20 rounded-2xl p-6 hover:border-green-500/40 hover:bg-green-500/5 hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(34,197,94,0.08)] transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
              <FontAwesomeIcon icon={faWhatsapp} className="text-green-500 text-lg" />
            </div>
            <div>
              <p className="text-[10px] text-gray-600 tracking-widest uppercase mb-1">WhatsApp 🇮🇳 Founder</p>
              <p className="text-white text-sm tracking-wide">+91 7418270710</p>
              <p className="text-gray-600 text-[11px] mt-2">Viju Titus · India</p>
            </div>
          </a>

          {/* WhatsApp — Viju (Dubai) */}
          <a
            href="https://wa.me/971588340270"
            target="_blank"
            rel="noreferrer"
            className="group flex flex-col gap-4 bg-[#0b0b0b] border border-green-500/20 rounded-2xl p-6 hover:border-green-500/40 hover:bg-green-500/5 hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(34,197,94,0.08)] transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
              <FontAwesomeIcon icon={faWhatsapp} className="text-green-500 text-lg" />
            </div>
            <div>
              <p className="text-[10px] text-gray-600 tracking-widest uppercase mb-1">WhatsApp 🇦🇪 Founder</p>
              <p className="text-white text-sm tracking-wide">+971 588340270</p>
              <p className="text-gray-600 text-[11px] mt-2">Viju Titus · Dubai</p>
            </div>
          </a>

          
        </div>

        {/* Locations */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-[#0b0b0b] border border-gray-800 rounded-2xl p-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#F2AA00]/10 flex items-center justify-center flex-shrink-0 text-base">🇮🇳</div>
            <div>
              <p className="text-[10px] text-gray-600 tracking-widest uppercase mb-1">India Office</p>
              <p className="text-white text-sm tracking-wide">India Operations</p>
              <p className="text-gray-500 text-xs mt-1">Serving players across all Indian states · BGMI & PUBG PC</p>
            </div>
          </div>
          <div className="bg-[#0b0b0b] border border-gray-800 rounded-2xl p-6 flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#F2AA00]/10 flex items-center justify-center flex-shrink-0 text-base">🇦🇪</div>
            <div>
              <p className="text-[10px] text-gray-600 tracking-widest uppercase mb-1">UAE Office</p>
              <p className="text-white text-sm tracking-wide">Dubai, United Arab Emirates</p>
              <p className="text-gray-500 text-xs mt-1">Serving UAE & GCC region players · PUBG PC</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="px-6 py-16 bg-[#080808]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#F2AA00]/60 text-xs tracking-[0.4em] uppercase mb-3">Got Questions?</p>
            <h2 className="text-3xl tracking-widest">Frequently Asked</h2>
            <div className="w-12 h-0.5 bg-[#F2AA00] mx-auto mt-4" />
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <FAQItem key={i} q={faq.q} a={faq.a} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative px-6 py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "linear-gradient(#F2AA00 1px, transparent 1px), linear-gradient(90deg, #F2AA00 1px, transparent 1px)", backgroundSize: "60px 60px" }}
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[500px] h-[200px] bg-[#F2AA00]/8 rounded-full blur-[100px]" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <h2 className="text-4xl tracking-widest mb-4">Ready to <span className="text-[#F2AA00]">Compete?</span></h2>
          <p className="text-gray-500 text-sm mb-8 tracking-wide">Join thousands of players battling it out across India and UAE. Register free and start winning.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="/tournaments" className="bg-[#F2AA00] text-black px-8 py-3.5 text-sm tracking-widest hover:bg-[#e09e00] hover:shadow-lg hover:shadow-[#F2AA00]/20 active:scale-95 transition-all duration-150 rounded-lg">
              Browse Tournaments
            </a>
            <a href="/signup" className="border border-gray-700 text-gray-300 px-8 py-3.5 text-sm tracking-widest hover:border-[#F2AA00]/50 hover:text-[#F2AA00] transition-all duration-200 rounded-lg">
              Create Account
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}