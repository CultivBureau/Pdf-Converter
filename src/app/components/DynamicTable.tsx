"use client";

import React from 'react';
import type { Table } from "../types/ExtractTypes";
import DynamicTableTemplate from "../Templates/dynamicTableTemplate";

interface TableCell {
  content: string;
  rowSpan?: number;
  colSpan?: number;
  isHeader?: boolean;
  className?: string;
}

interface TableRow {
  cells: TableCell[];
  className?: string;
}

interface DynamicTableProps {
  // Direct props (legacy support)
  title?: string;
  headers?: string[];
  rows?: TableRow[];
  
  // Phase 3: Table object support
  table?: Table;
  
  // Styling
  className?: string;
  cellClassName?: string;
  headerClassName?: string;
  
  // Features
  showStats?: boolean;
  editable?: boolean;
  onEdit?: (table: Table) => void;
  onDelete?: (table: Table) => void;
  onAddAfter?: (table: Table) => void;
}

const DynamicTable: React.FC<DynamicTableProps> = ({
  title,
  headers: propsHeaders,
  rows: propsRows,
  table,
  className = '',
  cellClassName = '',
  headerClassName = '',
  showStats = false,
  editable = false,
  onEdit,
  onDelete,
  onAddAfter,
}) => {
  // Use table object if available, otherwise use legacy props
  const tableColumns = table?.columns || propsHeaders || [];
  const tableRows = table?.rows || (propsRows?.map(row => row.cells.map(cell => cell.content)) || []);
  const tableTitle = title || table?.id || '';

  const handleCellChange = (rowIndex: number, cellIndex: number, newValue: string) => {
    if (table && onEdit) {
      const updatedRows = [...table.rows];
      if (updatedRows[rowIndex]) {
        updatedRows[rowIndex] = [...updatedRows[rowIndex]];
        updatedRows[rowIndex][cellIndex] = newValue;
      }
      onEdit({
        ...table,
        rows: updatedRows,
      });
    }
  };

  const handleHeaderChange = (headerIndex: number, newValue: string) => {
    if (table && onEdit) {
      const updatedColumns = [...table.columns];
      updatedColumns[headerIndex] = newValue;
      onEdit({
        ...table,
        columns: updatedColumns,
      });
    }
  };

  const handleTitleChange = (newTitle: string) => {
    // Table title is stored in meta or we can update it
    if (table && onEdit) {
      onEdit({
        ...table,
        // Title might be in meta or we handle it separately
      });
    }
  };

  if (tableColumns.length === 0 && tableRows.length === 0) {
    return (
      <div className={`w-full p-4 bg-gray-50 rounded-lg border border-gray-200 ${className}`}>
        <p className="text-gray-500 text-center">الجدول فارغ</p>
      </div>
    );
  }

  return (
    <div
      className={`w-full max-w-full relative ${className}`}
      data-table-id={table?.id}
      data-table-order={table?.order}
    >
      {/* Delete Icon - Top Right */}
      {editable && onDelete && table && (
        <button
          onClick={() => onDelete(table)}
          className="absolute top-2 right-2 z-10 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-110"
          title="Delete Table"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}

      <DynamicTableTemplate
        columns={tableColumns}
        rows={tableRows}
        title={tableTitle}
        editable={editable}
        onCellChange={editable ? handleCellChange : undefined}
        onHeaderChange={editable ? handleHeaderChange : undefined}
        onTitleChange={editable ? handleTitleChange : undefined}
        showTitle={!!tableTitle}
      />
      
      {/* Add Icon - Bottom Center */}
      {editable && onAddAfter && table && (
        <div className="flex justify-center mt-4">
          <button
            onClick={() => onAddAfter(table)}
            className="p-3 bg-[#A4C639] text-white rounded-full hover:bg-[#8FB02E] transition-all duration-200 shadow-md hover:shadow-lg hover:scale-110"
            title="Add New Table After This"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      )}
      
      {/* Statistics (optional) */}
      {showStats && table && (
        <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500 flex gap-4 justify-center">
          <span>Rows: {tableRows.length}</span>
          <span>Columns: {tableColumns.length}</span>
          <span>Order: {table.order}</span>
        </div>
      )}
    </div>
  );
};

export default DynamicTable;