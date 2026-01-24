"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { Hotel } from '../Templates/HotelsSection';
import { getCompanySettings, getIncludesAllOptions, addIncludesAllOptionUser } from "@/app/services/CompanySettingsApi";
import AddIncludesAllOptionModal from "./AddIncludesAllOptionModal";

interface EditHotelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (hotel: Hotel) => void;
  initialHotel: Hotel | null;
}

export default function EditHotelModal({
  isOpen,
  onClose,
  onSubmit,
  initialHotel,
}: EditHotelModalProps) {
  const { t, isRTL, dir } = useLanguage();
  const [city, setCity] = useState("");
  const [nights, setNights] = useState(1);
  const [cityBadge, setCityBadge] = useState("");
  const [hotelName, setHotelName] = useState("");
  const [hasDetailsLink, setHasDetailsLink] = useState(false);
  const [detailsLink, setDetailsLink] = useState("");
  const [includesAll, setIncludesAll] = useState("");
  const [roomType, setRoomType] = useState("");
  const [bedType, setBedType] = useState("");
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [checkInDay, setCheckInDay] = useState("");
  const [checkOutDay, setCheckOutDay] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const { user } = useAuth();
  const [includesAllOptions, setIncludesAllOptions] = useState<string[]>(["Includes All"]);
  const [showAddOptionModal, setShowAddOptionModal] = useState(false);
  const [language, setLanguage] = useState<"ar" | "en">("ar");
  

  // Fetch includes all options from company settings
  const fetchIncludesAllOptions = async () => {
    try {
      // Use the new endpoint that works for all users
      const result = await getIncludesAllOptions();
      setIncludesAllOptions(result.includes_all_options || ["Includes All"]);
    } catch (err) {
      console.error("Failed to fetch includes all options:", err);
      setIncludesAllOptions(["Includes All"]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchIncludesAllOptions();
    }
  }, [isOpen]);

  // Handle adding new includes-all option (for users and company admins)
  const handleAddIncludesAllOption = async (optionText: string) => {
    try {
      const result = await addIncludesAllOptionUser(optionText);
      if (result && result.includes_all_options) {
        setIncludesAllOptions(result.includes_all_options);
        // Auto-select the newly added option
        setIncludesAll(optionText);
      }
    } catch (err) {
      console.error("Failed to add includes-all option:", err);
      throw err;
    }
  };

  // Populate form when modal opens or initialHotel changes
  useEffect(() => {
    if (isOpen && initialHotel) {
      setCity(initialHotel.city);
      setNights(initialHotel.nights);
      setCityBadge(initialHotel.cityBadge || "");
      setHotelName(initialHotel.hotelName);
      setHasDetailsLink(initialHotel.hasDetailsLink || false);
      setDetailsLink(initialHotel.detailsLink || "");
      setIncludesAll(initialHotel.roomDescription.includesAll);
      setRoomType(initialHotel.roomDescription.roomType || "");
      setBedType(initialHotel.roomDescription.bedType);
      setCheckInDate(initialHotel.checkInDate);
      setCheckOutDate(initialHotel.checkOutDate);
      setCheckInDay(initialHotel.dayInfo.checkInDay);
      setCheckOutDay(initialHotel.dayInfo.checkOutDay);
      setErrors({});
    }
  }, [isOpen, initialHotel]);

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!city.trim()) {
      newErrors.city = "City is required";
    }
    if (!hotelName.trim()) {
      newErrors.hotelName = "Hotel name is required";
    }
    if (!checkInDate) {
      newErrors.checkInDate = "Check-in date is required";
    }
    if (!checkOutDate) {
      newErrors.checkOutDate = "Check-out date is required";
    }
    if (nights < 1) {
      newErrors.nights = "Nights must be at least 1";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    onSubmit({
      city: city.trim(),
      nights,
      cityBadge: cityBadge.trim() || undefined,
      hotelName: hotelName.trim(),
      hasDetailsLink,
      detailsLink: hasDetailsLink ? (detailsLink.trim() || undefined) : undefined,
      roomDescription: {
        includesAll: includesAll.trim(),
        bedType: bedType.trim(),
        roomType: roomType.trim() || undefined,
      },
      checkInDate,
      checkOutDate,
      dayInfo: {
        checkInDay: checkInDay.trim(),
        checkOutDay: checkOutDay.trim(),
      },
    });

    onClose();
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`bg-gradient-to-r from-[#3B5998] to-[#2E4A7A] px-6 py-4 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <h2 className={`text-xl font-bold text-white flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {t.modals.editHotel}
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
          {/* City */}
          <div>
            <label className={`block text-sm font-semibold text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t.modals.city}
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#3B5998] focus:border-transparent ${
                errors.city ? "border-red-500" : "border-gray-300"
              } ${isRTL ? 'text-right' : 'text-left'}`}
              placeholder={t.modals.cityPlaceholder}
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
            {errors.city && (
              <p className="text-red-500 text-xs mt-1">{errors.city}</p>
            )}
          </div>

          {/* Nights */}
          <div>
            <label className={`block text-sm font-semibold text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t.modals.nights}
            </label>
            <input
              type="number"
              min="1"
              value={nights}
              onChange={(e) => setNights(Math.max(1, parseInt(e.target.value) || 1))}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#3B5998] focus:border-transparent ${
                errors.nights ? "border-red-500" : "border-gray-300"
              } ${isRTL ? 'text-right' : 'text-left'}`}
            />
            {errors.nights && (
              <p className="text-red-500 text-xs mt-1">{errors.nights}</p>
            )}
          </div>

          {/* City Badge */}
          <div>
            <label className={`block text-sm font-semibold text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t.modals.cityBadge}
            </label>
            <input
              type="text"
              value={cityBadge}
              onChange={(e) => setCityBadge(e.target.value)}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B5998] focus:border-transparent ${isRTL ? 'text-right' : 'text-left'}`}
              placeholder={t.modals.cityBadgePlaceholder}
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
          </div>

          {/* Hotel Name */}
          <div>
            <label className={`block text-sm font-semibold text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t.modals.hotelName}
            </label>
            <input
              type="text"
              value={hotelName}
              onChange={(e) => setHotelName(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#3B5998] focus:border-transparent ${
                errors.hotelName ? "border-red-500" : "border-gray-300"
              } ${isRTL ? 'text-right' : 'text-left'}`}
              placeholder={t.modals.hotelNamePlaceholder}
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
            {errors.hotelName && (
              <p className="text-red-500 text-xs mt-1">{errors.hotelName}</p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-semibold text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t.modals.checkInDate}
              </label>
              <input
                type="date"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#3B5998] focus:border-transparent ${
                  errors.checkInDate ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.checkInDate && (
                <p className="text-red-500 text-xs mt-1">{errors.checkInDate}</p>
              )}
            </div>
            <div>
              <label className={`block text-sm font-semibold text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t.modals.checkOutDate}
              </label>
              <input
                type="date"
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#3B5998] focus:border-transparent ${
                  errors.checkOutDate ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.checkOutDate && (
                <p className="text-red-500 text-xs mt-1">{errors.checkOutDate}</p>
              )}
            </div>
          </div>

          {/* Day Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-semibold text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t.modals.checkInDay}
              </label>
              <input
                type="text"
                value={checkInDay}
                onChange={(e) => setCheckInDay(e.target.value)}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B5998] focus:border-transparent ${isRTL ? 'text-right' : 'text-left'}`}
                placeholder={t.modals.checkInDayPlaceholder}
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />
            </div>
            <div>
              <label className={`block text-sm font-semibold text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t.modals.checkOutDay}
              </label>
              <input
                type="text"
                value={checkOutDay}
                onChange={(e) => setCheckOutDay(e.target.value)}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B5998] focus:border-transparent ${isRTL ? 'text-right' : 'text-left'}`}
                placeholder={t.modals.checkOutDayPlaceholder}
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />
            </div>
          </div>

          {/* Room Description */}
          <div>
            <label className={`block text-sm font-semibold text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t.modals.includesAll}
            </label>
            <div className="relative">
              <select
                value={includesAll}
                onChange={(e) => setIncludesAll(e.target.value)}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B5998] focus:border-transparent appearance-none bg-white"
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
                  title={language === 'ar' ? 'إضافة خيار جديد' : 'Add new option'}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              )}
            </div>
            {includesAllOptions.length === 0 && (
              <p className={`text-xs text-gray-500 mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t.modals.noOptionsAvailable}
              </p>
            )}
          </div>

          <div>
            <label className={`block text-sm font-semibold text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t.modals.roomType}
            </label>
            <input
              type="text"
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B5998] focus:border-transparent ${isRTL ? 'text-right' : 'text-left'}`}
              placeholder={t.modals.roomTypePlaceholder}
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
          </div>

          <div>
            <label className={`block text-sm font-semibold text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t.modals.bedType}
            </label>
            <input
              type="text"
              value={bedType}
              onChange={(e) => setBedType(e.target.value)}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B5998] focus:border-transparent ${isRTL ? 'text-right' : 'text-left'}`}
              placeholder={t.modals.bedTypePlaceholder}
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
          </div>

          {/* Details Link */}
          <div>
            <div className={`flex items-center gap-2 mb-2 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
              <input
                type="checkbox"
                id="hasDetailsLink"
                checked={hasDetailsLink}
                onChange={(e) => setHasDetailsLink(e.target.checked)}
                className="w-4 h-4 text-[#3B5998] rounded focus:ring-[#3B5998]"
              />
              <label htmlFor="hasDetailsLink" className="text-sm text-gray-700">
                {t.modals.hasDetailsLink}
              </label>
            </div>
            {hasDetailsLink && (
              <input
                type="url"
                value={detailsLink}
                onChange={(e) => setDetailsLink(e.target.value)}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B5998] focus:border-transparent ${isRTL ? 'text-right' : 'text-left'}`}
                placeholder="https://..."
              />
            )}
          </div>
        </form>

        {/* Footer */}
        <div className={`bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-200 ${isRTL ? 'flex-row-reverse' : ''}`}>
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {t.modals.saveChanges}
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

      {/* Add Includes-All Option Modal */}
      <AddIncludesAllOptionModal
        isOpen={showAddOptionModal}
        onClose={() => setShowAddOptionModal(false)}
        onSuccess={handleAddIncludesAllOption}
        language={language}
      />
    </div>
  );
}

