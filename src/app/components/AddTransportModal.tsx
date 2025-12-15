"use client";

import React, { useState, useEffect } from "react";
import type { TransportTable, TransportRow, TransportColumn } from '../types/TransportTypes';

interface AddTransportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title?: string;
    showTitle?: boolean;
    tables: TransportTable[];
    direction?: "rtl" | "ltr";
    language?: "ar" | "en";
  }) => void;
}

export default function AddTransportModal({
  isOpen,
  onClose,
  onSubmit,
}: AddTransportModalProps) {
  const [title, setTitle] = useState("المواصلات");
  const [showTitle, setShowTitle] = useState(true);
  const [direction, setDirection] = useState<"rtl" | "ltr">("rtl");
  const [language, setLanguage] = useState<"ar" | "en">("ar");
  const [tables, setTables] = useState<TransportTable[]>([
    {
      id: `table_${Date.now()}`,
      title: "",
      backgroundColor: 'dark-blue',
      columns: [
        { key: 'day', label: language === 'ar' ? 'يوم' : 'Day' },
        { key: 'date', label: language === 'ar' ? 'التاريخ' : 'Date' },
        { key: 'description', label: language === 'ar' ? 'الوصف' : 'Description' },
        { key: 'carType', label: language === 'ar' ? 'نوع السياره' : 'Car Type' },
      ],
      rows: [
        {
          day: "",
          date: new Date().toISOString().split('T')[0],
          description: "",
          carType: "",
        }
      ]
    }
  ]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle("المواصلات");
      setShowTitle(true);
      setDirection("rtl");
      setLanguage("ar");
      setTables([
        {
          id: `table_${Date.now()}`,
          title: "",
          backgroundColor: 'dark-blue',
          columns: [
            { key: 'day', label: 'يوم' },
            { key: 'date', label: 'التاريخ' },
            { key: 'description', label: 'الوصف' },
            { key: 'carType', label: 'نوع السياره' },
          ],
          rows: [
            {
              day: "",
              date: new Date().toISOString().split('T')[0],
              description: "",
              carType: "",
            }
          ]
        }
      ]);
      setErrors({});
    }
  }, [isOpen]);

  // Update column labels when language changes
  useEffect(() => {
    const defaultLabels = language === 'ar' ? {
      day: 'يوم',
      date: 'التاريخ',
      description: 'الوصف',
      carType: 'نوع السياره'
    } : {
      day: 'Day',
      date: 'Date',
      description: 'Description',
      carType: 'Car Type'
    };

    setTables(prevTables => prevTables.map(table => ({
      ...table,
      columns: table.columns.map(col => {
        const defaultLabel = defaultLabels[col.key as keyof typeof defaultLabels];
        return {
          ...col,
          label: defaultLabel || col.label
        };
      })
    })));
  }, [language]);

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (tables.length === 0) {
      newErrors.tables = "At least one table is required";
    }

    tables.forEach((table, tableIndex) => {
      if (!table.title.trim()) {
        newErrors[`table_${tableIndex}_title`] = "Table title is required";
      }
      if (table.rows.length === 0) {
        newErrors[`table_${tableIndex}_rows`] = "At least one row is required";
      }
      table.rows.forEach((row, rowIndex) => {
        table.columns.forEach((column) => {
          if (column.key === 'day' && !row.day?.trim()) {
            newErrors[`table_${tableIndex}_row_${rowIndex}_day`] = "Day is required";
          }
          if (column.key === 'date' && !row.date) {
            newErrors[`table_${tableIndex}_row_${rowIndex}_date`] = "Date is required";
          }
        });
      });
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
      title: title.trim() || undefined,
      showTitle,
      tables,
      direction,
      language,
    });

    onClose();
  };

  const addTable = () => {
    setTables([
      ...tables,
      {
        id: `table_${Date.now()}_${Math.random()}`,
        title: "",
        backgroundColor: 'dark-blue',
        columns: [
          { key: 'day', label: language === 'ar' ? 'يوم' : 'Day' },
          { key: 'date', label: language === 'ar' ? 'التاريخ' : 'Date' },
          { key: 'description', label: language === 'ar' ? 'الوصف' : 'Description' },
          { key: 'carType', label: language === 'ar' ? 'نوع السياره' : 'Car Type' },
        ],
        rows: [
          {
            day: "",
            date: new Date().toISOString().split('T')[0],
            description: "",
            carType: "",
          }
        ]
      }
    ]);
  };

  const removeTable = (index: number) => {
    if (tables.length > 1) {
      setTables(tables.filter((_, i) => i !== index));
    }
  };

  const updateTable = (index: number, field: keyof TransportTable | 'columns' | 'rows', value: any) => {
    const newTables = [...tables];
    if (field === 'columns') {
      newTables[index] = {
        ...newTables[index],
        columns: value
      };
    } else if (field === 'rows') {
      newTables[index] = {
        ...newTables[index],
        rows: value
      };
    } else {
      newTables[index] = {
        ...newTables[index],
        [field]: value
      };
    }
    setTables(newTables);
  };

  const addRow = (tableIndex: number) => {
    const newTables = [...tables];
    const table = newTables[tableIndex];
    const newRow: TransportRow = {
      day: "",
      date: new Date().toISOString().split('T')[0],
      description: "",
      carType: "",
    };
    // Initialize all column values
    table.columns.forEach(col => {
      if (!newRow[col.key]) {
        newRow[col.key] = "";
      }
    });
    table.rows.push(newRow);
    setTables(newTables);
  };

  const removeRow = (tableIndex: number, rowIndex: number) => {
    const newTables = [...tables];
    if (newTables[tableIndex].rows.length > 1) {
      newTables[tableIndex].rows = newTables[tableIndex].rows.filter((_, i) => i !== rowIndex);
      setTables(newTables);
    }
  };

  const updateRow = (tableIndex: number, rowIndex: number, field: string, value: any) => {
    const newTables = [...tables];
    newTables[tableIndex].rows[rowIndex] = {
      ...newTables[tableIndex].rows[rowIndex],
      [field]: value
    };
    setTables(newTables);
  };

  const addColumn = (tableIndex: number) => {
    const newTables = [...tables];
    const newKey = `column_${Date.now()}`;
    newTables[tableIndex].columns.push({
      key: newKey,
      label: language === 'ar' ? 'عمود جديد' : 'New Column'
    });
    // Add empty value for this column in all rows
    newTables[tableIndex].rows.forEach(row => {
      row[newKey] = "";
    });
    setTables(newTables);
  };

  const removeColumn = (tableIndex: number, columnIndex: number) => {
    const newTables = [...tables];
    const column = newTables[tableIndex].columns[columnIndex];
    // Don't allow removing default columns
    if (['day', 'date', 'description', 'carType'].includes(column.key)) {
      return;
    }
    newTables[tableIndex].columns = newTables[tableIndex].columns.filter((_, i) => i !== columnIndex);
    // Remove column data from all rows
    newTables[tableIndex].rows.forEach(row => {
      delete row[column.key];
    });
    setTables(newTables);
  };

  const updateColumn = (tableIndex: number, columnIndex: number, field: 'key' | 'label', value: string) => {
    const newTables = [...tables];
    const column = newTables[tableIndex].columns[columnIndex];
    // Don't allow changing key of default columns
    if (field === 'key' && ['day', 'date', 'description', 'carType'].includes(column.key)) {
      return;
    }
    newTables[tableIndex].columns[columnIndex] = {
      ...column,
      [field]: value
    };
    setTables(newTables);
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1E40AF] px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
            </svg>
            Add Transport Section
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent"
              placeholder="Transportation"
            />
            <div className="mt-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="showTitle"
                checked={showTitle}
                onChange={(e) => setShowTitle(e.target.checked)}
                className="w-4 h-4 text-[#1E3A8A] rounded focus:ring-[#1E3A8A]"
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
                  setDirection(newLang === 'ar' ? 'rtl' : 'ltr');
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent"
              >
                <option value="rtl">Right to Left (RTL)</option>
                <option value="ltr">Left to Right (LTR)</option>
              </select>
            </div>
          </div>

          {/* Tables */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-semibold text-gray-700">
                Tables ({tables.length})
              </label>
              <button
                type="button"
                onClick={addTable}
                className="px-3 py-1.5 bg-[#1E3A8A] text-white rounded-lg hover:bg-[#1E40AF] transition-colors text-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Table
              </button>
            </div>
            
            <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
              {tables.map((table, tableIndex) => (
                <div key={table.id} className="border-2 border-gray-300 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-semibold text-gray-700">Table {tableIndex + 1}</span>
                    {tables.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTable(tableIndex)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove Table
                      </button>
                    )}
                  </div>

                  {/* Table Title */}
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Table Title *
                    </label>
                    <input
                      type="text"
                      value={table.title}
                      onChange={(e) => updateTable(tableIndex, 'title', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent text-sm ${
                        errors[`table_${tableIndex}_title`] ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder={language === 'ar' ? 'عنوان الجدول' : 'Table Title'}
                    />
                    {errors[`table_${tableIndex}_title`] && (
                      <p className="text-red-500 text-xs mt-1">{errors[`table_${tableIndex}_title`]}</p>
                    )}
                  </div>

                  {/* Background Color */}
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Background Color
                    </label>
                    <select
                      value={table.backgroundColor}
                      onChange={(e) => updateTable(tableIndex, 'backgroundColor', e.target.value as 'dark-blue' | 'dark-red' | 'pink')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent text-sm"
                    >
                      <option value="dark-blue">Dark Blue</option>
                      <option value="dark-red">Dark Red</option>
                      <option value="pink">Pink</option>
                    </select>
                  </div>

                  {/* Columns */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-medium text-gray-600">
                        Columns ({table.columns.length})
                      </label>
                      <button
                        type="button"
                        onClick={() => addColumn(tableIndex)}
                        className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                      >
                        Add Column
                      </button>
                    </div>
                    <div className="space-y-2">
                      {table.columns.map((column, colIndex) => (
                        <div key={colIndex} className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={column.key}
                            onChange={(e) => updateColumn(tableIndex, colIndex, 'key', e.target.value)}
                            disabled={['day', 'date', 'description', 'carType'].includes(column.key)}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm disabled:bg-gray-100"
                            placeholder="Column Key"
                          />
                          <input
                            type="text"
                            value={column.label}
                            onChange={(e) => updateColumn(tableIndex, colIndex, 'label', e.target.value)}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="Column Label"
                          />
                          {!['day', 'date', 'description', 'carType'].includes(column.key) && (
                            <button
                              type="button"
                              onClick={() => removeColumn(tableIndex, colIndex)}
                              className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rows */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-medium text-gray-600">
                        Rows ({table.rows.length})
                      </label>
                      <button
                        type="button"
                        onClick={() => addRow(tableIndex)}
                        className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                      >
                        Add Row
                      </button>
                    </div>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {table.rows.map((row, rowIndex) => (
                        <div key={rowIndex} className="border border-gray-200 rounded p-3 bg-white">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-600">Row {rowIndex + 1}</span>
                            {table.rows.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeRow(tableIndex, rowIndex)}
                                className="text-red-600 hover:text-red-700 text-xs"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {table.columns.map((column) => (
                              <div key={column.key}>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  {column.label}
                                </label>
                                {column.key === 'date' ? (
                                  <input
                                    type="date"
                                    value={row[column.key] || ''}
                                    onChange={(e) => updateRow(tableIndex, rowIndex, column.key, e.target.value)}
                                    className={`w-full px-2 py-1 border rounded text-sm ${
                                      errors[`table_${tableIndex}_row_${rowIndex}_${column.key}`] ? "border-red-500" : "border-gray-300"
                                    }`}
                                  />
                                ) : (
                                  <input
                                    type="text"
                                    value={row[column.key] || ''}
                                    onChange={(e) => updateRow(tableIndex, rowIndex, column.key, e.target.value)}
                                    className={`w-full px-2 py-1 border rounded text-sm ${
                                      errors[`table_${tableIndex}_row_${rowIndex}_${column.key}`] ? "border-red-500" : "border-gray-300"
                                    }`}
                                    placeholder={column.label}
                                  />
                                )}
                                {errors[`table_${tableIndex}_row_${rowIndex}_${column.key}`] && (
                                  <p className="text-red-500 text-xs mt-1">{errors[`table_${tableIndex}_row_${rowIndex}_${column.key}`]}</p>
                                )}
                              </div>
                            ))}
                            {/* Note field */}
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Note (Optional) 🚗
                              </label>
                              <input
                                type="text"
                                value={row.note || ''}
                                onChange={(e) => updateRow(tableIndex, rowIndex, 'note', e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Add note..."
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {errors[`table_${tableIndex}_rows`] && (
                      <p className="text-red-500 text-xs mt-1">{errors[`table_${tableIndex}_rows`]}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {errors.tables && (
              <p className="text-red-500 text-xs mt-2">{errors.tables}</p>
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
            className="px-5 py-2 bg-gradient-to-r from-[#1E3A8A] to-[#1E40AF] text-white rounded-lg hover:from-[#1E40AF] hover:to-[#1E3A8A] transition-all shadow-md hover:shadow-lg font-medium flex items-center gap-2"
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
    </div>
  );
}

