"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/app/contexts/AuthContext";
import SuperAdminRoute from "@/app/components/SuperAdminRoute";
import {
  getAllCompanies,
  getCompany,
  getCompanyUsage,
  getCompanyUsers,
  getCompanyPlanDetails,
  type Company,
  type CompanyUsageSummary,
  type CompanyUsersResponse,
  type CompanyPlanDetails,
} from "@/app/services/CompanyApi";
import { format } from "date-fns";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:8000";

export default function CompanyDetailsPage() {
  return (
    <SuperAdminRoute>
      <CompanyDetailsContent />
    </SuperAdminRoute>
  );
}

function CompanyDetailsContent() {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [companyDetails, setCompanyDetails] = useState<Company | null>(null);
  const [usage, setUsage] = useState<CompanyUsageSummary | null>(null);
  const [plan, setPlan] = useState<CompanyPlanDetails | null>(null);
  const [companyUsers, setCompanyUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Usage filter
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompanyId) {
      fetchCompanyDetails();
    } else {
      setCompanyDetails(null);
      setUsage(null);
      setPlan(null);
      setCompanyUsers([]);
    }
  }, [selectedCompanyId, selectedMonth, selectedYear]);

  const fetchCompanies = async () => {
    try {
      setIsLoading(true);
      setError("");
      const companiesData = await getAllCompanies();
      setCompanies(companiesData);
      // Don't auto-select - require user to choose
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch companies";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCompanyDetails = async () => {
    if (!selectedCompanyId) return;

    try {
      setIsLoading(true);
      setError("");
      const [detailsData, usageData, planData, usersData] = await Promise.all([
        getCompany(selectedCompanyId),
        getCompanyUsage(selectedCompanyId, selectedMonth, selectedYear),
        getCompanyPlanDetails(selectedCompanyId),
        getCompanyUsers(selectedCompanyId, 0, 100),
      ]);
      setCompanyDetails(detailsData);
      setUsage(usageData);
      setPlan(planData);
      setCompanyUsers(usersData.users || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch company details";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Image
             src="/logo.png"
              alt="Buearau logo"
                width={140}
                height={50}
                className="object-contain cursor-pointer"
                priority
              />
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{user.name}</span>
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                    <Link href="/" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Home
                    </Link>
                    <button
                      onClick={logout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-black mb-2">
            Company Details
          </h1>
          <p className="text-gray-700">Select and view detailed information for any company</p>
        </div>

        {/* Company Filter */}
        <div className="mb-8 bg-white rounded-2xl shadow-xl p-6 border-2 border-[#C4B454]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#C4B454] to-[#B8A040] rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <label className="text-lg font-bold text-black">
              Select a Company
            </label>
          </div>
          <select
            value={selectedCompanyId || ""}
            onChange={(e) => setSelectedCompanyId(e.target.value || null)}
            className="w-full px-5 py-3 text-black border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-[#C4B454]/30 focus:border-[#C4B454] font-medium text-base transition-all"
          >
            <option value="" className="text-gray-500">-- Choose a company to view details --</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id} className="text-black">
                {company.name} {company.is_active ? "✓ Active" : "✗ Inactive"}
              </option>
            ))}
          </select>
        </div>

        {/* Messages */}
        {success && (
          <div className="mb-6 rounded-lg bg-green-50 border border-green-200 p-4">
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {!selectedCompanyId ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-xl border-2 border-dashed border-gray-300">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#C4B454]/20 to-[#B8A040]/20 rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-[#C4B454]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-black mb-2">No Company Selected</h3>
              <p className="text-gray-700 text-lg">Please select a company from the dropdown above to view detailed information</p>
            </div>
          </div>
        ) : isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#C4B454]"></div>
            <p className="mt-2 text-gray-600">Loading company details...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Company Info */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-200 hover:shadow-2xl transition-shadow">
              <h2 className="text-2xl font-bold text-black mb-6 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#C4B454] to-[#B8A040] rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                Company Information
              </h2>

              {companyDetails && (
                <div className="space-y-5">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <label className="block text-sm font-bold text-black mb-2">
                      Company Name
                    </label>
                    <p className="text-black font-semibold text-lg">{companyDetails.name}</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl">
                    <label className="block text-sm font-bold text-black mb-2">
                      Status
                    </label>
                    <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold shadow-sm ${
                      companyDetails.is_active
                        ? "bg-green-100 text-green-800 border-2 border-green-300"
                        : "bg-red-100 text-red-800 border-2 border-red-300"
                    }`}>
                      {companyDetails.is_active ? "✓ Active" : "✗ Inactive"}
                    </span>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl">
                    <label className="block text-sm font-bold text-black mb-2">
                      Created At
                    </label>
                    <p className="text-black font-medium">
                      {format(new Date(companyDetails.created_at), "MMM dd, yyyy 'at' HH:mm")}
                    </p>
                  </div>

                  {companyDetails.plan_started_at && (
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <label className="block text-sm font-bold text-black mb-2">
                        Plan Started
                      </label>
                      <p className="text-black font-medium">
                        {format(new Date(companyDetails.plan_started_at), "MMM dd, yyyy")}
                      </p>
                    </div>
                  )}

                  {companyDetails.plan_expires_at && (
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <label className="block text-sm font-bold text-black mb-2">
                        Plan Expires
                      </label>
                      <p className="text-black font-medium">
                        {format(new Date(companyDetails.plan_expires_at), "MMM dd, yyyy")}
                      </p>
                    </div>
                  )}

                  {/* Branding Images */}
                  <div className="pt-6 border-t-2 border-gray-200 mt-6">
                    <h3 className="text-lg font-bold text-black mb-4">Branding Images</h3>
                    
                    {companyDetails.header_image && (
                      <div className="mb-4 bg-gray-50 p-4 rounded-xl">
                        <label className="block text-sm font-bold text-black mb-3">
                          Header Image
                        </label>
                        <img
                          src={companyDetails.header_image.startsWith("http") ? companyDetails.header_image : `${API_BASE_URL}${companyDetails.header_image}`}
                          alt="Header"
                          className="w-full h-32 object-cover rounded-xl border-2 border-gray-300 shadow-md"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                    )}

                    {companyDetails.footer_image && (
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <label className="block text-sm font-bold text-black mb-3">
                          Footer Image
                        </label>
                        <img
                          src={companyDetails.footer_image.startsWith("http") ? companyDetails.footer_image : `${API_BASE_URL}${companyDetails.footer_image}`}
                          alt="Footer"
                          className="w-full h-24 object-cover rounded-xl border-2 border-gray-300 shadow-md"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                    )}

                    {!companyDetails.header_image && !companyDetails.footer_image && (
                      <p className="text-sm text-black bg-gray-100 p-3 rounded-lg">No branding images uploaded</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Plan Details */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-200 hover:shadow-2xl transition-shadow">
              <h2 className="text-2xl font-bold text-black mb-6 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#C4B454] to-[#B8A040] rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                Plan Details
              </h2>

              {plan ? (
                plan.plan ? (
                  <div className="space-y-5">
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <label className="block text-sm font-bold text-black mb-2">
                        Plan Name
                      </label>
                      <p className="text-black font-semibold text-lg">{plan.plan.name}</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl">
                      <label className="block text-sm font-bold text-black mb-2">
                        Monthly Price
                      </label>
                      <p className="text-black font-semibold text-2xl">${plan.plan.price_monthly.toFixed(2)}</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl">
                      <label className="block text-sm font-bold text-black mb-2">
                        Plan Type
                      </label>
                      <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold shadow-sm ${
                        plan.plan.is_trial
                          ? "bg-yellow-100 text-yellow-800 border-2 border-yellow-300"
                          : "bg-[#C4B454]/20 text-[#B8A040] border-2 border-[#C4B454]"
                      }`}>
                        {plan.plan.is_trial ? "🎯 Trial" : "💎 Paid"}
                      </span>
                    </div>

                    <div className="pt-6 border-t-2 border-gray-200 mt-6">
                      <h3 className="text-lg font-bold text-black mb-4">Plan Limits</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center bg-[#C4B454]/10 p-3 rounded-lg border border-[#C4B454]/30">
                          <span className="text-black font-medium">Uploads per month:</span>
                          <span className="font-bold text-black text-lg">{plan.plan.limits.uploads_per_month}</span>
                        </div>
                        <div className="flex justify-between items-center bg-[#C4B454]/10 p-3 rounded-lg border border-[#C4B454]/30">
                          <span className="text-black font-medium">Users limit:</span>
                          <span className="font-bold text-black text-lg">{plan.plan.limits.users_limit}</span>
                        </div>
                        <div className="flex justify-between items-center bg-[#C4B454]/10 p-3 rounded-lg border border-[#C4B454]/30">
                          <span className="text-black font-medium">Pages per month:</span>
                          <span className="font-bold text-black text-lg">{plan.plan.limits.pages_per_month}</span>
                        </div>
                        <div className="flex justify-between items-center bg-[#C4B454]/10 p-3 rounded-lg border border-[#C4B454]/30">
                          <span className="text-black font-medium">PDF exports:</span>
                          <span className="font-bold text-black text-lg">{plan.plan.limits.pdf_exports}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-black bg-gray-100 p-4 rounded-lg">No plan assigned</p>
                )
              ) : (
                <p className="text-black bg-gray-100 p-4 rounded-lg">Loading plan details...</p>
              )}
            </div>

            {/* Usage Statistics */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-200 hover:shadow-2xl transition-shadow">
              <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <h2 className="text-2xl font-bold text-black flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#C4B454] to-[#B8A040] rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  Usage Statistics
                </h2>
                <div className="flex gap-2">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-semibold text-black focus:ring-2 focus:ring-[#C4B454]/30 focus:border-[#C4B454]"
                  >
                    {months.map((month, index) => (
                      <option key={index + 1} value={index + 1}>
                        {month}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    min="2000"
                    max="2100"
                    className="w-28 px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-semibold text-black focus:ring-2 focus:ring-[#C4B454]/30 focus:border-[#C4B454]"
                  />
                </div>
              </div>

              {usage ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-[#C4B454]/10 to-[#B8A040]/10 rounded-xl p-5 border-2 border-[#C4B454]/30 shadow-md">
                      <p className="text-sm text-black font-bold mb-2">Total Uploads</p>
                      <p className="text-3xl font-bold text-[#C4B454]">{usage.total_uploads}</p>
                    </div>
                    <div className="bg-gradient-to-br from-[#C4B454]/10 to-[#B8A040]/10 rounded-xl p-5 border-2 border-[#C4B454]/30 shadow-md">
                      <p className="text-sm text-black font-bold mb-2">OCR Pages</p>
                      <p className="text-3xl font-bold text-[#B8A040]">{usage.total_ocr_pages}</p>
                    </div>
                    <div className="bg-gradient-to-br from-[#C4B454]/10 to-[#B8A040]/10 rounded-xl p-5 border-2 border-[#C4B454]/30 shadow-md">
                      <p className="text-sm text-black font-bold mb-2">PDF Exports</p>
                      <p className="text-3xl font-bold text-[#A69035]">{usage.total_pdf_exports}</p>
                    </div>
                  </div>
                  <div className="text-sm text-black font-medium mt-4 bg-gray-100 p-3 rounded-lg">
                    📅 Period: {format(new Date(usage.period_start), "MMM dd, yyyy")} - {format(new Date(usage.period_end), "MMM dd, yyyy")}
                  </div>
                </div>
              ) : (
                <p className="text-black bg-gray-100 p-4 rounded-lg">Loading usage statistics...</p>
              )}
            </div>

            {/* Company Users */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-200 hover:shadow-2xl transition-shadow">
              <h2 className="text-2xl font-bold text-black mb-6 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-[#C4B454] to-[#B8A040] rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                Company Users ({companyUsers.length})
              </h2>

              {companyUsers.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                  {companyUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <div className="flex-1">
                        <p className="font-bold text-black text-lg">{user.name}</p>
                        <p className="text-sm text-gray-700 font-medium">{user.email}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-3 py-2 rounded-lg text-xs font-bold shadow-sm mb-2 ${
                          user.role === "superadmin"
                            ? "bg-red-100 text-red-800 border-2 border-red-300"
                            : user.role === "company_admin"
                            ? "bg-blue-100 text-blue-800 border-2 border-blue-300"
                            : "bg-gray-100 text-gray-800 border-2 border-gray-300"
                        }`}>
                          {user.role === "superadmin" ? "🔴 Super Admin" : user.role === "company_admin" ? "🔵 Admin" : "👤 User"}
                        </span>
                        <p className="text-xs text-black font-medium">
                          {format(new Date(user.created_at), "MMM dd, yyyy")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-black bg-gray-100 p-4 rounded-lg">No users found</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

