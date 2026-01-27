"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/contexts/AuthContext";
import { useLanguage } from "@/app/contexts/LanguageContext";
import LanguageToggle from "@/app/components/LanguageToggle";
import ProtectedRoute from "@/app/components/ProtectedRoute";
import Loading from "@/app/components/Loading";
import {
  createTicket,
  type TicketCategory,
  type TicketPriority,
  TICKET_CATEGORY_LABELS,
  TICKET_PRIORITY_LABELS,
} from "@/app/services/TicketsApi";

function NewTicketPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { t, isRTL, dir, language } = useLanguage();

  // Form state
  const [category, setCategory] = useState<TicketCategory | "">("");
  const [priority, setPriority] = useState<TicketPriority | "">("");
  const [otherCategoryText, setOtherCategoryText] = useState("");
  const [description, setDescription] = useState("");
  const [inputPdf, setInputPdf] = useState<File | null>(null);
  const [outputPdf, setOutputPdf] = useState<File | null>(null);
  const [screenshots, setScreenshots] = useState<File[]>([]);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for file inputs
  const inputPdfRef = useRef<HTMLInputElement>(null);
  const outputPdfRef = useRef<HTMLInputElement>(null);
  const screenshotsRef = useRef<HTMLInputElement>(null);

  const getLabel = (
    labels: Record<string, { en: string; ar: string }>,
    key: string
  ): string => {
    const label = labels[key];
    return label ? (language === "ar" ? label.ar : label.en) : key;
  };

  const handleInputPdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        setError(language === "ar" ? "يجب أن يكون الملف PDF" : "File must be a PDF");
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        setError(language === "ar" ? "حجم الملف يتجاوز 15MB" : "File size exceeds 15MB");
        return;
      }
      setInputPdf(file);
      setError(null);
    }
  };

  const handleOutputPdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        setError(language === "ar" ? "يجب أن يكون الملف PDF" : "File must be a PDF");
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        setError(language === "ar" ? "حجم الملف يتجاوز 15MB" : "File size exceeds 15MB");
        return;
      }
      setOutputPdf(file);
      setError(null);
    }
  };

  const handleScreenshotsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles: File[] = [];
    
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        setError(language === "ar" ? "يجب أن تكون الملفات صور" : "Files must be images");
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        setError(language === "ar" ? "حجم الملف يتجاوز 15MB" : "File size exceeds 15MB");
        return;
      }
      validFiles.push(file);
    }
    
    setScreenshots((prev) => [...prev, ...validFiles]);
    setError(null);
  };

  const removeScreenshot = (index: number) => {
    setScreenshots((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!category) {
      setError(language === "ar" ? "الرجاء اختيار فئة المشكلة" : "Please select a category");
      return;
    }
    if (!priority) {
      setError(language === "ar" ? "الرجاء اختيار أولوية التذكرة" : "Please select a priority");
      return;
    }
    if (category === "other" && !otherCategoryText.trim()) {
      setError(language === "ar" ? "الرجاء تحديد نوع المشكلة" : "Please specify the problem type");
      return;
    }
    if (description.trim().length < 10) {
      setError(
        language === "ar"
          ? "الرجاء كتابة وصف تفصيلي للمشكلة (10 أحرف على الأقل)"
          : "Please provide a detailed description (at least 10 characters)"
      );
      return;
    }
    if (!inputPdf) {
      setError(
        language === "ar"
          ? "الرجاء رفع ملف PDF الأصلي (المدخل)"
          : "Please upload the original input PDF"
      );
      return;
    }
    if (!outputPdf) {
      setError(
        language === "ar"
          ? "الرجاء رفع ملف PDF الناتج (المخرج)"
          : "Please upload the output PDF"
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await createTicket({
        category: category as TicketCategory,
        priority: priority as TicketPriority,
        description: description.trim(),
        other_category_text: category === "other" ? otherCategoryText.trim() : undefined,
        input_pdf: inputPdf,
        output_pdf: outputPdf,
        screenshots: screenshots.length > 0 ? screenshots : undefined,
      });

      // Success - redirect to tickets list
      router.push("/pages/Tickets");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br text-black from-blue-50 via-indigo-50 to-purple-50 ${dir === "rtl" ? "rtl" : "ltr"}`} dir={dir}>
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/pages/Tickets"
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
                  {language === "ar" ? "تذكرة دعم جديدة" : "New Support Ticket"}
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {language === "ar"
                    ? "أبلغ عن مشكلة واجهتك أثناء استخدام النظام"
                    : "Report an issue you encountered while using the system"}
                </p>
              </div>
            </div>
            <LanguageToggle />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-4 flex items-start gap-3 shadow-md">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Category Selection */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 bg-gradient-to-br from-[#C4B454]/10 to-[#B8A040]/10 rounded-lg">
                <svg className="w-5 h-5 text-[#B8A040]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                {language === "ar" ? "نوع المشكلة" : "Problem Type"}
              </h2>
              <span className="text-red-500 text-lg">*</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(TICKET_CATEGORY_LABELS).map(([key, labels]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategory(key as TicketCategory)}
                  className={`p-3 text-sm font-medium rounded-xl border-2 transition-all ${
                    category === key
                      ? "border-[#C4B454] bg-gradient-to-br from-[#C4B454]/10 to-[#B8A040]/10 text-[#B8A040] shadow-md"
                      : "border-gray-200 hover:border-[#C4B454]/50 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {language === "ar" ? labels.ar : labels.en}
                </button>
              ))}
            </div>

            {/* Other Category Text */}
            {category === "other" && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === "ar" ? "حدد نوع المشكلة" : "Specify problem type"} *
                </label>
                <input
                  type="text"
                  value={otherCategoryText}
                  onChange={(e) => setOtherCategoryText(e.target.value)}
                  placeholder={language === "ar" ? "اكتب نوع المشكلة..." : "Enter problem type..."}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {/* Priority Selection */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 bg-gradient-to-br from-[#C4B454]/10 to-[#B8A040]/10 rounded-lg">
                <svg className="w-5 h-5 text-[#B8A040]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                {language === "ar" ? "الأولوية" : "Priority"}
              </h2>
              <span className="text-red-500 text-lg">*</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(TICKET_PRIORITY_LABELS).map(([key, labels]) => {
                const priorityColors = {
                  low: "border-gray-300 hover:border-gray-400 data-[selected=true]:border-gray-500 data-[selected=true]:bg-gray-50 data-[selected=true]:text-gray-700",
                  medium: "border-blue-300 hover:border-blue-400 data-[selected=true]:border-blue-500 data-[selected=true]:bg-blue-50 data-[selected=true]:text-blue-700",
                  high: "border-orange-300 hover:border-orange-400 data-[selected=true]:border-orange-500 data-[selected=true]:bg-orange-50 data-[selected=true]:text-orange-700",
                  critical: "border-red-300 hover:border-red-400 data-[selected=true]:border-red-500 data-[selected=true]:bg-red-50 data-[selected=true]:text-red-700"
                };
                
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPriority(key as TicketPriority)}
                    data-selected={priority === key}
                    className={`p-3 text-sm font-medium rounded-xl border-2 transition-all ${priorityColors[key as keyof typeof priorityColors] || "border-gray-200"} ${
                      priority !== key ? "text-gray-700" : ""
                    }`}
                  >
                    {language === "ar" ? labels.ar : labels.en}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl shadow-lg border text-black border-gray-200 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-gradient-to-br from-[#C4B454]/10 to-[#B8A040]/10 rounded-lg">
                <svg className="w-5 h-5 text-[#B8A040]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                {language === "ar" ? "وصف المشكلة" : "Problem Description"}
              </h2>
              <span className="text-red-500 text-lg">*</span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                language === "ar"
                  ? "اشرح المشكلة بالتفصيل... ما الذي حدث؟ ما الذي توقعته؟ كيف يمكننا إعادة إنتاج المشكلة؟"
                  : "Describe the issue in detail... What happened? What did you expect? How can we reproduce the problem?"
              }
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="mt-2 text-xs text-gray-500">
              {description.length}/5000{" "}
              {language === "ar" ? "حرف" : "characters"}
            </div>
          </div>

          {/* File Uploads */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-gradient-to-br from-[#C4B454]/10 to-[#B8A040]/10 rounded-lg">
                <svg className="w-5 h-5 text-[#B8A040]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                {language === "ar" ? "الملفات المرفقة" : "Attachments"}
              </h2>
            </div>

            {/* Input PDF */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === "ar" ? "ملف PDF الأصلي (المدخل)" : "Original Input PDF"} *
              </label>
              <div
                onClick={() => inputPdfRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  inputPdf
                    ? "border-green-300 bg-green-50"
                    : "border-gray-300 hover:border-blue-400"
                }`}
              >
                {inputPdf ? (
                  <div className="flex items-center justify-center gap-2 text-green-700">
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
                        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="font-medium">{inputPdf.name}</span>
                    <span className="text-sm">
                      ({(inputPdf.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                ) : (
                  <div className="text-gray-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-8 h-8 mx-auto mb-2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                      />
                    </svg>
                    <p>
                      {language === "ar"
                        ? "انقر لرفع ملف PDF الأصلي الذي قمت برفعه"
                        : "Click to upload the original PDF you uploaded"}
                    </p>
                    <p className="text-xs mt-1">
                      {language === "ar" ? "الحد الأقصى: 15MB" : "Max: 15MB"}
                    </p>
                  </div>
                )}
              </div>
              <input
                ref={inputPdfRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleInputPdfChange}
                className="hidden"
              />
            </div>

            {/* Output PDF */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === "ar" ? "ملف PDF الناتج (المخرج)" : "Output PDF"} *
              </label>
              <div
                onClick={() => outputPdfRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  outputPdf
                    ? "border-green-300 bg-green-50"
                    : "border-gray-300 hover:border-blue-400"
                }`}
              >
                {outputPdf ? (
                  <div className="flex items-center justify-center gap-2 text-green-700">
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
                        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="font-medium">{outputPdf.name}</span>
                    <span className="text-sm">
                      ({(outputPdf.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                ) : (
                  <div className="text-gray-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-8 h-8 mx-auto mb-2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                      />
                    </svg>
                    <p>
                      {language === "ar"
                        ? "انقر لرفع ملف PDF الناتج من النظام"
                        : "Click to upload the PDF generated by the system"}
                    </p>
                    <p className="text-xs mt-1">
                      {language === "ar" ? "الحد الأقصى: 15MB" : "Max: 15MB"}
                    </p>
                  </div>
                )}
              </div>
              <input
                ref={outputPdfRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleOutputPdfChange}
                className="hidden"
              />
            </div>

            {/* Screenshots (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === "ar" ? "لقطات شاشة (اختياري)" : "Screenshots (Optional)"}
              </label>
              <div
                onClick={() => screenshotsRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-8 h-8 mx-auto mb-2 text-gray-400"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                  />
                </svg>
                <p className="text-gray-500">
                  {language === "ar"
                    ? "انقر لرفع صور توضيحية للمشكلة"
                    : "Click to upload screenshots illustrating the issue"}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  PNG, JPG, GIF, WebP - {language === "ar" ? "الحد الأقصى: 15MB لكل صورة" : "Max: 15MB per image"}
                </p>
              </div>
              <input
                ref={screenshotsRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleScreenshotsChange}
                className="hidden"
              />

              {/* Screenshots Preview */}
              {screenshots.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {screenshots.map((file, index) => (
                    <div
                      key={index}
                      className="relative group rounded-lg overflow-hidden border border-gray-200"
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Screenshot ${index + 1}`}
                        className="w-full h-24 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeScreenshot(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
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
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                        {file.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-3">
            <Link
              href="/pages/Tickets"
              className="px-6 py-2.5 border-2 border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-all"
            >
              {language === "ar" ? "إلغاء" : "Cancel"}
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-2.5 bg-gradient-to-r from-[#C4B454] to-[#B8A040] text-white rounded-xl font-medium hover:from-[#B8A040] hover:to-[#A69035] transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting && (
                <svg
                  className="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              )}
              {language === "ar" ? "إرسال التذكرة" : "Submit Ticket"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default function NewTicketPage() {
  return (
    <ProtectedRoute>
      <NewTicketPageContent />
    </ProtectedRoute>
  );
}
