"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGaugeHigh,
  faTrophy,
  faUsers,
  faUser,
  faWallet,
  faCreditCard,
  faChevronLeft,
  faBars,
  faCoins,
  faXmark,
  faRightFromBracket,
  faShieldHalved,
  faCircle,
  faC,
} from "@fortawesome/free-solid-svg-icons";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: faGaugeHigh },
  { label: "Tournaments", href: "/admin/tournaments", icon: faTrophy },
  { label: "Teams", href: "/admin/teams", icon: faUsers },
  { label: "Points", href: "/admin/points/winning", icon: faCoins },
  { label: "Users", href: "/admin/users", icon: faUser },
  { label: "Redeems", href: "/admin/redeems", icon: faWallet },
  { label: "Payments", href: "/admin/payment", icon: faCreditCard },
];

// ── mock user ─────────────────────────────────────────────
const user = { role: "admin", name: "Admin", email: "admin@bgmi.gg" };

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pointsMenuOpen, setPointsMenuOpen] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 60);
  }, []);

  // close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <div className="text-center space-y-3">
          <FontAwesomeIcon
            icon={faShieldHalved}
            className="text-red-400 text-4xl"
          />
          <p className="text-lg tracking-widest">Access Denied</p>
          <p className="text-gray-600 text-xs">
            You don't have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* LOGO */}
      <div
        className={`flex items-center gap-3 px-4 py-5 border-b border-gray-800 ${collapsed ? "justify-center" : ""}`}
      >
        <div className="w-8 h-8 rounded-lg bg-[#F2AA00] flex items-center justify-center flex-shrink-0">
          <FontAwesomeIcon
            icon={faShieldHalved}
            className="text-black text-sm"
          />
        </div>
        {!collapsed && (
          <div>
            <p className="text-[#F2AA00] text-sm tracking-widest">Admin</p>
            <p className="text-gray-700 text-[9px] tracking-widest uppercase">
              Control Panel
            </p>
          </div>
        )}
      </div>

      {/* NAV */}
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {!collapsed && (
          <p className="text-[12px] text-gray-700 tracking-[0.2em] uppercase px-3 mb-2">
            Navigation
          </p>
        )}
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-md tracking-wide transition-all duration-200 group relative ${
                isActive
                  ? "bg-[#F2AA00]/10 text-[#F2AA00] border border-[#F2AA00]/20"
                  : "text-gray-500 hover:bg-[#111] hover:text-gray-300 border border-transparent"
              } ${collapsed ? "justify-center" : ""}`}
              onClick={() => {
                if (item.submenu) {
                  setPointsMenuOpen(!pointsMenuOpen);
                }
              }}
            >
              {/* active indicator */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#F2AA00] rounded-full" />
              )}

              <FontAwesomeIcon
                icon={item.icon}
                className={`text-xs flex-shrink-0 ${isActive ? "text-[#F2AA00]" : "text-gray-600 group-hover:text-gray-400"} transition-colors duration-200`}
              />

              {!collapsed && <span>{item.label}</span>}

              {/* tooltip on collapsed */}
              {collapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-[#1a1a1a] border border-gray-800 rounded-lg text-[10px] text-white tracking-wide whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* BOTTOM */}
      <div className="sticky bottom-0 px-2 py-3 border-t border-gray-800 space-y-1">
        {/* collapse toggle — desktop only */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`hidden lg:flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-xs text-gray-600 hover:bg-[#111] hover:text-gray-400 border border-transparent transition-all duration-200 ${collapsed ? "justify-center" : ""}`}
        >
          <FontAwesomeIcon
            icon={faChevronLeft}
            className={`text-xs transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
          />
          {!collapsed && <span>Collapse</span>}
        </button>

        {/* user info */}
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#111] border border-gray-800">
            <div className="w-7 h-7 rounded-full bg-[#F2AA00]/20 flex items-center justify-center text-[10px] text-[#F2AA00] flex-shrink-0">
              {user.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{user.name}</p>
              <p className="text-[9px] text-gray-600 truncate">{user.email}</p>
            </div>
            <button
              className="text-gray-700 hover:text-red-400 transition-colors duration-150"
              title="Logout"
            >
              <FontAwesomeIcon icon={faRightFromBracket} className="text-xs" />
            </button>
          </div>
        )}

        {/* collapsed user avatar */}
        {collapsed && (
          <div className="flex justify-center px-3 py-1.5">
            <div className="w-7 h-7 rounded-full bg-[#F2AA00]/20 flex items-center justify-center text-[10px] text-[#F2AA00]">
              {user.name[0]}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* ── DESKTOP SIDEBAR ── */}
      <aside
        className={`hidden lg:flex flex-col flex-shrink-0 bg-[#0b0b0b] border-r border-gray-800 transition-all duration-300 ${
          collapsed ? "w-16" : "w-60"
        } ${visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}
      >
        <SidebarContent />
      </aside>

      {/* ── MOBILE OVERLAY ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── MOBILE DRAWER ── */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-60 bg-[#0b0b0b] border-r border-gray-800 lg:hidden transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent />
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP BAR */}
        <header
          className={`flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-gray-800 bg-[#0a0a0a] transition-all duration-500 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"
          }`}
          style={{ transitionDelay: "100ms" }}
        >
          <div className="flex items-center gap-3">
            {/* mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg border border-gray-800 text-gray-500 hover:text-white hover:border-gray-700 transition-all duration-150"
            >
              <FontAwesomeIcon
                icon={mobileOpen ? faXmark : faBars}
                className="text-xs"
              />
            </button>

            {/* breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="tracking-wide">Admin</span>
              {pathname !== "/admin" && (
                <>
                  <FontAwesomeIcon icon={faCircle} className="text-[4px]" />
                  <span className="text-gray-300 tracking-wide capitalize">
                    {pathname.split("/admin/")[1]?.replace(/-/g, " ") ?? ""}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* right side */}
          <div className="flex items-center gap-3">
            {/* live dot */}
            <div className="hidden sm:flex items-center gap-1.5 border border-gray-800 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] text-gray-500 tracking-widest">
                LIVE
              </span>
            </div>

            {/* admin badge */}
            <div className="flex items-center gap-2 bg-[#F2AA00]/10 border border-[#F2AA00]/20 px-3 py-1.5 rounded-full">
              <FontAwesomeIcon
                icon={faShieldHalved}
                className="text-[#F2AA00] text-[9px]"
              />
              <span className="text-[10px] text-[#F2AA00] tracking-widest">
                ADMIN
              </span>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main
          className={`flex-1 overflow-auto transition-all duration-500 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ transitionDelay: "200ms" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
