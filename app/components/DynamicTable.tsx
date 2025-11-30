import React from 'react';

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
  title?: string;
  headers?: string[];
  rows: TableRow[];
  className?: string;
  cellClassName?: string;
  headerClassName?: string;
}

const DynamicTable: React.FC<DynamicTableProps> = ({
  title,
  headers,
  rows,
  className = '',
  cellClassName = '',
  headerClassName = '',
}) => {
  return (
    <div className={`w-full max-w-full overflow-x-auto ${className}`}>
      {title && (
        <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
          {title}
        </h3>
      )}
      <table className="w-full max-w-full border-collapse border border-gray-400 table-auto">
        {headers && headers.length > 0 && (
          <thead>
            <tr className="bg-green-100">
              {headers.map((header, index) => (
                <th
                  key={index}
                  className={`border border-gray-400 px-3 py-2 text-center font-bold text-gray-900 text-sm ${headerClassName}`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className={row.className || ''}>
              {row.cells.map((cell, cellIndex) => {
                const CellTag = cell.isHeader ? 'th' : 'td';
                const baseClass = cell.isHeader
                  ? 'bg-green-100 font-bold text-gray-900'
                  : 'bg-white text-gray-800';
                
                return (
                  <CellTag
                    key={cellIndex}
                    rowSpan={cell.rowSpan}
                    colSpan={cell.colSpan}
                    className={`border border-gray-400 px-3 py-2 text-center text-sm ${baseClass} ${cell.className || ''} ${cellClassName}`}
                  >
                    {cell.content}
                  </CellTag>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DynamicTable;