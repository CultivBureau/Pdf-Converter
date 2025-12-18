import type { Section, Table, ExtractResponse } from '../types/ExtractTypes';

/**
 * Generate complete JSX template code from structured JSON data
 * Uses default imports and maps over sections/tables arrays
 */
export function structureToJsx(
  structure: ExtractResponse | { sections: Section[]; tables: Table[]; meta?: any }
): string {
  const sections = structure.sections || [];
  const tables = structure.tables || [];

  // Generate sections array string
  const sectionsArray = sections.map((section, index) => {
    const title = section.title || '';
    const content = section.content || '';
    
    // Escape backticks and template literals in content
    const escapedTitle = title.replace(/`/g, '\\`').replace(/\${/g, '\\${').replace(/\\/g, '\\\\');
    const escapedContent = content.replace(/`/g, '\\`').replace(/\${/g, '\\${').replace(/\\/g, '\\\\');
    
    return `    {
      title: \`${escapedTitle}\`,
      content: \`${escapedContent}\`,
      type: "${section.type || 'section'}"
    }`;
  }).join(',\n');

  // Generate tables array string
  const tablesArray = tables.map((table) => {
    const columns = table.columns || table.headers || [];
    const rows = table.rows || [];
    const title = table.title || '';
    
    // Escape strings in columns - properly escape for JSON strings
    const columnsStr = columns.map(col => {
      const escaped = JSON.stringify(String(col));
      return escaped;
    }).join(', ');
    
    // Escape strings in rows - properly escape for JSON arrays
    const rowsStr = rows.map(row => {
      const rowArray = row.map(cell => {
        // Use JSON.stringify for proper escaping
        return JSON.stringify(String(cell));
      }).join(', ');
      return `[${rowArray}]`;
    }).join(',\n      ');
    
    // Use JSON.stringify for title to ensure proper escaping
    const escapedTitle = JSON.stringify(title);
    
    return `    {
      title: ${escapedTitle},
      columns: [${columnsStr}],
      rows: [${rowsStr ? '\n      ' + rowsStr + '\n    ' : ''}]
    }`;
  }).join(',\n');

  // Generate the complete template
  // Note: "use client" is not included as it's not needed in the generated template
  // The individual template components already have "use client" directives
  const template = `import React from 'react';
import BaseTemplate from '../Templates/baseTemplate';
import SectionTemplate from '../Templates/sectionTemplate';
import DynamicTableTemplate from '../Templates/dynamicTableTemplate';
import AirplaneSection from '../Templates/airplaneSection';
import HotelsSection from '../Templates/HotelsSection';
import TransportSection from '../Templates/TransportSection';

export default function Template() {
  const sections = [
${sectionsArray}
  ];

  const tables = [
${tablesArray}
  ];

  return (
    <BaseTemplate>
      {sections.map((section, index) => (
        <SectionTemplate 
          key={index}
          title={section.title || ""}
          content={section.content || ""}
          type={section.type || "section"}
        />
      ))}
      {tables.map((table, index) => (
        <DynamicTableTemplate
          key={index}
          title={table.title || ""}
          columns={table.columns || []}
          rows={table.rows || []}
        />
      ))}
    </BaseTemplate>
  );
}`;

  return template;
}

