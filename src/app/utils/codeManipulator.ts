/**
 * Code Manipulator Utility
 * Functions to modify JSX code structure (sections, tables, columns, rows)
 * Handles both direct component usage and array-based patterns
 */

import { parseJSXCode, ParsedSection, ParsedTable } from './jsxParser';

/**
 * Generate object string for array-based section
 */
function generateSectionObject(section: { title?: string; content: string; type?: string; id?: string; order?: number; parent_id?: string | null }): string {
  const props: string[] = [];
  
  props.push(`"type": "section"`);
  
  // Preserve ID if it exists, otherwise generate new one
  if (section.id) {
    const escapedId = section.id
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"');
    props.push(`"id": "${escapedId}"`);
  } else {
    props.push(`"id": "section_${Date.now()}"`);
  }
  
  if (section.title !== undefined) {
    const escapedTitle = (section.title || '')
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n');
    props.push(`"title": "${escapedTitle}"`);
  } else {
    props.push(`"title": ""`);
  }
  
  const escapedContent = (section.content || '')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n');
  props.push(`"content": "${escapedContent}"`);
  
  props.push(`"order": ${section.order !== undefined ? section.order : 0}`);
  props.push(`"parent_id": ${section.parent_id !== undefined && section.parent_id !== null ? `"${section.parent_id.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"` : 'null'}`);
  
  return `    {\n      ${props.join(',\n      ')}\n    }`;
}

/**
 * Generate object string for array-based table
 */
function generateTableObject(table: { 
  headers?: string[]; 
  columns?: string[]; 
  rows: (string | number)[][]; 
  title?: string;
  id?: string;
}): string {
  const props: string[] = [];
  
  // Generate unique ID if not provided
  const tableId = table.id || `table_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  props.push(`"type": "table"`);
  props.push(`"id": "${tableId}"`);
  
  if (table.columns && table.columns.length > 0) {
    const columnsStr = table.columns.map(c => {
      const escaped = String(c)
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n');
      return `"${escaped}"`;
    }).join(', ');
    props.push(`"columns": [\n        ${columnsStr}\n      ]`);
  } else if (table.headers && table.headers.length > 0) {
    const headersStr = table.headers.map(h => {
      const escaped = String(h)
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n');
      return `"${escaped}"`;
    }).join(', ');
    props.push(`"columns": [\n        ${headersStr}\n      ]`);
  } else {
    props.push(`"columns": []`);
  }
  
  if (table.rows && table.rows.length > 0) {
    const rowsStr = table.rows.map(row => {
      const rowStr = row.map(cell => {
        const escaped = String(cell)
          .replace(/\\/g, '\\\\')
          .replace(/"/g, '\\"')
          .replace(/\n/g, '\\n');
        return `"${escaped}"`;
      }).join(', ');
      return `[\n        ${rowStr}\n      ]`;
    }).join(',\n      ');
    props.push(`"rows": [\n      ${rowsStr}\n    ]`);
  } else {
    props.push(`"rows": []`);
  }
  
  props.push(`"order": 0`);
  props.push(`"section_id": null`);
  
  return `    {\n      ${props.join(',\n      ')}\n    }`;
}

/**
 * Generate JSX string for a section (direct component usage)
 */
function generateSectionJSX(section: { title?: string; content: string; type?: string; id?: string }): string {
  const props: string[] = [];
  
  // Generate unique ID if not provided
  const sectionId = section.id || `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  props.push(`id="${sectionId}"`);
  
  if (section.title) {
    const escapedTitle = section.title
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n');
    props.push(`title="${escapedTitle}"`);
  }
  
  const escapedContent = section.content
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n');
  props.push(`content="${escapedContent}"`);
  
  if (section.type && section.type !== 'section') {
    props.push(`type="${section.type}"`);
  }
  
  return `<SectionTemplate ${props.join(' ')} />`;
}

/**
 * Generate JSX string for a table (direct component usage)
 */
function generateTableJSX(table: { 
  headers?: string[]; 
  columns?: string[]; 
  rows: (string | number)[][]; 
  title?: string;
  id?: string;
}): string {
  const props: string[] = [];
  
  // Generate unique ID if not provided
  const tableId = table.id || `table_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Add tableId prop for identification
  props.push(`tableId="${tableId}"`);
  
  if (table.title) {
    const escapedTitle = table.title
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n');
    props.push(`title="${escapedTitle}"`);
  }
  
  // Always include tableId for identification
  if (tableId) {
    props.push(`tableId="${tableId}"`);
  }
  
  if (table.columns && table.columns.length > 0) {
    const columnsStr = table.columns.map(c => {
      const escaped = String(c)
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n');
      return `"${escaped}"`;
    }).join(', ');
    props.push(`columns={[${columnsStr}]}`);
  } else if (table.headers && table.headers.length > 0) {
    const headersStr = table.headers.map(h => {
      const escaped = String(h)
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n');
      return `"${escaped}"`;
    }).join(', ');
    props.push(`headers={[${headersStr}]}`);
  }
  
  if (table.rows && table.rows.length > 0) {
    const rowsStr = table.rows.map(row => {
      const rowStr = row.map(cell => {
        const escaped = String(cell)
          .replace(/\\/g, '\\\\')
          .replace(/"/g, '\\"')
          .replace(/\n/g, '\\n');
        return `"${escaped}"`;
      }).join(', ');
      return `[${rowStr}]`;
    }).join(', ');
    props.push(`rows={[${rowsStr}]}`);
  }
  
  return `<DynamicTableTemplate ${props.join(' ')} />`;
}

/**
 * Add a new section to the code
 */
export function addSection(
  code: string,
  sectionData: { title?: string; content: string; type?: string },
  position?: number
): string {
  const parsed = parseJSXCode(code);
  
  if (parsed.isArrayBased) {
    // Handle array-based pattern
    const sectionsArrayMatch = code.match(/(const\s+sections\s*=\s*\[)([\s\S]*?)(\];)/);
    if (!sectionsArrayMatch) return code;
    
    const arrayStartIndex = sectionsArrayMatch.index! + sectionsArrayMatch[1].length;
    const arrayContent = sectionsArrayMatch[2];
    const newSectionObject = generateSectionObject(sectionData);
    
    if (position !== undefined && position >= 0 && position < parsed.sections.length) {
      // Insert at specific position
      const targetSection = parsed.sections[position];
      const relativeStart = targetSection.startIndex - arrayStartIndex;
      const beforeSection = arrayContent.substring(0, relativeStart).trim();
      const afterSection = arrayContent.substring(relativeStart).trim();
      
      // Find the start of the target section object
      let sectionObjStart = relativeStart;
      while (sectionObjStart > 0 && arrayContent[sectionObjStart - 1] !== '{' && arrayContent[sectionObjStart - 1] !== ',') {
        sectionObjStart--;
      }
      const actualBefore = arrayContent.substring(0, sectionObjStart).trim();
      
      const newArrayContent = actualBefore + 
        (actualBefore ? ',\n' : '') + 
        newSectionObject + ',\n' + 
        afterSection;
      
      return code.substring(0, sectionsArrayMatch.index!) + 
        sectionsArrayMatch[1] + newArrayContent + sectionsArrayMatch[3] + 
        code.substring(sectionsArrayMatch.index! + sectionsArrayMatch[0].length);
    } else {
      // Insert at the end (before closing bracket)
      const trimmedContent = arrayContent.trim();
      const newArrayContent = trimmedContent + 
        (trimmedContent ? ',\n' : '') + 
        newSectionObject;
      
      return code.substring(0, sectionsArrayMatch.index!) + 
        sectionsArrayMatch[1] + newArrayContent + sectionsArrayMatch[3] + 
        code.substring(sectionsArrayMatch.index! + sectionsArrayMatch[0].length);
    }
  } else {
    // Handle direct component usage
    const returnMatch = code.match(/return\s*\([\s\S]*?<BaseTemplate[^>]*>([\s\S]*?)<\/BaseTemplate>/);
    if (!returnMatch) {
      const lastSection = parsed.sections[parsed.sections.length - 1];
      if (lastSection) {
        const newSection = '\n        ' + generateSectionJSX(sectionData);
        return code.slice(0, lastSection.endIndex) + newSection + code.slice(lastSection.endIndex);
      }
      return code;
    }
    
    const baseTemplateContent = returnMatch[1];
    const baseTemplateContentStart = returnMatch.index! + returnMatch[0].indexOf('>') + 1;
    
    if (position !== undefined && position >= 0 && position < parsed.sections.length) {
      const targetSection = parsed.sections[position];
      const newSection = '\n        ' + generateSectionJSX(sectionData);
      return code.slice(0, targetSection.startIndex) + newSection + '\n        ' + code.slice(targetSection.startIndex);
    } else {
      const newSection = '\n        ' + generateSectionJSX(sectionData);
      return code.slice(0, baseTemplateContentStart + baseTemplateContent.length) + newSection + code.slice(baseTemplateContentStart + baseTemplateContent.length);
    }
  }
}

/**
 * Remove a section from the code by ID
 */
export function removeSection(code: string, sectionId: string): string {
  const parsed = parseJSXCode(code);
  
  // Find section by ID
  const sectionIndex = parsed.sections.findIndex(s => s.id === sectionId);
  
  if (sectionIndex === -1) {
    console.warn('Section not found with ID:', sectionId);
    return code;
  }
  
  const section = parsed.sections[sectionIndex];
  
  if (parsed.isArrayBased && section.isArrayBased) {
    // Handle array-based pattern - rebuild the entire array without the removed section
    const sectionsArrayMatch = code.match(/(const\s+sections\s*=\s*\[)([\s\S]*?)(\];)/);
    if (!sectionsArrayMatch) {
      console.warn('Could not find sections array in code');
      return code;
    }
    
    // Create new sections array without the removed section
    const remainingSections = parsed.sections.filter((s) => s.id !== sectionId);
    
    console.log('Removing section', sectionIndex, '- remaining sections:', remainingSections.length);
    
    // Rebuild array with remaining sections
    const newSectionObjects = remainingSections.map((s, idx) => {
      const sectionObj = generateSectionObject({
        title: s.title || '',
        content: s.content || '',
        type: s.type || 'section',
        id: s.id,
        order: s.order !== undefined ? s.order : idx,
        parent_id: s.parent_id,
      });
      console.log('Generated section object', idx, ':', sectionObj.substring(0, 100));
      return sectionObj;
    });
    
    const newArrayContent = newSectionObjects.join(',\n');
    
    const beforeArray = code.substring(0, sectionsArrayMatch.index!);
    const afterArray = code.substring(sectionsArrayMatch.index! + sectionsArrayMatch[0].length);
    
    // Ensure we have valid array content
    if (remainingSections.length === 0) {
      // Empty array case
      const newCode = beforeArray + sectionsArrayMatch[1] + '\n' + sectionsArrayMatch[3] + afterArray;
      console.log('Removed last section - empty array');
      return newCode;
    }
    
    const newCode = beforeArray + sectionsArrayMatch[1] + '\n' + newArrayContent + '\n' + sectionsArrayMatch[3] + afterArray;
    
    console.log('Generated new code length:', newCode.length, 'original:', code.length);
    console.log('New array content preview:', newArrayContent.substring(0, 200));
    
    // Validate the generated code doesn't have obvious syntax errors
    if (newArrayContent.includes(',,') || newArrayContent.match(/,\s*,/)) {
      console.error('Double comma detected in generated array!');
      return code; // Return original code if we detect an error
    }
    
    // Check for unclosed braces
    const openBraces = (newArrayContent.match(/{/g) || []).length;
    const closeBraces = (newArrayContent.match(/}/g) || []).length;
    if (openBraces !== closeBraces) {
      console.error('Mismatched braces in generated array!', { openBraces, closeBraces });
      return code;
    }
    
    return newCode;
  } else {
    // Handle direct component usage
    let before = code.slice(0, section.startIndex);
    let after = code.slice(section.endIndex);
    
    before = before.replace(/\n\s*\n\s*$/, '\n');
    after = after.replace(/^\s*\n\s*/, '\n');
    
    return before + after;
  }
}

/**
 * Update section title
 */
export function updateSectionTitle(code: string, sectionIndex: number, newTitle: string): string {
  const parsed = parseJSXCode(code);
  
  if (sectionIndex < 0 || sectionIndex >= parsed.sections.length) {
    return code;
  }
  
  const section = parsed.sections[sectionIndex];
  
  if (parsed.isArrayBased && section.isArrayBased) {
    // Update in array - replace the entire section object
    const updatedSection: ParsedSection = {
      ...section,
      title: newTitle,
    };
    
    const newSectionObject = generateSectionObject(updatedSection);
    return code.substring(0, section.startIndex) + newSectionObject + code.substring(section.endIndex);
  } else {
    // Update in JSX
    const updatedSection: ParsedSection = {
      ...section,
      title: newTitle,
    };
    
    const newJSX = generateSectionJSX(updatedSection);
    return code.slice(0, section.startIndex) + newJSX + code.slice(section.endIndex);
  }
}

/**
 * Update section content
 */
export function updateSectionContent(code: string, sectionIndex: number, newContent: string): string {
  const parsed = parseJSXCode(code);
  
  if (sectionIndex < 0 || sectionIndex >= parsed.sections.length) {
    return code;
  }
  
  const section = parsed.sections[sectionIndex];
  
  if (parsed.isArrayBased && section.isArrayBased) {
    // Update in array - replace the entire section object
    const updatedSection: ParsedSection = {
      ...section,
      content: newContent,
    };
    
    const newSectionObject = generateSectionObject(updatedSection);
    return code.substring(0, section.startIndex) + newSectionObject + code.substring(section.endIndex);
  } else {
    // Update in JSX
    const updatedSection: ParsedSection = {
      ...section,
      content: newContent,
    };
    
    const newJSX = generateSectionJSX(updatedSection);
    return code.slice(0, section.startIndex) + newJSX + code.slice(section.endIndex);
  }
}

/**
 * Add a column to a table
 */
export function addTableColumn(
  code: string,
  tableIndex: number,
  columnName: string,
  position?: number
): string {
  const parsed = parseJSXCode(code);
  
  if (tableIndex < 0 || tableIndex >= parsed.tables.length) {
    return code;
  }
  
  const table = parsed.tables[tableIndex];
  const columns = table.columns || table.headers || [];
  const rows = table.rows || [];
  
  // Insert column at position
  const newColumns = [...columns];
  if (position !== undefined && position >= 0 && position <= newColumns.length) {
    newColumns.splice(position, 0, columnName);
  } else {
    newColumns.push(columnName);
  }
  
  // Add empty cell to each row
  const newRows = rows.map(row => {
    const newRow = [...row];
    if (position !== undefined && position >= 0 && position <= newRow.length) {
      newRow.splice(position, 0, '');
    } else {
      newRow.push('');
    }
    return newRow;
  });
  
  const updatedTable: ParsedTable = {
    ...table,
    columns: newColumns,
    rows: newRows,
  };
  
  if (parsed.isArrayBased && table.isArrayBased) {
    // Update in array
    const tablesArrayMatch = code.match(/(const\s+tables\s*=\s*\[)([\s\S]*?)(\];)/);
    if (!tablesArrayMatch) return code;
    
    const newTableObject = generateTableObject(updatedTable);
    const arrayContent = tablesArrayMatch[2];
    const relativeStart = table.startIndex - (tablesArrayMatch.index! + tablesArrayMatch[1].length);
    const relativeEnd = table.endIndex - (tablesArrayMatch.index! + tablesArrayMatch[1].length);
    
    const before = arrayContent.substring(0, relativeStart);
    const after = arrayContent.substring(relativeEnd);
    
    // Don't add extra comma - 'after' already contains comma if there's another table
    const newArrayContent = before + newTableObject + after;
    return code.replace(tablesArrayMatch[0], tablesArrayMatch[1] + newArrayContent + tablesArrayMatch[3]);
  } else {
    // Update in JSX
    const newJSX = generateTableJSX(updatedTable);
    return code.slice(0, table.startIndex) + newJSX + code.slice(table.endIndex);
  }
}

/**
 * Remove a column from a table
 */
export function removeTableColumn(code: string, tableIndex: number, columnIndex: number): string {
  const parsed = parseJSXCode(code);
  
  if (tableIndex < 0 || tableIndex >= parsed.tables.length) {
    return code;
  }
  
  const table = parsed.tables[tableIndex];
  const columns = table.columns || table.headers || [];
  
  if (columnIndex < 0 || columnIndex >= columns.length || columns.length <= 1) {
    return code; // Can't remove last column
  }
  
  const newColumns = columns.filter((_, i) => i !== columnIndex);
  const newRows = table.rows.map(row => row.filter((_, i) => i !== columnIndex));
  
  const updatedTable: ParsedTable = {
    ...table,
    columns: newColumns,
    rows: newRows,
  };
  
  if (parsed.isArrayBased && table.isArrayBased) {
    // Update in array
    const tablesArrayMatch = code.match(/(const\s+tables\s*=\s*\[)([\s\S]*?)(\];)/);
    if (!tablesArrayMatch) return code;
    
    const newTableObject = generateTableObject(updatedTable);
    const arrayContent = tablesArrayMatch[2];
    const relativeStart = table.startIndex - (tablesArrayMatch.index! + tablesArrayMatch[1].length);
    const relativeEnd = table.endIndex - (tablesArrayMatch.index! + tablesArrayMatch[1].length);
    
    const before = arrayContent.substring(0, relativeStart);
    const after = arrayContent.substring(relativeEnd);
    
    // Don't add extra comma - 'after' already contains comma if there's another table
    const newArrayContent = before + newTableObject + after;
    return code.replace(tablesArrayMatch[0], tablesArrayMatch[1] + newArrayContent + tablesArrayMatch[3]);
  } else {
    // Update in JSX
    const newJSX = generateTableJSX(updatedTable);
    return code.slice(0, table.startIndex) + newJSX + code.slice(table.endIndex);
  }
}

/**
 * Add a row to a table
 */
export function addTableRow(
  code: string,
  tableIndex: number,
  rowData?: (string | number)[],
  position?: number
): string {
  const parsed = parseJSXCode(code);
  
  if (tableIndex < 0 || tableIndex >= parsed.tables.length) {
    return code;
  }
  
  const table = parsed.tables[tableIndex];
  const columns = table.columns || table.headers || [];
  const rows = table.rows || [];
  
  // Create new row with empty cells if rowData not provided
  const newRow = rowData || columns.map(() => '');
  
  // Ensure row has correct number of cells
  while (newRow.length < columns.length) {
    newRow.push('');
  }
  while (newRow.length > columns.length) {
    newRow.pop();
  }
  
  const newRows = [...rows];
  if (position !== undefined && position >= 0 && position <= newRows.length) {
    newRows.splice(position, 0, newRow);
  } else {
    newRows.push(newRow);
  }
  
  const updatedTable: ParsedTable = {
    ...table,
    rows: newRows,
  };
  
  if (parsed.isArrayBased && table.isArrayBased) {
    // Update in array
    const tablesArrayMatch = code.match(/(const\s+tables\s*=\s*\[)([\s\S]*?)(\];)/);
    if (!tablesArrayMatch) return code;
    
    const newTableObject = generateTableObject(updatedTable);
    const arrayContent = tablesArrayMatch[2];
    const relativeStart = table.startIndex - (tablesArrayMatch.index! + tablesArrayMatch[1].length);
    const relativeEnd = table.endIndex - (tablesArrayMatch.index! + tablesArrayMatch[1].length);
    
    const before = arrayContent.substring(0, relativeStart);
    const after = arrayContent.substring(relativeEnd);
    
    // Don't add extra comma - 'after' already contains comma if there's another table
    const newArrayContent = before + newTableObject + after;
    return code.replace(tablesArrayMatch[0], tablesArrayMatch[1] + newArrayContent + tablesArrayMatch[3]);
  } else {
    // Update in JSX
    const newJSX = generateTableJSX(updatedTable);
    return code.slice(0, table.startIndex) + newJSX + code.slice(table.endIndex);
  }
}

/**
 * Remove a row from a table
 */
export function removeTableRow(code: string, tableIndex: number, rowIndex: number): string {
  const parsed = parseJSXCode(code);
  
  if (tableIndex < 0 || tableIndex >= parsed.tables.length) {
    return code;
  }
  
  const table = parsed.tables[tableIndex];
  const rows = table.rows || [];
  
  if (rowIndex < 0 || rowIndex >= rows.length) {
    return code;
  }
  
  const newRows = rows.filter((_, i) => i !== rowIndex);
  
  const updatedTable: ParsedTable = {
    ...table,
    rows: newRows,
  };
  
  if (parsed.isArrayBased && table.isArrayBased) {
    // Update in array
    const tablesArrayMatch = code.match(/(const\s+tables\s*=\s*\[)([\s\S]*?)(\];)/);
    if (!tablesArrayMatch) return code;
    
    const newTableObject = generateTableObject(updatedTable);
    const arrayContent = tablesArrayMatch[2];
    const relativeStart = table.startIndex - (tablesArrayMatch.index! + tablesArrayMatch[1].length);
    const relativeEnd = table.endIndex - (tablesArrayMatch.index! + tablesArrayMatch[1].length);
    
    const before = arrayContent.substring(0, relativeStart);
    const after = arrayContent.substring(relativeEnd);
    
    // Don't add extra comma - 'after' already contains comma if there's another table
    const newArrayContent = before + newTableObject + after;
    return code.replace(tablesArrayMatch[0], tablesArrayMatch[1] + newArrayContent + tablesArrayMatch[3]);
  } else {
    // Update in JSX
    const newJSX = generateTableJSX(updatedTable);
    return code.slice(0, table.startIndex) + newJSX + code.slice(table.endIndex);
  }
}

/**
 * Merge adjacent columns in a table
 */
export function mergeTableColumns(
  code: string,
  tableIndex: number,
  startCol: number,
  endCol: number
): string {
  const parsed = parseJSXCode(code);
  
  if (tableIndex < 0 || tableIndex >= parsed.tables.length) {
    return code;
  }
  
  const table = parsed.tables[tableIndex];
  const columns = table.columns || table.headers || [];
  const rows = table.rows || [];
  
  if (startCol < 0 || endCol >= columns.length || startCol >= endCol) {
    return code;
  }
  
  // Merge column names (join with space)
  const mergedColumnName = columns.slice(startCol, endCol + 1).join(' ');
  
  // Merge cells in each row (join with space)
  const newRows = rows.map(row => {
    const mergedCell = row.slice(startCol, endCol + 1).map(c => String(c)).join(' ');
    const newRow = [...row.slice(0, startCol), mergedCell, ...row.slice(endCol + 1)];
    return newRow;
  });
  
  // Remove merged columns
  const newColumns = [
    ...columns.slice(0, startCol),
    mergedColumnName,
    ...columns.slice(endCol + 1),
  ];
  
  const updatedTable: ParsedTable = {
    ...table,
    columns: newColumns,
    rows: newRows,
  };
  
  if (parsed.isArrayBased && table.isArrayBased) {
    // Update in array
    const tablesArrayMatch = code.match(/(const\s+tables\s*=\s*\[)([\s\S]*?)(\];)/);
    if (!tablesArrayMatch) return code;
    
    const newTableObject = generateTableObject(updatedTable);
    const arrayContent = tablesArrayMatch[2];
    const relativeStart = table.startIndex - (tablesArrayMatch.index! + tablesArrayMatch[1].length);
    const relativeEnd = table.endIndex - (tablesArrayMatch.index! + tablesArrayMatch[1].length);
    
    const before = arrayContent.substring(0, relativeStart);
    const after = arrayContent.substring(relativeEnd);
    
    // Don't add extra comma - 'after' already contains comma if there's another table
    const newArrayContent = before + newTableObject + after;
    return code.replace(tablesArrayMatch[0], tablesArrayMatch[1] + newArrayContent + tablesArrayMatch[3]);
  } else {
    // Update in JSX
    const newJSX = generateTableJSX(updatedTable);
    return code.slice(0, table.startIndex) + newJSX + code.slice(table.endIndex);
  }
}

/**
 * Move a section to a new position
 */
export function moveSection(
  code: string,
  fromIndex: number,
  toIndex: number
): string {
  const parsed = parseJSXCode(code);
  
  if (fromIndex < 0 || fromIndex >= parsed.sections.length ||
      toIndex < 0 || toIndex >= parsed.sections.length ||
      fromIndex === toIndex) {
    return code;
  }
  
  if (parsed.isArrayBased) {
    // Handle array-based pattern - reorder sections array
    const sectionsArrayMatch = code.match(/(const\s+sections\s*=\s*\[)([\s\S]*?)(\];)/);
    if (!sectionsArrayMatch) return code;
    
    // Create reordered sections array
    const reorderedSections = [...parsed.sections];
    const [movedSection] = reorderedSections.splice(fromIndex, 1);
    
    // Adjust toIndex if we removed an element before it
    let adjustedToIndex = toIndex;
    if (fromIndex < toIndex) {
      adjustedToIndex = toIndex - 1;
    }
    
    reorderedSections.splice(adjustedToIndex, 0, movedSection);
    
    // Rebuild array with reordered sections
    const newSectionObjects = reorderedSections.map(section => {
      return generateSectionObject({
        title: section.title || '',
        content: section.content || '',
        type: section.type || 'section',
      });
    });
    
    const newArrayContent = newSectionObjects.join(',\n');
    
    return code.substring(0, sectionsArrayMatch.index!) +
      sectionsArrayMatch[1] + '\n' + newArrayContent + '\n' + sectionsArrayMatch[3] +
      code.substring(sectionsArrayMatch.index! + sectionsArrayMatch[0].length);
  } else {
    // Handle direct component usage - swap JSX components
    const fromSection = parsed.sections[fromIndex];
    const toSection = parsed.sections[toIndex];
    
    // Extract both sections
    const fromJSX = fromSection.fullMatch;
    const toJSX = toSection.fullMatch;
    
    // Swap them
    let newCode = code;
    // Replace in reverse order to maintain indices
    if (fromIndex > toIndex) {
      newCode = code.substring(0, toSection.startIndex) +
        fromJSX +
        code.substring(toSection.endIndex, fromSection.startIndex) +
        toJSX +
        code.substring(fromSection.endIndex);
    } else {
      newCode = code.substring(0, fromSection.startIndex) +
        toJSX +
        code.substring(fromSection.endIndex, toSection.startIndex) +
        fromJSX +
        code.substring(toSection.endIndex);
    }
    
    return newCode;
  }
}

/**
 * Update table column header
 */
export function updateTableColumnHeader(
  code: string,
  tableIndex: number,
  columnIndex: number,
  newHeader: string
): string {
  const parsed = parseJSXCode(code);
  
  if (tableIndex < 0 || tableIndex >= parsed.tables.length) {
    return code;
  }
  
  const table = parsed.tables[tableIndex];
  const columns = table.columns || table.headers || [];
  
  if (columnIndex < 0 || columnIndex >= columns.length) {
    return code;
  }
  
  const newColumns = [...columns];
  newColumns[columnIndex] = newHeader;
  
  const updatedTable: ParsedTable = {
    ...table,
    columns: newColumns,
  };
  
  if (parsed.isArrayBased && table.isArrayBased) {
    // Update in array
    const tablesArrayMatch = code.match(/(const\s+tables\s*=\s*\[)([\s\S]*?)(\];)/);
    if (!tablesArrayMatch) return code;
    
    const newTableObject = generateTableObject(updatedTable);
    const arrayContent = tablesArrayMatch[2];
    const relativeStart = table.startIndex - (tablesArrayMatch.index! + tablesArrayMatch[1].length);
    const relativeEnd = table.endIndex - (tablesArrayMatch.index! + tablesArrayMatch[1].length);
    
    const before = arrayContent.substring(0, relativeStart);
    const after = arrayContent.substring(relativeEnd);
    
    // Don't add extra comma - 'after' already contains comma if there's another table
    const newArrayContent = before + newTableObject + after;
    return code.replace(tablesArrayMatch[0], tablesArrayMatch[1] + newArrayContent + tablesArrayMatch[3]);
  } else {
    // Update in JSX
    const newJSX = generateTableJSX(updatedTable);
    return code.slice(0, table.startIndex) + newJSX + code.slice(table.endIndex);
  }
}

/**
 * Add a new table to the code
 */
export function addNewTable(
  code: string,
  tableConfig: {
    title?: string;
    columns: string[];
    rowCount: number;
  }
): string {
  const parsed = parseJSXCode(code);
  
  // Create empty rows based on rowCount and columns
  const rows: (string | number)[][] = [];
  for (let i = 0; i < tableConfig.rowCount; i++) {
    rows.push(tableConfig.columns.map(() => ''));
  }
  
  const newTable = {
    columns: tableConfig.columns,
    rows,
    title: tableConfig.title,
  };
  
  if (parsed.isArrayBased) {
    // Handle array-based pattern
    const tablesArrayMatch = code.match(/(const\s+tables\s*=\s*\[)([\s\S]*?)(\];)/);
    
    if (tablesArrayMatch) {
      // Add to existing tables array
      const arrayContent = tablesArrayMatch[2];
      const newTableObject = generateTableObject(newTable);
      const trimmedContent = arrayContent.trim();
      const newArrayContent = trimmedContent + 
        (trimmedContent ? ',\n' : '') + 
        newTableObject;
      
      return code.substring(0, tablesArrayMatch.index!) + 
        tablesArrayMatch[1] + newArrayContent + tablesArrayMatch[3] + 
        code.substring(tablesArrayMatch.index! + tablesArrayMatch[0].length);
    } else {
      // Create new tables array if it doesn't exist
      const sectionsArrayMatch = code.match(/(const\s+sections\s*=\s*\[[\s\S]*?\];)/);
      if (sectionsArrayMatch) {
        const insertPosition = sectionsArrayMatch.index! + sectionsArrayMatch[0].length;
        const newTableObject = generateTableObject(newTable);
        const tablesArray = `\n\n  const tables = [\n${newTableObject}\n  ];`;
        return code.substring(0, insertPosition) + tablesArray + code.substring(insertPosition);
      }
    }
  } else {
    // Handle direct component usage
    const returnMatch = code.match(/return\s*\([\s\S]*?<BaseTemplate[^>]*>([\s\S]*?)<\/BaseTemplate>/);
    if (returnMatch) {
      const baseTemplateContent = returnMatch[1];
      const baseTemplateContentStart = returnMatch.index! + returnMatch[0].indexOf('>') + 1;
      const newTableJSX = '\n        ' + generateTableJSX(newTable);
      return code.slice(0, baseTemplateContentStart + baseTemplateContent.length) + newTableJSX + code.slice(baseTemplateContentStart + baseTemplateContent.length);
    } else {
      // Try to find the end of return statement
      const returnIndex = code.indexOf('return (');
      if (returnIndex !== -1) {
        // Find the closing div before the final closing parenthesis
        const closingDivMatch = code.match(/<\/div>\s*\)\s*;?\s*}/);
        if (closingDivMatch && closingDivMatch.index) {
          const insertPosition = closingDivMatch.index;
          const newTableJSX = '\n        ' + generateTableJSX(newTable) + '\n        ';
          return code.substring(0, insertPosition) + newTableJSX + code.substring(insertPosition);
        }
      }
    }
  }
  
  return code;
}

/**
 * Delete a table from the code by ID
 */
export function deleteTable(code: string, tableId: string): string {
  const parsed = parseJSXCode(code);
  
  // Find table by ID
  const tableIndex = parsed.tables.findIndex(t => t.id === tableId);
  
  if (tableIndex === -1) {
    console.warn('Table not found with ID:', tableId);
    return code;
  }
  
  const table = parsed.tables[tableIndex];
  
  if (parsed.isArrayBased && table.isArrayBased) {
    // Handle array-based pattern - rebuild the entire array without the removed table
    const tablesArrayMatch = code.match(/(const\s+tables\s*=\s*\[)([\s\S]*?)(\];)/);
    if (!tablesArrayMatch) {
      console.warn('Could not find tables array in code');
      return code;
    }
    
    // Create new tables array without the removed table
    const remainingTables = parsed.tables.filter((t) => t.id !== tableId);
    
    console.log('Removing table', tableIndex, '- remaining tables:', remainingTables.length);
    
    // Rebuild array with remaining tables (preserve IDs)
    const newTableObjects = remainingTables.map((t) => {
      return generateTableObject({
        columns: t.columns || t.headers || [],
        rows: t.rows || [],
        title: t.title,
        id: t.id, // Preserve original ID
      });
    });
    
    const newArrayContent = newTableObjects.join(',\n');
    
    const beforeArray = code.substring(0, tablesArrayMatch.index!);
    const afterArray = code.substring(tablesArrayMatch.index! + tablesArrayMatch[0].length);
    
    // Ensure we have valid array content
    if (remainingTables.length === 0) {
      // Empty array case
      const newCode = beforeArray + tablesArrayMatch[1] + '\n' + tablesArrayMatch[3] + afterArray;
      console.log('Removed last table - empty array');
      return newCode;
    }
    
    const newCode = beforeArray + tablesArrayMatch[1] + '\n' + newArrayContent + '\n' + tablesArrayMatch[3] + afterArray;
    
    console.log('Generated new code length:', newCode.length, 'original:', code.length);
    
    // Validate the generated code doesn't have obvious syntax errors
    if (newArrayContent.includes(',,') || newArrayContent.match(/,\s*,/)) {
      console.error('Double comma detected in generated array!');
      return code; // Return original code if we detect an error
    }
    
    return newCode;
  } else {
    // Handle direct component usage
    let before = code.slice(0, table.startIndex);
    let after = code.slice(table.endIndex);
    
    // Clean up extra whitespace
    before = before.replace(/\n\s*\n\s*$/, '\n');
    after = after.replace(/^\s*\n\s*/, '\n');
    
    return before + after;
  }
}

/**
 * Update a table cell value
 */
export function updateTableCell(
  code: string,
  tableIndex: number,
  rowIndex: number,
  columnIndex: number,
  newValue: string
): string {
  const parsed = parseJSXCode(code);
  
  if (tableIndex < 0 || tableIndex >= parsed.tables.length) {
    return code;
  }
  
  const table = parsed.tables[tableIndex];
  const rows = table.rows || [];
  
  if (rowIndex < 0 || rowIndex >= rows.length) {
    return code;
  }
  
  const row = rows[rowIndex];
  if (columnIndex < 0 || columnIndex >= row.length) {
    return code;
  }
  
  // Create new rows with updated cell
  const newRows = rows.map((r, rIdx) => {
    if (rIdx === rowIndex) {
      const newRow = [...r];
      newRow[columnIndex] = newValue;
      return newRow;
    }
    return r;
  });
  
  const updatedTable: ParsedTable = {
    ...table,
    rows: newRows,
  };
  
  if (parsed.isArrayBased && table.isArrayBased) {
    // Update in array
    const tablesArrayMatch = code.match(/(const\s+tables\s*=\s*\[)([\s\S]*?)(\];)/);
    if (!tablesArrayMatch) return code;
    
    const newTableObject = generateTableObject(updatedTable);
    const arrayContent = tablesArrayMatch[2];
    const relativeStart = table.startIndex - (tablesArrayMatch.index! + tablesArrayMatch[1].length);
    const relativeEnd = table.endIndex - (tablesArrayMatch.index! + tablesArrayMatch[1].length);
    
    const before = arrayContent.substring(0, relativeStart);
    const after = arrayContent.substring(relativeEnd);
    
    // Don't add extra comma - 'after' already contains comma if there's another table
    const newArrayContent = before + newTableObject + after;
    return code.replace(tablesArrayMatch[0], tablesArrayMatch[1] + newArrayContent + tablesArrayMatch[3]);
  } else {
    // Update in JSX
    const newJSX = generateTableJSX(updatedTable);
    return code.slice(0, table.startIndex) + newJSX + code.slice(table.endIndex);
  }
}
