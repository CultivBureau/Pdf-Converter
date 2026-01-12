"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { Hotel } from '../Templates/HotelsSection';
import { getCompanySettings, getIncludesAllOptions, addIncludesAllOptionUser } from "@/app/services/CompanySettingsApi";
import AddIncludesAllOptionModal from "./AddIncludesAllOptionModal";

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
    }
  }, [isOpen, includesAllOptions]);

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
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#3B5998] to-[#2E4A7A] px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.006 3.705a.75.75 0 00-.512-1.41L6 6.838V3a.75.75 0 00-.75-.75h-1.5A.75.75 0 003 3v4.93l-1.006.365a.75.75 0 00.512 1.41l16.5-6z" />
              <path fillRule="evenodd" d="M3.019 11.115L18 5.667V9.09l4.006 1.456a.75.75 0 11-.512 1.41l-.494-.18v8.475h.75a.75.75 0 010 1.5H2.25a.75.75 0 010-1.5H3v-9.129l.019-.007zM18 20.25v-9.565l1.5.545v9.02H18zm-9-6a.75.75 0 00-.75.75v4.5c0 .414.336.75.75.75h3a.75.75 0 00.75-.75V15a.75.75 0 00-.75-.75H9z" clipRule="evenodd" />
            </svg>
            Add Hotel Section
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
          {/* Section Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Section Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B5998] focus:border-transparent"
              placeholder="Hotel Booking"
            />
            <div className="mt-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="showTitle"
                checked={showTitle}
                onChange={(e) => setShowTitle(e.target.checked)}
                className="w-4 h-4 text-[#3B5998] rounded focus:ring-[#3B5998]"
              />
              <label htmlFor="showTitle" className="text-sm text-gray-700">
                Show Title
              </label>
            </div>
          </div>

          {/* Language & Direction */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Language
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
                <option value="ar">Arabic</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Direction
              </label>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as "rtl" | "ltr")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B5998] focus:border-transparent"
              >
                <option value="rtl">Right to Left (RTL)</option>
                <option value="ltr">Left to Right (LTR)</option>
              </select>
            </div>
          </div>

          {/* Hotels */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-semibold text-gray-700">
                Hotels ({hotels.length})
              </label>
              <button
                type="button"
                onClick={addHotel}
                className="px-3 py-1.5 bg-[#3B5998] text-white rounded-lg hover:bg-[#2E4A7A] transition-colors text-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Hotel
              </button>
            </div>
            
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {hotels.map((hotel, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-700">Hotel {index + 1}</span>
                    {hotels.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeHotel(index)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={hotel.city}
                        onChange={(e) => updateHotel(index, 'city', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#3B5998] focus:border-transparent text-sm ${
                          errors[`hotel_${index}_city`] ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder="City name..."
                      />
                      {errors[`hotel_${index}_city`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`hotel_${index}_city`]}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Nights
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
                      City Badge (Optional)
                    </label>
                    <input
                      type="text"
                      value={hotel.cityBadge || ""}
                      onChange={(e) => updateHotel(index, 'cityBadge', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B5998] focus:border-transparent text-sm"
                      placeholder="المدينة الاولى"
                    />
                  </div>

                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Hotel Name
                    </label>
                    <input
                      type="text"
                      value={hotel.hotelName}
                      onChange={(e) => updateHotel(index, 'hotelName', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#3B5998] focus:border-transparent text-sm ${
                        errors[`hotel_${index}_hotelName`] ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Hotel name..."
                    />
                    {errors[`hotel_${index}_hotelName`] && (
                      <p className="text-red-500 text-xs mt-1">{errors[`hotel_${index}_hotelName`]}</p>
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Check-in Date
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
                        Check-out Date
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
                        Check-in Day
                      </label>
                      <input
                        type="text"
                        value={hotel.dayInfo.checkInDay}
                        onChange={(e) => updateHotel(index, 'dayInfo', { ...hotel.dayInfo, checkInDay: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B5998] focus:border-transparent text-sm"
                        placeholder="اليوم الاول"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Check-out Day
                      </label>
                      <input
                        type="text"
                        value={hotel.dayInfo.checkOutDay}
                        onChange={(e) => updateHotel(index, 'dayInfo', { ...hotel.dayInfo, checkOutDay: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B5998] focus:border-transparent text-sm"
                        placeholder="اليوم الثاني"
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Includes All
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
                          title={language === 'ar' ? 'إضافة خيار جديد' : 'Add new option'}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      )}
                    </div>
                    {includesAllOptions.length === 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        No options available. Click the + button to add one.
                      </p>
                    )}
                  </div>

                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Room Type (Optional)
                    </label>
                    <input
                      type="text"
                      value={hotel.roomDescription.roomType || ""}
                      onChange={(e) => updateHotel(index, 'roomDescription', { ...hotel.roomDescription, roomType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B5998] focus:border-transparent text-sm"
                      placeholder="غرفة ميليا"
                    />
                  </div>

                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Bed Type
                    </label>
                    <input
                      type="text"
                      value={hotel.roomDescription.bedType}
                      onChange={(e) => updateHotel(index, 'roomDescription', { ...hotel.roomDescription, bedType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B5998] focus:border-transparent text-sm"
                      placeholder="سرير اضافي/ عدد: 2"
                    />
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`hasDetailsLink_${index}`}
                      checked={hotel.hasDetailsLink || false}
                      onChange={(e) => updateHotel(index, 'hasDetailsLink', e.target.checked)}
                      className="w-4 h-4 text-[#3B5998] rounded focus:ring-[#3B5998]"
                    />
                    <label htmlFor={`hasDetailsLink_${index}`} className="text-xs text-gray-700">
                      Has Details Link
                    </label>
                  </div>

                  {hotel.hasDetailsLink && (
                    <div className="mt-3">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Details Link URL
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
            className="px-5 py-2 bg-gradient-to-r from-[#3B5998] to-[#2E4A7A] text-white rounded-lg hover:from-[#2E4A7A] hover:to-[#1E3A5A] transition-all shadow-md hover:shadow-lg font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Section
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

