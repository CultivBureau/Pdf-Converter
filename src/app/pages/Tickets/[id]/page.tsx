"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/contexts/AuthContext";
import { useLanguage } from "@/app/contexts/LanguageContext";
import LanguageToggle from "@/app/components/LanguageToggle";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import Loading from "@/app/components/Loading";
import {
  getTicket,
  addComment,
  updateTicket,
  downloadAttachment,
  type Ticket,
  type TicketStatus,
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

function TicketDetailContent() {
  const router = useRouter();
  const params = useParams();
  const ticketId = params.id as string;
  const { user, isSuperAdmin, isCompanyAdmin } = useAuth();
  const { t, isRTL, dir, language } = useLanguage();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Comment form
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Admin update form
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminStatus, setAdminStatus] = useState<TicketStatus | "">("");
  const [adminPriority, setAdminPriority] = useState<TicketPriority | "">("");
  const [adminNotes, setAdminNotes] = useState("");
  const [solutionSummary, setSolutionSummary] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Only super admin can update ticket status
  const canUpdateTicket = isSuperAdmin;

  useEffect(() => {
    loadTicket();
  }, [ticketId]);

  const loadTicket = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getTicket(ticketId);
      setTicket(data);
      
      // Initialize admin form with current values
      setAdminStatus(data.status);
      setAdminPriority(data.priority);
      setAdminNotes(data.admin_notes || "");
      setSolutionSummary(data.solution_summary || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load ticket");
    } finally {
      setIsLoading(false);
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
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setIsSubmittingComment(true);
      const updated = await addComment(ticketId, { content: newComment.trim() });
      setTicket(updated);
      setNewComment("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add comment");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleAdminUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsUpdating(true);
      const updated = await updateTicket(ticketId, {
        status: adminStatus || undefined,
        priority: adminPriority || undefined,
        admin_notes: adminNotes || undefined,
        solution_summary: solutionSummary || undefined,
      });
      setTicket(updated);
      setShowAdminPanel(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update ticket");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDownloadAttachment = async (filename: string, originalFilename: string) => {
    try {
      const blob = await downloadAttachment(ticketId, filename);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = originalFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to download attachment");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className={`min-h-screen bg-gray-50 ${dir === "rtl" ? "rtl" : "ltr"}`} dir={dir}>
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <Link
                href={isSuperAdmin ? "/pages/Tickets/admin" : "/pages/Tickets"}
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
              <h1 className="text-xl font-semibold text-gray-900">
                {language === "ar" ? "تفاصيل التذكرة" : "Ticket Details"}
              </h1>
            </div>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error || (language === "ar" ? "التذكرة غير موجودة" : "Ticket not found")}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 ${dir === "rtl" ? "rtl" : "ltr"}`} dir={dir}>
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href={isSuperAdmin ? "/pages/Tickets/admin" : "/pages/Tickets"}
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
                  {language === "ar" ? "تفاصيل التذكرة" : "Ticket Details"}
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">#{ticket.id.slice(-8)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <LanguageToggle />
              {canUpdateTicket && (
                <button
                  onClick={() => setShowAdminPanel(!showAdminPanel)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#C4B454] to-[#B8A040] text-white rounded-xl hover:from-[#B8A040] hover:to-[#A69035] transition-all shadow-md hover:shadow-lg font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  {language === "ar" ? "تحديث الحالة" : "Update Status"}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Admin Panel */}
        {canUpdateTicket && showAdminPanel && (
          <div className="bg-gradient-to-br text-black from-[#C4B454]/5 to-[#B8A040]/5 border-2 border-[#C4B454] rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-br from-[#C4B454] to-[#B8A040] rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                {language === "ar" ? "تحديث التذكرة (مدير عام)" : "Update Ticket (Super Admin)"}
              </h2>
            </div>
            <form onSubmit={handleAdminUpdate} className="space-y-5 ">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {language === "ar" ? "الحالة" : "Status"}
                  </label>
                  <select
                    value={adminStatus}
                    onChange={(e) => setAdminStatus(e.target.value as TicketStatus)}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C4B454] focus:border-[#C4B454] transition-all"
                  >
                    {Object.keys(TICKET_STATUS_LABELS).map((status) => (
                      <option key={status} value={status}>
                        {getLabel(TICKET_STATUS_LABELS, status)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {language === "ar" ? "الأولوية" : "Priority"}
                  </label>
                  <select
                    value={adminPriority}
                    onChange={(e) => setAdminPriority(e.target.value as TicketPriority)}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C4B454] focus:border-[#C4B454] transition-all"
                  >
                    {Object.keys(TICKET_PRIORITY_LABELS).map((priority) => (
                      <option key={priority} value={priority}>
                        {getLabel(TICKET_PRIORITY_LABELS, priority)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {language === "ar" ? "ملاحظات المدير" : "Admin Notes"}
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C4B454] focus:border-[#C4B454] transition-all"
                  placeholder={language === "ar" ? "ملاحظات داخلية..." : "Internal notes..."}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {language === "ar" ? "ملخص الحل" : "Solution Summary"}
                </label>
                <textarea
                  value={solutionSummary}
                  onChange={(e) => setSolutionSummary(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C4B454] focus:border-[#C4B454] transition-all"
                  placeholder={
                    language === "ar"
                      ? "كيف تم حل المشكلة؟ (للاستخدام في تحسين AI)"
                      : "How was the issue resolved? (For AI improvement)"
                  }
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdminPanel(false)}
                  className="px-6 py-2.5 border-2 border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-all"
                >
                  {language === "ar" ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-8 py-2.5 bg-gradient-to-r from-[#C4B454] to-[#B8A040] text-white rounded-xl font-medium hover:from-[#B8A040] hover:to-[#A69035] transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isUpdating && (
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  {isUpdating
                    ? language === "ar"
                      ? "جاري الحفظ..."
                      : "Saving..."
                    : language === "ar"
                    ? "حفظ التغييرات"
                    : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Ticket Info */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8">
          {/* Status & Priority Badges */}
          <div className="flex flex-wrap gap-3 mb-6">
            {isSuperAdmin && (
              <span
                className={`inline-flex px-4 py-2 text-sm font-semibold rounded-xl shadow-sm ${
                  STATUS_COLORS[ticket.status]
                }`}
              >
                {getLabel(TICKET_STATUS_LABELS, ticket.status)}
              </span>
            )}
            <span
              className={`inline-flex px-4 py-2 text-sm font-semibold rounded-xl shadow-sm ${
                PRIORITY_COLORS[ticket.priority]
              }`}
            >
              {getLabel(TICKET_PRIORITY_LABELS, ticket.priority)}
            </span>
            <span className="inline-flex px-4 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 shadow-sm">
              {getLabel(TICKET_CATEGORY_LABELS, ticket.category)}
              {ticket.other_category_text && `: ${ticket.other_category_text}`}
            </span>
          </div>

          {/* Description */}
          <div className="mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                {language === "ar" ? "وصف المشكلة" : "Problem Description"}
              </h3>
            </div>
            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
          </div>

          {/* Meta Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                {language === "ar" ? "تم الإنشاء" : "Created"}
              </p>
              <p className="font-semibold text-gray-900">{formatDate(ticket.created_at)}</p>
            </div>
            {/* <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                {language === "ar" ? "آخر تحديث" : "Updated"}
              </p>
              <p className="font-semibold text-gray-900">{formatDate(ticket.updated_at)}</p>
            </div> */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
              <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                {language === "ar" ? "المستخدم" : "User"}
              </p>
              <p className="font-semibold text-gray-900 break-all">{ticket.user_email}</p>
            </div>
            {ticket.resolved_at && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                <p className="text-xs font-semibold text-green-600 mb-2 uppercase tracking-wide">
                  {language === "ar" ? "تم الحل" : "Resolved"}
                </p>
                <p className="font-semibold text-gray-900">{formatDate(ticket.resolved_at)}</p>
              </div>
            )}
          </div>

          {/* Solution Summary (if exists) */}
          {ticket.solution_summary && (
            <div className="mt-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                  {language === "ar" ? "ملخص الحل" : "Solution Summary"}
                </h3>
              </div>
              <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{ticket.solution_summary}</p>
            </div>
          )}

          {/* Admin Notes (if exists) */}
          {ticket.admin_notes && (
            <div className="mt-6 bg-gradient-to-br from-[#C4B454]/10 to-[#B8A040]/10 rounded-xl p-6 border-2 border-[#C4B454]">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-[#B8A040]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                  {language === "ar" ? "ملاحظات المدير" : "Admin Notes"}
                </h3>
              </div>
              <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{ticket.admin_notes}</p>
            </div>
          )}
        </div>

        {/* Attachments */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              {language === "ar" ? "الملفات المرفقة" : "Attachments"}
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ticket.attachments.map((att, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-5 border-2 border-gray-200 rounded-xl hover:border-[#C4B454] hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-4">
                  {att.file_type === "screenshot" ? (
                    <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg group-hover:from-blue-200 group-hover:to-indigo-200 transition-all">
                      <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  ) : (
                    <div className="p-3 bg-gradient-to-br from-red-100 to-pink-100 rounded-lg group-hover:from-red-200 group-hover:to-pink-200 transition-all">
                      <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
                      {att.file_type === "input_pdf"
                        ? language === "ar"
                          ? "PDF الأصلي"
                          : "Input PDF"
                        : att.file_type === "output_pdf"
                        ? language === "ar"
                          ? "PDF الناتج"
                          : "Output PDF"
                        : language === "ar"
                        ? "لقطة شاشة"
                        : "Screenshot"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {att.original_filename} • {(att.size_bytes / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDownloadAttachment(att.filename, att.original_filename)}
                  className="p-2.5 bg-gradient-to-r from-[#C4B454] to-[#B8A040] text-white hover:from-[#B8A040] hover:to-[#A69035] rounded-lg transition-all shadow-sm hover:shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Comments */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              {language === "ar" ? "التعليقات" : "Comments"} ({ticket.comments.length})
            </h3>
          </div>

          {/* Comments List */}
          {ticket.comments.length > 0 ? (
            <div className="space-y-4 mb-6">
              {ticket.comments.map((comment) => (
                <div
                  key={comment.id}
                  className={`p-5 rounded-xl border-2 ${
                    comment.user_role === "superadmin" || comment.user_role === "company_admin"
                      ? "bg-gradient-to-br from-[#C4B454]/10 to-[#B8A040]/10 border-[#C4B454]"
                      : "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">
                        {comment.user_email}
                      </span>
                      {(comment.user_role === "superadmin" || comment.user_role === "company_admin") && (
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-gradient-to-r from-[#C4B454] to-[#B8A040] text-white shadow-sm">
                          {language === "ar" ? "مدير" : "Admin"}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 font-medium">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 mb-6">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-gray-500 font-medium">
                {language === "ar" ? "لا توجد تعليقات بعد" : "No comments yet"}
              </p>
            </div>
          )}

          {/* Add Comment Form */}
          <form onSubmit={handleAddComment} className="border-t-2 text-black border-gray-200 pt-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {language === "ar" ? "أضف تعليقك" : "Add Your Comment"}
            </label>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={
                language === "ar"
                  ? "اكتب تعليقك هنا..."
                  : "Write your comment here..."
              }
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C4B454] focus:border-[#C4B454] resize-none transition-all"
            />
            <div className="flex justify-end mt-4">
              <button
                type="submit"
                disabled={!newComment.trim() || isSubmittingComment}
                className="px-8 py-2.5 bg-gradient-to-r from-[#C4B454] to-[#B8A040] text-white rounded-xl font-medium hover:from-[#B8A040] hover:to-[#A69035] transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmittingComment && (
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {language === "ar" ? "إضافة تعليق" : "Add Comment"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function TicketDetailPage() {
  return (
    <ProtectedRoute>
      <TicketDetailContent />
    </ProtectedRoute>
  );
}
