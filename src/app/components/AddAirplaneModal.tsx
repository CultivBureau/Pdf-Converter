"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { getCompanySettings, getAirlineCompanies, addAirlineCompanyUser } from "@/app/services/CompanySettingsApi";
import {
  getAirplaneTemplates,
  saveAirplaneTemplate,
  deleteAirplaneTemplate,
  importAirplaneTemplate,
  Template,
} from "@/app/services/TemplatesApi";
import AddAirlineCompanyModal from "./AddAirlineCompanyModal";
import DeleteConfirmationModal from "./DeleteConfirmationModal";

export interface FlightData {
  date: string;
  time?: string;
  airlineCompany?: string;
  airlineCompanyLink?: string;
  fromAirport: string;
  fromAirportLink?: string;
  toAirport: string;
  toAirportLink?: string;
  travelers: {
    adults: number;
    children: number;
    infants: number;
  };
  luggage: string;
}

interface AddAirplaneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title?: string;
    showTitle?: boolean;
    noticeMessage?: string;
    showNotice?: boolean;
    flights: FlightData[];
    direction?: "rtl" | "ltr";
    language?: "ar" | "en";
  }) => void;
}

export default function AddAirplaneModal({
  isOpen,
  onClose,
  onSubmit,
}: AddAirplaneModalProps) {
  const [title, setTitle] = useState("حجز الطيران");
  const [showTitle, setShowTitle] = useState(true);
  const [noticeMessage, setNoticeMessage] = useState("التواجد في صاله المطار قبل الاقلاع بساعتين");
  const [showNotice, setShowNotice] = useState(true);
  const [direction, setDirection] = useState<"rtl" | "ltr">("rtl");
  const [language, setLanguage] = useState<"ar" | "en">("ar");
  const { user, isCompanyAdmin } = useAuth();
  const [airlineCompanies, setAirlineCompanies] = useState<string[]>([]);
  const [showAddAirlineModal, setShowAddAirlineModal] = useState(false);
  const [flights, setFlights] = useState<FlightData[]>([
    {
      date: new Date().toISOString().split('T')[0],
      time: "",
      airlineCompany: "",
      airlineCompanyLink: "",
      fromAirport: "",
      fromAirportLink: "",
      toAirport: "",
      toAirportLink: "",
      travelers: { adults: 1, children: 0, infants: 0 },
      luggage: "20 كيلو"
    }
  ]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  // Template-related state
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [showTemplateSelection, setShowTemplateSelection] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [showDeleteTemplateModal, setShowDeleteTemplateModal] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch airline companies from company settings
  const fetchAirlineCompanies = async () => {
    try {
      // Use the new endpoint that works for all users
      const result = await getAirlineCompanies();
      setAirlineCompanies(result.airline_companies || []);
    } catch (err) {
      console.error("Failed to fetch airline companies:", err);
      setAirlineCompanies([]);
    }
  };

  // Fetch templates when modal opens
  const fetchTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const result = await getAirplaneTemplates();
      setTemplates(result.templates || []);
      // Always show template selection UI (including empty state)
      setShowTemplateSelection(true);
    } catch (err) {
      console.error("Failed to fetch templates:", err);
      setTemplates([]);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAirlineCompanies();
      fetchTemplates();
    }
  }, [isOpen]);

  // Handle adding new airline company (for users only)
  const handleAddAirlineCompany = async (companyName: string) => {
    try {
      const result = await addAirlineCompanyUser(companyName);
      if (result && result.airline_companies) {
        setAirlineCompanies(result.airline_companies);
        // Auto-select the newly added company in the first flight
        if (flights.length > 0) {
          updateFlight(0, 'airlineCompany', companyName);
        }
      }
    } catch (err) {
      console.error("Failed to add airline company:", err);
      throw err;
    }
  };

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle("حجز الطيران");
      setShowTitle(true);
      setNoticeMessage("التواجد في صاله المطار قبل الاقلاع بساعتين");
      setShowNotice(true);
      setDirection("rtl");
      setLanguage("ar");
      setFlights([
        {
          date: new Date().toISOString().split('T')[0],
          time: "",
          airlineCompany: "",
          airlineCompanyLink: "",
          fromAirport: "",
          fromAirportLink: "",
          toAirport: "",
          toAirportLink: "",
          travelers: { adults: 1, children: 0, infants: 0 },
          luggage: "20 كيلو"
        }
      ]);
      setErrors({});
      setShowTemplateSelection(false);
      setShowSaveTemplateModal(false);
      setTemplateName("");
    }
  }, [isOpen]);

  // Load template data into form
  const loadTemplate = (template: Template) => {
    const data = template.data;
    if (data.title !== undefined) setTitle(data.title || "حجز الطيران");
    if (data.showTitle !== undefined) setShowTitle(data.showTitle);
    if (data.noticeMessage !== undefined) setNoticeMessage(data.noticeMessage || "");
    if (data.showNotice !== undefined) setShowNotice(data.showNotice);
    if (data.direction) setDirection(data.direction);
    if (data.language) setLanguage(data.language);
    if (data.flights && data.flights.length > 0) {
      setFlights(data.flights);
    }
    setShowTemplateSelection(false);
  };

  // Save current form as template
  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      alert(language === 'ar' ? 'يرجى إدخال اسم القالب' : 'Please enter a template name');
      return;
    }

    try {
      const templateData = {
        title,
        showTitle,
        noticeMessage,
        showNotice,
        flights,
        direction,
        language,
      };

      await saveAirplaneTemplate(templateName.trim(), templateData);
      setShowSaveTemplateModal(false);
      setTemplateName("");
      await fetchTemplates(); // Refresh templates list
      alert(language === 'ar' ? 'تم حفظ القالب بنجاح' : 'Template saved successfully');
    } catch (err) {
      console.error("Failed to save template:", err);
      alert(language === 'ar' ? 'فشل حفظ القالب' : 'Failed to save template');
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
        flights,
        direction,
        language,
      },
      exported_at: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `airplane-template-${Date.now()}.json`;
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

      if (!importData.data || !importData.data.flights) {
        alert(language === 'ar' ? 'ملف JSON غير صالح' : 'Invalid JSON file');
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
      if (data.flights && data.flights.length > 0) {
        setFlights(data.flights);
      }

      alert(language === 'ar' ? 'تم استيراد القالب بنجاح' : 'Template imported successfully');
    } catch (err) {
      console.error("Failed to import template:", err);
      alert(language === 'ar' ? 'فشل استيراد القالب' : 'Failed to import template');
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Delete template
  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await deleteAirplaneTemplate(templateId);
      setShowDeleteTemplateModal(false);
      setTemplateToDelete(null);
      await fetchTemplates(); // Refresh templates list
      alert(language === 'ar' ? 'تم حذف القالب بنجاح' : 'Template deleted successfully');
    } catch (err) {
      console.error("Failed to delete template:", err);
      alert(language === 'ar' ? 'فشل حذف القالب' : 'Failed to delete template');
    }
  };

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (flights.length === 0) {
      newErrors.flights = "At least one flight is required";
    }

    flights.forEach((flight, index) => {
      if (!flight.fromAirport.trim()) {
        newErrors[`flight_${index}_from`] = "From airport is required";
      }
      if (!flight.toAirport.trim()) {
        newErrors[`flight_${index}_to`] = "To airport is required";
      }
      if (!flight.date) {
        newErrors[`flight_${index}_date`] = "Date is required";
      }
      if (flight.travelers.adults < 0 || flight.travelers.children < 0 || flight.travelers.infants < 0) {
        newErrors[`flight_${index}_travelers`] = "Traveler counts cannot be negative";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    onSubmit({
      title: title.trim() || undefined,
      showTitle,
      noticeMessage: noticeMessage.trim() || undefined,
      showNotice,
      flights,
      direction,
      language,
    });

    onClose();
  };

  const addFlight = () => {
    setFlights([
      ...flights,
      {
        date: new Date().toISOString().split('T')[0],
        time: "",
        airlineCompany: "",
        airlineCompanyLink: "",
        fromAirport: "",
        fromAirportLink: "",
        toAirport: "",
        toAirportLink: "",
        travelers: { adults: 1, children: 0, infants: 0 },
        luggage: "20 كيلو"
      }
    ]);
  };

  const removeFlight = (index: number) => {
    if (flights.length > 1) {
      setFlights(flights.filter((_, i) => i !== index));
    }
  };

  const updateFlight = (index: number, field: keyof FlightData | 'travelers', value: any) => {
    const newFlights = [...flights];
    if (field === 'travelers') {
      newFlights[index] = {
        ...newFlights[index],
        travelers: { ...newFlights[index].travelers, ...value }
      };
    } else {
      newFlights[index] = {
        ...newFlights[index],
        [field]: value
      };
    }
    setFlights(newFlights);
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#4A5568] to-[#2D3748] px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
            Add Airplane Section
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
          {/* Template Selection Section */}
          {showTemplateSelection && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.5a2 2 0 00-1 .25" />
                  </svg>
                  {language === 'ar' ? 'القوالب المحفوظة' : 'Saved Templates'}
                </h3>
                {templates.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowTemplateSelection(false)}
                    className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                  >
                    {language === 'ar' ? 'إخفاء' : 'Hide'}
                  </button>
                )}
              </div>

              {templates.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg hover:border-blue-400 transition-all cursor-pointer group"
                        onClick={() => loadTemplate(template)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                              {template.name}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">
                              {template.data?.flights?.length || 0} {language === 'ar' ? 'رحلات' : 'flights'}
                            </p>
                          </div>
                          <svg className="w-5 h-5 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTemplateToDelete(template.id);
                              setShowDeleteTemplateModal(true);
                            }}
                            className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded text-xs"
                            title={language === 'ar' ? 'حذف' : 'Delete'}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTemplateSelection(false)}
                    className="mt-4 w-full text-sm text-blue-600 hover:text-blue-700 font-semibold py-2 rounded-lg hover:bg-blue-100/50 transition-colors"
                  >
                    {language === 'ar' ? '+ بدء جديد' : '+ Start Fresh'}
                  </button>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="flex justify-center mb-4">
                    <div className="relative">
                      <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.5a2 2 0 00-1 .25" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-1">
                    {language === 'ar' ? 'لا توجد قوالب محفوظة' : 'No Saved Templates'}
                  </h4>
                  <p className="text-xs text-gray-500 mb-4 max-w-xs mx-auto">
                    {language === 'ar' 
                      ? 'ابدأ بإنشاء قسم طيران جديد وحفظه كقالب لاستخدام لاحق' 
                      : 'Create a new airplane section and save it as a template for future use'}
                  </p>
                  <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 text-left text-xs text-blue-800 mb-4">
                    <p className="font-semibold mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2z" clipRule="evenodd" />
                      </svg>
                      {language === 'ar' ? 'نصيحة' : 'Quick Tip'}
                    </p>
                    {language === 'ar' 
                      ? 'ستتمكن من حفظ النماذج التي تنشئها وإعادة استخدامها بسرعة' 
                      : 'You can save the forms you create and reuse them quickly'}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTemplateSelection(false)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all shadow-md font-medium text-sm"
                  >
                    {language === 'ar' ? 'إنشاء القسم الأول' : 'Create Your First'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Section Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Section Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5568] focus:border-transparent"
              placeholder="Flight Booking"
            />
            <div className="mt-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="showTitle"
                checked={showTitle}
                onChange={(e) => setShowTitle(e.target.checked)}
                className="w-4 h-4 text-[#4A5568] rounded focus:ring-[#4A5568]"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5568] focus:border-transparent"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5568] focus:border-transparent"
              >
                <option value="rtl">Right to Left (RTL)</option>
                <option value="ltr">Left to Right (LTR)</option>
              </select>
            </div>
          </div>

          {/* Notice Message */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Notice Message
            </label>
            <textarea
              value={noticeMessage}
              onChange={(e) => setNoticeMessage(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5568] focus:border-transparent"
              rows={2}
              placeholder="Notice message..."
            />
            <div className="mt-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="showNotice"
                checked={showNotice}
                onChange={(e) => setShowNotice(e.target.checked)}
                className="w-4 h-4 text-[#4A5568] rounded focus:ring-[#4A5568]"
              />
              <label htmlFor="showNotice" className="text-sm text-gray-700">
                Show Notice
              </label>
            </div>
          </div>

          {/* Flights */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-semibold text-gray-700">
                Flights ({flights.length})
              </label>
              <button
                type="button"
                onClick={addFlight}
                className="px-3 py-1.5 bg-[#4A5568] text-white rounded-lg hover:bg-[#2D3748] transition-colors text-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Flight
              </button>
            </div>
            
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {flights.map((flight, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-700">Flight {index + 1}</span>
                    {flights.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFlight(index)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        value={flight.date}
                        onChange={(e) => updateFlight(index, 'date', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A5568] focus:border-transparent text-sm ${
                          errors[`flight_${index}_date`] ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors[`flight_${index}_date`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`flight_${index}_date`]}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Time
                      </label>
                      <input
                        type="time"
                        value={flight.time || ""}
                        onChange={(e) => updateFlight(index, 'time', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5568] focus:border-transparent text-sm"
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Airline Company
                    </label>
                    <div className="relative">
                      <select
                        value={flight.airlineCompany || ""}
                        onChange={(e) => updateFlight(index, 'airlineCompany', e.target.value)}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5568] focus:border-transparent text-sm appearance-none bg-white"
                      >
                        <option value="">Select airline company</option>
                        {airlineCompanies.map((company, idx) => (
                          <option key={idx} value={company}>
                            {company}
                          </option>
                        ))}
                      </select>
                      {/* Add button for users and company admins */}
                      {user && (
                        <button
                          type="button"
                          onClick={() => setShowAddAirlineModal(true)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-[#4A5568] text-white rounded-lg hover:bg-[#2D3748] transition-colors text-xs flex items-center gap-1"
                          title={language === 'ar' ? 'إضافة شركة طيران جديدة' : 'Add new airline company'}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      )}
                    </div>
                    {airlineCompanies.length === 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        No airline companies available. Click the + button to add one.
                      </p>
                    )}
                  </div>
                  
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Airline Company Link (Optional) 🔗
                    </label>
                    <input
                      type="url"
                      value={flight.airlineCompanyLink || ''}
                      onChange={(e) => updateFlight(index, 'airlineCompanyLink', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5568] focus:border-transparent text-sm"
                      placeholder="Airline company link"
                    />
                  </div>
                  
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Luggage
                    </label>
                    <input
                      type="text"
                      value={flight.luggage}
                      onChange={(e) => updateFlight(index, 'luggage', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5568] focus:border-transparent text-sm"
                      placeholder="20 كيلو"
                    />
                  </div>
                  
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      From Airport
                    </label>
                    <input
                      type="text"
                      value={flight.fromAirport}
                      onChange={(e) => updateFlight(index, 'fromAirport', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A5568] focus:border-transparent text-sm ${
                        errors[`flight_${index}_from`] ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="مطار..."
                    />
                    {errors[`flight_${index}_from`] && (
                      <p className="text-red-500 text-xs mt-1">{errors[`flight_${index}_from`]}</p>
                    )}
                  </div>
                  
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      From Airport Link (Optional) 🔗
                    </label>
                    <input
                      type="url"
                      value={flight.fromAirportLink || ''}
                      onChange={(e) => updateFlight(index, 'fromAirportLink', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5568] focus:border-transparent text-sm"
                      placeholder="Airport location link"
                    />
                  </div>
                  
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      To Airport
                    </label>
                    <input
                      type="text"
                      value={flight.toAirport}
                      onChange={(e) => updateFlight(index, 'toAirport', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A5568] focus:border-transparent text-sm ${
                        errors[`flight_${index}_to`] ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="مطار..."
                    />
                    {errors[`flight_${index}_to`] && (
                      <p className="text-red-500 text-xs mt-1">{errors[`flight_${index}_to`]}</p>
                    )}
                  </div>
                  
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      To Airport Link (Optional) 🔗
                    </label>
                    <input
                      type="url"
                      value={flight.toAirportLink || ''}
                      onChange={(e) => updateFlight(index, 'toAirportLink', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5568] focus:border-transparent text-sm"
                      placeholder="Airport location link"
                    />
                  </div>
                  
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Adults
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={flight.travelers.adults}
                        onChange={(e) => updateFlight(index, 'travelers', { ...flight.travelers, adults: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5568] focus:border-transparent text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Children
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={flight.travelers.children}
                        onChange={(e) => updateFlight(index, 'travelers', { ...flight.travelers, children: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5568] focus:border-transparent text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Infants
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={flight.travelers.infants}
                        onChange={(e) => updateFlight(index, 'travelers', { ...flight.travelers, infants: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5568] focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                  {errors[`flight_${index}_travelers`] && (
                    <p className="text-red-500 text-xs mt-1">{errors[`flight_${index}_travelers`]}</p>
                  )}
                </div>
              ))}
            </div>
            {errors.flights && (
              <p className="text-red-500 text-xs mt-2">{errors.flights}</p>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportJSON}
              className="px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
              title={language === 'ar' ? 'تصدير JSON' : 'Export JSON'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {language === 'ar' ? 'تصدير' : 'Export'}
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
              title={language === 'ar' ? 'استيراد JSON' : 'Import JSON'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              {language === 'ar' ? 'استيراد' : 'Import'}
            </button>
            <button
              type="button"
              onClick={() => setShowSaveTemplateModal(true)}
              className="px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
              title={language === 'ar' ? 'حفظ كقالب' : 'Save as Template'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {language === 'ar' ? 'حفظ' : 'Save'}
            </button>
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
              className="px-5 py-2 bg-gradient-to-r from-[#4A5568] to-[#2D3748] text-white rounded-lg hover:from-[#2D3748] hover:to-[#1A202C] transition-all shadow-md hover:shadow-lg font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {language === 'ar' ? 'إضافة القسم' : 'Add Section'}
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

      {/* Add Airline Company Modal */}
      <AddAirlineCompanyModal
        isOpen={showAddAirlineModal}
        onClose={() => setShowAddAirlineModal(false)}
        onSuccess={handleAddAirlineCompany}
        language={language}
      />

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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5568] focus:border-transparent"
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
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#4A5568] rounded-lg hover:bg-[#2D3748] transition-colors"
              >
                {language === 'ar' ? 'حفظ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Template Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteTemplateModal}
        onClose={() => {
          setShowDeleteTemplateModal(false);
          setTemplateToDelete(null);
        }}
        onConfirm={() => {
          if (templateToDelete) {
            handleDeleteTemplate(templateToDelete);
          }
        }}
        title={language === 'ar' ? 'حذف القالب' : 'Delete Template'}
        message={language === 'ar' ? 'هل أنت متأكد من حذف هذا القالب؟ لا يمكن التراجع عن هذا الإجراء.' : 'Are you sure you want to delete this template? This action cannot be undone.'}
        confirmButtonText={language === 'ar' ? 'حذف' : 'Delete'}
      />
    </div>
  );
}

