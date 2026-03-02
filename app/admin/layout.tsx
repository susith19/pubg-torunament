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
  faCreditCard,
  faChevronLeft,
  faBars,
  faCoins,
  faXmark,
  faRightFromBracket,
  faShieldHalved,
  faCircle,
} from "@fortawesome/free-solid-svg-icons";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: faGaugeHigh },
  { label: "Tournaments", href: "/admin/tournaments", icon: faTrophy },
  { label: "Teams", href: "/admin/teams", icon: faUsers },
  { label: "Points", href: "/admin/points/winning", icon: faCoins },
  { label: "Users", href: "/admin/users", icon: faUser },
  { label: "Payments", href: "/admin/payment", icon: faCreditCard },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [visible, setVisible] = useState(false);

  // 🔥 AUTH STATE
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // animation
  useEffect(() => {
    setTimeout(() => setVisible(true), 60);
  }, []);

  // close mobile on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // 🔥 ADMIN CHECK
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          window.location.href = "/404";
          return;
        }

        const res = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          window.location.href = "/404";
          return;
        }

        const data = await res.json();

        if (data.role !== "admin") {
          window.location.href = "/404";
          return;
        }

        setUser({
          name: localStorage.getItem("name") || "Admin",
          email: data.email || "admin@bgmi.gg",
          role: data.role,
        });
      } catch (err) {
        console.error(err);
        window.location.href = "/404";
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, []);

  // 🔥 block render until verified
  if (loading) return null;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* LOGO */}
      <div
        className={`flex items-center gap-3 px-4 py-5 border-b border-gray-800 ${
          collapsed ? "justify-center" : ""
        }`}
      >
        <div className="w-8 h-8 rounded-lg bg-[#F2AA00] flex items-center justify-center">
          <FontAwesomeIcon
            icon={faShieldHalved}
            className="text-black text-sm"
          />
        </div>
        {!collapsed && (
          <div>
            <p className="text-[#F2AA00] text-sm tracking-widest">Admin</p>
            <p className="text-gray-700 text-[12px] uppercase">
              Control Panel
            </p>
          </div>
        )}
      </div>

      {/* NAV */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-3.5 rounded-lg text-md transition ${
                isActive
                  ? "bg-[#F2AA00]/10 text-[#F2AA00]"
                  : "text-gray-500 hover:bg-[#111]"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <FontAwesomeIcon icon={item.icon} className="text-sm" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* USER */}
      <div className="sticky bottom-0 px-3 py-3 border-t border-gray-800">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F2AA00]/20 flex items-center justify-center text-[#F2AA00]">
              {user?.name?.[0] || "A"}
            </div>
            <div className="flex-1">
              <p className="text-lg text-white">{user?.name}</p>
              <p className="text-[12px] text-gray-600">{user?.email}</p>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("role");
                localStorage.removeItem("name");
                window.location.href = "/login";
              }}
              className="text-gray-600 hover:text-red-400"
            >
              <FontAwesomeIcon icon={faRightFromBracket} />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* SIDEBAR */}
      <aside
        className={`hidden lg:flex flex-col bg-[#0b0b0b] border-r border-gray-800 ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        <SidebarContent />
      </aside>

      {/* MOBILE */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-60 bg-[#0b0b0b] lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent />
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col">
        {/* HEADER */}
        <header className="flex justify-between items-center px-4 py-3 border-b border-gray-800">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden"
          >
            <FontAwesomeIcon icon={mobileOpen ? faXmark : faBars} />
          </button>

          <div className="text-sm text-gray-500">
            Admin {pathname !== "/admin" && ` / ${pathname.split("/admin/")[1]}`}
          </div>

          <div className="text-sm text-[#F2AA00] flex items-center gap-2">
            <FontAwesomeIcon icon={faShieldHalved} />
            ADMIN
          </div>
        </header>

        {/* CONTENT */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}