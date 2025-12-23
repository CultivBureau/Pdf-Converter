"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/app/contexts/AuthContext";
import { User, Mail, Lock, AlertCircle, Loader2, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      const returnUrl = searchParams.get("returnUrl") || "/";
      router.push(returnUrl);
    }
  }, [user, loading, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login({ email, password });
      
      // Redirect handled by AuthContext
      const returnUrl = searchParams.get("returnUrl") || "/";
      router.push(returnUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link href="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
            <Image
             src="/logo.png"
              alt="Buearau logo"
              width={140}
              height={50}
              className="object-contain"
              priority
            />
          </Link>
        </div>
      </header>

      <div className="flex items-center justify-center bg-white px-6 py-16">
        <div className="w-full max-w-md">
          {/* Login Card */}
          <div className="bg-white rounded-3xl shadow-2xl p-10 border border-gray-100 relative overflow-hidden">
            {/* Decorative gradient background */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#C4B454] to-[#B8A040]"></div>
            
            <div className="text-center mb-8 mt-4">
              <div className="w-16 h-16 bg-gradient-to-br from-[#C4B454] to-[#B8A040] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
                Welcome Back
              </h1>
              <p className="text-gray-500">
                Sign in to access your documents
              </p>
            </div>

            {error && (
              <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2"
                >
                  <Mail className="w-4 h-4 text-[#B8A040]" />
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#C4B454]/20 focus:border-[#B8A040] focus:bg-white transition-all duration-200 text-gray-900 placeholder:text-gray-400"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2"
                >
                  <Lock className="w-4 h-4 text-[#B8A040]" />
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#C4B454]/20 focus:border-[#B8A040] focus:bg-white transition-all duration-200 text-gray-900 placeholder:text-gray-400"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#C4B454] to-[#B8A040] text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-2xl hover:from-[#B8A040] hover:to-[#A69035] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-1 hover:scale-[1.02] active:scale-95"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin h-5 w-5" />
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <div className="bg-gradient-to-r from-[#C4B454]/10 to-[#B8A040]/5 rounded-xl p-4 border border-[#C4B454]/20">
                <p className="text-sm text-gray-700 font-medium mb-1">
                  Need an account?
                </p>
                <p className="text-xs text-gray-600">
                  Contact your administrator to register. Only administrators can create new user accounts.
                </p>
              </div>
            </div>
          </div>

          {/* Info */}
          <p className="mt-6 text-center text-xs text-gray-400">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}

