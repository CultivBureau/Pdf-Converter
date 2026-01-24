"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "./contexts/AuthContext";
import { useHistory } from "./contexts/HistoryContext";
import { useLanguage } from "./contexts/LanguageContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Loading from "./components/Loading";
import LanguageToggle from "./components/LanguageToggle";
import { getRoleDisplayName, getRoleBadgeColor } from "./utils/rbac";
import { 
  Upload, 
  FileText, 
  Clock, 
  Building2, 
  FileStack, 
  Shield, 
  Users, 
  Settings, 
  ArrowRight, 
  ChevronDown,
  Zap,
  Eye,
  Download,
  Sparkles
} from "lucide-react";

function HomeContent() {
  const {
    user,
    isAdmin,
    isSuperAdmin,
    isCompanyAdmin,
    canManageCompanies,
    canManagePlans,
    canManageUsers,
    canManageCompanySettings,
    logout,
  } = useAuth();
  const { documents, toggleSidebar } = useHistory();
  const { t, isRTL, dir } = useLanguage();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" dir={dir}>
      {/* Header with Logo */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image
              src="/logo.png"
              alt="Buearau logo"
              width={140}
              height={50}
              className="object-contain"
              priority
            />
          </div>
          <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {/* Language Toggle */}
            <LanguageToggle variant="compact" />
            
            {user && (
              <button
                onClick={toggleSidebar}
                className="relative px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                title="Toggle History Sidebar"
              >
                <Clock className="w-5 h-5 text-gray-700" />
                <span className="text-sm font-semibold text-gray-700 hidden sm:inline">{t.home.history}</span>
                {documents.length > 0 && (
                  <span className={`absolute -top-1 ${isRTL ? '-left-1' : '-right-1'} w-5 h-5 bg-gradient-to-r from-[#C4B454] to-[#B8A040] text-white text-xs font-bold rounded-full flex items-center justify-center`}>
                    {documents.length > 99 ? '99+' : documents.length}
                  </span>
                )}
              </button>
            )}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-[#C4B454] to-[#B8A040] rounded-full flex items-center justify-center text-white font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-medium text-gray-700">{user.name}</span>
                    {user && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${getRoleBadgeColor(user.role)}`}>
                        {getRoleDisplayName(user.role)}
                      </span>
                    )}
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                </button>
                {showUserMenu && (
                  <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10`}>
                    {canManageCompanies && (
                      <>
                        <Link
                          href="/pages/Companies"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <span className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            {t.home.companies}
                          </span>
                        </Link>
                        {isSuperAdmin && (
                          <Link
                            href="/pages/CompanyDetails"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <span className="flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              {t.home.companyDetails}
                            </span>
                          </Link>
                        )}
                      </>
                    )}
                    {canManagePlans && (
                      <Link
                        href="/pages/Plans"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <span className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          {t.home.plans}
                        </span>
                      </Link>
                    )}
                    {canManageUsers && (
                      <Link
                        href="/pages/UserManagement"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <span className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          {t.home.userManagement}
                        </span>
                      </Link>
                    )}
                    {canManageCompanySettings && (
                      <Link
                        href="/pages/CompanySettings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <span className="flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          {t.home.companySettings}
                        </span>
                      </Link>
                    )}
                    <Link
                      href="/pages/History"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <span className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {isSuperAdmin ? t.home.allDocuments : isCompanyAdmin ? t.home.companyDocuments : t.home.myDocuments}
                      </span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      {t.common.logout}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/pages/Login"
                className="px-4 py-2 bg-gradient-to-r from-[#C4B454] to-[#B8A040] text-white rounded-lg font-medium hover:from-[#B8A040] hover:to-[#A69035] transition-all shadow-md hover:shadow-lg"
              >
                {t.common.login}
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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#C4B454]/10 to-[#B8A040]/10 rounded-full border border-[#C4B454]/20 mb-6">
              <span className="text-2xl">✨</span>
              <span className="text-sm font-bold text-[#B8A040]">{t.home.professionalTemplateStudio}</span>
            </div>
            <h1 className="text-5xl font-extrabold mb-4">
              <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">{t.home.welcomeTo} </span>
              <span className="bg-gradient-to-r from-[#C4B454] to-[#B8A040] bg-clip-text text-transparent">{t.home.bureauOCR}</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              {t.home.subtitle}
            </p>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="group block rounded-3xl border-2 border-gray-200 bg-white p-8 shadow-xl transition-all duration-300 hover:shadow-2xl hover:border-[#C4B454] hover:-translate-y-2 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#C4B454]/50 relative overflow-hidden cursor-pointer"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json,application/json';
                input.onchange = async (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (!file) return;
                  
                  try {
                    const text = await file.text();
                    const data = JSON.parse(text);
                    
                    // Store the structure in sessionStorage
                    sessionStorage.setItem('uploadedStructure', JSON.stringify(data));
                    
                    // Navigate to CodePreview
                    window.location.href = '/pages/CodePreview';
                  } catch (error) {
                    alert('Invalid JSON file. Please upload a valid JSON document.');
                  }
                };
                input.click();
              }}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#C4B454] to-[#B8A040]"></div>
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-4 bg-gradient-to-br from-[#C4B454] to-[#B8A040] rounded-2xl text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                    <FileStack className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">{t.home.uploadJson}</h2>
                </div>
                <p className="text-gray-600 mb-4 grow leading-relaxed">
                  {t.home.uploadJsonDesc}
                </p>
                <div className="flex items-center text-[#B8A040] font-bold group-hover:gap-3 transition-all">
                  <span>{t.home.uploadFile}</span>
                  <ArrowRight className="w-5 h-5 transform group-hover:translate-x-2 transition-transform duration-300" />
                </div>
              </div>
            </div>

            <Link
              href="/pages/PdfConverter"
              className="group block rounded-3xl border-2 border-gray-200 bg-white p-8 shadow-xl transition-all duration-300 hover:shadow-2xl hover:border-[#C4B454] hover:-translate-y-2 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#C4B454]/50 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#C4B454] to-[#B8A040]"></div>
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-4 bg-gradient-to-br from-[#C4B454] to-[#B8A040] rounded-2xl text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                    <Upload className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">{t.home.pdfUpload}</h2>
                </div>
                <p className="text-gray-600 mb-4 grow leading-relaxed">
                  {t.home.pdfUploadDesc}
                </p>
                <div className="flex items-center text-[#B8A040] font-bold group-hover:gap-3 transition-all">
                  <span>{t.home.uploadDocument}</span>
                  <ArrowRight className="w-5 h-5 transform group-hover:translate-x-2 transition-transform duration-300" />
                </div>
              </div>
            </Link>

            {user && (
              <Link
                href="/pages/History"
                className="group block rounded-3xl border-2 border-gray-200 bg-white p-8 shadow-xl transition-all duration-300 hover:shadow-2xl hover:border-[#C4B454] hover:-translate-y-2 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#C4B454]/50 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#C4B454] to-[#B8A040]"></div>
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-4 bg-gradient-to-br from-[#C4B454] to-[#B8A040] rounded-2xl text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      <Clock className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {isSuperAdmin ? t.home.allDocuments : isCompanyAdmin ? t.home.companyDocuments : t.home.myDocuments}
                    </h2>
                  </div>
                  <p className="text-gray-600 mb-4 grow leading-relaxed">
                    {isSuperAdmin 
                      ? t.home.allDocumentsDesc
                      : isCompanyAdmin
                      ? t.home.companyDocumentsDesc
                      : t.home.myDocumentsDesc}
                  </p>
                  <div className="flex items-center text-[#B8A040] font-bold group-hover:gap-3 transition-all">
                    <span>{t.home.viewDocuments}</span>
                    <ArrowRight className="w-5 h-5 transform group-hover:translate-x-2 transition-transform duration-300" />
                  </div>
                </div>
              </Link>
            )}

            {canManageCompanies && (
              <>
                <Link
                  href="/pages/Companies"
                  className="group block rounded-3xl border-2 border-gray-200 bg-white p-8 shadow-xl transition-all duration-300 hover:shadow-2xl hover:border-[#C4B454] hover:-translate-y-2 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#C4B454]/50 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#C4B454] to-[#B8A040]"></div>
                  <div className="flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-4 bg-gradient-to-br from-[#C4B454] to-[#B8A040] rounded-2xl text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                        <Building2 className="w-8 h-8" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">{t.home.companies}</h2>
                    </div>
                    <div className="mb-4">
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-[#C4B454] to-[#B8A040] text-white text-xs font-bold rounded-full mb-3 shadow-md">
                        <Shield className="w-3 h-3" />
                        {t.home.superAdminOnly}
                      </span>
                      <p className="text-gray-600 grow leading-relaxed">
                        {t.home.manageCompaniesDesc}
                      </p>
                    </div>
                    <div className="flex items-center text-[#B8A040] font-bold group-hover:gap-3 transition-all">
                      <span>{t.home.manageCompanies}</span>
                      <ArrowRight className="w-5 h-5 transform group-hover:translate-x-2 transition-transform duration-300" />
                    </div>
                  </div>
                </Link>
                {isSuperAdmin && (
                  <Link
                    href="/pages/CompanyDetails"
                    className="group block rounded-3xl border-2 border-gray-200 bg-white p-8 shadow-xl transition-all duration-300 hover:shadow-2xl hover:border-[#C4B454] hover:-translate-y-2 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#C4B454]/50 relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#C4B454] to-[#B8A040]"></div>
                    <div className="flex flex-col h-full">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-4 bg-gradient-to-br from-[#C4B454] to-[#B8A040] rounded-2xl text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                          <FileText className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">{t.home.companyDetails}</h2>
                      </div>
                      <div className="mb-4">
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-[#C4B454] to-[#B8A040] text-white text-xs font-bold rounded-full mb-3 shadow-md">
                          <Shield className="w-3 h-3" />
                          {t.home.superAdminOnly}
                        </span>
                        <p className="text-gray-600 grow leading-relaxed">
                          {t.home.viewDetailsDesc}
                        </p>
                      </div>
                      <div className="flex items-center text-[#B8A040] font-bold group-hover:gap-3 transition-all">
                        <span>{t.home.viewDetails}</span>
                        <ArrowRight className="w-5 h-5 transform group-hover:translate-x-2 transition-transform duration-300" />
                      </div>
                    </div>
                  </Link>
                )}
              </>
            )}

            {canManagePlans && (
              <Link
                href="/pages/Plans"
                className="group block rounded-3xl border-2 border-gray-200 bg-white p-8 shadow-xl transition-all duration-300 hover:shadow-2xl hover:border-[#C4B454] hover:-translate-y-2 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#C4B454]/50 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#C4B454] to-[#B8A040]"></div>
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-4 bg-gradient-to-br from-[#C4B454] to-[#B8A040] rounded-2xl text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      <Shield className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">{t.home.plans}</h2>
                  </div>
                  <p className="text-gray-600 mb-4 grow leading-relaxed">
                    {t.home.managePlansDesc}
                  </p>
                  <div className="flex items-center text-[#B8A040] font-bold group-hover:gap-3 transition-all">
                    <span>{t.home.managePlans}</span>
                    <ArrowRight className="w-5 h-5 transform group-hover:translate-x-2 transition-transform duration-300" />
                  </div>
                </div>
              </Link>
            )}

            {canManageUsers && (
              <Link
                href="/pages/UserManagement"
                className="group block rounded-3xl border-2 border-gray-200 bg-white p-8 shadow-xl transition-all duration-300 hover:shadow-2xl hover:border-[#C4B454] hover:-translate-y-2 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#C4B454]/50 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#C4B454] to-[#B8A040]"></div>
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-4 bg-gradient-to-br from-[#C4B454] to-[#B8A040] rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">{t.home.userManagement}</h2>
                  </div>
                  <div className="mb-4">
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-[#C4B454] to-[#B8A040] text-white text-xs font-bold rounded-full mb-3 shadow-md">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      {t.home.adminOnly}
                    </span>
                    <p className="text-gray-600 grow leading-relaxed">
                      {t.home.manageUsersDesc}
                    </p>
                  </div>
                  <div className="flex items-center text-[#B8A040] font-bold group-hover:gap-3 transition-all">
                    <span>{t.home.manageUsers}</span>
                    <svg className="w-5 h-5 transform group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              </Link>
            )}

            {canManageCompanySettings && !isSuperAdmin && (
              <Link
                href="/pages/CompanySettings"
                className="group block rounded-3xl border-2 border-gray-200 bg-white p-8 shadow-xl transition-all duration-300 hover:shadow-2xl hover:border-[#C4B454] hover:-translate-y-2 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#C4B454]/50 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#C4B454] to-[#B8A040]"></div>
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-4 bg-gradient-to-br from-[#C4B454] to-[#B8A040] rounded-2xl text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      <Settings className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">{t.home.companySettingsCard}</h2>
                  </div>
                  <p className="text-gray-600 mb-4 grow leading-relaxed">
                    {t.home.companySettingsDesc}
                  </p>
                  <div className="flex items-center text-[#B8A040] font-bold group-hover:gap-3 transition-all">
                    <span>{t.home.viewSettings}</span>
                    <ArrowRight className="w-5 h-5 transform group-hover:translate-x-2 transition-transform duration-300" />
                  </div>
                </div>
              </Link>
            )}
          </div>

          {/* Features Section */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-8 bg-white/70 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-gradient-to-br from-[#C4B454] to-[#B8A040] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">{t.home.fastEfficient}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{t.home.fastEfficientDesc}</p>
            </div>
            <div className="text-center p-8 bg-white/70 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-gradient-to-br from-[#C4B454] to-[#B8A040] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Eye className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">{t.home.livePreview}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{t.home.livePreviewDesc}</p>
            </div>
            <div className="text-center p-8 bg-white/70 backdrop-blur-md rounded-2xl shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 bg-gradient-to-br from-[#C4B454] to-[#B8A040] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Download className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">{t.home.easyExport}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{t.home.easyExportDesc2}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <Image
              src="/logo.png"
              alt="Bureau OCR"
              width={140}
              height={50}
              className="object-contain opacity-75"
            />
            <span>•</span>
            <span>{t.home.footerText}</span>
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
