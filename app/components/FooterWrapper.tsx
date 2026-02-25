"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

export default function FooterWrapper() {
  const pathname = usePathname();

  const hideRoutes = ["/login", "/signup"];
  const shouldHide =
    hideRoutes.includes(pathname) || pathname.startsWith("/admin");

  if (shouldHide) return null;

  return <Footer />;
}