"use client";

import React, { useState, useEffect } from "react";

export interface HotelsSectionData {
  title: string;
  hotels: {
    city: string;
    nights: number;
    cityBadge?: string;
    hotelName: string;
    hasDetailsLink?: boolean;
    roomDescription: {
      includesAll: string;
      bedType: string;
      roomType?: string;
    };
    checkInDate: string;
    checkOutDate: string;
    dayInfo: {
      checkInDay: string;
      checkOutDay: string;
    };
  }[];
  showTitle?: boolean;
}

interface HotelsSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: HotelsSectionData) => void;
  initialData?: HotelsSectionData;
}

export default function HotelsSectionModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: HotelsSectionModalProps) {
  const [title, setTitle] = useState("حجز الفنادق");
  const [showTitle, setShowTitle] = useState(true);
  const [hotels, setHotels] = useState<HotelsSectionData["hotels"]>([
    {
      city: "",
      nights: 0,
      cityBadge: "",
      hotelName: "",
      hasDetailsLink: false,
      roomDescription: {
        includesAll: "",
        bedType: "",
        roomType: "",
      },
      checkInDate: "",
      checkOutDate: "",
      dayInfo: {
        checkInDay: "",
        checkOutDay: "",
      },
    },
  ]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Reset form when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Pre-fill with initial data for editing
        setTitle(initialData.title || "حجز الفنادق");
        setShowTitle(initialData.showTitle !== undefined ? initialData.showTitle : true);
        setHotels(initialData.hotels.length > 0 ? initialData.hotels : [
          {
            city: "",
            nights: 0,
            cityBadge: "",
            hotelName: "",
            hasDetailsLink: false,
            roomDescription: {
              includesAll: "",
              bedType: "",
              roomType: "",
            },
            checkInDate: "",
            checkOutDate: "",
            dayInfo: {
              checkInDay: "",
              checkOutDay: "",
            },
          },
        ]);
      } else {
        // Reset to defaults for new section
        setTitle("حجز الفنادق");
        setShowTitle(true);
        setHotels([
          {
            city: "",
            nights: 0,
            cityBadge: "",
            hotelName: "",
            hasDetailsLink: false,
            roomDescription: {
              includesAll: "",
              bedType: "",
              roomType: "",
            },
            checkInDate: "",
            checkOutDate: "",
            dayInfo: {
              checkInDay: "",
              checkOutDay: "",
            },
          },
        ]);
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (hotels.length === 0) {
      newErrors.hotels = "يجب إضافة فندق واحد على الأقل";
    }

    hotels.forEach((hotel, index) => {
      if (!hotel.city.trim()) {
        newErrors[`hotel_${index}_city`] = "المدينة مطلوبة";
      }
      if (hotel.nights <= 0) {
        newErrors[`hotel_${index}_nights`] = "عدد الليالي مطلوب";
      }
      if (!hotel.hotelName.trim()) {
        newErrors[`hotel_${index}_hotelName`] = "اسم الفندق مطلوب";
      }
      if (!hotel.roomDescription.includesAll.trim()) {
        newErrors[`hotel_${index}_includesAll`] = "نوع الإفطار مطلوب";
      }
      if (!hotel.roomDescription.bedType.trim()) {
        newErrors[`hotel_${index}_bedType`] = "نوع السرير مطلوب";
      }
      if (!hotel.checkInDate.trim()) {
        newErrors[`hotel_${index}_checkInDate`] = "تاريخ الدخول مطلوب";
      }
      if (!hotel.checkOutDate.trim()) {
        newErrors[`hotel_${index}_checkOutDate`] = "تاريخ الخروج مطلوب";
      }
      if (!hotel.dayInfo.checkInDay.trim()) {
        newErrors[`hotel_${index}_checkInDay`] = "يوم الدخول مطلوب";
      }
      if (!hotel.dayInfo.checkOutDay.trim()) {
        newErrors[`hotel_${index}_checkOutDay`] = "يوم الخروج مطلوب";
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

    onSubmit({
      title,
      hotels,
      showTitle,
    });

    onClose();
  };

  const addHotel = () => {
    setHotels([
      ...hotels,
      {
        city: "",
        nights: 0,
        cityBadge: "",
        hotelName: "",
        hasDetailsLink: false,
        roomDescription: {
          includesAll: "",
          bedType: "",
          roomType: "",
        },
        checkInDate: "",
        checkOutDate: "",
        dayInfo: {
          checkInDay: "",
          checkOutDay: "",
        },
      },
    ]);
  };

  const removeHotel = (index: number) => {
    if (hotels.length > 1) {
      setHotels(hotels.filter((_, i) => i !== index));
    }
  };

  const updateHotel = (index: number, field: string, value: any) => {
    const newHotels = [...hotels];
    if (field === "roomDescription") {
      newHotels[index].roomDescription = {
        ...newHotels[index].roomDescription,
        ...value,
      };
    } else if (field === "dayInfo") {
      newHotels[index].dayInfo = { ...newHotels[index].dayInfo, ...value };
    } else {
      (newHotels[index] as any)[field] = value;
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
      dir="rtl"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#3B5998] to-[#2E4A7A] px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19.006 3.705a.75.75 0 00-.512-1.41L6 6.838V3a.75.75 0 00-.75-.75h-1.5A.75.75 0 003 3v4.93l-1.006.365a.75.75 0 00.512 1.41l16.5-6z"
              />
              <path
                fillRule="evenodd"
                d="M3.019 11.115L18 5.667V9.09l4.006 1.456a.75.75 0 11-.512 1.41l-.494-.18v8.475h.75a.75.75 0 010 1.5H2.25a.75.75 0 010-1.5H3v-9.129l.019-.007zM18 20.25v-9.565l1.5.545v9.02H18zm-9-6a.75.75 0 00-.75.75v4.5c0 .414.336.75.75.75h3a.75.75 0 00.75-.75V15a.75.75 0 00-.75-.75H9z"
                clipRule="evenodd"
              />
            </svg>
            إضافة قسم الفنادق
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
            aria-label="إغلاق"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">عنوان القسم</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B5998] focus:border-transparent"
              placeholder="حجز الفنادق"
            />
            <div className="mt-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="showTitle"
                checked={showTitle}
                onChange={(e) => setShowTitle(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="showTitle" className="text-sm text-gray-700">
                إظهار العنوان
              </label>
            </div>
          </div>

          {/* Hotels */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-gray-700">الفنادق</label>
              <button
                type="button"
                onClick={addHotel}
                className="px-3 py-1.5 bg-[#3B5998] text-white rounded-lg text-sm hover:bg-[#2E4A7A] transition-colors"
              >
                + إضافة فندق
              </button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {hotels.map((hotel, index) => (
                <div
                  key={index}
                  className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-800">فندق {index + 1}</h3>
                    {hotels.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeHotel(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        حذف
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* City */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        المدينة
                      </label>
                      <input
                        type="text"
                        value={hotel.city}
                        onChange={(e) => updateHotel(index, "city", e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#3B5998] focus:border-transparent text-sm ${
                          errors[`hotel_${index}_city`] ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder="جزيرة بوكيت"
                      />
                      {errors[`hotel_${index}_city`] && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors[`hotel_${index}_city`]}
                        </p>
                      )}
                    </div>

                    {/* Nights */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        عدد الليالي
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={hotel.nights}
                        onChange={(e) =>
                          updateHotel(index, "nights", parseInt(e.target.value) || 0)
                        }
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#3B5998] focus:border-transparent text-sm ${
                          errors[`hotel_${index}_nights`] ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors[`hotel_${index}_nights`] && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors[`hotel_${index}_nights`]}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* City Badge */}
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      شارة المدينة (اختياري)
                    </label>
                    <input
                      type="text"
                      value={hotel.cityBadge || ""}
                      onChange={(e) => updateHotel(index, "cityBadge", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B5998] focus:border-transparent text-sm"
                      placeholder="المدينة الاولى"
                    />
                  </div>

                  {/* Hotel Name */}
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      اسم الفندق
                    </label>
                    <input
                      type="text"
                      value={hotel.hotelName}
                      onChange={(e) => updateHotel(index, "hotelName", e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#3B5998] focus:border-transparent text-sm ${
                        errors[`hotel_${index}_hotelName`] ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="منتجع بولمان بوكيت كارون بيتش"
                    />
                    {errors[`hotel_${index}_hotelName`] && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors[`hotel_${index}_hotelName`]}
                      </p>
                    )}
                  </div>

                  {/* Room Description */}
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        نوع الإفطار
                      </label>
                      <input
                        type="text"
                        value={hotel.roomDescription.includesAll}
                        onChange={(e) =>
                          updateHotel(index, "roomDescription", {
                            includesAll: e.target.value,
                          })
                        }
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#3B5998] focus:border-transparent text-sm ${
                          errors[`hotel_${index}_includesAll`] ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder="شامل الافطار"
                      />
                      {errors[`hotel_${index}_includesAll`] && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors[`hotel_${index}_includesAll`]}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        نوع السرير
                      </label>
                      <input
                        type="text"
                        value={hotel.roomDescription.bedType}
                        onChange={(e) =>
                          updateHotel(index, "roomDescription", {
                            bedType: e.target.value,
                          })
                        }
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#3B5998] focus:border-transparent text-sm ${
                          errors[`hotel_${index}_bedType`] ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder="سرير اضافي/ عدد: 2"
                      />
                      {errors[`hotel_${index}_bedType`] && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors[`hotel_${index}_bedType`]}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        نوع الغرفة (اختياري)
                      </label>
                      <input
                        type="text"
                        value={hotel.roomDescription.roomType || ""}
                        onChange={(e) =>
                          updateHotel(index, "roomDescription", {
                            roomType: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B5998] focus:border-transparent text-sm"
                        placeholder="سوبريور علي الحديقه"
                      />
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="mt-3 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        تاريخ الدخول
                      </label>
                      <input
                        type="date"
                        value={hotel.checkInDate}
                        onChange={(e) => updateHotel(index, "checkInDate", e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#3B5998] focus:border-transparent text-sm ${
                          errors[`hotel_${index}_checkInDate`] ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors[`hotel_${index}_checkInDate`] && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors[`hotel_${index}_checkInDate`]}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        تاريخ الخروج
                      </label>
                      <input
                        type="date"
                        value={hotel.checkOutDate}
                        onChange={(e) => updateHotel(index, "checkOutDate", e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#3B5998] focus:border-transparent text-sm ${
                          errors[`hotel_${index}_checkOutDate`] ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors[`hotel_${index}_checkOutDate`] && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors[`hotel_${index}_checkOutDate`]}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Day Info */}
                  <div className="mt-3 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        يوم الدخول
                      </label>
                      <input
                        type="text"
                        value={hotel.dayInfo.checkInDay}
                        onChange={(e) =>
                          updateHotel(index, "dayInfo", {
                            checkInDay: e.target.value,
                          })
                        }
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#3B5998] focus:border-transparent text-sm ${
                          errors[`hotel_${index}_checkInDay`] ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder="اليوم الاول"
                      />
                      {errors[`hotel_${index}_checkInDay`] && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors[`hotel_${index}_checkInDay`]}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        يوم الخروج
                      </label>
                      <input
                        type="text"
                        value={hotel.dayInfo.checkOutDay}
                        onChange={(e) =>
                          updateHotel(index, "dayInfo", {
                            checkOutDay: e.target.value,
                          })
                        }
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#3B5998] focus:border-transparent text-sm ${
                          errors[`hotel_${index}_checkOutDay`] ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder="اليوم السادس"
                      />
                      {errors[`hotel_${index}_checkOutDay`] && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors[`hotel_${index}_checkOutDay`]}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Has Details Link */}
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`hasDetailsLink_${index}`}
                      checked={hotel.hasDetailsLink}
                      onChange={(e) => updateHotel(index, "hasDetailsLink", e.target.checked)}
                      className="w-4 h-4"
                    />
                    <label htmlFor={`hasDetailsLink_${index}`} className="text-sm text-gray-700">
                      إظهار رابط التفاصيل
                    </label>
                  </div>
                </div>
              ))}
            </div>
            {errors.hotels && <p className="text-red-500 text-xs mt-2">{errors.hotels}</p>}
          </div>
        </form>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            إلغاء
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-5 py-2 bg-gradient-to-r from-[#3B5998] to-[#2E4A7A] text-white rounded-lg hover:from-[#2E4A7A] hover:to-[#1E3A5A] transition-all shadow-md hover:shadow-lg font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            حفظ
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

