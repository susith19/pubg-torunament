"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
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

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path
      d="M2.5 7l3 3L11.5 4"
      stroke="#16a34a"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const XSmallIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path
      d="M3.5 3.5l7 7M10.5 3.5l-7 7"
      stroke="#dc2626"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const GiftIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 12 20 22 4 22 4 12" />
    <rect x="2" y="7" width="20" height="5" />
    <line x1="12" y1="22" x2="12" y2="7" />
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
  </svg>
);

// ---------------------------------------------------------------------------
// Password strength helpers
// ---------------------------------------------------------------------------
const rules = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One number", test: (p: string) => /\d/.test(p) },
];

// ---------------------------------------------------------------------------
// Main Signup Component
// ---------------------------------------------------------------------------
export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Referral code state
  const [referralCode, setReferralCode] = useState("");
  const [showReferral, setShowReferral] = useState(false);

  const passwordFocused = password.length > 0;
  const passwordsMatch =
    password === confirmPassword && confirmPassword.length > 0;
  const allRulesPassed = rules.every((r) => r.test(password));

  const signup = async () => {
    if (!email || !password) return;

    setLoading(true);
    setError("");

    try {
      // ✅ 1. Create user in Firebase
      const res = await createUserWithEmailAndPassword(auth, email, password);

      // ✅ 2. Set display name
      await updateProfile(res.user, { displayName: name });

      // ✅ 3. Force refresh token (IMPORTANT)
      const token = await res.user.getIdToken(true);

      // ✅ 4. Send to backend (with optional referral code)
      const apiRes = await fetch("/api/auth/firebase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          ...(referralCode.trim() && { referral_code: referralCode.trim() }), // 👈 Only sent if provided
        }),
      });

      const data = await apiRes.json();

      if (!apiRes.ok) {
        throw new Error(data.error || "Backend failed");
      }

      // ✅ 5. Save session
      localStorage.setItem("token", token);
      localStorage.setItem("name", res.user.displayName || "User");

      // ✅ 6. Redirect
      window.location.href = "/";
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Sign up failed.");
    } finally {
      setLoading(false);
    }
  };

  const googleSignup = async () => {
    setLoading(true);
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      const token = await res.user.getIdToken();

      await fetch("/api/auth/firebase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          ...(referralCode.trim() && { referral_code: referralCode.trim() }), // 👈 Also passed for Google signup
        }),
      });

      localStorage.setItem("token", token);
      localStorage.setItem("name", res.user.displayName || "User");
      window.location.href = "/dashboard";
    } catch (e: any) {
      setError(e.message || "Google sign up failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") signup();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3">
          <span className="text-gray-500 text-base sm:text-lg font-light">
            Create account on
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
            onClick={googleSignup}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white hover:bg-gray-50 text-gray-700 text-sm font-medium border border-gray-200 hover:border-gray-300 transition-all duration-150 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            <GoogleIcon />
            Sign up via Google
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

          {/* Full Name */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Full Name
            </label>
            <input
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="name"
              className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-900 text-sm placeholder-gray-400 outline-none focus:border-[#F2AA00] focus:ring-2 focus:ring-[#F2AA00]/10 transition-all duration-150"
            />
          </div>

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
              className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-900 text-sm placeholder-gray-400 outline-none focus:border-[#F2AA00] focus:ring-2 focus:ring-[#F2AA00]/10 transition-all duration-150"
            />
          </div>

          {/* Password */}
          <div className="mb-4">
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
                autoComplete="new-password"
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

            {/* Password rules */}
            {passwordFocused && (
              <div className="mt-2 space-y-1">
                {rules.map((rule) => {
                  const passed = rule.test(password);
                  return (
                    <div key={rule.label} className="flex items-center gap-2">
                      <span
                        className={`flex-shrink-0 ${passed ? "text-green-600" : "text-red-500"}`}
                      >
                        {passed ? <CheckIcon /> : <XSmallIcon />}
                      </span>
                      <span
                        className={`text-xs ${passed ? "text-green-600" : "text-gray-400"}`}
                      >
                        {rule.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="mb-5">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                autoComplete="new-password"
                className={`w-full px-4 py-3 pr-12 rounded-xl bg-white border text-gray-900 text-sm placeholder-gray-400 outline-none transition-all duration-150 ${
                  confirmPassword.length > 0
                    ? passwordsMatch
                      ? "border-[#F2AA00] focus:ring-2 focus:ring-[#F2AA00]/10"
                      : "border-red-400 focus:ring-2 focus:ring-red-400/10"
                    : "border-gray-200 focus:border-[#F2AA00] focus:ring-2 focus:ring-[#F2AA00]/10"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 cursor-pointer"
              >
                <EyeIcon open={showConfirm} />
              </button>
            </div>
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className="mt-1.5 text-xs text-red-500">
                Passwords do not match.
              </p>
            )}
          </div>

          {/* Referral Code (Optional) */}
          <div className="mb-5">
            <button
              type="button"
              onClick={() => setShowReferral(!showReferral)}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-[#F2AA00] transition-colors duration-150 cursor-pointer group"
            >
              <GiftIcon />
              <span>
                {showReferral ? "Hide referral code" : "Have a referral code?"}
              </span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                className={`transition-transform duration-200 ${showReferral ? "rotate-180" : ""}`}
              >
                <path
                  d="M3 5l4 4 4-4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {showReferral && (
              <div className="mt-2 overflow-hidden">
                <input
                  type="text"
                  placeholder="Enter referral code (optional)"
                  value={referralCode}
                  onChange={(e) =>
                    setReferralCode(e.target.value.toUpperCase())
                  }
                  onKeyDown={handleKeyDown}
                  autoComplete="off"
                  maxLength={20}
                  className="w-full px-4 py-3 rounded-xl bg-amber-50 border border-[#F2AA00]/40 text-gray-900 text-sm placeholder-gray-400 outline-none focus:border-[#F2AA00] focus:ring-2 focus:ring-[#F2AA00]/10 transition-all duration-150 tracking-widest font-mono uppercase"
                />
                {referralCode && (
                  <p className="mt-1.5 text-xs text-[#c48e00] flex items-center gap-1">
                    <CheckIcon />
                    Referral code applied
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Terms */}
          <div className="flex items-start gap-3 mb-6">
            <div
              className={`mt-0.5 w-4 h-4 flex-shrink-0 rounded border flex items-center justify-center transition-all duration-150 cursor-pointer ${
                agreed
                  ? "bg-[#F2AA00] border-[#F2AA00]"
                  : "bg-white border-gray-300"
              }`}
              onClick={() => setAgreed(!agreed)}
            >
              {agreed && (
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
              className="text-gray-500 text-sm leading-snug cursor-pointer select-none"
              onClick={() => setAgreed(!agreed)}
            >
              I agree to the{" "}
              <a
                href="#"
                onClick={(e) => e.stopPropagation()}
                className="text-gray-900 font-medium underline underline-offset-2 decoration-gray-300 hover:text-[#F2AA00] transition-colors"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="#"
                onClick={(e) => e.stopPropagation()}
                className="text-gray-900 font-medium underline underline-offset-2 decoration-gray-300 hover:text-[#F2AA00] transition-colors"
              >
                Privacy Policy
              </a>
            </span>
          </div>

          {/* Sign Up Button */}
          <button
            onClick={signup}
            disabled={loading}
            className="relative overflow-hidden w-full py-3 rounded-xl bg-gray-900 text-white text-lg transition-all duration-300 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer group"
          >
            <span className="relative z-10 transition-colors duration-300 group-hover:text-black">
              {loading ? "Creating account…" : "Create account"}
            </span>

            {/* Yellow fill animation */}
            <span className="absolute inset-0 bg-[#F2AA00] transform scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100"></span>
          </button>

          {/* Sign In link */}
          <p className="text-center mt-5 text-sm text-gray-400">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-gray-900 hover:text-[#F2AA00] transition-colors underline underline-offset-2 decoration-gray-300"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}