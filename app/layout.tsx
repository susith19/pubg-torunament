import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import HeaderWrapper from "./components/HeaderWrapper";
import FooterWrapper from "./components/FooterWrapper";

const pubgFont = localFont({
  src: [
    {
      path: "./fonts/PUBG-SANS.ttf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-pubg",
});

export const metadata : Metadata = {
  title: "PUBG Tournament - Play and Win",
  description: "Join PUBG tournaments, compete with players and win rewards.",
  keywords: "PUBG tournament, BGMI tournament, gaming tournament",
  icons: {
    icon: "/logo.svg",
  },
  verification: {
    google: "tJW7j2QEgU1MisBzouh98CKItpJyFsjioLubsA--u7c",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={pubgFont.variable}>
      <body className="antialiased">
        <HeaderWrapper />
        {children}
        {/* Footer */}
        <FooterWrapper />
      </body>
    </html>
  );
}