"use client";

import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/app/contexts/AuthContext";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { Hotel } from '../Templates/HotelsSection';
import { getCompanySettings, getIncludesAllOptions, addIncludesAllOptionUser } from "@/app/services/CompanySettingsApi";
import {
  getHotelTemplates,
  saveHotelTemplate,
  deleteHotelTemplate,
  Template,
} from "@/app/services/TemplatesApi";
import AddIncludesAllOptionModal from "./AddIncludesAllOptionModal";
import DeleteConfirmationModal from "./DeleteConfirmationModal";

interface AddHotelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title?: string;
    showTitle?: boolean;
    hotels: Hotel[];
    direction?: "rtl" | "ltr";
    language?: "ar" | "en";
    labels?: {
      nights: string;
      includes: string;
      checkIn: string;
      checkOut: string;
      details: string;
      count: string;
    };
  }) => void;
}

export default function AddHotelModal({
  isOpen,
  onClose,
  onSubmit,
}: AddHotelModalProps) {
  const { t, isRTL, dir } = useLanguage();
  const [title, setTitle] = useState("حجز الفنادق");
  const [showTitle, setShowTitle] = useState(true);
  const { user } = useAuth();
  const [direction, setDirection] = useState<"rtl" | "ltr">("rtl");
  const [language, setLanguage] = useState<"ar" | "en">("ar");
  const [includesAllOptions, setIncludesAllOptions] = useState<string[]>(["Includes All"]);
  const [showAddOptionModal, setShowAddOptionModal] = useState(false);
  const [hotels, setHotels] = useState<Hotel[]>([
    {
      city: "",
      nights: 1,
      hotelName: "",
      hasDetailsLink: false,
      roomDescription: {
        includesAll: "Includes All",
        bedType: "سرير اضافي/ عدد: 2",
        roomType: ""
      },
      checkInDate: new Date().toISOString().split('T')[0],
      checkOutDate: new Date().toISOString().split('T')[0],
      dayInfo: {
        checkInDay: "اليوم الاول",
        checkOutDay: "اليوم الثاني"
      }
    }
  ]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  // Template-related state
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [showTemplateSelection, setShowTemplateSelection] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [showDeleteTemplateModal, setShowDeleteTemplateModal] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch includes all options from company settings
  const fetchIncludesAllOptions = async () => {
    try {
      // Use the new endpoint that works for all users
      const result = await getIncludesAllOptions();
      const options = result.includes_all_options || ["Includes All"];
      setIncludesAllOptions(options);
      // Update hotels to use default option
      if (hotels.length > 0 && hotels[0].roomDescription.includesAll === "Includes All") {
        setHotels(prev => prev.map(h => ({
          ...h,
          roomDescription: {
            ...h.roomDescription,
            includesAll: options[0] || "Includes All"
          }
        })));
      }
    } catch (err) {
      console.error("Failed to fetch includes all options:", err);
      setIncludesAllOptions(["Includes All"]);
    }
  };

  // Fetch templates when modal opens
  const fetchTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const result = await getHotelTemplates();
      setTemplates(result.templates || []);
      // Don't auto-show template selection - user clicks button to show
    } catch (err) {
      console.error("Failed to fetch templates:", err);
      setTemplates([]);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchIncludesAllOptions();
      fetchTemplates();
    }
  }, [isOpen]);

  // Handle adding new includes-all option (for users and company admins)
  const handleAddIncludesAllOption = async (optionText: string) => {
    try {
      const result = await addIncludesAllOptionUser(optionText);
      if (result && result.includes_all_options) {
        setIncludesAllOptions(result.includes_all_options);
        // Auto-select the newly added option in the first hotel
        if (hotels.length > 0) {
          updateHotel(0, 'roomDescription', { ...hotels[0].roomDescription, includesAll: optionText });
        }
      }
    } catch (err) {
      console.error("Failed to add includes-all option:", err);
      throw err;
    }
  };

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle("حجز الفنادق");
      setShowTitle(true);
      setDirection("rtl");
      setLanguage("ar");
      setHotels([
        {
          city: "",
          nights: 1,
          hotelName: "",
          hasDetailsLink: false,
          roomDescription: {
            includesAll: includesAllOptions[0] || "Includes All",
            bedType: "سرير اضافي/ عدد: 2",
            roomType: ""
          },
          checkInDate: new Date().toISOString().split('T')[0],
          checkOutDate: new Date().toISOString().split('T')[0],
          dayInfo: {
            checkInDay: "اليوم الاول",
            checkOutDay: "اليوم الثاني"
          }
        }
      ]);
      setErrors({});
      setShowTemplateSelection(false);
      setShowSaveTemplateModal(false);
      setTemplateName("");
    }
  }, [isOpen, includesAllOptions]);

  // Load template data into form
  const loadTemplate = (template: Template) => {
    const data = template.data as any;
    if (data.title !== undefined) setTitle(data.title || "حجز الفنادق");
    if (data.showTitle !== undefined) setShowTitle(data.showTitle);
    if (data.direction) setDirection(data.direction);
    if (data.language) setLanguage(data.language);
    if (data.hotels && data.hotels.length > 0) {
      setHotels(data.hotels);
    }
    setShowTemplateSelection(false);
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
        hotels,
        direction,
        language,
        labels: undefined, // Let component use defaults
      };

      await saveHotelTemplate(templateName.trim(), templateData);
      setShowSaveTemplateModal(false);
      setTemplateName("");
      await fetchTemplates(); // Refresh templates list
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
      name: title || "Hotel Section",
      template_type: "hotel",
      data: {
        title,
        showTitle,
        hotels,
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
    a.download = `hotel-template-${Date.now()}.json`;
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

      if (!importData.data || !importData.data.hotels) {
        toast.error(language === 'ar' ? 'ملف JSON غير صالح' : 'Invalid JSON file');
        return;
      }

      // Load imported data into form
      const data = importData.data;
      if (data.title !== undefined) setTitle(data.title || "حجز الفنادق");
      if (data.showTitle !== undefined) setShowTitle(data.showTitle);
      if (data.direction) setDirection(data.direction);
      if (data.language) setLanguage(data.language);
      if (data.hotels && data.hotels.length > 0) {
        setHotels(data.hotels);
      }

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

  // Delete template
  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await deleteHotelTemplate(templateId);
      setShowDeleteTemplateModal(false);
      setTemplateToDelete(null);
      await fetchTemplates(); // Refresh templates list
      toast.success(language === 'ar' ? 'تم حذف القالب بنجاح' : 'Template deleted successfully');
    } catch (err) {
      console.error("Failed to delete template:", err);
      toast.error(language === 'ar' ? 'فشل حذف القالب' : 'Failed to delete template');
    }
  };

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (hotels.length === 0) {
      newErrors.hotels = "At least one hotel is required";
    }

    hotels.forEach((hotel, index) => {
      if (!hotel.city.trim()) {
        newErrors[`hotel_${index}_city`] = "City is required";
      }
      if (!hotel.hotelName.trim()) {
        newErrors[`hotel_${index}_hotelName`] = "Hotel name is required";
      }
      if (!hotel.checkInDate) {
        newErrors[`hotel_${index}_checkIn`] = "Check-in date is required";
      }
      if (!hotel.checkOutDate) {
        newErrors[`hotel_${index}_checkOut`] = "Check-out date is required";
      }
      if (hotel.nights < 1) {
        newErrors[`hotel_${index}_nights`] = "Nights must be at least 1";
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

    // Only provide labels if user wants to customize (component has defaults)
    // For now, we'll let the component use its default labels based on language
    onSubmit({
      title: title.trim() || undefined,
      showTitle,
      hotels,
      direction,
      language,
      // labels: undefined, // Let component use defaults based on language
    });

    onClose();
  };

  const addHotel = () => {
    setHotels([
      ...hotels,
      {
        city: "",
        nights: 1,
        hotelName: "",
        hasDetailsLink: false,
        roomDescription: {
          includesAll: "شامل الافطار",
          bedType: "سرير اضافي/ عدد: 2",
          roomType: ""
        },
        checkInDate: new Date().toISOString().split('T')[0],
        checkOutDate: new Date().toISOString().split('T')[0],
        dayInfo: {
          checkInDay: "اليوم الاول",
          checkOutDay: "اليوم الثاني"
        }
      }
    ]);
  };

  const removeHotel = (index: number) => {
    if (hotels.length > 1) {
      setHotels(hotels.filter((_, i) => i !== index));
    }
  };

  const updateHotel = (index: number, field: keyof Hotel | 'roomDescription' | 'dayInfo', value: any) => {
    const newHotels = [...hotels];
    if (field === 'roomDescription') {
      newHotels[index] = {
        ...newHotels[index],
        roomDescription: { ...newHotels[index].roomDescription, ...value }
      };
    } else if (field === 'dayInfo') {
      newHotels[index] = {
        ...newHotels[index],
        dayInfo: { ...newHotels[index].dayInfo, ...value }
      };
    } else {
      newHotels[index] = {
        ...newHotels[index],
        [field]: value
      };
    }
    setHotels(newHotels);
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
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in ${isRTL ? 'text-right' : 'text-left'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`bg-gradient-to-r from-[#3B5998] to-[#2E4A7A] px-6 py-4 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <h2 className={`text-xl font-bold text-white flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.006 3.705a.75.75 0 00-.512-1.41L6 6.838V3a.75.75 0 00-.75-.75h-1.5A.75.75 0 003 3v4.93l-1.006.365a.75.75 0 00.512 1.41l16.5-6z" />
              <path fillRule="evenodd" d="M3.019 11.115L18 5.667V9.09l4.006 1.456a.75.75 0 11-.512 1.41l-.494-.18v8.475h.75a.75.75 0 010 1.5H2.25a.75.75 0 010-1.5H3v-9.129l.019-.007zM18 20.25v-9.565l1.5.545v9.02H18zm-9-6a.75.75 0 00-.75.75v4.5c0 .414.336.75.75.75h3a.75.75 0 00.75-.75V15a.75.75 0 00-.75-.75H9z" clipRule="evenodd" />
            </svg>
            {t.modals.addHotelSection}
          </h2>
          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {/* Saved Templates Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowTemplateSelection(!showTemplateSelection);
              }}
              className={`px-4 py-2 rounded-lg transition-all font-medium text-sm flex items-center gap-2 ${
                showTemplateSelection 
                  ? 'bg-white text-[#3B5998] shadow-lg' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              } ${isRTL ? 'flex-row-reverse' : ''}`}
              title={t.modals.savedTemplates}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <span>{t.modals.savedTemplates}</span>
              {templates.length > 0 && (
                <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                  showTemplateSelection ? 'bg-[#3B5998] text-white' : 'bg-white/30 text-white'
                }`}>
                  {templates.length}
                </span>
              )}
            </button>
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
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Template Selection Section */}
          {showTemplateSelection && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6">
              <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <h3 className={`text-base font-bold text-gray-800 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.006 3.705a.75.75 0 00-.512-1.41L6 6.838V3a.75.75 0 00-.75-.75h-1.5A.75.75 0 003 3v4.93l-1.006.365a.75.75 0 00.512 1.41l16.5-6z" />
                    <path fillRule="evenodd" d="M3.019 11.115L18 5.667V9.09l4.006 1.456a.75.75 0 11-.512 1.41l-.494-.18v8.475h.75a.75.75 0 010 1.5H2.25a.75.75 0 010-1.5H3v-9.129l.019-.007zM18 20.25v-9.565l1.5.545v9.02H18zm-9-6a.75.75 0 00-.75.75v4.5c0 .414.336.75.75.75h3a.75.75 0 00.75-.75V15a.75.75 0 00-.75-.75H9z" clipRule="evenodd" />
                  </svg>
                  {t.modals.savedTemplates}
                </h3>
                {templates.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowTemplateSelection(false)}
                    className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                  >
                    {t.modals.hide}
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
                        <div className={`flex items-start justify-between mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                              {template.name}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">
                              {(template.data as any)?.hotels?.length || 0} {t.modals.hotelsCount}
                            </p>
                          </div>
                          <svg className={`w-5 h-5 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ${isRTL ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                        <div className={`flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTemplateToDelete(template.id);
                              setShowDeleteTemplateModal(true);
                            }}
                            className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded text-xs"
                            title={t.common.delete}
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
                    {t.modals.startFresh}
                  </button>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="flex justify-center mb-4">
                    <div className="relative">
                      <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.006 3.705a.75.75 0 00-.512-1.41L6 6.838V3a.75.75 0 00-.75-.75h-1.5A.75.75 0 003 3v4.93l-1.006.365a.75.75 0 00.512 1.41l16.5-6z" />
                        <path fillRule="evenodd" d="M3.019 11.115L18 5.667V9.09l4.006 1.456a.75.75 0 11-.512 1.41l-.494-.18v8.475h.75a.75.75 0 010 1.5H2.25a.75.75 0 010-1.5H3v-9.129l.019-.007zM18 20.25v-9.565l1.5.545v9.02H18zm-9-6a.75.75 0 00-.75.75v4.5c0 .414.336.75.75.75h3a.75.75 0 00.75-.75V15a.75.75 0 00-.75-.75H9z" clipRule="evenodd" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-1">
                    {t.modals.noSavedTemplates}
                  </h4>
                  <p className="text-xs text-gray-500 mb-4 max-w-xs mx-auto">
                    {t.modals.createHotelSectionDesc}
                  </p>
                  <div className={`bg-blue-100 border border-blue-300 rounded-lg p-3 text-xs text-blue-800 mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                    <p className={`font-semibold mb-2 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2z" clipRule="evenodd" />
                      </svg>
                      {t.modals.quickTip}
                    </p>
                    {t.modals.templateTipDesc}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowTemplateSelection(false)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all shadow-md font-medium text-sm"
                  >
                    {t.modals.createYourFirst}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Section Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t.modals.sectionTitle}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B5998] focus:border-transparent"
              placeholder={t.modals.hotelBooking}
            />
            <div className={`mt-2 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <input
                type="checkbox"
                id="showTitle"
                checked={showTitle}
                onChange={(e) => setShowTitle(e.target.checked)}
                className="w-4 h-4 text-[#3B5998] rounded focus:ring-[#3B5998]"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B5998] focus:border-transparent"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B5998] focus:border-transparent"
              >
                <option value="rtl">{t.modals.rtl}</option>
                <option value="ltr">{t.modals.ltr}</option>
              </select>
            </div>
          </div>

          {/* Hotels */}
          <div>
            <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <label className="block text-sm font-semibold text-gray-700">
                {t.modals.hotels} ({hotels.length})
              </label>
              <button
                type="button"
                onClick={addHotel}
                className={`px-3 py-1.5 bg-[#3B5998] text-white rounded-lg hover:bg-[#2E4A7A] transition-colors text-sm flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t.modals.addHotel}
              </button>
            </div>
            
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {hotels.map((hotel, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className={`flex items-center justify-between mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="text-sm font-semibold text-gray-700">{t.modals.hotel} {index + 1}</span>
                    {hotels.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeHotel(index)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        {t.modals.removeHotel}
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        {t.modals.city}
                      </label>
                      <input
                        type="text"
                        value={hotel.city}
                        onChange={(e) => updateHotel(index, 'city', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#3B5998] focus:border-transparent text-sm ${
                          errors[`hotel_${index}_city`] ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder={t.modals.cityPlaceholder}
                      />
                      {errors[`hotel_${index}_city`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`hotel_${index}_city`]}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        {t.modals.nights}
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={hotel.nights}
                        onChange={(e) => updateHotel(index, 'nights', parseInt(e.target.value) || 1)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#3B5998] focus:border-transparent text-sm ${
                          errors[`hotel_${index}_nights`] ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors[`hotel_${index}_nights`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`hotel_${index}_nights`]}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {t.modals.cityBadge}
                    </label>
                    <input
                      type="text"
                      value={hotel.cityBadge || ""}
                      onChange={(e) => updateHotel(index, 'cityBadge', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B5998] focus:border-transparent text-sm"
                      placeholder={t.modals.cityBadgePlaceholder}
                    />
                  </div>

                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {t.modals.hotelName}
                    </label>
                    <input
                      type="text"
                      value={hotel.hotelName}
                      onChange={(e) => updateHotel(index, 'hotelName', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#3B5998] focus:border-transparent text-sm ${
                        errors[`hotel_${index}_hotelName`] ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder={t.modals.hotelNamePlaceholder}
                    />
                    {errors[`hotel_${index}_hotelName`] && (
                      <p className="text-red-500 text-xs mt-1">{errors[`hotel_${index}_hotelName`]}</p>
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        {t.modals.checkInDate}
                      </label>
                      <input
                        type="date"
                        value={hotel.checkInDate}
                        onChange={(e) => updateHotel(index, 'checkInDate', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#3B5998] focus:border-transparent text-sm ${
                          errors[`hotel_${index}_checkIn`] ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors[`hotel_${index}_checkIn`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`hotel_${index}_checkIn`]}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        {t.modals.checkOutDate}
                      </label>
                      <input
                        type="date"
                        value={hotel.checkOutDate}
                        onChange={(e) => updateHotel(index, 'checkOutDate', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#3B5998] focus:border-transparent text-sm ${
                          errors[`hotel_${index}_checkOut`] ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors[`hotel_${index}_checkOut`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`hotel_${index}_checkOut`]}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        {t.modals.checkInDay}
                      </label>
                      <input
                        type="text"
                        value={hotel.dayInfo.checkInDay}
                        onChange={(e) => updateHotel(index, 'dayInfo', { ...hotel.dayInfo, checkInDay: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B5998] focus:border-transparent text-sm"
                        placeholder={t.modals.checkInDayPlaceholder}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        {t.modals.checkOutDay}
                      </label>
                      <input
                        type="text"
                        value={hotel.dayInfo.checkOutDay}
                        onChange={(e) => updateHotel(index, 'dayInfo', { ...hotel.dayInfo, checkOutDay: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B5998] focus:border-transparent text-sm"
                        placeholder={t.modals.checkOutDayPlaceholder}
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {t.modals.includesAll}
                    </label>
                    <div className="relative">
                      <select
                        value={hotel.roomDescription.includesAll}
                        onChange={(e) => updateHotel(index, 'roomDescription', { ...hotel.roomDescription, includesAll: e.target.value })}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B5998] focus:border-transparent text-sm appearance-none bg-white"
                      >
                        {includesAllOptions.map((option, idx) => (
                          <option key={idx} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                      {/* Add button for users and company admins */}
                      {user && (
                        <button
                          type="button"
                          onClick={() => setShowAddOptionModal(true)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-[#4A5568] text-white rounded-lg hover:bg-[#2D3748] transition-colors text-xs flex items-center gap-1"
                          title={t.modals.addNewOption}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      )}
                    </div>
                    {includesAllOptions.length === 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {t.modals.noOptionsAvailable}
                      </p>
                    )}
                  </div>

                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {t.modals.roomType}
                    </label>
                    <input
                      type="text"
                      value={hotel.roomDescription.roomType || ""}
                      onChange={(e) => updateHotel(index, 'roomDescription', { ...hotel.roomDescription, roomType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B5998] focus:border-transparent text-sm"
                      placeholder={t.modals.roomTypePlaceholder}
                    />
                  </div>

                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {t.modals.bedType}
                    </label>
                    <input
                      type="text"
                      value={hotel.roomDescription.bedType}
                      onChange={(e) => updateHotel(index, 'roomDescription', { ...hotel.roomDescription, bedType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B5998] focus:border-transparent text-sm"
                      placeholder={t.modals.bedTypePlaceholder}
                    />
                  </div>

                  <div className={`mt-3 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <input
                      type="checkbox"
                      id={`hasDetailsLink_${index}`}
                      checked={hotel.hasDetailsLink || false}
                      onChange={(e) => updateHotel(index, 'hasDetailsLink', e.target.checked)}
                      className="w-4 h-4 text-[#3B5998] rounded focus:ring-[#3B5998]"
                    />
                    <label htmlFor={`hasDetailsLink_${index}`} className="text-xs text-gray-700">
                      {t.modals.hasDetailsLink}
                    </label>
                  </div>

                  {hotel.hasDetailsLink && (
                    <div className="mt-3">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        {t.modals.detailsLinkUrl}
                      </label>
                      <input
                        type="url"
                        value={hotel.detailsLink || ""}
                        onChange={(e) => updateHotel(index, 'detailsLink', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B5998] focus:border-transparent text-sm"
                        placeholder="https://..."
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
            {errors.hotels && (
              <p className="text-red-500 text-xs mt-2">{errors.hotels}</p>
            )}
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
              {t.common.save}
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
              className={`px-5 py-2 bg-gradient-to-r from-[#3B5998] to-[#2E4A7A] text-white rounded-lg hover:from-[#2E4A7A] hover:to-[#1E3A5A] transition-all shadow-md hover:shadow-lg font-medium flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t.modals.addSection}
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

      {/* Add Includes-All Option Modal */}
      <AddIncludesAllOptionModal
        isOpen={showAddOptionModal}
        onClose={() => setShowAddOptionModal(false)}
        onSuccess={handleAddIncludesAllOption}
        language={language}
      />

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
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B5998] focus:border-transparent ${isRTL ? 'text-right' : 'text-left'}`}
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
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#3B5998] rounded-lg hover:bg-[#2E4A7A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
        title={t.modals.deleteTemplate}
        message={t.modals.deleteTemplateConfirm}
        confirmButtonText={t.common.delete}
      />
    </div>
  );
}

