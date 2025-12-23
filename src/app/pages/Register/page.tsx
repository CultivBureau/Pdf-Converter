"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/app/contexts/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user?.role === "admin") {
        // Redirect admin users to User Management
        router.push("/pages/UserManagement");
      } else {
        // Redirect non-admin users to home
        router.push("/");
      }
    }
  }, [user, loading, router]);

  // Show loading state while checking
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-blue-50 to-lime-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#A4C639]"></div>
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
    }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-lime-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
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

      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8 border-t-4 border-red-500">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                  className="w-8 h-8 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Admin Access Required
              </h1>
              <p className="text-gray-600 mb-4">
                User registration is only available to administrators.
                </p>
              <p className="text-sm text-gray-500 mb-6">
                Please contact your system administrator to create a new account.
              </p>
                <Link
                  href="/pages/Login"
                className="inline-block bg-gradient-to-r from-[#A4C639] to-[#8FB02E] text-white font-semibold py-2 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all"
                >
                Go to Login
                </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

