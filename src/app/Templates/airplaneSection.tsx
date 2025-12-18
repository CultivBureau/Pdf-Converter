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
 * - Enhanced UI with perfect layout and responsive design
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
  onDeleteSection?: () => void;
  
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
  title,
  showTitle = true,
  noticeMessage,
  showNotice = true,
  direction = "rtl",
  language = "ar",
  columnLabels,
  editable = false,
  id,
  sectionId,
  onEditFlight,
  onRemoveFlight,
  onAddFlight,
  onEditSection,
  onDeleteSection,
  className = "",
  style
}) => {
  const sectionIdValue = id || sectionId;
  
  // Set default values based on language
  const defaultTitle = title || (language === 'ar' ? 'حجز الطيران' : 'Flight Booking');
  const defaultNotice = noticeMessage || (language === 'ar' 
    ? 'التواجد في صاله المطار قبل الاقلاع بساعتين' 
    : 'Please arrive at the airport 2 hours before departure');
  const defaultColumnLabels = columnLabels || (language === 'ar' ? {
    date: "التاريخ",
    fromAirport: "من مطار",
    toAirport: "الى مطار",
    travelers: "المسافرين",
    luggage: "الأمتعه"
  } : {
    date: "Date",
    fromAirport: "From Airport",
    toAirport: "To Airport",
    travelers: "Travelers",
    luggage: "Luggage"
  });
  
  const formatTravelers = (travelers: { adults: number; children: number; infants: number } | undefined) => {
    if (!travelers) {
      return null;
    }
    const parts = [];
    if (travelers.adults > 0) {
      parts.push(
        <span key="adults" className="block">
          <span className="font-semibold">{language === 'ar' ? 'البالغين: ' : 'Adults: '}</span>
          <span className="text-[#4A5568]">{travelers.adults}</span>
        </span>
      );
    }
    if (travelers.children > 0) {
      parts.push(
        <span key="children" className="block">
          <span className="font-semibold">{language === 'ar' ? 'الأطفال: ' : 'Children: '}</span>
          <span className="text-[#4A5568]">{travelers.children}</span>
        </span>
      );
    }
    if (travelers.infants > 0) {
      parts.push(
        <span key="infants" className="block">
          <span className="font-semibold">{language === 'ar' ? 'رضيع: ' : 'Infants: '}</span>
          <span className="text-[#4A5568]">{travelers.infants}</span>
        </span>
      );
    }
    return parts.length > 0 ? <div className="space-y-0.5">{parts}</div> : null;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      // Format as dd/mm/yyyy (Gregorian/Melady calendar)
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      
      return `${day}/${month}/${year}`;
    } catch {
      return dateString;
    }
  };

  return (
    <div 
      className={`w-full mb-8 ${className} no-break`} 
      style={style} 
      dir={direction} 
      data-airplane-section-id={sectionIdValue}
    >
      {/* Header with Title and Icon */}
      {showTitle && (
        <div className="flex items-center justify-center mb-6 relative">
          <div className={`bg-[#4A5568] text-white px-10 py-3.5 rounded-full flex items-center gap-3.5 shadow-lg hover:shadow-xl transition-shadow duration-300 ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
            <h2 className="text-xl md:text-2xl font-bold tracking-wide">{defaultTitle}</h2>
            <div className="bg-white rounded-full p-2.5 shadow-inner">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="currentColor" 
                className="w-6 h-6 text-[#4A5568]"
              >
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
            </div>
          </div>
          {editable && (
            <div className={`absolute top-1/2 -translate-y-1/2 flex gap-2 z-10 ${direction === 'rtl' ? 'right-0' : 'left-0'}`}>
              <button
                onClick={(e) => {
                  // Support prop handler if provided (for backward compatibility)
                  // Event delegation will handle this when rendered in preview
                  if (onEditSection) {
                    e.stopPropagation();
                    onEditSection();
                  }
                }}
                data-action="edit-section"
                data-airplane-section-id={sectionIdValue}
                className="p-2.5 bg-[#4A5568] text-white rounded-full hover:bg-[#2D3748] transition-all duration-200 shadow-md hover:shadow-lg hover:scale-110"
                title={language === 'ar' ? 'تعديل القسم' : 'Edit Section'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  // Support prop handler if provided (for backward compatibility)
                  // Event delegation will handle this when rendered in preview
                  if (onDeleteSection) {
                    e.stopPropagation();
                    onDeleteSection();
                  }
                }}
                data-action="delete-section"
                data-airplane-section-id={sectionIdValue}
                className="p-2.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-110"
                title={language === 'ar' ? 'حذف القسم' : 'Delete Section'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-hidden rounded-2xl shadow-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[600px]">
          {/* Column Headers */}
          <thead>
            <tr className="bg-[#F5A623]">
              {editable && (
                  <th className="px-3 py-4 text-center text-white font-bold text-xs md:text-sm border-r-2 border-white/30 min-w-[80px]">
                    <div className="flex items-center justify-center">
                      <span>{language === 'ar' ? 'إجراءات' : 'Actions'}</span>
                    </div>
                  </th>
                )}
                <th className="px-4 py-4 text-center text-white font-bold text-sm md:text-base border-r-2 border-white/30 whitespace-nowrap">
                  {defaultColumnLabels.date}
                </th>
                <th className="px-4 py-4 text-center text-white font-bold text-sm md:text-base border-r-2 border-white/30 min-w-[180px]">
                  {defaultColumnLabels.fromAirport}
              </th>
                <th className="px-4 py-4 text-center text-white font-bold text-sm md:text-base border-r-2 border-white/30 min-w-[180px]">
                  {defaultColumnLabels.toAirport}
              </th>
                <th className="px-4 py-4 text-center text-white font-bold text-sm md:text-base border-r-2 border-white/30 min-w-[140px]">
                  {defaultColumnLabels.travelers}
              </th>
                <th className="px-4 py-4 text-center text-white font-bold text-sm md:text-base min-w-[100px]">
                  {defaultColumnLabels.luggage}
              </th>
            </tr>
          </thead>

          {/* Data Rows */}
          <tbody>
            {flights.map((flight, index) => {
              // Ensure travelers has default values
              const safeTravelers = flight.travelers || { adults: 0, children: 0, infants: 0 };
              
              return (
                <tr 
                  key={index} 
                  className="bg-[#E8E8E8] hover:bg-[#D8D8D8] transition-colors duration-200 border-b-2 border-white group"
                >
                {editable && (
                    <td className="px-3 py-4 border-r-2 border-white/50">
                      <div className="flex flex-col gap-2 items-center">
                      <button
                        onClick={(e) => {
                          // Support prop handler if provided (for backward compatibility)
                          // Event delegation will handle this when rendered in preview
                          if (onEditFlight) {
                            e.stopPropagation();
                            onEditFlight(index);
                          }
                        }}
                        data-action="edit-flight"
                        data-airplane-section-id={sectionIdValue}
                        data-flight-index={index}
                        className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-110"
                        title={language === 'ar' ? 'تعديل' : 'Edit'}
                      >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      {flights.length > 1 && (
                        <button
                          onClick={(e) => {
                            // Support prop handler if provided (for backward compatibility)
                            // Event delegation will handle this when rendered in preview
                            if (onRemoveFlight) {
                              e.stopPropagation();
                              onRemoveFlight(index);
                            }
                          }}
                          data-action="remove-flight"
                          data-airplane-section-id={sectionIdValue}
                          data-flight-index={index}
                          className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-110"
                          title={language === 'ar' ? 'حذف' : 'Delete'}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                )}
                  <td className="px-4 py-4 text-center text-gray-800 font-semibold text-sm md:text-base border-r-2 border-white/50">
                    <div className="flex flex-col items-center">
                      <span className="text-[#4A5568] font-bold">{formatDate(flight.date)}</span>
                    </div>
                </td>
                  <td className="px-4 py-4 text-center text-gray-800 font-semibold text-sm md:text-base border-r-2 border-white/50">
                    <div className={`flex items-center justify-center gap-2 ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 24 24" 
                        fill="currentColor" 
                        className="w-5 h-5 text-[#4A5568] shrink-0"
                      >
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                      <div className="whitespace-pre-line leading-relaxed text-[#2D3748]">{flight.fromAirport}</div>
                    </div>
                </td>
                  <td className="px-4 py-4 text-center text-gray-800 font-semibold text-sm md:text-base border-r-2 border-white/50">
                    <div className={`flex items-center justify-center gap-2 ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="currentColor" 
                        className="w-5 h-5 text-[#4FC3F7] shrink-0"
                  >
                    <path fillRule="evenodd" d="M19.902 4.098a3.75 3.75 0 00-5.304 0l-4.5 4.5a3.75 3.75 0 001.035 6.037.75.75 0 01-.646 1.353 5.25 5.25 0 01-1.449-8.45l4.5-4.5a5.25 5.25 0 117.424 7.424l-1.757 1.757a.75.75 0 11-1.06-1.06l1.757-1.757a3.75 3.75 0 000-5.304zm-7.389 4.267a.75.75 0 011-.353 5.25 5.25 0 011.449 8.45l-4.5 4.5a5.25 5.25 0 11-7.424-7.424l1.757-1.757a.75.75 0 111.06 1.06l-1.757 1.757a3.75 3.75 0 105.304 5.304l4.5-4.5a3.75 3.75 0 00-1.035-6.037.75.75 0 01-.354-1z" clipRule="evenodd" />
                  </svg>
                      <div className="whitespace-pre-line leading-relaxed text-[#2D3748]">{flight.toAirport}</div>
                    </div>
                </td>
                  <td className="px-4 py-4 text-center text-gray-800 font-semibold text-sm md:text-base border-r-2 border-white/50">
                    <div className="flex items-center justify-center">
                      {formatTravelers(safeTravelers)}
                    </div>
                </td>
                  <td className="px-4 py-4 text-center text-gray-800 font-semibold text-sm md:text-base">
                    <div className={`flex items-center justify-center gap-2 ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 24 24" 
                        fill="currentColor" 
                        className="w-5 h-5 text-[#4A5568] shrink-0"
                      >
                        <path d="M19 7h-3V6a4 4 0 00-8 0v1H5a1 1 0 00-1 1v11a3 3 0 003 3h10a3 3 0 003-3V8a1 1 0 00-1-1zM10 6a2 2 0 014 0v1h-4V6zm8 13a1 1 0 01-1 1H7a1 1 0 01-1-1V9h12v10z"/>
                      </svg>
                      <span className="text-[#2D3748]">{flight.luggage || ''}</span>
                    </div>
                </td>
              </tr>
              );
            })}
            {editable && (
                <tr className="bg-gray-50 hover:bg-gray-100 transition-colors">
                  <td colSpan={editable ? 6 : 5} className="px-4 py-5 text-center">
                  <button
                    onClick={(e) => {
                      // Support prop handler if provided (for backward compatibility)
                      // Event delegation will handle this when rendered in preview
                      if (onAddFlight) {
                        e.stopPropagation();
                        onAddFlight();
                      }
                    }}
                    data-action="add-flight"
                    data-airplane-section-id={sectionIdValue}
                    className="px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all duration-200 text-sm md:text-base font-medium flex items-center gap-2 mx-auto shadow-md hover:shadow-lg hover:scale-105"
                  >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                      {language === 'ar' ? 'إضافة رحلة جديدة' : 'Add New Flight'}
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Notice Message */}
      {showNotice && defaultNotice && (
        <div className="mt-6 text-center">
          <div className={`inline-flex items-center gap-3 bg-red-50 border-2 border-[#DC143C] rounded-2xl px-6 py-4 shadow-md ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              className="w-6 h-6 text-[#DC143C] shrink-0"
            >
              <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
            </svg>
            <p className="text-[#DC143C] font-bold text-base md:text-lg leading-relaxed">
              {defaultNotice}
          </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AirplaneSection;