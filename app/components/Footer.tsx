import Image from "next/image";
import { FaTwitter, FaFacebook, FaInstagram, FaYoutube } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-black text-gray-400 px-6 md:px-20 pb-10 pt-5 border-t border-gray-800 w-full">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

        {/* 🔥 Logo + Description */}
        <div>
          <div className="flex items-center gap-3 bg-[#F2AA00] w-max px-2 rounded">
            <Image
              src="/logo.svg"
              alt="Logo"
              width={45}
              height={45}
            />
          </div>

          <p className="text-sm leading-6 pt-2">
            The premier destination for competitive mobile esports.
            Join the community, compete with the best, and rise to glory.
          </p>

          {/* Social Icons */}
          <div className="flex gap-4 mt-4 text-lg">
            <FaTwitter className="hover:text-white cursor-pointer" />
            <FaFacebook className="hover:text-white cursor-pointer" />
            <FaInstagram className="hover:text-white cursor-pointer" />
            <FaYoutube className="hover:text-white cursor-pointer" />
          </div>
        </div>

        {/* Tournament */}
        <div>
          <h3 className="text-white  mb-4">Tournament</h3>
          <ul className="space-y-2 text-sm">
            <li className="hover:text-white cursor-pointer">Rules & Regulations</li>
            <li className="hover:text-white cursor-pointer">Prize Pool</li>
            <li className="hover:text-white cursor-pointer">Schedule</li>
            <li className="hover:text-white cursor-pointer">Leaderboards</li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h3 className="text-white  mb-4">Support</h3>
          <ul className="space-y-2 text-sm">
            <li className="hover:text-white cursor-pointer">Help Center</li>
            <li className="hover:text-white cursor-pointer">Contact Us</li>
            <li className="hover:text-white cursor-pointer">Report a Bug</li>
            <li className="hover:text-white cursor-pointer">Privacy Policy</li>
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h3 className="text-white  mb-4">Newsletter</h3>
          <p className="text-sm mb-4">
            Subscribe to get updates on upcoming tournaments.
          </p>

          <div className="flex">
            <input
              type="email"
              placeholder="Email address"
              className="bg-black border border-gray-700 px-4 py-2 text-sm w-full outline-none"
            />
            <button className="bg-[#F2AA00] px-4 flex text-black items-center justify-center">
                Subscribe
            </button>
          </div>
        </div>

      </div>

      {/* Bottom */}
      <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col md:flex-row justify-between text-sm">
        <p>© 2026 Elite Series. All rights reserved.</p>
        <div className="flex gap-6 mt-4 md:mt-0">
          <span className="hover:text-white cursor-pointer">Terms</span>
          <span className="hover:text-white cursor-pointer">Privacy</span>
          <span className="hover:text-white cursor-pointer">Cookies</span>
        </div>
      </div>
    </footer>
  );
}