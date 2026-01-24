"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { FlightData } from './AddAirplaneModal';
import { getCompanySettings, getAirlineCompanies, addAirlineCompanyUser } from "@/app/services/CompanySettingsApi";
import AddAirlineCompanyModal from "./AddAirlineCompanyModal";

interface EditFlightModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (flight: FlightData) => void;
  initialFlight: FlightData | null;
}

export default function EditFlightModal({
  isOpen,
  onClose,
  onSubmit,
  initialFlight,
}: EditFlightModalProps) {
  const { t, isRTL, dir } = useLanguage();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [airlineCompany, setAirlineCompany] = useState("");
  const [airlineCompanyLink, setAirlineCompanyLink] = useState("");
  const [fromAirport, setFromAirport] = useState("");
  const [fromAirportLink, setFromAirportLink] = useState("");
  const [toAirport, setToAirport] = useState("");
  const [toAirportLink, setToAirportLink] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [luggage, setLuggage] = useState("20 كيلو");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const { user, isCompanyAdmin } = useAuth();
  const [airlineCompanies, setAirlineCompanies] = useState<string[]>([]);
  const [showAddAirlineModal, setShowAddAirlineModal] = useState(false);
  const [language, setLanguage] = useState<"ar" | "en">("ar");

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

  useEffect(() => {
    if (isOpen) {
      fetchAirlineCompanies();
    }
  }, [isOpen]);

  // Handle adding new airline company (for users only)
  const handleAddAirlineCompany = async (companyName: string) => {
    try {
      const result = await addAirlineCompanyUser(companyName);
      if (result && result.airline_companies) {
        setAirlineCompanies(result.airline_companies);
        // Auto-select the newly added company
        setAirlineCompany(companyName);
      }
    } catch (err) {
      console.error("Failed to add airline company:", err);
      throw err;
    }
  };

  // Populate form when modal opens or initialFlight changes
  useEffect(() => {
    if (isOpen && initialFlight) {
      setDate(initialFlight.date);
      setTime(initialFlight.time || "");
      setAirlineCompany(initialFlight.airlineCompany || "");
      setAirlineCompanyLink(initialFlight.airlineCompanyLink || "");
      setFromAirport(initialFlight.fromAirport);
      setFromAirportLink(initialFlight.fromAirportLink || "");
      setToAirport(initialFlight.toAirport);
      setToAirportLink(initialFlight.toAirportLink || "");
      setAdults(initialFlight.travelers.adults);
      setChildren(initialFlight.travelers.children);
      setInfants(initialFlight.travelers.infants);
      setLuggage(initialFlight.luggage);
      setErrors({});
    }
  }, [isOpen, initialFlight]);

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!fromAirport.trim()) {
      newErrors.fromAirport = "From airport is required";
    }
    if (!toAirport.trim()) {
      newErrors.toAirport = "To airport is required";
    }
    if (!date) {
      newErrors.date = "Date is required";
    }
    if (adults < 0 || children < 0 || infants < 0) {
      newErrors.travelers = "Traveler counts cannot be negative";
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
      date,
      time: time.trim() || undefined,
      airlineCompany: airlineCompany.trim() || undefined,
      airlineCompanyLink: airlineCompanyLink.trim() || undefined,
      fromAirport: fromAirport.trim(),
      fromAirportLink: fromAirportLink.trim() || undefined,
      toAirport: toAirport.trim(),
      toAirportLink: toAirportLink.trim() || undefined,
      travelers: { adults, children, infants },
      luggage: luggage.trim(),
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
        <div className={`bg-gradient-to-r from-[#4A5568] to-[#2D3748] px-6 py-4 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <h2 className={`text-xl font-bold text-white flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {t.modals.editFlight}
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
          {/* Date */}
          <div>
            <label className={`block text-sm font-semibold text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t.modals.date}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A5568] focus:border-transparent ${
                errors.date ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.date && (
              <p className="text-red-500 text-xs mt-1">{errors.date}</p>
            )}
          </div>

          {/* Time */}
          <div>
            <label className={`block text-sm font-semibold text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t.modals.time}
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5568] focus:border-transparent"
            />
          </div>

          {/* Airline Company */}
          <div>
            <label className={`block text-sm font-semibold text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t.modals.airlineCompany}
            </label>
            <div className="relative">
              <select
                value={airlineCompany}
                onChange={(e) => setAirlineCompany(e.target.value)}
                className={`w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5568] focus:border-transparent appearance-none bg-white ${isRTL ? 'text-right' : 'text-left'}`}
              >
                <option value="">{t.modals.selectAirlineCompany}</option>
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
                  className={`absolute ${isRTL ? 'left-2' : 'right-2'} top-1/2 -translate-y-1/2 p-1.5 bg-[#4A5568] text-white rounded-lg hover:bg-[#2D3748] transition-colors text-xs flex items-center gap-1`}
                  title={t.modals.addNewAirlineCompany}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              )}
            </div>
            {airlineCompanies.length === 0 && (
              <p className={`text-xs text-gray-500 mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t.modals.noAirlineCompanies}
              </p>
            )}
          </div>

          {/* Airline Company Link */}
          <div>
            <label className={`block text-sm font-semibold text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t.modals.airlineCompanyLink} 🔗
            </label>
            <input
              type="url"
              value={airlineCompanyLink}
              onChange={(e) => setAirlineCompanyLink(e.target.value)}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5568] focus:border-transparent ${isRTL ? 'text-right' : 'text-left'}`}
              placeholder={t.modals.airlineCompanyLinkPlaceholder}
            />
          </div>

          {/* From Airport */}
          <div>
            <label className={`block text-sm font-semibold text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t.modals.fromAirport}
            </label>
            <input
              type="text"
              value={fromAirport}
              onChange={(e) => setFromAirport(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A5568] focus:border-transparent ${
                errors.fromAirport ? "border-red-500" : "border-gray-300"
              } ${isRTL ? 'text-right' : 'text-left'}`}
              placeholder={isRTL ? "مطار..." : "Airport..."}
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
            {errors.fromAirport && (
              <p className="text-red-500 text-xs mt-1">{errors.fromAirport}</p>
            )}
          </div>

          {/* From Airport Link */}
          <div>
            <label className={`block text-sm font-semibold text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t.modals.fromAirportLink} 🔗
            </label>
            <input
              type="url"
              value={fromAirportLink}
              onChange={(e) => setFromAirportLink(e.target.value)}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5568] focus:border-transparent ${isRTL ? 'text-right' : 'text-left'}`}
              placeholder={t.modals.airportLocationLink}
            />
          </div>

          {/* To Airport */}
          <div>
            <label className={`block text-sm font-semibold text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t.modals.toAirport}
            </label>
            <input
              type="text"
              value={toAirport}
              onChange={(e) => setToAirport(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A5568] focus:border-transparent ${
                errors.toAirport ? "border-red-500" : "border-gray-300"
              } ${isRTL ? 'text-right' : 'text-left'}`}
              placeholder={isRTL ? "مطار..." : "Airport..."}
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
            {errors.toAirport && (
              <p className="text-red-500 text-xs mt-1">{errors.toAirport}</p>
            )}
          </div>

          {/* To Airport Link */}
          <div>
            <label className={`block text-sm font-semibold text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t.modals.toAirportLink} 🔗
            </label>
            <input
              type="url"
              value={toAirportLink}
              onChange={(e) => setToAirportLink(e.target.value)}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5568] focus:border-transparent ${isRTL ? 'text-right' : 'text-left'}`}
              placeholder={t.modals.airportLocationLink}
            />
          </div>

          {/* Travelers */}
          <div>
            <label className={`block text-sm font-semibold text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t.modals.travelers}
            </label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={`block text-xs font-medium text-gray-600 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t.modals.adults}
                </label>
                <input
                  type="number"
                  min="0"
                  value={adults}
                  onChange={(e) => setAdults(Math.max(0, parseInt(e.target.value) || 0))}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5568] focus:border-transparent ${isRTL ? 'text-right' : 'text-left'}`}
                />
              </div>
              <div>
                <label className={`block text-xs font-medium text-gray-600 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t.modals.children}
                </label>
                <input
                  type="number"
                  min="0"
                  value={children}
                  onChange={(e) => setChildren(Math.max(0, parseInt(e.target.value) || 0))}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5568] focus:border-transparent ${isRTL ? 'text-right' : 'text-left'}`}
                />
              </div>
              <div>
                <label className={`block text-xs font-medium text-gray-600 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t.modals.infants}
                </label>
                <input
                  type="number"
                  min="0"
                  value={infants}
                  onChange={(e) => setInfants(Math.max(0, parseInt(e.target.value) || 0))}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5568] focus:border-transparent ${isRTL ? 'text-right' : 'text-left'}`}
                />
              </div>
            </div>
            {errors.travelers && (
              <p className="text-red-500 text-xs mt-1">{errors.travelers}</p>
            )}
          </div>

          {/* Luggage */}
          <div>
            <label className={`block text-sm font-semibold text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t.modals.luggage}
            </label>
            <input
              type="text"
              value={luggage}
              onChange={(e) => setLuggage(e.target.value)}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5568] focus:border-transparent ${isRTL ? 'text-right' : 'text-left'}`}
              placeholder={isRTL ? "20 كيلو" : "20 kg"}
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
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
            className={`px-5 py-2 bg-gradient-to-r from-[#4A5568] to-[#2D3748] text-white rounded-lg hover:from-[#2D3748] hover:to-[#1A202C] transition-all shadow-md hover:shadow-lg font-medium flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
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

      {/* Add Airline Company Modal */}
      <AddAirlineCompanyModal
        isOpen={showAddAirlineModal}
        onClose={() => setShowAddAirlineModal(false)}
        onSuccess={handleAddAirlineCompany}
        language={language}
      />
    </div>
  );
}

