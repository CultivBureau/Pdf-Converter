"use client";

import React, { useState, useEffect } from "react";
import type { TransportTable, TransportColumn } from '../types/TransportTypes';
import { useLanguage } from "@/app/contexts/LanguageContext";

interface EditTransportTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (table: TransportTable) => void;
  initialTable: TransportTable | null;
  language?: "ar" | "en";
}

export default function EditTransportTableModal({
  isOpen,
  onClose,
  onSubmit,
  initialTable,
  language = "ar",
}: EditTransportTableModalProps) {
  const { t, isRTL, dir } = useLanguage();
  const [title, setTitle] = useState("");
  const [backgroundColor, setBackgroundColor] = useState<'dark-blue' | 'dark-red' | 'pink'>('dark-blue');
  const [columns, setColumns] = useState<TransportColumn[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Populate form when modal opens or initialTable changes
  useEffect(() => {
    if (isOpen && initialTable) {
      setTitle(initialTable.title);
      setBackgroundColor(initialTable.backgroundColor);
      setColumns([...initialTable.columns]);
      setErrors({});
    }
  }, [isOpen, initialTable]);

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!title.trim()) {
      newErrors.title = language === 'ar' ? 'عنوان الجدول مطلوب' : 'Table title is required';
    }
    if (columns.length === 0) {
      newErrors.columns = language === 'ar' ? 'يجب أن يحتوي الجدول على عمود واحد على الأقل' : 'Table must have at least one column';
    }
    columns.forEach((col, index) => {
      if (!col.key.trim()) {
        newErrors[`column_${index}_key`] = language === 'ar' ? 'مفتاح العمود مطلوب' : 'Column key is required';
      }
      if (!col.label.trim()) {
        newErrors[`column_${index}_label`] = language === 'ar' ? 'تسمية العمود مطلوبة' : 'Column label is required';
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

    if (!initialTable) return;

    onSubmit({
      ...initialTable,
      title: title.trim(),
      backgroundColor,
      columns: columns.map(col => ({
        key: col.key.trim(),
        label: col.label.trim()
      }))
    });

    onClose();
  };

  const addColumn = () => {
    setColumns([
      ...columns,
      {
        key: `column_${Date.now()}`,
        label: language === 'ar' ? 'عمود جديد' : 'New Column'
      }
    ]);
  };

  const removeColumn = (index: number) => {
    // Allow deletion of any column
    if (columns.length <= 1) {
      alert(language === 'ar' ? 'يجب أن يحتوي الجدول على عمود واحد على الأقل' : 'Table must have at least one column');
      return;
    }
    setColumns(columns.filter((_, i) => i !== index));
  };

  const updateColumn = (index: number, field: 'key' | 'label', value: string) => {
    const newColumns = [...columns];
    const column = newColumns[index];
    
    // Allow changing any column
    newColumns[index] = {
      ...column,
      [field]: value
    };
    setColumns(newColumns);
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        dir={dir}
      >
        {/* Header */}
        <div className={`bg-gradient-to-r from-[#1E3A8A] to-[#1E40AF] px-6 py-4 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <h2 className={`text-xl font-bold text-white flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {t.modals.editTable}
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
          {/* Table Title */}
          <div>
            <label className={`block text-sm font-semibold text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t.modals.tableTitle} *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent ${
                errors.title ? "border-red-500" : "border-gray-300"
              } ${isRTL ? 'text-right' : 'text-left'}`}
              placeholder={t.modals.tableTitle}
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
            {errors.title && (
              <p className={`text-red-500 text-xs mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>{errors.title}</p>
            )}
          </div>

          {/* Background Color */}
          <div>
            <label className={`block text-sm font-semibold text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t.modals.backgroundColor}
            </label>
            <select
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value as 'dark-blue' | 'dark-red' | 'pink')}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent ${isRTL ? 'text-right' : 'text-left'}`}
            >
              <option value="dark-blue">{t.modals.darkBlue}</option>
              <option value="dark-red">{t.modals.darkRed}</option>
              <option value="pink">{t.modals.pink}</option>
            </select>
          </div>

          {/* Columns */}
          <div>
            <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <label className={`block text-sm font-semibold text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t.modals.columns} ({columns.length})
              </label>
              <button
                type="button"
                onClick={addColumn}
                className={`px-3 py-1.5 bg-[#1E3A8A] text-white rounded-lg hover:bg-[#1E40AF] transition-colors text-sm flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t.modals.addColumn}
              </button>
            </div>
            
            <div className="space-y-3">
              {columns.map((column, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className={`flex items-center justify-between mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className={`text-xs font-medium text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t.modals.column} {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeColumn(index)}
                      className="text-red-600 hover:text-red-700 text-xs"
                    >
                      {t.modals.removeColumn}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-xs font-medium text-gray-600 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                        {t.modals.columnKey}
                      </label>
                      <input
                        type="text"
                        value={column.key}
                        onChange={(e) => updateColumn(index, 'key', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg text-sm ${
                          errors[`column_${index}_key`] ? "border-red-500" : "border-gray-300"
                        } ${isRTL ? 'text-right' : 'text-left'}`}
                        placeholder="column_key"
                      />
                      {errors[`column_${index}_key`] && (
                        <p className={`text-red-500 text-xs mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>{errors[`column_${index}_key`]}</p>
                      )}
                    </div>
                    <div>
                      <label className={`block text-xs font-medium text-gray-600 mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                        {t.modals.columnLabel}
                      </label>
                      <input
                        type="text"
                        value={column.label}
                        onChange={(e) => updateColumn(index, 'label', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg text-sm ${
                          errors[`column_${index}_label`] ? "border-red-500" : "border-gray-300"
                        } ${isRTL ? 'text-right' : 'text-left'}`}
                        placeholder={t.modals.columnLabel}
                        dir={language === 'ar' ? 'rtl' : 'ltr'}
                      />
                      {errors[`column_${index}_label`] && (
                        <p className={`text-red-500 text-xs mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>{errors[`column_${index}_label`]}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {errors.columns && (
              <p className={`text-red-500 text-xs mt-2 ${isRTL ? 'text-right' : 'text-left'}`}>{errors.columns}</p>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className={`bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-200 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            {t.common.cancel}
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className={`px-5 py-2 bg-gradient-to-r from-[#1E3A8A] to-[#1E40AF] text-white rounded-lg hover:from-[#1E40AF] hover:to-[#1E3A8A] transition-all shadow-md hover:shadow-lg font-medium flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {t.common.save}
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

