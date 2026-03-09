import Image from "next/image";
import Link from "next/link";
import { FaInstagram, FaYoutube, FaWhatsapp } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-black text-gray-400 px-6 md:px-20 pb-10 pt-5 border-t border-gray-800 w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

        {/* Logo + Description */}
        <div>
          <div className="flex items-center gap-3 bg-[#F2AA00] w-max px-2 rounded">
            <Image src="/logo.svg" alt="Logo" width={45} height={45} />
          </div>
          <p className="text-sm leading-6 pt-2">
            The premier destination for competitive PUBG & BGMI tournaments across India and UAE.
            Compete. Win. Dominate.
          </p>
          <div className="flex gap-4 mt-4 text-lg">
            <a href="https://www.instagram.com/kingpubg_tournaments.co" target="_blank" rel="noreferrer">
              <FaInstagram className="hover:text-pink-500 cursor-pointer transition-colors" />
            </a>
            <a href="https://youtube.com/@kingopislive-pubg" target="_blank" rel="noreferrer">
              <FaYoutube className="hover:text-red-500 cursor-pointer transition-colors" />
            </a>
            <a href="https://wa.me/971588340270" target="_blank" rel="noreferrer">
              <FaWhatsapp className="hover:text-green-500 cursor-pointer transition-colors" />
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="text-white mb-4 tracking-widest text-sm">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/tournaments" className="hover:text-white transition-colors">Tournaments</Link></li>
            <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
            <li><Link href="/about#faq" className="hover:text-white transition-colors">FAQ</Link></li>
            <li><Link href="/login" className="hover:text-white transition-colors">Login / Register</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-white mb-4 tracking-widest text-sm">Contact & Support</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="mailto:kingopubgtournaments@gmail.com" className="hover:text-white transition-colors break-all">
                kingopubgtournaments@gmail.com
              </a>
            </li>
            <li>
              <a href="https://wa.me/917418270710" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                🇮🇳 +91 7418270710 (Viju)
              </a>
            </li>
            <li>
              <a href="https://wa.me/971588340270" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                🇦🇪 +971 588340270 (Viju)
              </a>
            </li>
            <li>
              <a href="https://wa.me/917539993019" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                🇮🇳 +91 75399 93019 (Ashwin)
              </a>
            </li>
            <li>
              <a href="https://wa.me/971504211486" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                🇦🇪 +971 504211486 (Ashwin)
              </a>
            </li>
          </ul>
        </div>

      </div>

      {/* Bottom */}
      <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col md:flex-row justify-between text-sm">
        <p>© 2026 KingPUBG Tournaments. All rights reserved.</p>
        <div className="flex gap-6 mt-4 md:mt-0">
          <Link href="/about" className="hover:text-white transition-colors">About</Link>
          <Link href="/about#faq" className="hover:text-white transition-colors">FAQ</Link>
          <a href="mailto:kingopubgtournaments@gmail.com" className="hover:text-white transition-colors">Contact</a>
        </div>
      </div>
    </footer>
  );
}