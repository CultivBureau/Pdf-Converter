"use client";

import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { saveHotelTemplate } from "@/app/services/TemplatesApi";

interface EditHotelSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title?: string;
    showTitle?: boolean;
    direction?: "rtl" | "ltr";
    language?: "ar" | "en";
  }) => void;
  initialData: {
    title?: string;
    showTitle?: boolean;
    direction?: "rtl" | "ltr";
    language?: "ar" | "en";
    hotels?: any[]; // Add hotels to initialData
  } | null;
}

export default function EditHotelSectionModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: EditHotelSectionModalProps) {
  const [title, setTitle] = useState("حجز الفنادق");
  const [showTitle, setShowTitle] = useState(true);
  const [direction, setDirection] = useState<"rtl" | "ltr">("rtl");
  const [language, setLanguage] = useState<"ar" | "en">("ar");
  
  // Template-related state
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Populate form when modal opens or initialData changes
  useEffect(() => {
    if (isOpen && initialData) {
      setTitle(initialData.title || "حجز الفنادق");
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

  // Save current section settings as template
  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast.error(language === 'ar' ? 'يرجى إدخال اسم القالب' : 'Please enter a template name');
      return;
    }

    try {
      const templateData = {
        title: title.trim() || undefined,
        showTitle,
        hotels: initialData?.hotels || [], // Use hotels from initialData if available
        direction,
        language,
        labels: undefined,
      };

      await saveHotelTemplate(templateName.trim(), templateData);
      setShowSaveTemplateModal(false);
      setTemplateName("");
      toast.success(language === 'ar' ? 'تم حفظ القالب بنجاح' : 'Template saved successfully');
    } catch (err) {
      console.error("Failed to save template:", err);
      toast.error(language === 'ar' ? 'فشل حفظ القالب' : 'Failed to save template');
    }
  };

  // Export current section settings as JSON
  const handleExportJSON = () => {
    const exportData = {
      name: title || "Hotel Section",
      template_type: "hotel",
      data: {
        title: title.trim() || undefined,
        showTitle,
        hotels: initialData?.hotels || [], // Use hotels from initialData if available
        direction,
        language,
        labels: undefined,
      },
      exported_at: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hotel-section-template-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import section settings from JSON file
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
      if (data.title !== undefined) setTitle(data.title || "حجز الفنادق");
      if (data.showTitle !== undefined) setShowTitle(data.showTitle);
      if (data.direction) setDirection(data.direction);
      if (data.language) setLanguage(data.language);
      
      // Note: Hotels data is imported but we can't update the structure from here
      // The user would need to manually add hotels or we'd need to pass a callback
      // For now, we just update the section settings
      if (data.hotels && data.hotels.length > 0) {
        toast(language === 'ar' 
          ? 'تم استيراد إعدادات القسم. ملاحظة: يجب إضافة الفنادق يدوياً أو استخدام قالب كامل.' 
          : 'Section settings imported. Note: Hotels need to be added manually or use a full template.', {
          duration: 6000,
          icon: 'ℹ️'
        });
      } else {
        toast.success(language === 'ar' ? 'تم استيراد القالب بنجاح' : 'Template imported successfully');
      }
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
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#3B5998] to-[#2E4A7A] px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Hotel Section
          </h2>
          <div className="flex items-center gap-3">
            {/* Save, Export, Import buttons */}
            <button
              type="button"
              onClick={handleExportJSON}
              className="flex flex-col items-center gap-1 p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors group"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-xs font-medium">{language === 'ar' ? 'تصدير' : 'Export'}</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-1 p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors group"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-xs font-medium">{language === 'ar' ? 'استيراد' : 'Import'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowSaveTemplateModal(true)}
              className="flex flex-col items-center gap-1 p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors group"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-xs font-medium">{language === 'ar' ? 'حفظ' : 'Save'}</span>
            </button>
            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
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

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Section Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B5998] focus:border-transparent"
              placeholder="Hotel Booking"
            />
            <div className="mt-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="showTitle"
                checked={showTitle}
                onChange={(e) => setShowTitle(e.target.checked)}
                className="w-4 h-4 text-[#3B5998] rounded focus:ring-[#3B5998]"
              />
              <label htmlFor="showTitle" className="text-sm text-gray-700">
                Show Title
              </label>
            </div>
          </div>

          {/* Language & Direction */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => {
                  const newLang = e.target.value as "ar" | "en";
                  setLanguage(newLang);
                  // Auto-change direction based on language
                  setDirection(newLang === 'ar' ? 'rtl' : 'ltr');
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B5998] focus:border-transparent"
              >
                <option value="ar">Arabic</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Direction
              </label>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as "rtl" | "ltr")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B5998] focus:border-transparent"
              >
                <option value="rtl">Right to Left (RTL)</option>
                <option value="ltr">Left to Right (LTR)</option>
              </select>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-5 py-2 bg-gradient-to-r from-[#3B5998] to-[#2E4A7A] text-white rounded-lg hover:from-[#2E4A7A] hover:to-[#1E3A5A] transition-all shadow-md hover:shadow-lg font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Save Changes
          </button>
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

      {/* Save Template Modal */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowSaveTemplateModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {language === 'ar' ? 'حفظ كقالب' : 'Save as Template'}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {language === 'ar' ? 'اسم القالب' : 'Template Name'}
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B5998] focus:border-transparent"
                placeholder={language === 'ar' ? 'أدخل اسم القالب' : 'Enter template name'}
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSaveTemplateModal(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleSaveTemplate}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#3B5998] rounded-lg hover:bg-[#2E4A7A] transition-colors"
              >
                {language === 'ar' ? 'حفظ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

