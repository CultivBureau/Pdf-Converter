/**
 * Transport Section Code Manipulator
 * 
 * Utilities for manipulating TransportSection components in JSX code
 * with safeguards to only modify user-created sections (user_transport_* IDs)
 */

import { guardGeneratedContent } from './contentGuards';
import type { TransportTable, TransportRow } from '../types/TransportTypes';

/**
 * Find a TransportSection component by ID in the code
 * Returns the full component JSX string and its position
 */
export function findTransportSection(code: string, id: string): { component: string; startIndex: number; endIndex: number } | null {
  // Type check: ensure id is a string
  if (typeof id !== 'string' || !id) {
    throw new Error(`Invalid transport section ID: expected string, got ${typeof id}`);
  }
  
  guardGeneratedContent(id, 'find');
  
  if (!id.startsWith('user_transport_')) {
    throw new Error(`Invalid transport section ID: ${id}. Must start with 'user_transport_'`);
  }
  
  // Escape special regex characters in the ID
  const idPattern = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Find the opening tag with the specific ID
  const openingTagRegex = new RegExp(
    `<TransportSection\\s+[^>]*id\\s*=\\s*["']${idPattern}["'][^>]*(?:/>|>)`,
    'i'
  );
  
  const openingMatch = code.match(openingTagRegex);
  if (!openingMatch || openingMatch.index === undefined) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`TransportSection with id "${id}" not found in code`);
    }
    return null;
  }
  
  const startIndex = openingMatch.index;
  let endIndex = startIndex + openingMatch[0].length;
  
  // Validate that we actually matched a TransportSection component
  if (!/^<TransportSection/i.test(openingMatch[0])) {
    throw new Error(`Regex matched non-TransportSection component. This should not happen.`);
  }
  
  // If self-closing tag, we're done
  if (openingMatch[0].trim().endsWith('/>')) {
    return {
      component: openingMatch[0],
      startIndex,
      endIndex
    };
  }
  
  // If opening tag, find the corresponding closing tag
  const afterOpening = code.substring(endIndex);
  const closingTagRegex = /<\/TransportSection>/i;
  const closingMatch = afterOpening.match(closingTagRegex);
  
  if (closingMatch && closingMatch.index !== undefined) {
    endIndex = endIndex + closingMatch.index + closingMatch[0].length;
    const fullComponent = code.substring(startIndex, endIndex);
    
    // Final validation
    if (!fullComponent.includes(id)) {
      throw new Error(`Full component does not contain expected ID "${id}"`);
    }
    
    return {
      component: fullComponent,
      startIndex,
      endIndex
    };
  }
  
  return {
    component: openingMatch[0],
    startIndex,
    endIndex
  };
}

/**
 * Extract tables array from a TransportSection component string
 */
export function extractTransportTablesFromComponent(component: string): TransportTable[] {
  const tablesMatch = component.match(/tables\s*=\s*\{\[([\s\S]*?)\]\}/);
  if (!tablesMatch) {
    return [];
  }
  
  const tablesString = tablesMatch[1].trim();
  if (!tablesString) {
    return [];
  }
  
  const tables: TransportTable[] = [];
  
  // Parse table objects - similar to hotel parsing
  let depth = 0;
  let start = -1;
  const tableObjects: string[] = [];
  
  for (let i = 0; i < tablesString.length; i++) {
    const char = tablesString[i];
    const prevChar = i > 0 ? tablesString[i - 1] : '';
    
    if (char === '{' && prevChar !== '\\') {
      if (depth === 0) {
        start = i;
      }
      depth++;
    } else if (char === '}' && prevChar !== '\\') {
      depth--;
      if (depth === 0 && start !== -1) {
        tableObjects.push(tablesString.substring(start, i + 1));
        start = -1;
      }
    }
  }
  
  // Parse each table object
  for (const tableStr of tableObjects) {
    try {
      const table: Partial<TransportTable> = {
        columns: [],
        rows: []
      };
      
      // Extract id
      const idMatch = tableStr.match(/id\s*:\s*["']([^"']*)["']/);
      if (idMatch) table.id = idMatch[1];
      
      // Extract title
      const titleMatch = tableStr.match(/title\s*:\s*["']((?:[^"']|\\")*)["']/);
      if (titleMatch) table.title = titleMatch[1].replace(/\\"/g, '"');
      
      // Extract backgroundColor
      const bgMatch = tableStr.match(/backgroundColor\s*:\s*["']([^"']*)["']/);
      if (bgMatch) table.backgroundColor = bgMatch[1] as 'dark-blue' | 'dark-red' | 'pink';
      
      // Extract columns array
      const columnsMatch = tableStr.match(/columns\s*:\s*\[([\s\S]*?)\]/);
      if (columnsMatch) {
        const columnsStr = columnsMatch[1];
        // Parse column objects
        let colDepth = 0;
        let colStart = -1;
        const columnObjects: string[] = [];
        
        for (let i = 0; i < columnsStr.length; i++) {
          const char = columnsStr[i];
          const prevChar = i > 0 ? columnsStr[i - 1] : '';
          
          if (char === '{' && prevChar !== '\\') {
            if (colDepth === 0) colStart = i;
            colDepth++;
          } else if (char === '}' && prevChar !== '\\') {
            colDepth--;
            if (colDepth === 0 && colStart !== -1) {
              columnObjects.push(columnsStr.substring(colStart, i + 1));
              colStart = -1;
            }
          }
        }
        
        table.columns = columnObjects.map(colStr => {
          const keyMatch = colStr.match(/key\s*:\s*["']([^"']*)["']/);
          const labelMatch = colStr.match(/label\s*:\s*["']((?:[^"']|\\")*)["']/);
          return {
            key: keyMatch ? keyMatch[1] : '',
            label: labelMatch ? labelMatch[1].replace(/\\"/g, '"') : ''
          };
        });
      }
      
      // Extract rows array
      const rowsMatch = tableStr.match(/rows\s*:\s*\[([\s\S]*?)\]/);
      if (rowsMatch) {
        const rowsStr = rowsMatch[1];
        // Parse row objects
        let rowDepth = 0;
        let rowStart = -1;
        const rowObjects: string[] = [];
        
        for (let i = 0; i < rowsStr.length; i++) {
          const char = rowsStr[i];
          const prevChar = i > 0 ? rowsStr[i - 1] : '';
          
          if (char === '{' && prevChar !== '\\') {
            if (rowDepth === 0) rowStart = i;
            rowDepth++;
          } else if (char === '}' && prevChar !== '\\') {
            rowDepth--;
            if (rowDepth === 0 && rowStart !== -1) {
              rowObjects.push(rowsStr.substring(rowStart, i + 1));
              rowStart = -1;
            }
          }
        }
        
        table.rows = rowObjects.map(rowStr => {
          const row: TransportRow = {
            day: '',
            date: '',
            description: '',
            carType: ''
          };
          
          // Extract all key-value pairs
          const keyValueRegex = /(\w+)\s*:\s*["']((?:[^"']|\\")*)["']/g;
          let match;
          while ((match = keyValueRegex.exec(rowStr)) !== null) {
            const key = match[1];
            const value = match[2].replace(/\\"/g, '"').replace(/\\n/g, '\n');
            row[key] = value;
          }
          
          return row;
        });
      }
      
      if (table.id && table.title && table.backgroundColor && table.columns && table.rows) {
        tables.push(table as TransportTable);
      }
    } catch (error) {
      console.warn('Error parsing table object:', error);
    }
  }
  
  return tables;
}

/**
 * Extract transport section data (for editing section props)
 */
export function extractTransportSectionData(code: string, sectionId: string): {
  title?: string;
  showTitle?: boolean;
  direction?: "rtl" | "ltr";
  language?: "ar" | "en";
  tables: TransportTable[];
} | null {
  const section = findTransportSection(code, sectionId);
  if (!section) {
    return null;
  }
  
  const component = section.component;
  
  // Extract title
  const titleMatch = component.match(/title=["']((?:[^"']|\\")*)["']/);
  const title = titleMatch ? titleMatch[1].replace(/\\"/g, '"') : undefined;
  
  // Extract showTitle
  const showTitleMatch = component.match(/showTitle=\{?([^}]*)\}?/);
  const showTitle = showTitleMatch ? showTitleMatch[1].trim() === 'true' : undefined;
  
  // Extract direction
  const directionMatch = component.match(/direction=["']([^"']*)["']/);
  const direction = directionMatch ? directionMatch[1] as "rtl" | "ltr" : undefined;
  
  // Extract language
  const languageMatch = component.match(/language=["']([^"']*)["']/);
  const language = languageMatch ? languageMatch[1] as "ar" | "en" : undefined;
  
  // Extract tables using the parser
  const tables = extractTransportTablesFromComponent(component);
  
  return {
    title,
    showTitle,
    direction,
    language,
    tables
  };
}

/**
 * Replace tables array in component string
 */
function replaceTablesInComponent(component: string, tables: TransportTable[]): string {
  // Format tables for JSX
  const tablesString = tables.map(table => {
    const columnsString = table.columns.map(col => `{
            key: "${col.key.replace(/"/g, '\\"')}",
            label: "${col.label.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"
          }`).join(',\n            ');
    
    const rowsString = table.rows.map(row => {
      const rowData: string[] = [];
      table.columns.forEach(col => {
        const value = row[col.key] || '';
        rowData.push(`${col.key}: "${String(value).replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`);
      });
      if (row.note) {
        rowData.push(`note: "${row.note.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`);
      }
      return `{
              ${rowData.join(',\n              ')}
            }`;
    }).join(',\n          ');
    
    return `{
            id: "${table.id}",
            title: "${table.title.replace(/"/g, '\\"')}",
            backgroundColor: "${table.backgroundColor}",
            columns: [\n            ${columnsString}\n            ],
            rows: [\n          ${rowsString}\n          ]
          }`;
  }).join(',\n          ');
  
  // Replace the tables array in the component
  const tablesRegex = /(tables\s*=\s*\{\[)([\s\S]*?)(\]\})/;
  return component.replace(tablesRegex, `$1\n          ${tablesString}\n          $3`);
}

/**
 * Update a row in a specific table
 */
export function updateTransportRowInComponent(
  code: string, 
  sectionId: string, 
  tableIndex: number, 
  rowIndex: number, 
  rowData: TransportRow
): string {
  guardGeneratedContent(sectionId, 'update');
  
  const section = findTransportSection(code, sectionId);
  if (!section) {
    throw new Error(`TransportSection with id "${sectionId}" not found`);
  }
  
  // Parse tables from component
  const tables = extractTransportTablesFromComponent(section.component);
  if (tableIndex < 0 || tableIndex >= tables.length) {
    throw new Error(`Invalid table index: ${tableIndex}. Component has ${tables.length} tables.`);
  }
  if (rowIndex < 0 || rowIndex >= tables[tableIndex].rows.length) {
    throw new Error(`Invalid row index: ${rowIndex}. Table has ${tables[tableIndex].rows.length} rows.`);
  }
  
  // Update the row
  tables[tableIndex].rows[rowIndex] = { ...rowData };
  
  // Regenerate component with updated tables
  const updatedComponent = replaceTablesInComponent(section.component, tables);
  
  // Replace in code
  const before = code.substring(0, section.startIndex);
  const after = code.substring(section.endIndex);
  
  return before + updatedComponent + after;
}

/**
 * Add a row to a specific table
 */
export function addTransportRowToComponent(
  code: string, 
  sectionId: string, 
  tableIndex: number, 
  rowData: TransportRow
): string {
  guardGeneratedContent(sectionId, 'add');
  
  const section = findTransportSection(code, sectionId);
  if (!section) {
    throw new Error(`TransportSection with id "${sectionId}" not found`);
  }
  
  const tables = extractTransportTablesFromComponent(section.component);
  if (tableIndex < 0 || tableIndex >= tables.length) {
    throw new Error(`Invalid table index: ${tableIndex}. Component has ${tables.length} tables.`);
  }
  
  tables[tableIndex].rows.push({ ...rowData });
  
  const updatedComponent = replaceTablesInComponent(section.component, tables);
  
  const before = code.substring(0, section.startIndex);
  const after = code.substring(section.endIndex);
  
  return before + updatedComponent + after;
}

/**
 * Remove a row from a specific table
 */
export function removeTransportRowFromComponent(
  code: string, 
  sectionId: string, 
  tableIndex: number, 
  rowIndex: number
): string {
  guardGeneratedContent(sectionId, 'remove');
  
  const section = findTransportSection(code, sectionId);
  if (!section) {
    throw new Error(`TransportSection with id "${sectionId}" not found`);
  }
  
  const tables = extractTransportTablesFromComponent(section.component);
  if (tableIndex < 0 || tableIndex >= tables.length) {
    throw new Error(`Invalid table index: ${tableIndex}. Component has ${tables.length} tables.`);
  }
  if (rowIndex < 0 || rowIndex >= tables[tableIndex].rows.length) {
    throw new Error(`Invalid row index: ${rowIndex}. Table has ${tables[tableIndex].rows.length} rows.`);
  }
  if (tables[tableIndex].rows.length === 1) {
    throw new Error('Cannot remove the last row. Delete the entire table instead.');
  }
  
  tables[tableIndex].rows.splice(rowIndex, 1);
  
  const updatedComponent = replaceTablesInComponent(section.component, tables);
  
  const before = code.substring(0, section.startIndex);
  const after = code.substring(section.endIndex);
  
  return before + updatedComponent + after;
}

/**
 * Update a table (title, color, columns)
 */
export function updateTransportTableInComponent(
  code: string, 
  sectionId: string, 
  tableIndex: number, 
  tableData: TransportTable
): string {
  guardGeneratedContent(sectionId, 'update');
  
  const section = findTransportSection(code, sectionId);
  if (!section) {
    throw new Error(`TransportSection with id "${sectionId}" not found`);
  }
  
  const tables = extractTransportTablesFromComponent(section.component);
  if (tableIndex < 0 || tableIndex >= tables.length) {
    throw new Error(`Invalid table index: ${tableIndex}. Component has ${tables.length} tables.`);
  }
  
  // Update the table while preserving existing rows
  tables[tableIndex] = {
    ...tableData,
    id: tables[tableIndex].id, // Preserve ID
    rows: tables[tableIndex].rows, // Preserve existing rows
  };
  
  const updatedComponent = replaceTablesInComponent(section.component, tables);
  
  const before = code.substring(0, section.startIndex);
  const after = code.substring(section.endIndex);
  
  return before + updatedComponent + after;
}

/**
 * Add a table to the section
 */
export function addTransportTableToComponent(
  code: string, 
  sectionId: string, 
  tableData: TransportTable
): string {
  guardGeneratedContent(sectionId, 'add');
  
  const section = findTransportSection(code, sectionId);
  if (!section) {
    throw new Error(`TransportSection with id "${sectionId}" not found`);
  }
  
  const tables = extractTransportTablesFromComponent(section.component);
  tables.push({ ...tableData });
  
  const updatedComponent = replaceTablesInComponent(section.component, tables);
  
  const before = code.substring(0, section.startIndex);
  const after = code.substring(section.endIndex);
  
  return before + updatedComponent + after;
}

/**
 * Remove a table from the section
 */
export function removeTransportTableFromComponent(
  code: string, 
  sectionId: string, 
  tableIndex: number
): string {
  guardGeneratedContent(sectionId, 'remove');
  
  const section = findTransportSection(code, sectionId);
  if (!section) {
    throw new Error(`TransportSection with id "${sectionId}" not found`);
  }
  
  const tables = extractTransportTablesFromComponent(section.component);
  if (tableIndex < 0 || tableIndex >= tables.length) {
    throw new Error(`Invalid table index: ${tableIndex}. Component has ${tables.length} tables.`);
  }
  if (tables.length === 1) {
    throw new Error('Cannot remove the last table. Delete the entire section instead.');
  }
  
  tables.splice(tableIndex, 1);
  
  const updatedComponent = replaceTablesInComponent(section.component, tables);
  
  const before = code.substring(0, section.startIndex);
  const after = code.substring(section.endIndex);
  
  return before + updatedComponent + after;
}

/**
 * Update TransportSection props (title, showTitle, direction, language)
 */
export function updateTransportSectionProps(
  code: string,
  sectionId: string,
  props: {
    title?: string;
    showTitle?: boolean;
    direction?: "rtl" | "ltr";
    language?: "ar" | "en";
  }
): string {
  guardGeneratedContent(sectionId, 'update');
  
  const section = findTransportSection(code, sectionId);
  if (!section) {
    throw new Error(`TransportSection with id "${sectionId}" not found`);
  }
  
  let updated = section.component;
  
  // Update title
  if (props.title !== undefined) {
    if (updated.includes('title=')) {
      updated = updated.replace(/title=["'][^"']*["']/g, `title="${props.title.replace(/"/g, '\\"')}"`);
    } else {
      updated = updated.replace(/(id=["'][^"']*["'])/, `title="${props.title.replace(/"/g, '\\"')}" $1`);
    }
  }
  
  // Update showTitle
  if (props.showTitle !== undefined) {
    if (updated.includes('showTitle=')) {
      updated = updated.replace(/showTitle=\{?[^}]*\}?/g, `showTitle={${props.showTitle}}`);
    } else {
      updated = updated.replace(/(id=["'][^"']*["'])/, `showTitle={${props.showTitle}} $1`);
    }
  }
  
  // Update direction
  if (props.direction !== undefined) {
    if (updated.includes('direction=')) {
      updated = updated.replace(/direction=["'][^"']*["']/g, `direction="${props.direction}"`);
    } else {
      updated = updated.replace(/(language=|id=["'][^"']*["'])/, `direction="${props.direction}" $1`);
    }
  }
  
  // Update language
  if (props.language !== undefined) {
    if (updated.includes('language=')) {
      updated = updated.replace(/language=["'][^"']*["']/g, `language="${props.language}"`);
    } else {
      updated = updated.replace(/(\/>|>)/, `language="${props.language}" $1`);
    }
  }
  
  // Replace the component in the code
  const before = code.substring(0, section.startIndex);
  const after = code.substring(section.endIndex);
  
  return before + updated + after;
}

/**
 * Remove an entire TransportSection component from code
 */
export function removeTransportSection(code: string, id: string): string {
  guardGeneratedContent(id, 'delete');
  
  const section = findTransportSection(code, id);
  if (!section) {
    throw new Error(`TransportSection with id "${id}" not found in code`);
  }
  
  // Remove the component and clean up surrounding whitespace
  const before = code.substring(0, section.startIndex);
  const after = code.substring(section.endIndex);
  
  // Remove trailing newlines/whitespace from before
  const cleanedBefore = before.replace(/\s+$/, '');
  // Remove leading newlines/whitespace from after
  const cleanedAfter = after.replace(/^\s+/, after.trimStart().startsWith('\n') ? '' : '');
  
  return cleanedBefore + cleanedAfter;
}

