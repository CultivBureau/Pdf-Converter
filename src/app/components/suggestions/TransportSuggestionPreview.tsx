"use client";

import React from 'react';
import type { TransportSectionData } from '../../types/ExtractTypes';

interface TransportSuggestionPreviewProps {
  data: TransportSectionData;
  language?: "ar" | "en";
  direction?: "rtl" | "ltr";
}

/**
 * Read-only preview component for transport suggestions
 */
const TransportSuggestionPreview: React.FC<TransportSuggestionPreviewProps> = ({
  data,
  language = "ar",
  direction = "rtl"
}) => {
  const tables = data.tables || [];
  const title = data.title || (language === 'ar' ? 'المواصلات' : 'Transportation');
  
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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
        </svg>
        <h3 className="font-bold text-blue-900">{title}</h3>
      </div>
      
      {tables.length > 0 ? (
        <div className="space-y-3">
          {tables.map((table, tableIndex) => (
            <div key={tableIndex} className="bg-white rounded p-3 border border-blue-200">
              {table.title && (
                <h4 className="font-semibold text-blue-800 mb-2">{table.title}</h4>
              )}
              {table.rows && table.rows.length > 0 ? (
                <div className="space-y-2">
                  {table.rows.map((row, rowIndex) => (
                    <div key={rowIndex} className="text-sm border-l-2 border-blue-300 pl-2">
                      <div className="grid grid-cols-2 gap-2">
                        {row.day && (
                          <div>
                            <span className="font-semibold">{language === 'ar' ? 'يوم' : 'Day'}: </span>
                            <span>{row.day}</span>
                          </div>
                        )}
                        {row.date && (
                          <div>
                            <span className="font-semibold">{language === 'ar' ? 'التاريخ' : 'Date'}: </span>
                            <span>{formatDate(row.date)}</span>
                          </div>
                        )}
                        {row.from && (
                          <div>
                            <span className="font-semibold">{language === 'ar' ? 'من' : 'From'}: </span>
                            <span>{row.from}</span>
                          </div>
                        )}
                        {row.to && (
                          <div>
                            <span className="font-semibold">{language === 'ar' ? 'إلى' : 'To'}: </span>
                            <span>{row.to}</span>
                          </div>
                        )}
                        {row.carType && (
                          <div>
                            <span className="font-semibold">{language === 'ar' ? 'نوع السيارة' : 'Car Type'}: </span>
                            <span>{row.carType}</span>
                          </div>
                        )}
                        {row.description && (
                          <div className="col-span-2">
                            <span className="font-semibold">{language === 'ar' ? 'الوصف' : 'Description'}: </span>
                            <span>{row.description}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-sm">{language === 'ar' ? 'لا توجد صفوف' : 'No rows'}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600 text-sm">{language === 'ar' ? 'لا توجد جداول نقل' : 'No transport tables'}</p>
      )}
    </div>
  );
};

export default TransportSuggestionPreview;
