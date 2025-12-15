"use client";

import React, { useState, useEffect } from "react";
import type { TransportTable } from '../types/TransportTypes';

interface EditTransportSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title?: string;
    showTitle?: boolean;
    direction?: "rtl" | "ltr";
    language?: "ar" | "en";
  }) => void;
  onDelete?: () => void;
  initialData: {
    title?: string;
    showTitle?: boolean;
    direction?: "rtl" | "ltr";
    language?: "ar" | "en";
    tables?: TransportTable[];
  } | null;
}

export default function EditTransportSectionModal({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  initialData,
}: EditTransportSectionModalProps) {
  const [title, setTitle] = useState("المواصلات");
  const [showTitle, setShowTitle] = useState(true);
  const [direction, setDirection] = useState<"rtl" | "ltr">("rtl");
  const [language, setLanguage] = useState<"ar" | "en">("ar");

  // Populate form when modal opens or initialData changes
  useEffect(() => {
    if (isOpen && initialData) {
      setTitle(initialData.title || "المواصلات");
      setShowTitle(initialData.showTitle !== undefined ? initialData.showTitle : true);
      setDirection(initialData.direction || "rtl");
      setLanguage(initialData.language || "ar");
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSubmit({
      title: title.trim() || undefined,
      showTitle,
      direction,
      language,
    });

    onClose();
  };

  const handleDelete = () => {
    if (onDelete) {
      if (window.confirm(language === 'ar' ? 'هل أنت متأكد من حذف هذا القسم؟' : 'Are you sure you want to delete this section?')) {
        onDelete();
        onClose();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-lg"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1E40AF] px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {language === 'ar' ? 'تعديل قسم المواصلات' : 'Edit Transport Section'}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {language === 'ar' ? 'عنوان القسم' : 'Section Title'}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent"
              placeholder={language === 'ar' ? 'المواصلات' : 'Transportation'}
            />
            <div className="mt-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="showTitle"
                checked={showTitle}
                onChange={(e) => setShowTitle(e.target.checked)}
                className="w-4 h-4 text-[#1E3A8A] rounded focus:ring-[#1E3A8A]"
              />
              <label htmlFor="showTitle" className="text-sm text-gray-700">
                {language === 'ar' ? 'إظهار العنوان' : 'Show Title'}
              </label>
            </div>
          </div>

          {/* Language & Direction */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {language === 'ar' ? 'اللغة' : 'Language'}
              </label>
              <select
                value={language}
                onChange={(e) => {
                  const newLang = e.target.value as "ar" | "en";
                  setLanguage(newLang);
                  setDirection(newLang === 'ar' ? 'rtl' : 'ltr');
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent"
              >
                <option value="ar">{language === 'ar' ? 'العربية' : 'Arabic'}</option>
                <option value="en">{language === 'ar' ? 'الإنجليزية' : 'English'}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {language === 'ar' ? 'الاتجاه' : 'Direction'}
              </label>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as "rtl" | "ltr")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent"
              >
                <option value="rtl">{language === 'ar' ? 'من اليمين لليسار' : 'Right to Left (RTL)'}</option>
                <option value="ltr">{language === 'ar' ? 'من اليسار لليمين' : 'Left to Right (LTR)'}</option>
              </select>
            </div>
          </div>

          {/* Info about tables */}
          {initialData?.tables && initialData.tables.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                {language === 'ar' 
                  ? `يحتوي هذا القسم على ${initialData.tables.length} جدول. استخدم أزرار التعديل في الجداول لتعديلها.`
                  : `This section contains ${initialData.tables.length} table(s). Use the edit buttons in the tables to modify them.`}
              </p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
          <div>
            {onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {language === 'ar' ? 'حذف القسم' : 'Delete Section'}
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="px-5 py-2 bg-gradient-to-r from-[#1E3A8A] to-[#1E40AF] text-white rounded-lg hover:from-[#1E40AF] hover:to-[#1E3A8A] transition-all shadow-md hover:shadow-lg font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {language === 'ar' ? 'حفظ' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}

