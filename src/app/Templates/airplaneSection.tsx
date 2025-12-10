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
  className = "",
  style
}) => {
  const formatTravelers = (travelers: { adults: number; children: number; infants: number }) => {
    const parts = [];
    if (travelers.adults > 0) parts.push(`${language === 'ar' ? 'البالغين:' : 'Adults:'}${travelers.adults}`);
    if (travelers.children > 0) parts.push(`${language === 'ar' ? 'الاطفال:' : 'Children:'}${travelers.children}`);
    if (travelers.infants > 0) parts.push(`${language === 'ar' ? 'رضيع:' : 'Infants:'}${travelers.infants}`);
    return parts.join('\n');
  };

  return (
    <div className={`w-full mb-6 ${className}`} style={style} dir={direction}>
      {/* Header with Title and Icon */}
      {showTitle && (
        <div className="flex items-center justify-center mb-3">
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
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl shadow-md">
        <table className="w-full border-collapse">
          {/* Column Headers */}
          <thead>
            <tr className="bg-[#F5A623]">
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
              <tr key={index} className="bg-[#E8E8E8]">
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