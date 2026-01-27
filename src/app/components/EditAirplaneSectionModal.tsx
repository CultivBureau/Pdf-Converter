"use client";

import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { saveAirplaneTemplate } from "@/app/services/TemplatesApi";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import { FlightData } from './AddAirplaneModal';
import { useLanguage } from "@/app/contexts/LanguageContext";

interface EditAirplaneSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title?: string;
    showTitle?: boolean;
    noticeMessage?: string;
    showNotice?: boolean;
    direction?: "rtl" | "ltr";
    language?: "ar" | "en";
  }) => void;
  initialData: {
    title?: string;
    showTitle?: boolean;
    noticeMessage?: string;
    showNotice?: boolean;
    direction?: "rtl" | "ltr";
    language?: "ar" | "en";
    flights?: FlightData[]; // Add flights data
  } | null;
}

export default function EditAirplaneSectionModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: EditAirplaneSectionModalProps) {
  const { t, isRTL, dir } = useLanguage();
  const [title, setTitle] = useState("حجز الطيران");
  const [showTitle, setShowTitle] = useState(true);
  const [noticeMessage, setNoticeMessage] = useState("التواجد في صاله المطار قبل الاقلاع بساعتين");
  const [showNotice, setShowNotice] = useState(true);
  const [direction, setDirection] = useState<"rtl" | "ltr">("rtl");
  const [language, setLanguage] = useState<"ar" | "en">("ar");
  
  // Store flights data for template saving
  const [flights, setFlights] = useState<FlightData[]>([]);
  
  // Template-related state
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Populate form when modal opens or initialData changes
  useEffect(() => {
    if (isOpen && initialData) {
      setTitle(initialData.title || "حجز الطيران");
      setShowTitle(initialData.showTitle !== undefined ? initialData.showTitle : true);
      setNoticeMessage(initialData.noticeMessage || "التواجد في صاله المطار قبل الاقلاع بساعتين");
      setShowNotice(initialData.showNotice !== undefined ? initialData.showNotice : true);
      setDirection(initialData.direction || "rtl");
      setLanguage(initialData.language || "ar");
      setFlights(initialData.flights || []); // Store flights data
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSubmit({
      title: title.trim() || undefined,
      showTitle,
      noticeMessage: noticeMessage.trim() || undefined,
      showNotice,
      direction,
      language,
    });

    onClose();
  };

  // Save current form as template
  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast.error(language === 'ar' ? 'يرجى إدخال اسم القالب' : 'Please enter a template name');
      return;
    }

    if (isSavingTemplate) return; // Prevent double-clicking

    try {
      setIsSavingTemplate(true);
      const templateData = {
        title,
        showTitle,
        noticeMessage,
        showNotice,
        flights: flights, // Use actual flights data instead of empty array
        direction,
        language,
      };

      await saveAirplaneTemplate(templateName.trim(), templateData);
      setShowSaveTemplateModal(false);
      setTemplateName("");
      toast.success(language === 'ar' ? 'تم حفظ القالب بنجاح' : 'Template saved successfully');
    } catch (err) {
      console.error("Failed to save template:", err);
      toast.error(language === 'ar' ? 'فشل حفظ القالب' : 'Failed to save template');
    } finally {
      setIsSavingTemplate(false);
    }
  };

  // Export current form as JSON
  const handleExportJSON = () => {
    const exportData = {
      name: title || "Airplane Section",
      template_type: "airplane",
      data: {
        title,
        showTitle,
        noticeMessage,
        showNotice,
        flights: flights, // Use actual flights data
        direction,
        language,
      },
      exported_at: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `airplane-section-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import template from JSON file
  const handleImportJSON = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      if (!importData.data) {
        toast.error(language === 'ar' ? 'ملف JSON غير صالح' : 'Invalid JSON file');
        return;
      }

      // Load imported data into form
      const data = importData.data;
      if (data.title !== undefined) setTitle(data.title || "حجز الطيران");
      if (data.showTitle !== undefined) setShowTitle(data.showTitle);
      if (data.noticeMessage !== undefined) setNoticeMessage(data.noticeMessage || "");
      if (data.showNotice !== undefined) setShowNotice(data.showNotice);
      if (data.direction) setDirection(data.direction);
      if (data.language) setLanguage(data.language);
      if (data.flights && Array.isArray(data.flights)) setFlights(data.flights); // Import flights data

      toast.success(language === 'ar' ? 'تم استيراد القالب بنجاح' : 'Template imported successfully');
    } catch (err) {
      console.error("Failed to import template:", err);
      toast.error(language === 'ar' ? 'فشل استيراد القالب' : 'Failed to import template');
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
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
      dir={dir}
    >
      <div 
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in ${isRTL ? 'text-right' : 'text-left'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`bg-gradient-to-r from-[#4A5568] to-[#2D3748] px-6 py-4 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <h2 className={`text-xl font-bold text-white flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {t.modals.editAirplaneSection}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
            aria-label={t.common.close}
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
              {t.modals.sectionTitle}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5568] focus:border-transparent"
              placeholder={t.modals.flightBooking}
            />
            <div className={`mt-2 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <input
                type="checkbox"
                id="showTitle"
                checked={showTitle}
                onChange={(e) => setShowTitle(e.target.checked)}
                className="w-4 h-4 text-[#4A5568] rounded focus:ring-[#4A5568]"
              />
              <label htmlFor="showTitle" className="text-sm text-gray-700">
                {t.modals.showTitle}
              </label>
            </div>
          </div>

          {/* Language & Direction */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t.modals.language}
              </label>
              <select
                value={language}
                onChange={(e) => {
                  const newLang = e.target.value as "ar" | "en";
                  setLanguage(newLang);
                  // Auto-change direction based on language
                  setDirection(newLang === 'ar' ? 'rtl' : 'ltr');
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5568] focus:border-transparent"
              >
                <option value="ar">{t.modals.arabic}</option>
                <option value="en">{t.modals.english}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t.modals.direction}
              </label>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as "rtl" | "ltr")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5568] focus:border-transparent"
              >
                <option value="rtl">{t.modals.rtl}</option>
                <option value="ltr">{t.modals.ltr}</option>
              </select>
            </div>
          </div>

          {/* Notice Message */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t.modals.noticeMessage}
            </label>
            <textarea
              value={noticeMessage}
              onChange={(e) => setNoticeMessage(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5568] focus:border-transparent"
              rows={2}
              placeholder={t.modals.arrivalAirportNotice}
            />
            <div className={`mt-2 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <input
                type="checkbox"
                id="showNotice"
                checked={showNotice}
                onChange={(e) => setShowNotice(e.target.checked)}
                className="w-4 h-4 text-[#4A5568] rounded focus:ring-[#4A5568]"
              />
              <label htmlFor="showNotice" className="text-sm text-gray-700">
                {t.modals.showNotice}
              </label>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className={`bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <button
              type="button"
              onClick={handleExportJSON}
              className={`px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
              title={t.modals.exportJson}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {t.modals.export}
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
              title={t.modals.importJson}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              {t.modals.import}
            </button>
            <button
              type="button"
              onClick={() => setShowSaveTemplateModal(true)}
              className={`px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
              title={t.modals.saveAsTemplate}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {t.modals.saveAsTemplate}
            </button>
          </div>
          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className={`px-5 py-2 bg-gradient-to-r from-[#4A5568] to-[#2D3748] text-white rounded-lg hover:from-[#2D3748] hover:to-[#1A202C] transition-all shadow-md hover:shadow-lg font-medium flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {t.common.save}
            </button>
          </div>
        </div>
        
        {/* Hidden file input for JSON import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImportJSON}
          className="hidden"
        />
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
      
      {/* Save Template Modal */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowSaveTemplateModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 animate-scale-in" onClick={(e) => e.stopPropagation()} dir={dir}>
            <h3 className={`text-lg font-semibold text-gray-900 mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t.modals.saveAsTemplate}
            </h3>
            <div className="mb-4">
              <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t.modals.templateName}
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveTemplate();
                  }
                }}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5568] focus:border-transparent ${isRTL ? 'text-right' : 'text-left'}`}
                placeholder={t.modals.enterTemplateName}
                autoFocus
              />
            </div>
            <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <button
                onClick={() => setShowSaveTemplateModal(false)}
                disabled={isSavingTemplate}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={isSavingTemplate}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#4A5568] rounded-lg hover:bg-[#2D3748] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSavingTemplate && (
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isSavingTemplate ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : t.common.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

