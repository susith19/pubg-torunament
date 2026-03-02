"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import { useSearchParams } from "next/navigation";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";

// ---------------------------------------------------------------------------
// SVG Icons
// ---------------------------------------------------------------------------

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

const EyeIcon = ({ open }: { open: boolean }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {open ? (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    )}
  </svg>
);

// ---------------------------------------------------------------------------
// Main Login Component
// ---------------------------------------------------------------------------
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = async () => {
    if (!email || !password) return;

    setLoading(true);
    setError("");

    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      const token = await res.user.getIdToken();

      // 🔥 GET ROLE FROM BACKEND
      const userRes = await fetch("/api/auth/firebase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      if (!userRes.ok) {
        throw new Error("Failed to fetch user role");
      }

      const userData = await userRes.json();

      // 🔥 STORE EVERYTHING
      localStorage.setItem("token", token);
      localStorage.setItem("name", res.user.displayName || "User");
      localStorage.setItem("role", userData.role);

      // 🔥 REDIRECT BASED ON ROLE
      if (userData.role === "admin") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/";
      }
    } catch (e: any) {
      setError(e.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      const token = await res.user.getIdToken();

      // 🔥 BACKEND VERIFY + GET ROLE
      const userRes = await fetch("/api/auth/firebase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      if (!userRes.ok) {
        throw new Error("Failed to fetch user role");
      }

      const userData = await userRes.json();

      // 🔥 STORE
      localStorage.setItem("token", token);
      localStorage.setItem("name", res.user.displayName || "User");
      localStorage.setItem("role", userData.role);

      // 🔥 REDIRECT
      if (userData.role === "admin") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/";
      }
    } catch (e: any) {
      setError(e.message || "Google login failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") login();
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 ">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3">
          <span className="text-gray-500 text-lg tracking-wider uppercase">
            Sign in to
          </span>
          <div className="flex flex-col leading-none">
            <img src="/logo.svg" alt="logo" width={65} height={65} />
            <span className="text-gray-400 text-[9px] tracking-[0.3em] uppercase">
              Tournaments
            </span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm">
          {/* Google Button */}
          <button
            onClick={googleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium border border-gray-200 hover:border-gray-300 transition-all duration-150 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer text-sm tracking-wide"
          >
            <GoogleIcon />
            Login via Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-gray-400 text-xs">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Email */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="email"
              className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-900 text-sm tracking-wide leading-relaxed placeholder-gray-400 outline-none focus:border-[#F2AA00] focus:ring-2 focus:ring-[#F2AA00]/10 transition-all duration-150"
            />
          </div>

          {/* Password */}
          <div className="mb-5">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                autoComplete="current-password"
                className="w-full px-4 py-3 pr-12 rounded-xl bg-white border border-gray-200 text-gray-900 text-sm placeholder-gray-400 outline-none focus:border-[#F2AA00] focus:ring-2 focus:ring-[#F2AA00]/10 transition-all duration-150"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 cursor-pointer"
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </div>

          {/* Remember me + Forgot password */}
          <div className="flex items-center justify-between mb-6">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center transition-all duration-150 ${
                  rememberMe
                    ? "bg-[#F2AA00] border-[#F2AA00]"
                    : "bg-white border-gray-300"
                }`}
                onClick={() => setRememberMe(!rememberMe)}
              >
                {rememberMe && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path
                      d="M2 5l2.5 2.5L8 3"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <span
                className="text-gray-500 text-sm group-hover:text-gray-700 transition-colors select-none"
                onClick={() => setRememberMe(!rememberMe)}
              >
                Remember me
              </span>
            </label>
            {/* <a
              href="/forgot-password"
              className="text-gray-500 text-sm hover:text-gray-900 underline underline-offset-2 decoration-gray-300 transition-colors"
            >
              Forgot password?
            </a> */}
          </div>

          {/* Sign In Button */}
          <button
            onClick={login}
            disabled={loading}
            className="relative overflow-hidden w-full py-3 text-xl rounded-xl bg-gray-900 text-white tracking-widest transition-all duration-300 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer group"
          >
            <span className="relative z-10 transition-colors duration-300 group-hover:text-black">
              {loading ? "Signing in…" : "Sign in"}
            </span>

            {/* Hover fill layer */}
            <span className="absolute inset-0 bg-[#F2AA00] transform scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100"></span>
          </button>

          {/* Sign Up link */}
          <p className="text-center mt-5 text-sm text-gray-400">
            Dont have an account yet?{" "}
            <a
              href="/signup"
              className="text-gray-900 hover:text-[#F2AA00] transition-colors underline underline-offset-2 decoration-gray-300 "
            >
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
