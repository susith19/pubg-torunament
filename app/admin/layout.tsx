"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { auth } from "@/lib/firebase";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGaugeHigh,
  faTrophy,
  faUsers,
  faUser,
  faCreditCard,
  faBars,
  faCoins,
  faXmark,
  faRightFromBracket,
  faShieldHalved,
  faBuildingColumns,
} from "@fortawesome/free-solid-svg-icons";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: faGaugeHigh },
  { label: "Tournaments", href: "/admin/tournaments", icon: faTrophy },
  {
    label: "Social Media Live",
    href: "/admin/social-media",
    icon: faShieldHalved,
  },
  { label: "Teams", href: "/admin/teams", icon: faUsers },
  { label: "Points", href: "/admin/points/winning", icon: faCoins },
  { label: "Users", href: "/admin/users", icon: faUser },
  { label: "Payments", href: "/admin/payment", icon: faCreditCard },
  {
    label: "Account Details",
    href: "/admin/payment-config",
    icon: faBuildingColumns,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // lock body scroll when mobile sidebar is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // 🔥 ADMIN AUTH CHECK
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      try {
        if (!firebaseUser) {
          window.location.href = "/login";
          return;
        }

        const token = await firebaseUser.getIdToken(true);
        localStorage.setItem("token", token);

        const res = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        if (res.status === 403) {
          window.location.href = "/unauthorized";
          return;
        }

        const data = await res.json();
        setUser({
          name: firebaseUser.displayName || "Admin",
          email: data.email,
          role: data.role,
        });
      } catch (err) {
        console.error(err);
        window.location.href = "/login";
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  if (loading) return null;

  // ── page label from pathname ──────────────────────────
  const pageLabel = (() => {
    const seg = pathname.split("/admin/")[1];
    if (!seg) return "Dashboard";
    return seg
      .split("/")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" / ");
  })();

  // ── shared sidebar inner content ─────────────────────
  const SidebarContent = ({ closeMobile }: { closeMobile?: () => void }) => (
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
            <p className="text-gray-700 text-[10px] uppercase tracking-widest">
              Control Panel
            </p>
          </div>
        )}
      </div>

      {/* NAV */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href + "/"));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMobile}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-all duration-150 ${
                isActive
                  ? "bg-[#F2AA00]/10 text-[#F2AA00]"
                  : "text-gray-500 hover:bg-[#111] hover:text-gray-300"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <FontAwesomeIcon
                icon={item.icon}
                className="text-sm w-4 flex-shrink-0"
              />
              {!collapsed && (
                <span className="tracking-wide">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* USER FOOTER */}
      <div className="px-3 py-3 border-t border-gray-800">
        {collapsed ? (
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full bg-[#F2AA00]/20 flex items-center justify-center text-[#F2AA00] text-sm">
              {user?.name?.[0] || "A"}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#F2AA00]/20 flex items-center justify-center text-[#F2AA00] flex-shrink-0">
              {user?.name?.[0] || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-gray-600 truncate">
                {user?.email}
              </p>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("role");
                localStorage.removeItem("name");
                window.location.href = "/login";
              }}
              className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0"
              title="Sign out"
            >
              <FontAwesomeIcon icon={faRightFromBracket} className="text-sm" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* ── DESKTOP SIDEBAR ─────────────────────────────── */}
      <aside
        className={`hidden lg:flex flex-col bg-[#0b0b0b] border-r border-gray-800 flex-shrink-0 transition-all duration-300 ${collapsed ? "w-16" : "w-56"}`}
      >
        <SidebarContent />
      </aside>

      {/* ── MOBILE OVERLAY ──────────────────────────────── */}
      {/* Sits above everything when open */}
      <div
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm lg:hidden transition-opacity duration-300 ${
          mobileOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        style={{ zIndex: 40 }}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* ── MOBILE SIDEBAR ──────────────────────────────── */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-[#0b0b0b] border-r border-gray-800 lg:hidden
          transition-transform duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{ zIndex: 50 }}
      >
        {/* close button inside sidebar */}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 text-gray-600 hover:text-white transition-colors"
          aria-label="Close menu"
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>

        <SidebarContent closeMobile={() => setMobileOpen(false)} />
      </aside>

      {/* ── MAIN CONTENT ────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* HEADER */}
        <header className="flex justify-between items-center px-4 py-3 border-b border-gray-800 bg-black sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden text-gray-500 hover:text-white transition-colors"
              aria-label="Open menu"
            >
              <FontAwesomeIcon icon={faBars} />
            </button>

            {/* Desktop collapse toggle */}
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="hidden lg:block text-gray-600 hover:text-white transition-colors"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <FontAwesomeIcon icon={faBars} className="text-sm" />
            </button>

            <p className="text-xs text-gray-500 tracking-widest uppercase">
              Admin{pathname !== "/admin" && ` / ${pageLabel}`}
            </p>
          </div>

          <div className="text-xs text-[#F2AA00] flex items-center gap-2 tracking-widest">
            <FontAwesomeIcon icon={faShieldHalved} />
            ADMIN
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
