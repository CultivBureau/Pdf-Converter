"use client";

import React, { useState, useEffect } from "react";
import { parseJSXCode } from "../utils/jsxParser";
import {
  addSection,
  removeSection,
  updateSectionTitle,
  updateSectionContent,
  addTableColumn,
  removeTableColumn,
  addTableRow,
  removeTableRow,
  mergeTableColumns,
  updateTableColumnHeader,
} from "../utils/codeManipulator";

export type PanelContext = 
  | { type: 'section'; index: number }
  | { type: 'table'; index: number }
  | { type: 'column'; tableIndex: number; columnIndex: number }
  | { type: 'row'; tableIndex: number; rowIndex: number }
  | null;

interface CustomizationPanelProps {
  code: string;
  onCodeChange: (newCode: string) => void;
  context: PanelContext;
  onClose: () => void;
}

export default function CustomizationPanel({
  code,
  onCodeChange,
  context,
  onClose,
}: CustomizationPanelProps) {
  const [parsed, setParsed] = useState(parseJSXCode(code));
  
  useEffect(() => {
    setParsed(parseJSXCode(code));
  }, [code]);
  
  if (!context) {
    return null;
  }
  
  const handleAddSection = () => {
    const newCode = addSection(code, {
      title: "New Section",
      content: "Section content here",
      type: "section",
    });
    onCodeChange(newCode);
    // Keep panel open to show the new section
    if (context && context.type === 'section') {
      // Update context to show new section (will be last one)
      setTimeout(() => {
        const newParsed = parseJSXCode(newCode);
        if (newParsed.sections.length > 0) {
          // Context will update automatically when code changes
        }
      }, 100);
    }
  };
  
  const handleRemoveSection = () => {
    if (context.type === 'section') {
      const newCode = removeSection(code, context.index);
      onCodeChange(newCode);
      onClose();
    }
  };
  
  const handleUpdateSectionTitle = (newTitle: string) => {
    if (context.type === 'section') {
      const newCode = updateSectionTitle(code, context.index, newTitle);
      onCodeChange(newCode);
    }
  };
  
  const handleUpdateSectionContent = (newContent: string) => {
    if (context.type === 'section') {
      const newCode = updateSectionContent(code, context.index, newContent);
      onCodeChange(newCode);
    }
  };
  
  const handleAddColumn = () => {
    if (context.type === 'table') {
      const newCode = addTableColumn(code, context.index, "New Column");
      onCodeChange(newCode);
    }
  };
  
  const handleRemoveColumn = () => {
    if (context.type === 'column') {
      const newCode = removeTableColumn(code, context.tableIndex, context.columnIndex);
      onCodeChange(newCode);
      onClose();
    }
  };
  
  const handleAddRow = () => {
    if (context.type === 'table' || context.type === 'row') {
      const tableIndex = context.type === 'table' ? context.index : context.tableIndex;
      const position = context.type === 'row' ? context.rowIndex + 1 : undefined;
      const newCode = addTableRow(code, tableIndex, undefined, position);
      onCodeChange(newCode);
    }
  };
  
  const handleRemoveRow = () => {
    if (context.type === 'row') {
      const newCode = removeTableRow(code, context.tableIndex, context.rowIndex);
      onCodeChange(newCode);
      onClose();
    }
  };
  
  const handleMergeColumns = (startCol: number, endCol: number) => {
    if (context.type === 'table') {
      const newCode = mergeTableColumns(code, context.index, startCol, endCol);
      onCodeChange(newCode);
    }
  };
  
  const handleUpdateColumnHeader = (newHeader: string) => {
    if (context.type === 'column') {
      const newCode = updateTableColumnHeader(code, context.tableIndex, context.columnIndex, newHeader);
      onCodeChange(newCode);
    }
  };
  
  const currentSection = context.type === 'section' ? parsed.sections[context.index] : null;
  const currentTable = context.type === 'table' || context.type === 'column' || context.type === 'row'
    ? parsed.tables[context.type === 'table' ? context.index : context.tableIndex]
    : null;
  const currentColumn = context.type === 'column' ? currentTable?.columns?.[context.columnIndex] || currentTable?.headers?.[context.columnIndex] : null;
  
  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#A4C639] to-[#8FB02E] px-6 py-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Customize</h2>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Section Context - Phase 1: Enhanced UI with Title */}
        {context.type === 'section' && currentSection && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Section Title
              </label>
              <input
                type="text"
                value={currentSection.title || ''}
                onChange={(e) => handleUpdateSectionTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A4C639] focus:border-transparent"
                placeholder="Section title"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Section Content
              </label>
              <textarea
                value={currentSection.content || ''}
                onChange={(e) => handleUpdateSectionContent(e.target.value)}
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A4C639] focus:border-transparent resize-none"
                placeholder="Section content"
              />
            </div>
            
            <button
              onClick={handleRemoveSection}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Section
            </button>
          </div>
        )}
        
        {/* Table Context */}
        {context.type === 'table' && currentTable && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Table: {currentTable.title || `Table ${context.index + 1}`}
              </h3>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Columns ({currentTable.columns?.length || currentTable.headers?.length || 0})
              </label>
              <button
                onClick={handleAddColumn}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                + Add Column
              </button>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Rows ({currentTable.rows?.length || 0})
              </label>
              <button
                onClick={handleAddRow}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                + Add Row
              </button>
            </div>
            
            {/* Column Merge */}
            {currentTable.columns && currentTable.columns.length > 1 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Merge Columns
                </label>
                <div className="space-y-2">
                  <select
                    id="merge-start"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    {currentTable.columns.map((col, idx) => (
                      <option key={idx} value={idx}>{col}</option>
                    ))}
                  </select>
                  <span className="text-xs text-gray-500 text-center block">to</span>
                  <select
                    id="merge-end"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    {currentTable.columns.map((col, idx) => (
                      <option key={idx} value={idx}>{col}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      const start = parseInt((document.getElementById('merge-start') as HTMLSelectElement)?.value || '0', 10);
                      const end = parseInt((document.getElementById('merge-end') as HTMLSelectElement)?.value || '0', 10);
                      if (start < end) {
                        handleMergeColumns(start, end);
                      }
                    }}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                  >
                    Merge Columns
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Column Context */}
        {context.type === 'column' && currentTable && currentColumn !== null && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Column: {currentColumn}
              </h3>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Column Name
              </label>
              <input
                type="text"
                value={currentColumn}
                onChange={(e) => handleUpdateColumnHeader(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#A4C639] focus:border-transparent"
                placeholder="Column name"
              />
            </div>
            
            <button
              onClick={handleRemoveColumn}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Remove Column
            </button>
          </div>
        )}
        
        {/* Row Context */}
        {context.type === 'row' && currentTable && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Row {context.rowIndex + 1}
              </h3>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Actions
              </label>
              <div className="space-y-2">
                <button
                  onClick={handleAddRow}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Add Row Below
                </button>
                <button
                  onClick={handleRemoveRow}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Remove Row
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

