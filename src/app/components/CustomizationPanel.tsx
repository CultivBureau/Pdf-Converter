"use client";

import React, { useState, useEffect } from "react";
import { parseJSXCode } from "../utils/jsxParser";
import {
  addSection,
  removeSection,
  updateSectionTitle,
  deleteTable,
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

  const handleDeleteTable = () => {
    if (context.type === 'table') {
      console.log('Deleting table at index:', context.index);
      const confirmed = window.confirm('Are you sure you want to delete this table? This action cannot be undone.');
      if (confirmed) {
        const newCode = deleteTable(code, context.index);
        console.log('Delete result - code changed:', newCode !== code);
        onCodeChange(newCode);
        onClose();
      }
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
      <div className="bg-linear-to-r from-[#A4C639] to-[#8FB02E] px-6 py-4 flex items-center justify-between">
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
            <div className="bg-linear-to-r from-green-50 to-lime-50 p-4 rounded-lg border border-green-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-[#A4C639]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {currentTable.title || `Table ${context.index + 1}`}
              </h3>
              <div className="flex items-center gap-4 text-sm text-gray-700">
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="font-semibold">{currentTable.columns?.length || currentTable.headers?.length || 0}</span>
                  <span>columns</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  <span className="font-semibold">{currentTable.rows?.length || 0}</span>
                  <span>rows</span>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="border-t border-red-200 pt-4 mt-4">
              <label className="block text-sm font-semibold text-red-700 mb-2">
                Danger Zone
              </label>
              <button
                onClick={handleDeleteTable}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Table
              </button>
            </div>
          </div>
        )}
        
        {/* Column Context - REMOVED */}
        
        {/* Row Context - REMOVED */}
      </div>
    </div>
  );
}

