"use client";

import React from 'react';
import type { TransportSectionProps, TransportTable, TransportRow } from '../types/TransportTypes';

/**
 * Transport Section Template Component
 * 
 * A template for transportation information with:
 * - Header with car icon
 * - Multiple tables with customizable background colors (dark blue, dark red, pink)
 * - Dynamic columns (default: day, date, description, car type)
 * - Notes with red car icon after rows
 * - RTL/LTR support for Arabic and English
 * - Enhanced UI with perfect layout and responsive design
 */

const TransportSection: React.FC<TransportSectionProps> = ({
  tables = [],
  title,
  showTitle = true,
  direction = "rtl",
  language = "ar",
  editable = false,
  id,
  onEditRow,
  onRemoveRow,
  onAddRow,
  onEditTable,
  onDeleteTable,
  onEditSection,
  onDeleteSection,
  className = "",
  style
}) => {
  // Ensure sectionIdValue is always a string
  const sectionIdValue = id ? String(id) : undefined;
  
  // Set default values based on language
  const defaultTitle = title || (language === 'ar' ? 'المواصلات' : 'Transportation');
  
  // Default column labels
  const getDefaultColumnLabels = () => {
    if (language === 'ar') {
      return {
        day: "يوم",
        date: "التاريخ",
        description: "الوصف",
        carType: "نوع السياره"
      };
    } else {
      return {
        day: "Day",
        date: "Date",
        description: "Description",
        carType: "Car Type"
      };
    }
  };

  const defaultColumnLabels = getDefaultColumnLabels();

  // Get background color classes
  const getBackgroundColorClass = (color: 'dark-blue' | 'dark-red' | 'pink') => {
    switch (color) {
      case 'dark-blue':
        return 'bg-[#1E3A8A]';
      case 'dark-red':
        return 'bg-[#991B1B]';
      case 'pink':
        return 'bg-[#EC4899]';
      default:
        return 'bg-[#1E3A8A]';
    }
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

  // Get column label - use custom label if available, otherwise use default
  const getColumnLabel = (columnKey: string, customLabel?: string) => {
    if (customLabel) return customLabel;
    return defaultColumnLabels[columnKey as keyof typeof defaultColumnLabels] || columnKey;
  };

  return (
    <div 
      className={`w-full mb-8 ${className} no-break`} 
      style={style} 
      dir={direction} 
      data-transport-section-id={sectionIdValue}
    >
      {/* Edit/Delete Buttons - Always visible when editable, regardless of showTitle */}
      {editable && (
        <div className={`mb-4 flex ${direction === 'rtl' ? 'justify-start' : 'justify-end'} relative`}>
          <div className={`flex gap-2 z-0 ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onEditSection) {
                  onEditSection();
                }
              }}
              data-action="edit-section"
              data-transport-section-id={sectionIdValue}
              className="p-2.5 bg-[#1E3A8A] text-white rounded-full hover:bg-[#1E40AF] transition-all duration-200 shadow-md hover:shadow-lg hover:scale-110 cursor-pointer"
              title={language === 'ar' ? 'تعديل القسم' : 'Edit Section'}
              type="button"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onDeleteSection) {
                  onDeleteSection();
                }
              }}
              data-action="delete-section"
              data-transport-section-id={sectionIdValue}
              className="p-2.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-110 cursor-pointer"
              title={language === 'ar' ? 'حذف القسم' : 'Delete Section'}
              type="button"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Header with Title and Icon */}
      {showTitle && (
        <div className="flex items-center justify-center mb-6">
          <div className={`bg-[#991B1B] text-white px-10 py-3.5 rounded-full flex items-center gap-3.5 shadow-lg hover:shadow-xl transition-shadow duration-300 ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
            <h2 className="text-xl md:text-2xl font-bold tracking-wide">{defaultTitle}</h2>
            <div className="bg-white rounded-full p-2.5 shadow-inner">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="currentColor" 
                className="w-6 h-6 text-[#991B1B]"
              >
                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Transport Tables */}
      <div className="space-y-6">
        {tables.map((table, tableIndex) => {
          const bgColorClass = getBackgroundColorClass(table.backgroundColor);
          
          return (
            <div key={table.id || tableIndex} className="overflow-hidden rounded-2xl shadow-xl border border-gray-200 bg-white">
              {/* Table Title Header */}
              {table.title && (
                <div className={`${bgColorClass} text-white px-6 py-3 relative ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
                  <h3 className="text-lg md:text-xl font-bold text-center">{table.title}</h3>
                  {editable && (
                    <div className={`absolute top-1/2 -translate-y-1/2 flex gap-2 ${direction === 'rtl' ? 'left-3' : 'right-3'}`}>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (onEditTable) {
                            onEditTable(tableIndex);
                          }
                        }}
                        data-action="edit-table"
                        data-transport-section-id={sectionIdValue}
                        data-table-index={tableIndex}
                        className="p-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all duration-200"
                        title={language === 'ar' ? 'تعديل الجدول' : 'Edit Table'}
                        type="button"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      {tables.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (onDeleteTable) {
                              onDeleteTable(tableIndex);
                            }
                          }}
                          data-action="delete-table"
                          data-transport-section-id={sectionIdValue}
                          data-table-index={tableIndex}
                          className="p-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all duration-200"
                          title={language === 'ar' ? 'حذف الجدول' : 'Delete Table'}
                          type="button"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Table Container */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[600px]">
                  {/* Column Headers */}
                  <thead>
                    <tr className={bgColorClass}>
                      {editable && (
                        <th className="px-3 py-4 text-center text-white font-bold text-xs md:text-sm border-r-2 border-white/30 min-w-[80px]">
                          <div className="flex items-center justify-center">
                            <span>{language === 'ar' ? 'إجراءات' : 'Actions'}</span>
                          </div>
                        </th>
                      )}
                      {table.columns.map((column, colIndex) => (
                        <th 
                          key={column.key || colIndex}
                          className="px-4 py-4 text-center text-white font-bold text-sm md:text-base border-r-2 border-white/30 whitespace-nowrap"
                        >
                          {getColumnLabel(column.key, column.label)}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  {/* Data Rows */}
                  <tbody>
                    {table.rows.map((row, rowIndex) => (
                      <React.Fragment key={rowIndex}>
                        <tr 
                          className={`${rowIndex % 2 === 0 ? 'bg-[#E8E8E8]' : 'bg-white'} hover:bg-[#D8D8D8] transition-colors duration-200 border-b-2 border-white group`}
                        >
                          {editable && (
                            <td className="px-3 py-4 border-r-2 border-white/50">
                              <div className="flex flex-col gap-2 items-center">
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (onEditRow) {
                                      onEditRow(tableIndex, rowIndex);
                                    }
                                  }}
                                  data-action="edit-row"
                                  data-transport-section-id={sectionIdValue}
                                  data-table-index={tableIndex}
                                  data-row-index={rowIndex}
                                  className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-110"
                                  title={language === 'ar' ? 'تعديل' : 'Edit'}
                                  type="button"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                {table.rows.length > 1 && (
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      if (onRemoveRow) {
                                        onRemoveRow(tableIndex, rowIndex);
                                      }
                                    }}
                                    data-action="remove-row"
                                    data-transport-section-id={sectionIdValue}
                                    data-table-index={tableIndex}
                                    data-row-index={rowIndex}
                                    className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-110"
                                    title={language === 'ar' ? 'حذف' : 'Delete'}
                                    type="button"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                          {table.columns.map((column, colIndex) => {
                            const cellValue = row[column.key] || '';
                            const isDateColumn = column.key === 'date';
                            const isLastColumn = colIndex === table.columns.length - 1;
                            
                            return (
                              <td 
                                key={column.key || colIndex}
                                className={`px-4 py-4 text-center text-gray-800 font-semibold text-sm md:text-base ${!isLastColumn ? 'border-r-2 border-white/50' : ''}`}
                              >
                                <div className={`flex items-center justify-center gap-2 ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
                                  {isDateColumn ? (
                                    <span className="text-[#4A5568] font-bold">{formatDate(cellValue)}</span>
                                  ) : (
                                    <span className="whitespace-pre-line leading-relaxed text-[#2D3748]">{cellValue}</span>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                        {/* Note row - appears as separate row below data row */}
                        {row.note && (
                          <tr className="bg-red-50 border-b-2 border-white">
                            <td 
                              colSpan={(editable ? 1 : 0) + table.columns.length}
                              className="px-4 py-3 text-center"
                            >
                              <div className={`flex items-center justify-center gap-2 ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
                                <span className="text-red-600 text-sm md:text-base font-semibold">{row.note}</span>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                    {editable && (
                      <tr className="bg-gray-50 hover:bg-gray-100 transition-colors">
                        <td colSpan={(editable ? 1 : 0) + table.columns.length} className="px-4 py-5 text-center border-t-2 border-gray-200">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (onAddRow) {
                                onAddRow(tableIndex);
                              }
                            }}
                            data-action="add-row"
                            data-transport-section-id={sectionIdValue}
                            data-table-index={tableIndex}
                            className="px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all duration-200 text-sm md:text-base font-medium flex items-center gap-2 mx-auto shadow-md hover:shadow-lg hover:scale-105"
                            type="button"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            {language === 'ar' ? 'إضافة صف جديد' : 'Add New Row'}
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TransportSection;

export const TransportSectionTemplate = TransportSection;
