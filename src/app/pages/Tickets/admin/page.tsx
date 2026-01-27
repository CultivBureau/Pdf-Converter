"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/contexts/AuthContext";
import { useLanguage } from "@/app/contexts/LanguageContext";
import LanguageToggle from "@/app/components/LanguageToggle";
import SuperAdminRoute from "@/app/components/SuperAdminRoute";
import Loading from "@/app/components/Loading";
import {
  listAllTicketsAdmin,
  getTicketStats,
  exportResolvedTickets,
  markTicketAddedToAi,
  type TicketListItem,
  type TicketListResponse,
  type TicketStats,
  type TicketStatus,
  type TicketCategory,
  type TicketPriority,
  TICKET_CATEGORY_LABELS,
  TICKET_STATUS_LABELS,
  TICKET_PRIORITY_LABELS,
} from "@/app/services/TicketsApi";
import { getAllCompanies, type Company } from "@/app/services/CompanyApi";

// Status badge colors
const STATUS_COLORS: Record<TicketStatus, string> = {
  open: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
  added_to_ai: "bg-purple-100 text-purple-800",
};

// Priority badge colors
const PRIORITY_COLORS: Record<TicketPriority, string> = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-blue-100 text-blue-600",
  high: "bg-orange-100 text-orange-600",
  critical: "bg-red-100 text-red-600",
};

function AdminTicketsPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { t, isRTL, dir, language } = useLanguage();

  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "">("");
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | "">("");
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | "">("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [userEmailFilter, setUserEmailFilter] = useState("");

  // Export state
  const [isExporting, setIsExporting] = useState(false);

  // Load companies on mount
  useEffect(() => {
    loadCompanies();
    loadStats();
  }, []);

  // Load tickets when filters change
  useEffect(() => {
    loadTickets();
  }, [page, statusFilter, categoryFilter, priorityFilter, companyFilter, userEmailFilter]);

  const loadCompanies = async () => {
    try {
      const data = await getAllCompanies(0, 1000);
      setCompanies(data);
    } catch (err) {
      console.error("Failed to load companies:", err);
    }
  };

  const loadStats = async () => {
    try {
      const data = await getTicketStats();
      setStats(data);
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
  };

  const loadTickets = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response: TicketListResponse = await listAllTicketsAdmin({
        page,
        page_size: 20,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        priority: priorityFilter || undefined,
        company_id: companyFilter || undefined,
        user_email: userEmailFilter || undefined,
      });
      setTickets(response.tickets);
      setTotalPages(response.total_pages);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tickets");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      // Export all resolved tickets, including those already added to AI
      const data = await exportResolvedTickets(true);
      
      if (data.total === 0) {
        alert(
          language === "ar"
            ? "لا توجد تذاكر محلولة للتصدير. يجب أولاً حل التذاكر وإضافة ملخص الحل."
            : "No resolved tickets to export. Please resolve tickets and add solution summaries first."
        );
        return;
      }
      
      // Download as JSON
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tickets-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Show success message
      alert(
        language === "ar"
          ? `تم تصدير ${data.total} تذكرة بنجاح`
          : `Successfully exported ${data.total} ticket${data.total > 1 ? 's' : ''}`
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to export tickets");
    } finally {
      setIsExporting(false);
    }
  };

  const getLabel = (
    labels: Record<string, { en: string; ar: string }>,
    key: string
  ): string => {
    const label = labels[key];
    return label ? (language === "ar" ? label.ar : label.en) : key;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCompanyName = (companyId: string) => {
    if (companyId === "superadmin") return "Super Admin";
    const company = companies.find((c) => c.id === companyId);
    return company?.name || companyId.slice(-8);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 ${dir === "rtl" ? "rtl" : "ltr"}`} dir={dir}>
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b-2 border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className={`w-5 h-5 ${isRTL ? "rotate-180" : ""}`}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                  />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  {language === "ar" ? "إدارة التذاكر (مدير)" : "Ticket Management (Admin)"}
                </h1>
                <p className="text-sm text-gray-600 font-medium">
                  {language === "ar"
                    ? "عرض وإدارة جميع تذاكر الدعم من جميع الشركات"
                    : "View and manage all support tickets from all companies"}
                </p>
              </div>
            </div>
            {/* <div className="flex items-center gap-3">
              <LanguageToggle />
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#C4B454] to-[#B8A040] text-white px-5 py-2.5 rounded-xl hover:from-[#B8A040] hover:to-[#A69035] transition-all shadow-md hover:shadow-lg text-sm font-semibold disabled:opacity-50"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                  />
                </svg>
                {isExporting
                  ? language === "ar"
                    ? "جاري التصدير..."
                    : "Exporting..."
                  : language === "ar"
                  ? "تصدير للـ AI"
                  : "Export for AI"}
              </button>
            </div> */}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-5 hover:shadow-xl transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-[#C4B454] to-[#B8A040] rounded-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold bg-gradient-to-r from-[#C4B454] to-[#B8A040] bg-clip-text text-transparent">{stats.total}</div>
              <div className="text-sm font-semibold text-gray-600">
                {language === "ar" ? "إجمالي" : "Total"}
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-200 p-5 hover:shadow-xl transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold text-blue-600">
                {stats.by_status.open || 0}
              </div>
              <div className="text-sm font-semibold text-gray-600">
                {language === "ar" ? "مفتوحة" : "Open"}
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border-2 border-yellow-200 p-5 hover:shadow-xl transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold text-yellow-600">
                {stats.by_status.in_progress || 0}
              </div>
              <div className="text-sm font-semibold text-gray-600">
                {language === "ar" ? "قيد المعالجة" : "In Progress"}
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border-2 border-green-200 p-5 hover:shadow-xl transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold text-green-600">
                {stats.by_status.resolved || 0}
              </div>
              <div className="text-sm font-semibold text-gray-600">
                {language === "ar" ? "تم الحل" : "Resolved"}
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border-2 border-purple-200 p-5 hover:shadow-xl transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold text-purple-600">
                {stats.by_status.added_to_ai || 0}
              </div>
              <div className="text-sm font-semibold text-gray-600">
                {language === "ar" ? "أُضيف للـ AI" : "Added to AI"}
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border-2 border-orange-200 p-5 hover:shadow-xl transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <div className="text-3xl font-bold text-orange-600">
                {stats.by_priority.critical || 0}
              </div>
              <div className="text-sm font-semibold text-gray-600">
                {language === "ar" ? "حرجة" : "Critical"}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg text-black border-2 border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {/* Company Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === "ar" ? "الشركة" : "Company"}
              </label>
              <select
                value={companyFilter}
                onChange={(e) => {
                  setCompanyFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C4B454] focus:border-[#C4B454] transition-all"
              >
                <option value="">{language === "ar" ? "الكل" : "All"}</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === "ar" ? "الحالة" : "Status"}
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as TicketStatus | "");
                  setPage(1);
                }}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C4B454] focus:border-[#C4B454] transition-all"
              >
                <option value="">{language === "ar" ? "الكل" : "All"}</option>
                {Object.keys(TICKET_STATUS_LABELS).map((status) => (
                  <option key={status} value={status}>
                    {getLabel(TICKET_STATUS_LABELS, status)}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === "ar" ? "الفئة" : "Category"}
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value as TicketCategory | "");
                  setPage(1);
                }}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C4B454] focus:border-[#C4B454] transition-all"
              >
                <option value="">{language === "ar" ? "الكل" : "All"}</option>
                {Object.keys(TICKET_CATEGORY_LABELS).map((category) => (
                  <option key={category} value={category}>
                    {getLabel(TICKET_CATEGORY_LABELS, category)}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === "ar" ? "الأولوية" : "Priority"}
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value as TicketPriority | "");
                  setPage(1);
                }}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C4B454] focus:border-[#C4B454] transition-all"
              >
                <option value="">{language === "ar" ? "الكل" : "All"}</option>
                {Object.keys(TICKET_PRIORITY_LABELS).map((priority) => (
                  <option key={priority} value={priority}>
                    {getLabel(TICKET_PRIORITY_LABELS, priority)}
                  </option>
                ))}
              </select>
            </div>

            {/* User Email Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === "ar" ? "البريد" : "Email"}
              </label>
              <input
                type="text"
                value={userEmailFilter}
                onChange={(e) => {
                  setUserEmailFilter(e.target.value);
                  setPage(1);
                }}
                placeholder={language === "ar" ? "بحث..." : "Search..."}
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C4B454] focus:border-[#C4B454] transition-all"
              />
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setCompanyFilter("");
                  setStatusFilter("");
                  setCategoryFilter("");
                  setPriorityFilter("");
                  setUserEmailFilter("");
                  setPage(1);
                }}
                className="w-full px-3 py-2 text-sm font-medium bg-gradient-to-r from-[#C4B454] to-[#B8A040] text-white rounded-xl hover:from-[#B8A040] hover:to-[#A69035] transition-all shadow-sm hover:shadow-md"
              >
                {language === "ar" ? "مسح الفلاتر" : "Clear Filters"}
              </button>
            </div>
          </div>
        </div>

        {/* Tickets Table */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loading />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-12 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-12 h-12 mx-auto text-gray-400 mb-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              {language === "ar" ? "لا توجد تذاكر" : "No Tickets"}
            </h3>
            <p className="text-gray-500">
              {language === "ar"
                ? "لا توجد تذاكر تطابق معايير البحث"
                : "No tickets match the current filters"}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === "ar" ? "التذكرة" : "Ticket"}
                    </th>
                    <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === "ar" ? "الشركة" : "Company"}
                    </th>
                    <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === "ar" ? "المستخدم" : "User"}
                    </th>
                    <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === "ar" ? "الفئة" : "Category"}
                    </th>
                    <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === "ar" ? "الحالة" : "Status"}
                    </th>
                    <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === "ar" ? "الأولوية" : "Priority"}
                    </th>
                    <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === "ar" ? "التاريخ" : "Date"}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/pages/Tickets/${ticket.id}`)}
                    >
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-gray-900 line-clamp-1 max-w-xs">
                          {ticket.description}
                        </div>
                        <div className="text-xs text-gray-500">
                          #{ticket.id.slice(-8)}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {getCompanyName(ticket.company_id)}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{ticket.user_email}</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-xs text-gray-700">
                          {getLabel(TICKET_CATEGORY_LABELS, ticket.category)}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            STATUS_COLORS[ticket.status]
                          }`}
                        >
                          {getLabel(TICKET_STATUS_LABELS, ticket.status)}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            PRIORITY_COLORS[ticket.priority]
                          }`}
                        >
                          {getLabel(TICKET_PRIORITY_LABELS, ticket.priority)}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(ticket.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {language === "ar"
                    ? `عرض ${tickets.length} من ${total} تذكرة`
                    : `Showing ${tickets.length} of ${total} tickets`}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 text-sm font-medium border-2 border-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gradient-to-r hover:from-[#C4B454] hover:to-[#B8A040] hover:text-white hover:border-[#C4B454] transition-all"
                  >
                    {language === "ar" ? "السابق" : "Previous"}
                  </button>
                  <span className="text-sm font-semibold text-gray-700">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 text-sm font-medium border-2 border-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gradient-to-r hover:from-[#C4B454] hover:to-[#B8A040] hover:text-white hover:border-[#C4B454] transition-all"
                  >
                    {language === "ar" ? "التالي" : "Next"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function AdminTicketsPage() {
  return (
    <SuperAdminRoute>
      <AdminTicketsPageContent />
    </SuperAdminRoute>
  );
}
