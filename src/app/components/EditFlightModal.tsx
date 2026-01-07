"use client";

import React, { useState, useEffect } from "react";
import { FlightData } from './AddAirplaneModal';
import { getCompanySettings } from "@/app/services/CompanySettingsApi";

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
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [airlineCompany, setAirlineCompany] = useState("");
  const [fromAirport, setFromAirport] = useState("");
  const [toAirport, setToAirport] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [luggage, setLuggage] = useState("20 كيلو");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [airlineCompanies, setAirlineCompanies] = useState<string[]>([]);

  // Fetch airline companies from company settings
  useEffect(() => {
    const fetchAirlineCompanies = async () => {
      try {
        const settings = await getCompanySettings();
        setAirlineCompanies(settings.airline_companies || []);
      } catch (err) {
        console.error("Failed to fetch airline companies:", err);
        setAirlineCompanies([]);
      }
    };
    if (isOpen) {
      fetchAirlineCompanies();
    }
  }, [isOpen]);

  // Populate form when modal opens or initialFlight changes
  useEffect(() => {
    if (isOpen && initialFlight) {
      setDate(initialFlight.date);
      setTime(initialFlight.time || "");
      setAirlineCompany(initialFlight.airlineCompany || "");
      setFromAirport(initialFlight.fromAirport);
      setToAirport(initialFlight.toAirport);
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
      fromAirport: fromAirport.trim(),
      toAirport: toAirport.trim(),
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
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#4A5568] to-[#2D3748] px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Flight
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Date
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Time
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Airline Company
            </label>
            <select
              value={airlineCompany}
              onChange={(e) => setAirlineCompany(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5568] focus:border-transparent"
            >
              <option value="">Select airline company</option>
              {airlineCompanies.map((company, idx) => (
                <option key={idx} value={company}>
                  {company}
                </option>
              ))}
            </select>
            {airlineCompanies.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">
                No airline companies available. Add them in Company Settings.
              </p>
            )}
          </div>

          {/* From Airport */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              From Airport
            </label>
            <input
              type="text"
              value={fromAirport}
              onChange={(e) => setFromAirport(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A5568] focus:border-transparent ${
                errors.fromAirport ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="مطار..."
            />
            {errors.fromAirport && (
              <p className="text-red-500 text-xs mt-1">{errors.fromAirport}</p>
            )}
          </div>

          {/* To Airport */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              To Airport
            </label>
            <input
              type="text"
              value={toAirport}
              onChange={(e) => setToAirport(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A5568] focus:border-transparent ${
                errors.toAirport ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="مطار..."
            />
            {errors.toAirport && (
              <p className="text-red-500 text-xs mt-1">{errors.toAirport}</p>
            )}
          </div>

          {/* Travelers */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Travelers
            </label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Adults
                </label>
                <input
                  type="number"
                  min="0"
                  value={adults}
                  onChange={(e) => setAdults(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5568] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Children
                </label>
                <input
                  type="number"
                  min="0"
                  value={children}
                  onChange={(e) => setChildren(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5568] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Infants
                </label>
                <input
                  type="number"
                  min="0"
                  value={infants}
                  onChange={(e) => setInfants(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5568] focus:border-transparent"
                />
              </div>
            </div>
            {errors.travelers && (
              <p className="text-red-500 text-xs mt-1">{errors.travelers}</p>
            )}
          </div>

          {/* Luggage */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Luggage
            </label>
            <input
              type="text"
              value={luggage}
              onChange={(e) => setLuggage(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5568] focus:border-transparent"
              placeholder="20 كيلو"
            />
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
            className="px-5 py-2 bg-gradient-to-r from-[#4A5568] to-[#2D3748] text-white rounded-lg hover:from-[#2D3748] hover:to-[#1A202C] transition-all shadow-md hover:shadow-lg font-medium flex items-center gap-2"
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
    </div>
  );
}

