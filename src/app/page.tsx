"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

function HomeContent() {
  const { user, isAdmin, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header with Logo */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image
              src="/logoHappylife.jpg"
              alt="HappyLife Travel & Tourism"
              width={180}
              height={60}
              className="object-contain"
              priority
            />
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <div className="w-8 h-8 bg-[#A4C639] rounded-full flex items-center justify-center text-white font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col items-start">
                  <span className="text-sm font-medium text-gray-700">{user.name}</span>
                    {isAdmin && (
                      <span className="text-xs text-[#A4C639] font-semibold">Admin</span>
                    )}
                  </div>
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                    {isAdmin && (
                      <Link
                        href="/pages/UserManagement"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          User Management
                        </span>
                      </Link>
                    )}
                    <Link
                      href="/pages/History"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      My Documents
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/pages/Login"
                className="px-4 py-2 bg-[#A4C639] text-white rounded-lg font-medium hover:bg-[#8FB02E] transition-colors"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-5xl">
          {/* Welcome Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#A4C639]/10 to-emerald-500/10 rounded-full border border-[#A4C639]/20 mb-6">
              <span className="text-2xl">✨</span>
              <span className="text-sm font-bold text-[#A4C639]">Professional Template Studio</span>
            </div>
            <h1 className="text-5xl font-extrabold mb-4">
              <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">Welcome to </span>
              <span className="bg-gradient-to-r from-[#A4C639] to-emerald-600 bg-clip-text text-transparent">HappyLife</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Create, edit, and export professional travel packages and documents with our advanced AI-powered PDF template generator
            </p>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <Link 
              href="/pages/CodePreview" 
              className="group block rounded-3xl border-2 border-gray-200 bg-white p-8 shadow-xl transition-all duration-300 hover:shadow-2xl hover:border-blue-400 hover:-translate-y-2 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400/50 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Code Editor</h2>
                </div>
                <p className="text-gray-600 mb-4 grow leading-relaxed">
                  Open the live React + Tailwind template editor. Design and customize your travel packages with real-time preview.
                </p>
                <div className="flex items-center text-blue-600 font-bold group-hover:gap-3 transition-all">
                  <span>Start Editing</span>
                  <svg className="w-5 h-5 transform group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </Link>

            <Link
              href="/pages/PdfConverter"
              className="group block rounded-3xl border-2 border-gray-200 bg-white p-8 shadow-xl transition-all duration-300 hover:shadow-2xl hover:border-orange-400 hover:-translate-y-2 focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-400/50 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-amber-500"></div>
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-4 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">PDF Upload</h2>
                </div>
                <p className="text-gray-600 mb-4 grow leading-relaxed">
                  Upload a PDF document and let AI transform it into an editable template. Extract content and preview with live editing capabilities.
                </p>
                <div className="flex items-center text-orange-600 font-bold group-hover:gap-3 transition-all">
                  <span>Upload Document</span>
                  <svg className="w-5 h-5 transform group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </Link>

            {user && (
              <Link
                href="/pages/History"
                className="group block rounded-3xl border-2 border-gray-200 bg-white p-8 shadow-xl transition-all duration-300 hover:shadow-2xl hover:border-purple-400 hover:-translate-y-2 focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-400/50 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-4 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">My History</h2>
                  </div>
                  <p className="text-gray-600 mb-4 grow leading-relaxed">
                    Access all your converted documents. View, edit, share, and manage your PDF history in one place.
                  </p>
                  <div className="flex items-center text-purple-600 font-bold group-hover:gap-3 transition-all">
                    <span>View Documents</span>
                    <svg className="w-5 h-5 transform group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </Link>
            )}

            {isAdmin && (
              <Link
                href="/pages/UserManagement"
                className="group block rounded-3xl border-2 border-gray-200 bg-white p-8 shadow-xl transition-all duration-300 hover:shadow-2xl hover:border-[#A4C639] hover:-translate-y-2 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#A4C639]/50 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#A4C639] to-emerald-500"></div>
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-4 bg-gradient-to-br from-[#A4C639] to-emerald-500 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
                  </div>
                  <div className="mb-4">
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-[#A4C639] to-emerald-500 text-white text-xs font-bold rounded-full mb-3 shadow-md">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Admin Only
                    </span>
                    <p className="text-gray-600 grow leading-relaxed">
                      Create, view, and manage user accounts. Control access and permissions for your team.
                    </p>
                  </div>
                  <div className="flex items-center text-[#A4C639] font-bold group-hover:gap-3 transition-all">
                    <span>Manage Users</span>
                    <svg className="w-5 h-5 transform group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </Link>
            )}
          </div>

          {/* Features Section */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-8 bg-white/70 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-gradient-to-br from-[#A4C639] to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">Fast & Efficient</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Generate templates in seconds with AI-powered extraction</p>
            </div>
            <div className="text-center p-8 bg-white/70 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">Live Preview</h3>
              <p className="text-sm text-gray-600 leading-relaxed">See changes in real-time as you edit your templates</p>
            </div>
            <div className="text-center p-8 bg-white/70 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">Easy Export</h3>
              <p className="text-sm text-gray-600 leading-relaxed">Download as code or PDF with one click</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <Image
              src="/logoHappylife.jpg"
              alt="HappyLife"
              width={120}
              height={40}
              className="object-contain opacity-75"
            />
            <span>•</span>
            <span>Professional Travel Document Solutions</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <ProtectedRoute>
      <HomeContent />
    </ProtectedRoute>
  );
}
