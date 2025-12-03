"use client";

import React from "react";

/**
 * Customizable Dynamic Table Template Component
 * 
 * A flexible table component with customizable:
 * - Header styling and colors
 * - Cell formatting
 * - Row styling (striped, hover effects)
 * - Border and spacing
 * - Empty state handling
 * - Responsive behavior
 */
export interface DynamicTableTemplateProps {
  headers?: string[];
  columns?: string[]; // Support 'columns' prop from our JSON structure
  rows: (string | number | React.ReactNode)[][];
  
  // Editable Configuration
  editable?: boolean;
  onCellChange?: (rowIndex: number, cellIndex: number, newValue: string) => void;
  onHeaderChange?: (headerIndex: number, newValue: string) => void;
  onTitleChange?: (newTitle: string) => void;
  
  // Table Title
  title?: string;
  titleClassName?: string;
  titleSize?: "sm" | "base" | "lg" | "xl" | "2xl";
  showTitle?: boolean;
  
  // Header Configuration
  headerBackgroundColor?: string;
  headerGradient?: {
    from: string;
    to: string;
  };
  headerTextColor?: string;
  headerFontWeight?: "normal" | "medium" | "semibold" | "bold";
  headerTextSize?: "xs" | "sm" | "base";
  headerClassName?: string;
  headerUppercase?: boolean;
  headerTracking?: "normal" | "wide" | "wider" | "widest";
  
  // Cell Configuration
  cellClassName?: string;
  cellTextColor?: string;
  cellTextSize?: "xs" | "sm" | "base";
  cellPadding?: string;
  cellAlignment?: "left" | "center" | "right";
  
  // Row Configuration
  stripedRows?: boolean;
  stripeColor?: string;
  hoverEffect?: boolean;
  hoverColor?: string;
  rowClassName?: string;
  
  // Border Configuration
  border?: boolean;
  borderColor?: string;
  borderWidth?: "thin" | "medium" | "thick";
  rounded?: boolean;
  
  // Spacing Configuration
  marginBottom?: string;
  tableWrapperClassName?: string;
  containerClassName?: string;
  
  // Empty State
  emptyStateMessage?: string;
  emptyStateClassName?: string;
  showEmptyState?: boolean;
  
  // Layout
  fullWidth?: boolean;
  overflowX?: boolean;
  shadow?: boolean;
  backgroundColor?: string;
  
  // Additional customization
  className?: string;
  style?: React.CSSProperties;
}

const DynamicTableTemplate: React.FC<DynamicTableTemplateProps> = ({
  headers,
  columns, // Use 'columns' from JSON or fallback to 'headers'
  rows,
  // Editable
  editable = true,
  onCellChange,
  onHeaderChange,
  onTitleChange,
  // Title
  title,
  titleClassName = "",
  titleSize = "xl",
  showTitle = true,
  // Header
  headerBackgroundColor,
  headerGradient = {
    from: "#A4C639",
    to: "#8FB02E",
  },
  headerTextColor = "text-white",
  headerFontWeight = "bold",
  headerTextSize = "sm",
  headerClassName = "",
  headerUppercase = true,
  headerTracking = "wider",
  // Cell
  cellClassName = "",
  cellTextColor = "text-gray-700",
  cellTextSize = "sm",
  cellPadding = "px-6 py-4",
  cellAlignment = "left",
  // Row
  stripedRows = true,
  stripeColor = "bg-gray-50/30",
  hoverEffect = true,
  hoverColor = "hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50",
  rowClassName = "",
  // Border
  border = true,
  borderColor = "border-gray-200",
  borderWidth = "medium",
  rounded = true,
  // Spacing
  marginBottom = "mb-10",
  tableWrapperClassName = "",
  containerClassName = "",
  // Empty State
  emptyStateMessage = "No data available",
  emptyStateClassName = "",
  showEmptyState = true,
  // Layout
  fullWidth = true,
  overflowX = true,
  shadow = true,
  backgroundColor = "bg-white",
  // Additional
  className = "",
  style,
}) => {
  // Use 'columns' from JSON or fallback to 'headers'
  const tableHeaders = columns || headers || [];

  // Handle empty state
  if (!tableHeaders || tableHeaders.length === 0) {
    return null;
  }

  // Normalize rows to match headers length
  const normalizedRows = rows?.map((row) => {
    const normalizedRow = Array.isArray(row) ? [...row] : [];
    // Pad or truncate to match headers length
    while (normalizedRow.length < tableHeaders.length) {
      normalizedRow.push("");
    }
    return normalizedRow.slice(0, tableHeaders.length);
  }) || [];

  // Clean empty headers
  const cleanHeaders = tableHeaders.filter(h => h && String(h).trim());
  
  if (cleanHeaders.length === 0) return null;

  // Build header background classes
  const getHeaderBackgroundClasses = () => {
    if (headerBackgroundColor) {
      return `bg-[${headerBackgroundColor}]`;
    }
    if (headerGradient) {
      return `bg-gradient-to-r from-[${headerGradient.from}] to-[${headerGradient.to}]`;
    }
    // Default gradient
    return `bg-gradient-to-r from-[#A4C639] to-[#8FB02E]`;
  };

  // Build header classes - Ultra compact for NO scrolling
  const headerClasses = [
    getHeaderBackgroundClasses(),
    headerTextColor,
    `font-${headerFontWeight}`,
    "text-center",
    "border-r border-white/30",
    headerUppercase && "uppercase",
    "tracking-tight",
    "last:border-r-0",
    headerClassName,
  ].filter(Boolean).join(" ");

  // Build cell classes - Compact for perfect compression
  const cellClasses = [
    cellTextColor,
    "text-center",
    "border-r border-gray-200",
    "last:border-r-0",
    cellClassName,
  ].filter(Boolean).join(" ");

  // Build row classes
  const getRowClasses = (rowIndex: number) => {
    return [
      "transition-colors duration-150",
      hoverEffect && hoverColor,
      stripedRows && rowIndex % 2 === 0 && stripeColor,
      rowClassName,
    ].filter(Boolean).join(" ");
  };

  // Build border width classes
  const getBorderWidth = () => {
    switch (borderWidth) {
      case "thin":
        return "border";
      case "thick":
        return "border-2";
      default:
        return "border";
    }
  };

  // Build wrapper classes - Always 100% width, comfortable spacing
  const wrapperClasses = [
    "dynamic-table-wrapper",
    "w-full",
    marginBottom || "mb-6",
    tableWrapperClassName,
    className,
  ].filter(Boolean).join(" ");

  return (
    <div className={wrapperClasses} style={style}>
      {/* Table Title - Compact */}
      {showTitle && title && (
        <div className="mb-3">
          <h3 
            className="text-base font-bold text-gray-900"
            contentEditable={editable}
            suppressContentEditableWarning={true}
            onBlur={(e) => {
              if (editable && onTitleChange) {
                onTitleChange(e.currentTarget.textContent || '');
              }
            }}
          >
            {title}
          </h3>
        </div>
      )}

      {/* Table Container - NO overflow, perfect compression */}
      <div className="w-full rounded-lg border-2 border-[#A4C639] overflow-hidden">
        <table className="dynamic-table w-full border-collapse" style={{ tableLayout: 'fixed' }}>
          {/* Table Header */}
          <thead>
            <tr className="bg-linear-to-r from-[#A4C639] to-[#8FB02E]">
              {cleanHeaders.map((header, index) => (
                  <th
                    key={index}
                  className={headerClasses}
                  style={{ 
                    fontSize: '9px',
                    lineHeight: '1.2',
                    padding: '6px 4px',
                    verticalAlign: 'middle'
                  }}
                >
                  <div 
                    className="wrap-break-word hyphens-auto" 
                    style={{ wordBreak: 'break-word' }}
                    contentEditable={editable}
                    suppressContentEditableWarning={true}
                    onBlur={(e) => {
                      if (editable && onHeaderChange) {
                        onHeaderChange(index, e.currentTarget.textContent || '');
                      }
                    }}
                  >
                    {header || `Col ${index + 1}`}
                  </div>
                  </th>
                ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {normalizedRows.length > 0 ? (
              normalizedRows.map((row, rowIndex) => (
                <tr 
                  key={rowIndex} 
                  className={`${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-green-50/50 transition-colors`}
                >
                  {cleanHeaders.map((_, cellIndex) => {
                    const cell = row[cellIndex];
                    const cellValue = cell !== null && cell !== undefined ? String(cell) : '';
                    
                    return (
                      <td 
                        key={cellIndex} 
                        className={cellClasses}
                        style={{ 
                          fontSize: '8px',
                          lineHeight: '1.3',
                          padding: '5px 4px',
                          verticalAlign: 'middle'
                        }}
                      >
                        <div 
                          className="wrap-break-word font-medium" 
                          style={{ wordBreak: 'break-word' }}
                          contentEditable={editable}
                          suppressContentEditableWarning={true}
                          onBlur={(e) => {
                            if (editable && onCellChange) {
                              onCellChange(rowIndex, cellIndex, e.currentTarget.textContent || '');
                            }
                          }}
                        >
                          {cellValue || '—'}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={cleanHeaders.length}
                  className="px-4 py-6 text-center text-gray-400 text-xs"
                >
                  No data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DynamicTableTemplate;

