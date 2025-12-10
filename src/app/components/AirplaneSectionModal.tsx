"use client";

import React, { useState, useEffect } from "react";

export interface AirplaneSectionData {
  title: string;
  flights: {
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
  noticeMessage: string;
  showTitle?: boolean;
  showNotice?: boolean;
}

interface AirplaneSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AirplaneSectionData) => void;
  initialData?: AirplaneSectionData;
}

export default function AirplaneSectionModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: AirplaneSectionModalProps) {
  const [title, setTitle] = useState("حجز الطيران");
  const [noticeMessage, setNoticeMessage] = useState("التواجد في صاله المطار قبل الاقلاع بساعتين");
  const [showTitle, setShowTitle] = useState(true);
  const [showNotice, setShowNotice] = useState(true);
  const [flights, setFlights] = useState<AirplaneSectionData["flights"]>([
    {
      date: "",
      fromAirport: "",
      toAirport: "",
      travelers: { adults: 0, children: 0, infants: 0 },
      luggage: "",
    },
  ]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Reset form when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Pre-fill with initial data for editing
        setTitle(initialData.title || "حجز الطيران");
        setNoticeMessage(initialData.noticeMessage || "التواجد في صاله المطار قبل الاقلاع بساعتين");
        setShowTitle(initialData.showTitle !== undefined ? initialData.showTitle : true);
        setShowNotice(initialData.showNotice !== undefined ? initialData.showNotice : true);
        setFlights(initialData.flights.length > 0 ? initialData.flights : [
          {
            date: "",
            fromAirport: "",
            toAirport: "",
            travelers: { adults: 0, children: 0, infants: 0 },
            luggage: "",
          },
        ]);
      } else {
        // Reset to defaults for new section
        setTitle("حجز الطيران");
        setNoticeMessage("التواجد في صاله المطار قبل الاقلاع بساعتين");
        setShowTitle(true);
        setShowNotice(true);
        setFlights([
          {
            date: "",
            fromAirport: "",
            toAirport: "",
            travelers: { adults: 0, children: 0, infants: 0 },
            luggage: "",
          },
        ]);
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (flights.length === 0) {
      newErrors.flights = "يجب إضافة رحلة واحدة على الأقل";
    }

    flights.forEach((flight, index) => {
      if (!flight.date.trim()) {
        newErrors[`flight_${index}_date`] = "التاريخ مطلوب";
      }
      if (!flight.fromAirport.trim()) {
        newErrors[`flight_${index}_fromAirport`] = "مطار المغادرة مطلوب";
      }
      if (!flight.toAirport.trim()) {
        newErrors[`flight_${index}_toAirport`] = "مطار الوصول مطلوب";
      }
      if (flight.travelers.adults === 0 && flight.travelers.children === 0 && flight.travelers.infants === 0) {
        newErrors[`flight_${index}_travelers`] = "يجب تحديد عدد المسافرين";
      }
      if (!flight.luggage.trim()) {
        newErrors[`flight_${index}_luggage`] = "الأمتعة مطلوبة";
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
      flights,
      noticeMessage,
      showTitle,
      showNotice,
    });

    onClose();
  };

  const addFlight = () => {
    setFlights([
      ...flights,
      {
        date: "",
        fromAirport: "",
        toAirport: "",
        travelers: { adults: 0, children: 0, infants: 0 },
        luggage: "",
      },
    ]);
  };

  const removeFlight = (index: number) => {
    if (flights.length > 1) {
      setFlights(flights.filter((_, i) => i !== index));
    }
  };

  const updateFlight = (index: number, field: string, value: any) => {
    const newFlights = [...flights];
    if (field === "travelers") {
      newFlights[index].travelers = { ...newFlights[index].travelers, ...value };
    } else {
      (newFlights[index] as any)[field] = value;
    }
    setFlights(newFlights);
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#4A5568] to-[#2D3748] px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z"
              />
            </svg>
            إضافة قسم الطيران
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5568] focus:border-transparent"
              placeholder="حجز الطيران"
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

          {/* Flights */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-gray-700">الرحلات</label>
              <button
                type="button"
                onClick={addFlight}
                className="px-3 py-1.5 bg-[#4A5568] text-white rounded-lg text-sm hover:bg-[#2D3748] transition-colors"
              >
                + إضافة رحلة
              </button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {flights.map((flight, index) => (
                <div
                  key={index}
                  className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-800">رحلة {index + 1}</h3>
                    {flights.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFlight(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        حذف
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Date */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        التاريخ
                      </label>
                      <input
                        type="date"
                        value={flight.date}
                        onChange={(e) => updateFlight(index, "date", e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A5568] focus:border-transparent text-sm ${
                          errors[`flight_${index}_date`] ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {errors[`flight_${index}_date`] && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors[`flight_${index}_date`]}
                        </p>
                      )}
                    </div>

                    {/* Luggage */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        الأمتعة
                      </label>
                      <input
                        type="text"
                        value={flight.luggage}
                        onChange={(e) => updateFlight(index, "luggage", e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A5568] focus:border-transparent text-sm ${
                          errors[`flight_${index}_luggage`] ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder="20 كيلو"
                      />
                      {errors[`flight_${index}_luggage`] && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors[`flight_${index}_luggage`]}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* From Airport */}
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      من مطار
                    </label>
                    <input
                      type="text"
                      value={flight.fromAirport}
                      onChange={(e) => updateFlight(index, "fromAirport", e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A5568] focus:border-transparent text-sm ${
                        errors[`flight_${index}_fromAirport`] ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="مطار بوكيت الدولي تايلاند"
                    />
                    {errors[`flight_${index}_fromAirport`] && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors[`flight_${index}_fromAirport`]}
                      </p>
                    )}
                  </div>

                  {/* To Airport */}
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      إلى مطار
                    </label>
                    <input
                      type="text"
                      value={flight.toAirport}
                      onChange={(e) => updateFlight(index, "toAirport", e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#4A5568] focus:border-transparent text-sm ${
                        errors[`flight_${index}_toAirport`] ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="مطار شنغهاي"
                    />
                    {errors[`flight_${index}_toAirport`] && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors[`flight_${index}_toAirport`]}
                      </p>
                    )}
                  </div>

                  {/* Travelers */}
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      المسافرين
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">بالغين</label>
                        <input
                          type="number"
                          min="0"
                          value={flight.travelers.adults}
                          onChange={(e) =>
                            updateFlight(index, "travelers", {
                              ...flight.travelers,
                              adults: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5568] focus:border-transparent text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">أطفال</label>
                        <input
                          type="number"
                          min="0"
                          value={flight.travelers.children}
                          onChange={(e) =>
                            updateFlight(index, "travelers", {
                              ...flight.travelers,
                              children: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5568] focus:border-transparent text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">رضع</label>
                        <input
                          type="number"
                          min="0"
                          value={flight.travelers.infants}
                          onChange={(e) =>
                            updateFlight(index, "travelers", {
                              ...flight.travelers,
                              infants: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5568] focus:border-transparent text-sm"
                        />
                      </div>
                    </div>
                    {errors[`flight_${index}_travelers`] && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors[`flight_${index}_travelers`]}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {errors.flights && <p className="text-red-500 text-xs mt-2">{errors.flights}</p>}
          </div>

          {/* Notice Message */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              رسالة التنبيه
            </label>
            <textarea
              value={noticeMessage}
              onChange={(e) => setNoticeMessage(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4A5568] focus:border-transparent"
              placeholder="التواجد في صاله المطار قبل الاقلاع بساعتين"
            />
            <div className="mt-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="showNotice"
                checked={showNotice}
                onChange={(e) => setShowNotice(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="showNotice" className="text-sm text-gray-700">
                إظهار رسالة التنبيه
              </label>
            </div>
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
            className="px-5 py-2 bg-gradient-to-r from-[#4A5568] to-[#2D3748] text-white rounded-lg hover:from-[#2D3748] hover:to-[#1A202C] transition-all shadow-md hover:shadow-lg font-medium flex items-center gap-2"
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

