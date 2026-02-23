"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

export default function FooterWrapper() {
  const pathname = usePathname();

  const hideRoutes = ["/login", "/signup"];

  if (hideRoutes.includes(pathname)) return null;

  return <Footer />;
}