"use client";

import React, { useState, useEffect } from "react";

interface CreateTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTable: (config: {
    title: string;
    columns: string[];
    rowCount: number;
    position?: 'end' | number; // 'end' or section index to insert after
  }) => void;
  sections?: Array<{ title?: string; index: number }>; // List of sections for position selection
}

export default function CreateTableModal({
  isOpen,
  onClose,
  onCreateTable,
  sections = [],
}: CreateTableModalProps) {
  const [title, setTitle] = useState("");
  const [columnCount, setColumnCount] = useState(3);
  const [rowCount, setRowCount] = useState(3);
  const [columnNames, setColumnNames] = useState<string[]>(["Column 1", "Column 2", "Column 3"]);
  const [position, setPosition] = useState<'end' | number>('end');
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
      setPosition('end');
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
      position,
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
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#A4C639] to-[#8FB02E] px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Table
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Table Title (optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A4C639] focus:border-transparent"
              placeholder="e.g., Pricing Table, Schedule, etc."
            />
          </div>

          {/* Dimensions */}
          <div className="grid grid-cols-2 gap-4">
            {/* Column Count */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Number of Columns
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={columnCount}
                onChange={(e) => setColumnCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#A4C639] focus:border-transparent ${
                  errors.columnCount ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.columnCount && (
                <p className="text-red-500 text-xs mt-1">{errors.columnCount}</p>
              )}
            </div>

            {/* Row Count */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Number of Rows
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={rowCount}
                onChange={(e) => setRowCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#A4C639] focus:border-transparent ${
                  errors.rowCount ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.rowCount && (
                <p className="text-red-500 text-xs mt-1">{errors.rowCount}</p>
              )}
            </div>
          </div>

          {/* Column Names */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Column Names
            </label>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
              {columnNames.map((name, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600 w-20">
                    Col {index + 1}:
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => handleColumnNameChange(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A4C639] focus:border-transparent text-sm"
                    placeholder={`Column ${index + 1}`}
                  />
                </div>
              ))}
            </div>
            {errors.columnNames && (
              <p className="text-red-500 text-xs mt-2">{errors.columnNames}</p>
            )}
          </div>

          {/* Position Selection */}
          {sections.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Insert Position
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="position"
                    value="end"
                    checked={position === 'end'}
                    onChange={() => setPosition('end')}
                    className="text-[#A4C639] focus:ring-[#A4C639]"
                  />
                  <span className="text-sm text-gray-700">Add at the end</span>
                </label>
                <div className="ml-6 space-y-1 max-h-48 overflow-y-auto pr-2">
                  {sections.map((section) => (
                    <label key={section.index} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="position"
                        value={section.index}
                        checked={position === section.index}
                        onChange={() => setPosition(section.index)}
                        className="text-[#A4C639] focus:ring-[#A4C639]"
                      />
                      <span className="text-sm text-gray-700">
                        After: {section.title || `Section ${section.index + 1}`}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Preview Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-blue-900">Table Preview</p>
                <p className="text-xs text-blue-700 mt-1">
                  Your table will have {columnCount} column{columnCount !== 1 ? "s" : ""} and {rowCount} row{rowCount !== 1 ? "s" : ""}.
                  All cells will be empty and editable.
                </p>
              </div>
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
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-5 py-2 bg-gradient-to-r from-[#A4C639] to-[#8FB02E] text-white rounded-lg hover:from-[#8FB02E] hover:to-[#7A9124] transition-all shadow-md hover:shadow-lg font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Table
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

