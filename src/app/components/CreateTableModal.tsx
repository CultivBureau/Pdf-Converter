"use client";

import React, { useState, useEffect } from "react";
import { useLanguage } from "@/app/contexts/LanguageContext";

interface CreateTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTable: (config: {
    title: string;
    columns: string[];
    rowCount: number;
  }) => void;
}

export default function CreateTableModal({
  isOpen,
  onClose,
  onCreateTable,
}: CreateTableModalProps) {
  const { t, isRTL, dir } = useLanguage();
  const [title, setTitle] = useState("");
  const [columnCount, setColumnCount] = useState(3);
  const [rowCount, setRowCount] = useState(3);
  const [columnNames, setColumnNames] = useState<string[]>(["Column 1", "Column 2", "Column 3"]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Update column names array when column count changes
  useEffect(() => {
    const newColumnNames = [...columnNames];
    if (columnCount > columnNames.length) {
      // Add new columns
      for (let i = columnNames.length; i < columnCount; i++) {
        newColumnNames.push(`Column ${i + 1}`);
      }
    } else if (columnCount < columnNames.length) {
      // Remove excess columns
      newColumnNames.splice(columnCount);
    }
    setColumnNames(newColumnNames);
  }, [columnCount]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setColumnCount(3);
      setRowCount(3);
      setColumnNames(["Column 1", "Column 2", "Column 3"]);
      setErrors({});
    }
  }, [isOpen]);

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (columnCount < 1) {
      newErrors.columnCount = "Must have at least 1 column";
    }
    if (columnCount > 20) {
      newErrors.columnCount = "Maximum 20 columns allowed";
    }
    if (rowCount < 1) {
      newErrors.rowCount = "Must have at least 1 row";
    }
    if (rowCount > 100) {
      newErrors.rowCount = "Maximum 100 rows allowed";
    }

    // Check for empty column names
    const emptyColumns = columnNames.some((name, idx) => !name.trim());
    if (emptyColumns) {
      newErrors.columnNames = "All column names must be filled";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    onCreateTable({
      title: title.trim() || "New Table",
      columns: columnNames.map(name => name.trim()),
      rowCount,
    });

    onClose();
  };

  const handleColumnNameChange = (index: number, value: string) => {
    const newColumnNames = [...columnNames];
    newColumnNames[index] = value;
    setColumnNames(newColumnNames);
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        dir={dir}
      >
        {/* Header */}
        <div className={`bg-gradient-to-r from-[#A4C639] to-[#8FB02E] px-6 py-4 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <h2 className={`text-xl font-bold text-white flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t.modals.createNewTable}
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
              {t.modals.tableTitleOptional}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A4C639] focus:border-transparent ${isRTL ? 'text-right' : 'text-left'}`}
              placeholder={t.modals.tableTitlePlaceholderExample}
            />
          </div>

          {/* Dimensions */}
          <div className="grid grid-cols-2 gap-4">
            {/* Column Count */}
            <div>
              <label className={`block text-sm font-semibold text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t.modals.numberOfColumns}
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={columnCount}
                onChange={(e) => setColumnCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#A4C639] focus:border-transparent ${
                  errors.columnCount ? "border-red-500" : "border-gray-300"
                } ${isRTL ? 'text-right' : 'text-left'}`}
              />
              {errors.columnCount && (
                <p className={`text-red-500 text-xs mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>{errors.columnCount}</p>
              )}
            </div>

            {/* Row Count */}
            <div>
              <label className={`block text-sm font-semibold text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t.modals.numberOfRows}
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={rowCount}
                onChange={(e) => setRowCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#A4C639] focus:border-transparent ${
                  errors.rowCount ? "border-red-500" : "border-gray-300"
                } ${isRTL ? 'text-right' : 'text-left'}`}
              />
              {errors.rowCount && (
                <p className={`text-red-500 text-xs mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>{errors.rowCount}</p>
              )}
            </div>
          </div>

          {/* Column Names */}
          <div>
            <label className={`block text-sm font-semibold text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t.modals.columnNames}
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
              {columnNames.map((name, index) => (
                <div key={index} className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className={`text-sm font-medium text-gray-600 w-20 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t.modals.colNumber} {index + 1}:
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => handleColumnNameChange(index, e.target.value)}
                    className={`flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A4C639] focus:border-transparent text-sm ${isRTL ? 'text-right' : 'text-left'}`}
                    placeholder={`${t.modals.colNumber} ${index + 1}`}
                  />
                </div>
              ))}
            </div>
            {errors.columnNames && (
              <p className={`text-red-500 text-xs mt-2 ${isRTL ? 'text-right' : 'text-left'}`}>{errors.columnNames}</p>
            )}
          </div>

          {/* Preview Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className={`flex items-start gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className={`text-sm font-semibold text-blue-900 ${isRTL ? 'text-right' : 'text-left'}`}>{t.modals.tablePreview}</p>
                <p className={`text-xs text-blue-700 mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t.modals.tablePreviewDesc
                    .replace('{columns}', String(columnCount))
                    .replace('{rows}', String(rowCount))}
                </p>
              </div>
            </div>
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
            className={`px-5 py-2 bg-gradient-to-r from-[#A4C639] to-[#8FB02E] text-white rounded-lg hover:from-[#8FB02E] hover:to-[#7A9124] transition-all shadow-md hover:shadow-lg font-medium flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t.modals.createTable}
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

