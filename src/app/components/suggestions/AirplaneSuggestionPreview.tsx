"use client";

import React from 'react';
import type { AirplaneSectionData } from '../../types/ExtractTypes';

interface AirplaneSuggestionPreviewProps {
  data: AirplaneSectionData;
  language?: "ar" | "en";
  direction?: "rtl" | "ltr";
}

/**
 * Read-only preview component for airplane/flight suggestions
 */
const AirplaneSuggestionPreview: React.FC<AirplaneSuggestionPreviewProps> = ({
  data,
  language = "ar",
  direction = "rtl"
}) => {
  const flights = data.flights || [];
  const title = data.title || (language === 'ar' ? 'حجز الطيران' : 'Flight Booking');
  
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateString;
    }
  };

  const formatTravelers = (travelers: { adults: number; children: number; infants: number }) => {
    const parts = [];
    if (travelers.adults > 0) parts.push(`${language === 'ar' ? 'البالغين' : 'Adults'}: ${travelers.adults}`);
    if (travelers.children > 0) parts.push(`${language === 'ar' ? 'الأطفال' : 'Children'}: ${travelers.children}`);
    if (travelers.infants > 0) parts.push(`${language === 'ar' ? 'رضيع' : 'Infants'}: ${travelers.infants}`);
    return parts.join(', ');
  };

  return (
    <div className="border-2 border-blue-300 rounded-lg p-4 bg-blue-50" dir={direction}>
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
        </svg>
        <h3 className="font-bold text-blue-900">{title}</h3>
      </div>
      
      {flights.length > 0 ? (
        <div className="space-y-2">
          {flights.map((flight, index) => (
            <div key={index} className="bg-white rounded p-3 border border-blue-200">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-semibold">{language === 'ar' ? 'التاريخ' : 'Date'}: </span>
                  <span>{formatDate(flight.date)}</span>
                </div>
                {flight.time && (
                  <div>
                    <span className="font-semibold">{language === 'ar' ? 'الوقت' : 'Time'}: </span>
                    <span>{flight.time}</span>
                  </div>
                )}
                <div>
                  <span className="font-semibold">{language === 'ar' ? 'من مطار' : 'From'}: </span>
                  <span>{flight.fromAirport}</span>
                </div>
                <div>
                  <span className="font-semibold">{language === 'ar' ? 'إلى مطار' : 'To'}: </span>
                  <span>{flight.toAirport}</span>
                </div>
                {flight.airlineCompany && (
                  <div>
                    <span className="font-semibold">{language === 'ar' ? 'شركة الطيران' : 'Airline'}: </span>
                    <span>{flight.airlineCompany}</span>
                  </div>
                )}
                <div>
                  <span className="font-semibold">{language === 'ar' ? 'المسافرين' : 'Travelers'}: </span>
                  <span>{formatTravelers(flight.travelers)}</span>
                </div>
                <div>
                  <span className="font-semibold">{language === 'ar' ? 'الأمتعة' : 'Luggage'}: </span>
                  <span>{flight.luggage}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600 text-sm">{language === 'ar' ? 'لا توجد رحلات' : 'No flights'}</p>
      )}
    </div>
  );
};

export default AirplaneSuggestionPreview;
