"use client";

import React from 'react';

/**
 * Airplane Section Template Component
 * 
 * A template for flight booking information with:
 * - Dark header with airplane icon
 * - Orange column headers (Date, From Airport, To Airport, Travelers, Luggage)
 * - Dynamic rows with flight data
 * - RTL support for Arabic text
 * - Notice message at the bottom
 */

export interface AirplaneSectionProps {
  // Data
  flights?: {
    date: string;
    fromAirport: string;
    toAirport: string;
    travelers: {
      adults: number;
      children: number;
      infants: number;
    };
    luggage: string;
  }[];
  
  // Title
  title?: string;
  showTitle?: boolean;
  
  // Notice Message
  noticeMessage?: string;
  showNotice?: boolean;
  
  // Language & Direction
  direction?: "rtl" | "ltr";
  language?: "ar" | "en";
  
  // Column Labels
  columnLabels?: {
    date: string;
    fromAirport: string;
    toAirport: string;
    travelers: string;
    luggage: string;
  };
  
  // Unique identifier
  id?: string; // Unique identifier for the airplane section
  
  // Editable mode
  editable?: boolean;
  sectionId?: string; // Deprecated, use id instead
  onEditFlight?: (flightIndex: number) => void;
  onRemoveFlight?: (flightIndex: number) => void;
  onAddFlight?: () => void;
  onEditSection?: () => void;
  
  // Customization
  className?: string;
  style?: React.CSSProperties;
}

const AirplaneSection: React.FC<AirplaneSectionProps> = ({
  flights = [
    {
      date: "2025-07-06",
      fromAirport: "مطار بوكيت الدولي تايلاند الطيران ايراشيا",
      toAirport: "مطارشنغهاي تايلند",
      travelers: { adults: 7, children: 3, infants: 0 },
      luggage: "20 كيلو"
    },
    {
      date: "2025-07-10",
      fromAirport: "مطارشنغهاي تايلند الطيران ايراشيا",
      toAirport: "مطار سوفارنابهومي بانكوك الدو ب",
      travelers: { adults: 7, children: 3, infants: 0 },
      luggage: "20 كيلو"
    }
  ],
  title = "حجز الطيران",
  showTitle = true,
  noticeMessage = "التواجد في صاله المطار قبل الاقلاع بساعتين",
  showNotice = true,
  direction = "rtl",
  language = "ar",
  columnLabels = {
    date: "التاريخ",
    fromAirport: "من مطار",
    toAirport: "الى مطار",
    travelers: "المسافرين",
    luggage: "الأمتعه"
  },
  editable = false,
  id,
  sectionId,
  onEditFlight,
  onRemoveFlight,
  onAddFlight,
  onEditSection,
  className = "",
  style
}) => {
  const sectionIdValue = id || sectionId;
  const formatTravelers = (travelers: { adults: number; children: number; infants: number }) => {
    const parts = [];
    if (travelers.adults > 0) parts.push(`${language === 'ar' ? 'البالغين:' : 'Adults:'}${travelers.adults}`);
    if (travelers.children > 0) parts.push(`${language === 'ar' ? 'الاطفال:' : 'Children:'}${travelers.children}`);
    if (travelers.infants > 0) parts.push(`${language === 'ar' ? 'رضيع:' : 'Infants:'}${travelers.infants}`);
    return parts.join('\n');
  };

  return (
    <div className={`w-full mb-6 ${className}`} style={style} dir={direction} data-airplane-section-id={sectionIdValue}>
      {/* Header with Title and Icon */}
      {showTitle && (
        <div className="flex items-center justify-center mb-3 relative">
          <div className="bg-[#4A5568] text-white px-8 py-2.5 rounded-full flex items-center gap-3 shadow-md">
            <h2 className="text-lg font-bold tracking-wide">{title}</h2>
            <div className="bg-white rounded-full p-2">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="currentColor" 
                className="w-5 h-5 text-[#4A5568]"
              >
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
            </div>
          </div>
          {editable && onEditSection && (
            <button
              onClick={onEditSection}
              className="absolute left-0 top-1/2 -translate-y-1/2 p-2 bg-[#4A5568] text-white rounded-full hover:bg-[#2D3748] transition-colors shadow-md"
              title="تعديل القسم"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl shadow-md">
        <table className="w-full border-collapse">
          {/* Column Headers */}
          <thead>
            <tr className="bg-[#F5A623]">
              {editable && (
                <th className="px-2 py-2.5 text-center text-white font-bold text-xs border-r-2 border-white">
                  إجراءات
                </th>
              )}
              <th className="px-4 py-2.5 text-center text-white font-bold text-sm border-r-2 border-white">
                {columnLabels.date}
              </th>
              <th className="px-4 py-2.5 text-center text-white font-bold text-sm border-r-2 border-white">
                {columnLabels.fromAirport}
              </th>
              <th className="px-4 py-2.5 text-center text-white font-bold text-sm border-r-2 border-white">
                {columnLabels.toAirport}
              </th>
              <th className="px-4 py-2.5 text-center text-white font-bold text-sm border-r-2 border-white">
                {columnLabels.travelers}
              </th>
              <th className="px-4 py-2.5 text-center text-white font-bold text-sm">
                {columnLabels.luggage}
              </th>
            </tr>
          </thead>

          {/* Data Rows */}
          <tbody>
            {flights.map((flight, index) => (
              <tr key={index} className="bg-[#E8E8E8] relative group">
                {editable && (
                  <td className="px-2 py-3 border-r-2 border-white">
                    <div className="flex flex-col gap-1">
                      {onEditFlight && (
                        <button
                          onClick={() => onEditFlight(index)}
                          className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                          title="تعديل"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}
                      {onRemoveFlight && flights.length > 1 && (
                        <button
                          onClick={() => onRemoveFlight(index)}
                          className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                          title="حذف"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                )}
                <td className="px-4 py-3 text-center text-gray-800 font-semibold text-sm border-r-2 border-white">
                  {flight.date}
                </td>
                <td className="px-4 py-3 text-center text-gray-800 font-semibold text-sm border-r-2 border-white">
                  <div className="whitespace-pre-line">{flight.fromAirport}</div>
                </td>
                <td className="px-4 py-3 text-center text-gray-800 font-semibold text-sm border-r-2 border-white flex items-center justify-center gap-1.5">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="currentColor" 
                    className="w-4 h-4 text-[#4FC3F7]"
                  >
                    <path fillRule="evenodd" d="M19.902 4.098a3.75 3.75 0 00-5.304 0l-4.5 4.5a3.75 3.75 0 001.035 6.037.75.75 0 01-.646 1.353 5.25 5.25 0 01-1.449-8.45l4.5-4.5a5.25 5.25 0 117.424 7.424l-1.757 1.757a.75.75 0 11-1.06-1.06l1.757-1.757a3.75 3.75 0 000-5.304zm-7.389 4.267a.75.75 0 011-.353 5.25 5.25 0 011.449 8.45l-4.5 4.5a5.25 5.25 0 11-7.424-7.424l1.757-1.757a.75.75 0 111.06 1.06l-1.757 1.757a3.75 3.75 0 105.304 5.304l4.5-4.5a3.75 3.75 0 00-1.035-6.037.75.75 0 01-.354-1z" clipRule="evenodd" />
                  </svg>
                  <div className="whitespace-pre-line">{flight.toAirport}</div>
                </td>
                <td className="px-4 py-3 text-center text-gray-800 font-semibold text-sm border-r-2 border-white">
                  <div className="whitespace-pre-line">{formatTravelers(flight.travelers)}</div>
                </td>
                <td className="px-4 py-3 text-center text-gray-800 font-semibold text-sm">
                  {flight.luggage}
                </td>
              </tr>
            ))}
            {editable && onAddFlight && (
              <tr>
                <td colSpan={editable ? 6 : 5} className="px-4 py-3 text-center">
                  <button
                    onClick={onAddFlight}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium flex items-center gap-2 mx-auto"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    إضافة رحلة جديدة
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Notice Message */}
      {showNotice && noticeMessage && (
        <div className="mt-4 text-center">
          <p className="text-[#DC143C] font-bold text-base">
            {noticeMessage}
          </p>
        </div>
      )}
    </div>
  );
};

export default AirplaneSection;