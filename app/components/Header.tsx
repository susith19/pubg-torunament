"use client";

import { useEffect, useState, useRef } from "react";

const navItems = [
  { label: "TOURNAMENT", href: "/tournaments" },
  { label: "SCHEDULE", href: "/schedule" },
  { label: "ABOUT", href: "/about" },
];

function NavDropdown({ item }: { item: (typeof navItems)[0] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!(item as any).dropdown) {
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
        <svg
          width="8" height="8" viewBox="0 0 8 8" fill="none"
          className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        >
          <path d="M1 2.5L4 5.5L7 2.5" stroke="black" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="absolute bottom-0 left-0 h-[1.5px] w-0 bg-black transition-all duration-300 group-hover:w-full" />
      </button>
      <div
        className={`absolute top-full left-1/2 -translate-x-1/2 mt-3 w-40 transition-all duration-200 ${
          open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-1 pointer-events-none"
        }`}
        style={{ zIndex: 100 }}
      >
        <div className="flex justify-center">
          <div className="w-2.5 h-2.5 bg-gray-900 rotate-45 -mb-1.5 rounded-sm" />
        </div>
        <div className="bg-gray-900 rounded-xl overflow-hidden shadow-2xl">
          {(item as any).dropdown.map((d: any, i: number) => (
            <a
              key={d.href}
              href={d.href}
              className={`block px-5 py-3 text-[11px] tracking-[0.12em] text-gray-300 hover:text-[#F2AA00] hover:bg-white/5 transition-colors duration-150 ${
                i !== (item as any).dropdown.length - 1 ? "border-b border-white/5" : ""
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

function ProfileDropdown({ user, onLogout }: { user: any; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const menuItems = [
    {
      label: "My Profile",
      href: "/profile",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
    {
      label: "Redeem Points",
      href: "/redeem-points",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      ),
    },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-full text-md tracking-[0.12em] hover:bg-gray-800 transition-colors duration-200 cursor-pointer"
      >
        <div className="w-8 h-8 rounded-full bg-[#F2AA00] flex items-center justify-center text-black font-bold text-[16px]">
          {user.name?.[0]?.toUpperCase() || "U"}
        </div>
        <span>{user.name}</span>
        <svg
          width="8" height="8" viewBox="0 0 8 8" fill="none"
          className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        >
          <path d="M1 2.5L4 5.5L7 2.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dropdown */}
      <div
        className={`absolute top-full right-0 mt-3 w-52 transition-all duration-200 ${
          open ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-1 pointer-events-none"
        }`}
        style={{ zIndex: 100 }}
      >
        {/* Arrow tip */}
        <div className="flex justify-end pr-5">
          <div className="w-2.5 h-2.5 bg-gray-900 rotate-45 -mb-1.5 rounded-sm" />
        </div>

        <div className="bg-gray-900 rounded-xl overflow-hidden shadow-2xl">
          {/* User info header */}
          <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#F2AA00] flex items-center justify-center text-black font-bold text-[16px] flex-shrink-0">
              {user.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="overflow-hidden">
              <p className="text-white text-[12px] tracking-[0.10em] font-medium truncate">{user.name}</p>
              {user.email && (
                <p className="text-gray-500 text-[10px] tracking-[0.08em] truncate">{user.email}</p>
              )}
            </div>
          </div>

          {/* Menu items */}
          {menuItems.map((item, i) => (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 text-[11px] tracking-[0.12em] text-gray-300 hover:text-[#F2AA00] hover:bg-white/5 transition-colors duration-150 ${
                i !== menuItems.length - 1 ? "border-b border-white/5" : ""
              }`}
              onClick={() => setOpen(false)}
            >
              <span className="opacity-60">{item.icon}</span>
              {item.label}
            </a>
          ))}

          {/* Logout */}
          <button
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-[11px] tracking-[0.12em] text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors duration-150 border-t border-white/10 cursor-pointer"
          >
            <span className="opacity-70">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </span>
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data?.user) {
        setUser(data.user); // ✅ FIX HERE
      }});
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    window.location.href = "/";
  };

  return (
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
        {user ? (
          <ProfileDropdown user={user} onLogout={handleLogout} />
        ) : (
          <a
            href="/login"
            className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-full text-lg tracking-[0.25em] hover:bg-gray-800 transition-colors duration-200"
          >
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

          {user ? (
            <>
              <a href="/profile" className="text-gray-300 hover:text-[#F2AA00] py-3 text-[11px] tracking-[0.18em] border-b border-white/5 transition-colors duration-150" onClick={() => setMobileOpen(false)}>
                My Profile
              </a>
              <a href="/redeem-points" className="text-gray-300 hover:text-[#F2AA00] py-3 text-[11px] tracking-[0.18em] border-b border-white/5 transition-colors duration-150" onClick={() => setMobileOpen(false)}>
                Redeem Points
              </a>
              <div className="pt-4">
                <button
                  onClick={() => { setMobileOpen(false); handleLogout(); }}
                  className="flex items-center gap-2 bg-red-500/20 text-red-400 px-4 py-2 rounded-full text-[13px] tracking-[0.15em] cursor-pointer"
                >
                  Log Out
                </button>
              </div>
            </>
          ) : (
            <div className="pt-4 flex items-center justify-between">
              <a href="/login" className="flex items-center gap-2 bg-[#F2AA00] text-black px-4 py-2 rounded-full text-[15px] tracking-[0.15em]">
                Log-in
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}