import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import HeaderWrapper from "./components/HeaderWrapper";

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

export const metadata: Metadata = {
  title: "Pubg App",
  description: "Tournament App",
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
      </body>
    </html>
  );
}