"use client";

import React from 'react';

/**
 * Hotels Section Template Component
 * 
 * A template for hotel reservation information with:
 * - Blue header with building icon
 * - Dynamic hotel cards with city badges
 * - Hotel details, room info, and dates
 * - RTL support for Arabic text
 */

export interface Hotel {
  city: string;
  nights: number;
  cityBadge?: string; // e.g., "المدينة الاولى"
  hotelName: string;
  hasDetailsLink?: boolean;
  roomDescription: {
    includesAll: string; // e.g., "شامل الافطار"
    bedType: string; // e.g., "سرير اضافي/ عدد: 2"
    roomType?: string; // e.g., "غرفة ميليا"
  };
  checkInDate: string;
  checkOutDate: string;
  dayInfo: {
    checkInDay: string; // e.g., "اليوم الاول"
    checkOutDay: string; // e.g., "اليوم السادس"
  };
}

export interface HotelsSectionProps {
  // Data
  hotels?: Hotel[];
  
  // Title
  title?: string;
  showTitle?: boolean;
  
  // Language & Direction
  direction?: "rtl" | "ltr";
  language?: "ar" | "en";
  
  // Labels
  labels?: {
    nights: string; // e.g., "ليالي"
    includes: string; // e.g., "شامل الافطار"
    checkIn: string; // e.g., "تاريخ الدخول"
    checkOut: string; // e.g., "تاريخ الخروج"
    details: string; // e.g., "للتفاصيل"
    count: string; // e.g., "عدد"
  };
  
  // Customization
  className?: string;
  style?: React.CSSProperties;
}

const HotelsSection: React.FC<HotelsSectionProps> = ({
  hotels = [
    {
      city: "جزيرة بوكيت",
      nights: 5,
      cityBadge: "المدينة الاولى",
      hotelName: "منتجع بولمان بوكيت كارون بيتش",
      hasDetailsLink: false,
      roomDescription: {
        includesAll: "شامل الافطار",
        bedType: "سرير اضافي/ عدد: 2",
        roomType: "سوبريور علي الحديقه"
      },
      checkInDate: "2025-07-01",
      checkOutDate: "2025-07-06",
      dayInfo: {
        checkInDay: "اليوم الاول",
        checkOutDay: "اليوم السادس"
      }
    },
    {
      city: "شنغماي",
      nights: 4,
      cityBadge: "المدينة الثانيه",
      hotelName: "فندق فييلا شنغماي",
      hasDetailsLink: true,
      roomDescription: {
        includesAll: "شامل الافطار",
        bedType: "سرير اضافي/ عدد: 2",
        roomType: "غرفة ميليا"
      },
      checkInDate: "2025-07-06",
      checkOutDate: "2025-07-10",
      dayInfo: {
        checkInDay: "اليوم السادس",
        checkOutDay: "اليوم العاشر"
      }
    },
    {
      city: "بانكوك",
      nights: 2,
      cityBadge: "المدينة الثالثه",
      hotelName: "فندق جراند سنتر بوينت بلومبينيتشنيت",
      hasDetailsLink: true,
      roomDescription: {
        includesAll: "شامل الافطار",
        bedType: "سرير اضافي/ عدد: 2",
        roomType: "سوبريور مع بلكونه"
      },
      checkInDate: "2025-07-10",
      checkOutDate: "2025-07-12",
      dayInfo: {
        checkInDay: "اليوم العاشر",
        checkOutDay: "اليوم الثاني عشر"
      }
    }
  ],
  title = "حجز الفنادق",
  showTitle = true,
  direction = "rtl",
  language = "ar",
  labels = {
    nights: "ليالي",
    includes: "شامل الافطار",
    checkIn: "تاريخ الدخول",
    checkOut: "تاريخ الخروج",
    details: "للتفاصيل",
    count: "عدد"
  },
  className = "",
  style
}) => {
  return (
    <div className={`w-full mb-6 ${className}`} style={style} dir={direction}>
      {/* Header with Title and Icon */}
      {showTitle && (
        <div className="flex items-center justify-center mb-4">
          <div className="bg-[#3B5998] text-white px-10 py-3 rounded-full flex items-center gap-3 shadow-md">
            <h2 className="text-xl font-bold tracking-wide">{title}</h2>
            <div className="bg-white rounded-full p-2.5">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="currentColor" 
                className="w-6 h-6 text-[#3B5998]"
              >
                <path d="M19.006 3.705a.75.75 0 00-.512-1.41L6 6.838V3a.75.75 0 00-.75-.75h-1.5A.75.75 0 003 3v4.93l-1.006.365a.75.75 0 00.512 1.41l16.5-6z" />
                <path fillRule="evenodd" d="M3.019 11.115L18 5.667V9.09l4.006 1.456a.75.75 0 11-.512 1.41l-.494-.18v8.475h.75a.75.75 0 010 1.5H2.25a.75.75 0 010-1.5H3v-9.129l.019-.007zM18 20.25v-9.565l1.5.545v9.02H18zm-9-6a.75.75 0 00-.75.75v4.5c0 .414.336.75.75.75h3a.75.75 0 00.75-.75V15a.75.75 0 00-.75-.75H9z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Hotel Cards */}
      <div className="space-y-4">
        {hotels.map((hotel, index) => (
          <div 
            key={index} 
            className="border-2 border-blue-300 rounded-2xl p-4 bg-white shadow-md relative"
          >
            {/* City Badge */}
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 flex items-center gap-2">
              <div className="bg-[#FF6B35] text-white px-4 py-1 rounded-full text-sm font-bold">
                {hotel.cityBadge}
              </div>
              <div className="bg-[#1E88E5] text-white px-6 py-1.5 rounded-full text-base font-bold flex items-center gap-2">
                <span className="bg-white text-[#1E88E5] px-3 py-0.5 rounded-full text-sm">
                  {hotel.nights} {labels.nights}
                </span>
                <span>{hotel.city}</span>
              </div>
            </div>

            {/* Day Info - Right Side */}
            <div className="absolute top-6 right-4 text-right text-sm font-semibold text-[#1E88E5] space-y-1">
              <div>{hotel.dayInfo.checkInDay}</div>
              <div>{hotel.dayInfo.checkOutDay}</div>
            </div>

            {/* Hotel Name Bar */}
            <div className="mt-6 bg-[#1E88E5] text-white px-4 py-2.5 rounded-lg flex items-center justify-between">
              <span className="font-bold text-base">{hotel.hotelName}</span>
              {hotel.hasDetailsLink && (
                <div className="bg-white rounded-full p-1.5 flex items-center gap-1 px-3">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="currentColor" 
                    className="w-4 h-4 text-[#4FC3F7]"
                  >
                    <path fillRule="evenodd" d="M19.902 4.098a3.75 3.75 0 00-5.304 0l-4.5 4.5a3.75 3.75 0 001.035 6.037.75.75 0 01-.646 1.353 5.25 5.25 0 01-1.449-8.45l4.5-4.5a5.25 5.25 0 117.424 7.424l-1.757 1.757a.75.75 0 11-1.06-1.06l1.757-1.757a3.75 3.75 0 000-5.304zm-7.389 4.267a.75.75 0 011-.353 5.25 5.25 0 011.449 8.45l-4.5 4.5a5.25 5.25 0 11-7.424-7.424l1.757-1.757a.75.75 0 111.06 1.06l-1.757 1.757a3.75 3.75 0 105.304 5.304l4.5-4.5a3.75 3.75 0 00-1.035-6.037.75.75 0 01-.354-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[#1E88E5] text-xs font-bold">{labels.details}</span>
                </div>
              )}
            </div>

            {/* Room Details */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="bg-[#1E88E5] text-white px-4 py-2 rounded-lg text-center font-semibold text-sm">
                {hotel.roomDescription.includesAll}
              </div>
              {hotel.roomDescription.roomType && (
                <div className="bg-[#1E88E5] text-white px-4 py-2 rounded-lg text-center font-semibold text-sm">
                  {hotel.roomDescription.roomType}
                </div>
              )}
            </div>

            <div className="mt-2">
              <div className="bg-[#1E88E5] text-white px-4 py-2 rounded-lg text-center font-semibold text-sm">
                {hotel.roomDescription.bedType}
              </div>
            </div>

            {/* Date Section */}
            <div className="mt-3 bg-[#FF6B35] text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-3 text-sm font-bold">
              <span>{labels.checkIn} {hotel.checkInDate}</span>
              <div className="flex gap-1">
                <span>《</span>
                <span>《</span>
                <span>《</span>
              </div>
              <span>{labels.checkOut} {hotel.checkOutDate}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HotelsSection;

export const HotelsSectionTemplate = HotelsSection;