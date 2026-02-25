"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";

export default function HeaderWrapper() {
  const pathname = usePathname();

  const hideRoutes = ["/login", "/signup"];

  const shouldHide =
    hideRoutes.includes(pathname) || pathname.startsWith("/admin");

  if (shouldHide) {
    return null;
  }

  return <Header />;
}