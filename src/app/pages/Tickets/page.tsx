"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/contexts/AuthContext";
import { useLanguage } from "@/app/contexts/LanguageContext";
import LanguageToggle from "@/app/components/LanguageToggle";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import Loading from "@/app/components/Loading";
import {
  listTickets,
  getTicketStats,
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

function TicketsPageContent() {
  const router = useRouter();
  const { user, isSuperAdmin, isCompanyAdmin } = useAuth();
  const { t, isRTL, dir, language } = useLanguage();

  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
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

  // Load tickets
  useEffect(() => {
    loadTickets();
  }, [page, statusFilter, categoryFilter, priorityFilter]);

  // Load stats on mount
  useEffect(() => {
    loadStats();
  }, []);

  const loadTickets = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response: TicketListResponse = await listTickets({
        page,
        page_size: 10,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        priority: priorityFilter || undefined,
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

  const loadStats = async () => {
    try {
      const statsData = await getTicketStats();
      setStats(statsData);
    } catch (err) {
      console.error("Failed to load stats:", err);
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
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 ${dir === "rtl" ? "rtl" : "ltr"}`} dir={dir}>
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-all"
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
                  {language === "ar" ? "تذاكر الدعم" : "Support Tickets"}
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {language === "ar"
                    ? "الإبلاغ عن مشاكل ومتابعة حالتها"
                    : "Report issues and track their status"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <LanguageToggle />
              <Link
                href="/pages/Tickets/new"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#C4B454] to-[#B8A040] text-white px-5 py-2.5 rounded-xl hover:from-[#B8A040] hover:to-[#A69035] transition-all shadow-md hover:shadow-lg font-medium"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
                {language === "ar" ? "تذكرة جديدة" : "New Ticket"}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="group bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#C4B454] to-[#B8A040]"></div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-[#C4B454]/10 to-[#B8A040]/10 rounded-lg">
                  <svg className="w-5 h-5 text-[#B8A040]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-[#C4B454] to-[#B8A040] bg-clip-text text-transparent">{stats.total}</div>
              </div>
              <div className="text-sm font-medium text-gray-600">
                {language === "ar" ? "إجمالي التذاكر" : "Total Tickets"}
              </div>
            </div>
            <div className="group bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-blue-600"></div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-blue-600">
                  {stats.by_status.open || 0}
                </div>
              </div>
              <div className="text-sm font-medium text-gray-600">
                {language === "ar" ? "مفتوحة" : "Open"}
              </div>
            </div>
            <div className="group bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-orange-500"></div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-yellow-50 rounded-lg">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-yellow-600">
                  {stats.by_status.in_progress || 0}
                </div>
              </div>
              <div className="text-sm font-medium text-gray-600">
                {language === "ar" ? "قيد المعالجة" : "In Progress"}
              </div>
            </div>
            <div className="group bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-green-600"></div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-50 rounded-lg">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-green-600">
                  {stats.by_status.resolved || 0}
                </div>
              </div>
              <div className="text-sm font-medium text-gray-600">
                {language === "ar" ? "تم الحل" : "Resolved"}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg text-black border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-[#B8A040]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900">
              {language === "ar" ? "تصفية النتائج" : "Filter Results"}
            </h3>
          </div>
          <div className="flex flex-wrap gap-4">
            {/* Status Filter - Only for Super Admin */}
            {isSuperAdmin && (
              <div className="flex-1 min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === "ar" ? "الحالة" : "Status"}
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as TicketStatus | "");
                    setPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{language === "ar" ? "الكل" : "All"}</option>
                  {Object.keys(TICKET_STATUS_LABELS).map((status) => (
                    <option key={status} value={status}>
                      {getLabel(TICKET_STATUS_LABELS, status)}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {/* Category Filter */}
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === "ar" ? "الفئة" : "Category"}
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value as TicketCategory | "");
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === "ar" ? "الأولوية" : "Priority"}
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value as TicketPriority | "");
                  setPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{language === "ar" ? "الكل" : "All"}</option>
                {Object.keys(TICKET_PRIORITY_LABELS).map((priority) => (
                  <option key={priority} value={priority}>
                    {getLabel(TICKET_PRIORITY_LABELS, priority)}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            {(statusFilter || categoryFilter || priorityFilter) && (
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setStatusFilter("");
                    setCategoryFilter("");
                    setPriorityFilter("");
                    setPage(1);
                  }}
                  className="px-4 py-2 text-sm font-medium text-[#B8A040] hover:text-[#A69035] border border-[#C4B454] rounded-lg hover:bg-[#C4B454]/5 transition-all"
                >
                  {language === "ar" ? "مسح الفلاتر" : "Clear Filters"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tickets List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loading />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-16 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-[#C4B454]/10 to-[#B8A040]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-10 h-10 text-[#B8A040]"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {language === "ar" ? "لا توجد تذاكر" : "No Tickets"}
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {language === "ar"
                ? "لم يتم العثور على أي تذاكر. أنشئ تذكرة جديدة للإبلاغ عن مشكلة."
                : "No tickets found. Create a new ticket to report an issue."}
            </p>
            <Link
              href="/pages/Tickets/new"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#C4B454] to-[#B8A040] text-white px-6 py-3 rounded-xl hover:from-[#B8A040] hover:to-[#A69035] transition-all shadow-lg hover:shadow-xl font-medium"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              {language === "ar" ? "تذكرة جديدة" : "New Ticket"}
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === "ar" ? "التذكرة" : "Ticket"}
                    </th>
                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === "ar" ? "الفئة" : "Category"}
                    </th>
                    {isSuperAdmin && (
                      <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {language === "ar" ? "الحالة" : "Status"}
                      </th>
                    )}
                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === "ar" ? "الأولوية" : "Priority"}
                    </th>
                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === "ar" ? "التاريخ" : "Date"}
                    </th>
                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {language === "ar" ? "التعليقات" : "Comments"}
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
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 line-clamp-2">
                          {ticket.description}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          #{ticket.id.slice(-8)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {getLabel(TICKET_CATEGORY_LABELS, ticket.category)}
                        </span>
                      </td>
                      {isSuperAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              STATUS_COLORS[ticket.status]
                            }`}
                          >
                            {getLabel(TICKET_STATUS_LABELS, ticket.status)}
                          </span>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            PRIORITY_COLORS[ticket.priority]
                          }`}
                        >
                          {getLabel(TICKET_PRIORITY_LABELS, ticket.priority)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(ticket.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-4 h-4"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
                            />
                          </svg>
                          {ticket.comments_count}
                        </div>
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
                    className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#C4B454] hover:bg-[#C4B454]/5 transition-all"
                  >
                    {language === "ar" ? "السابق" : "Previous"}
                  </button>
                  <span className="text-sm font-semibold text-gray-900 px-4 py-2 bg-gradient-to-r from-[#C4B454]/10 to-[#B8A040]/10 rounded-lg">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#C4B454] hover:bg-[#C4B454]/5 transition-all"
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

export default function TicketsPage() {
  return (
    <ProtectedRoute>
      <TicketsPageContent />
    </ProtectedRoute>
  );
}
