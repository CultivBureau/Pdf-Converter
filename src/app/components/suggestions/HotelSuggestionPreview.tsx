"use client";

import React from 'react';
import type { HotelsSectionData } from '../../types/ExtractTypes';

interface HotelSuggestionPreviewProps {
  data: HotelsSectionData;
  language?: "ar" | "en";
  direction?: "rtl" | "ltr";
}

/**
 * Read-only preview component for hotel suggestions
 */
const HotelSuggestionPreview: React.FC<HotelSuggestionPreviewProps> = ({
  data,
  language = "ar",
  direction = "rtl"
}) => {
  const hotels = data.hotels || [];
  const title = data.title || (language === 'ar' ? 'حجز الفنادق' : 'Hotel Booking');
  
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

  return (
    <div className="border-2 border-blue-300 rounded-lg p-4 bg-blue-50" dir={direction}>
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.006 3.705a.75.75 0 00-.512-1.41L6 6.838V3a.75.75 0 00-.75-.75h-1.5A.75.75 0 003 3v4.93l-1.006.365a.75.75 0 00.512 1.41l16.5-6z" />
          <path fillRule="evenodd" d="M3.019 11.115L18 5.667V9.09l4.006 1.456a.75.75 0 11-.512 1.41l-.494-.18v8.475h.75a.75.75 0 010 1.5H2.25a.75.75 0 010-1.5H3v-9.129l.019-.007zM18 20.25v-9.565l1.5.545v9.02H18zm-9-6a.75.75 0 00-.75.75v4.5c0 .414.336.75.75.75h3a.75.75 0 00.75-.75V15a.75.75 0 00-.75-.75H9z" clipRule="evenodd" />
        </svg>
        <h3 className="font-bold text-blue-900">{title}</h3>
      </div>
      
      {hotels.length > 0 ? (
        <div className="space-y-3">
          {hotels.map((hotel, index) => (
            <div key={index} className="bg-white rounded p-3 border border-blue-200">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{language === 'ar' ? 'المدينة' : 'City'}: </span>
                  <span>{hotel.city}</span>
                  {hotel.cityBadge && (
                    <span className="bg-orange-200 text-orange-800 px-2 py-1 rounded text-xs">
                      {hotel.cityBadge}
                    </span>
                  )}
                  {hotel.nights && (
                    <span className="text-gray-600">
                      ({hotel.nights} {language === 'ar' ? 'ليالي' : 'nights'})
                    </span>
                  )}
                </div>
                <div>
                  <span className="font-semibold">{language === 'ar' ? 'اسم الفندق' : 'Hotel Name'}: </span>
                  <span>{hotel.hotelName}</span>
                </div>
                {hotel.roomDescription?.roomType && (
                  <div>
                    <span className="font-semibold">{language === 'ar' ? 'نوع الغرفة' : 'Room Type'}: </span>
                    <span>{hotel.roomDescription.roomType}</span>
                  </div>
                )}
                {hotel.roomDescription?.includesAll && (
                  <div>
                    <span className="font-semibold">{language === 'ar' ? 'يشمل' : 'Includes'}: </span>
                    <span>{hotel.roomDescription.includesAll}</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="font-semibold">{language === 'ar' ? 'تاريخ الدخول' : 'Check-in'}: </span>
                    <span>{formatDate(hotel.checkInDate)}</span>
                    {hotel.dayInfo?.checkInDay && (
                      <span className="text-gray-600 ml-1">({hotel.dayInfo.checkInDay})</span>
                    )}
                  </div>
                  <div>
                    <span className="font-semibold">{language === 'ar' ? 'تاريخ الخروج' : 'Check-out'}: </span>
                    <span>{formatDate(hotel.checkOutDate)}</span>
                    {hotel.dayInfo?.checkOutDay && (
                      <span className="text-gray-600 ml-1">({hotel.dayInfo.checkOutDay})</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600 text-sm">{language === 'ar' ? 'لا توجد فنادق' : 'No hotels'}</p>
      )}
    </div>
  );
};

export default HotelSuggestionPreview;
