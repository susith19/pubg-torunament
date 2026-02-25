"use client";

import { useEffect, useState, useRef } from "react";

const navItems = [
  { label: "TOURNAMENT", href: "/tournaments" },
  { label: "SCHEDULE", href: "/schedule" },
  { label: "ABOUT", href: "/about" },
];

const langs = [
  { code: "EN", label: "EN" },
  { code: "TA", label: "தமிழ்" },
  { code: "HI", label: "हिंदी" },
];

function NavDropdown({
  item,
}: {
  item: (typeof navItems)[0];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!item.dropdown) {
    return (
      <a
        href={item.href}
        className="relative text-black text-xl tracking-[0.20em] group flex items-center gap-1 py-1"
        
      >
        {item.label}
        <span className="absolute bottom-0 left-0 h-[1.5px] w-0 bg-black transition-all duration-300 group-hover:w-full" />
      </a>
    );
  }

  return (
    <div ref={ref} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        className="relative text-black text-xl tracking-[0.18em] group flex items-center gap-1.5 py-1 cursor-pointer"
        
        onClick={() => setOpen((p) => !p)}
      >
        {item.label}
        {/* Chevron */}
        <svg
          width="8"
          height="8"
          viewBox="0 0 8 8"
          fill="none"
          className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        >
          <path d="M1 2.5L4 5.5L7 2.5" stroke="black" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="absolute bottom-0 left-0 h-[1.5px] w-0 bg-black transition-all duration-300 group-hover:w-full" />
      </button>

      {/* Dropdown Panel */}
      <div
        className={`absolute top-full left-1/2 -translate-x-1/2 mt-3 w-40 transition-all duration-200 ${
          open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-1 pointer-events-none"
        }`}
        style={{ zIndex: 100 }}
      >
        {/* Arrow tip */}
        <div className="flex justify-center">
          <div className="w-2.5 h-2.5 bg-gray-900 rotate-45 -mb-1.5 rounded-sm" />
        </div>
        <div className="bg-gray-900 rounded-xl overflow-hidden shadow-2xl">
          {item.dropdown.map((d, i) => (
            <a
              key={d.href}
              href={d.href}
              className={`block px-5 py-3 text-[11px] tracking-[0.12em] text-gray-300 hover:text-[#F2AA00] hover:bg-white/5 transition-colors duration-150 ${
                i !== item.dropdown!.length - 1 ? "border-b border-white/5" : ""
              }`}
              
              onClick={() => setOpen(false)}
            >
              {d.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function LangSelector({ lang, setLang }: { lang: string; setLang: (l: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const current = langs.find((l) => l.code === lang) || langs[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1.5 text-black text-xl tracking-[0.12em] cursor-pointer py-1 group"
        
      >
        {/* Globe icon */}
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        {current.label}
        <svg
          width="8" height="8" viewBox="0 0 8 8" fill="none"
          className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        >
          <path d="M1 2.5L4 5.5L7 2.5" stroke="black" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div
        className={`absolute top-full right-0 mt-3 w-32 transition-all duration-200 ${
          open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-1 pointer-events-none"
        }`}
        style={{ zIndex: 100 }}
      >
        <div className="flex justify-end pr-3">
          <div className="w-2.5 h-2.5 bg-gray-900 rotate-45 -mb-1.5 rounded-sm" />
        </div>
        <div className="bg-gray-900 rounded-xl overflow-hidden shadow-2xl">
          {langs.map((l, i) => (
            <button
              key={l.code}
              onClick={() => { setLang(l.code); setOpen(false); }}
              className={`w-full text-left px-5 py-3 text-[11px] tracking-[0.12em] transition-colors duration-150 cursor-pointer ${
                l.code === lang ? "text-[#F2AA00]" : "text-gray-300 hover:text-[#F2AA00] hover:bg-white/5"
              } ${i !== langs.length - 1 ? "border-b border-white/5" : ""}`}
              
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [lang, setLang] = useState("EN");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
  const token = localStorage.getItem("token");

  if (!token) return;

  fetch("/api/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((res) => res.json())
    .then((data) => {
      if (!data.error) {
        setUser(data);
      }
    });
}, []);

  return (
    <>
      {/* Google Font */}
    

      <header className="sticky top-0 z-50 bg-[#F2AA00] flex items-center justify-between px-8 py-0 relative shadow-md" style={{ minHeight: 56 }}>

        {/* LEFT — Logo */}
        <div className="flex items-center" style={{ minWidth: 80 }}>
          <a href="/">
            <img src="/logo.svg" alt="logo" className="h-18 w-auto object-contain" />
          </a>
        </div>

        {/* CENTER — Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <NavDropdown key={item.label} item={item} />
          ))}
        </nav>

        {/* RIGHT */}
        <div className="hidden md:flex items-center gap-5">
          <LangSelector lang={lang} setLang={setLang} />

          {/* Divider */}
          <div className="w-px h-4 bg-black/20" />

          {user ? (
            <div
              className="flex items-center justify-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-full text-md tracking-[0.12em]"
              
            >
              <div className="w-8 h-8 rounded-full bg-[#F2AA00] flex items-center justify-center text-black text-[20px]">
                {user.email?.[0]?.toUpperCase() || "U"}
              </div>
              {user.email}
            </div>
          ) : (
            <a
              href="/login"
              className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-full text-lg tracking-[0.25em] hover:bg-gray-800 transition-colors duration-200 group"
              
            >
              {/* Person icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Log-in
            </a>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2 cursor-pointer"
          onClick={() => setMobileOpen((p) => !p)}
        >
          <span className={`block w-5 h-px bg-black transition-all duration-300 ${mobileOpen ? "rotate-45 translate-y-[7px]" : ""}`} />
          <span className={`block w-5 h-px bg-black transition-all duration-300 ${mobileOpen ? "opacity-0" : ""}`} />
          <span className={`block w-5 h-px bg-black transition-all duration-300 ${mobileOpen ? "-rotate-45 -translate-y-[7px]" : ""}`} />
        </button>

        {/* Mobile Menu */}
        <div
          className={`absolute top-full left-0 w-full bg-gray-900 transition-all duration-300 overflow-hidden md:hidden ${
            mobileOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
          }`}
          style={{ zIndex: 99 }}
        >
          <div className="flex flex-col py-4 px-6 gap-1">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-gray-300 hover:text-[#F2AA00] py-3 text-[11px] tracking-[0.18em] border-b border-white/5 transition-colors duration-150"
                
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <div className="pt-4 flex items-center justify-between">
              <LangSelector lang={lang} setLang={setLang} />
              <a
                href="/login"
                className="flex items-center gap-2 bg-[#F2AA00] text-black px-4 py-2 rounded-full text-[15px] tracking-[0.15em]"
              >
                Log-in
              </a>
            </div>  
          </div>
        </div>
      </header>
    </>
  );
}