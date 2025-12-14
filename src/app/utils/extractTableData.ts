/**
 * Extract table data from the rendered DOM
 * This is used to capture user edits made in contentEditable table cells
 */

export interface ExtractedTableData {
  headers: string[];
  rows: string[][];
  title?: string;
  tableIndex?: number; // Index of table in the code
}

/**
 * Check if a table element is inside an AirplaneSection component
 * @param tableEl The table element to check
 * @returns true if the table is inside an AirplaneSection component
 */
function isInsideAirplaneSection(tableEl: HTMLTableElement): boolean {
  // Check if table is inside an element with data-airplane-section-id attribute
  const airplaneSectionWrapper = tableEl.closest('[data-airplane-section-id]');
  return airplaneSectionWrapper !== null;
}

/**
 * Check if a table element belongs to a DynamicTable component
 * @param tableEl The table element to check
 * @returns true if the table belongs to a DynamicTable component
 */
function isDynamicTable(tableEl: HTMLTableElement): boolean {
  // Check if table is inside an element with data-table-id attribute (DynamicTable wrapper)
  const dynamicTableWrapper = tableEl.closest('[data-table-id]');
  return dynamicTableWrapper !== null;
}

/**
 * Extract all table data from the current DOM
 * @param container Optional container element to search within (for better accuracy)
 */
export function extractAllTablesFromDOM(container?: HTMLElement | null): ExtractedTableData[] {
  const tables: ExtractedTableData[] = [];
  
  let previewContainer: Element | null = container || null;
  
  // If no container provided, try multiple selectors to find preview container
  if (!previewContainer) {
    const previewSelectors = [
      '.preview-content',
      '[class*="preview"]',
      '[data-testid="live-preview"]',
      'main',
      'body'
    ];
    
    for (const selector of previewSelectors) {
      previewContainer = document.querySelector(selector);
      if (previewContainer) break;
    }
  }
  
  if (!previewContainer) {
    console.warn('Preview container not found, trying document.body');
    previewContainer = document.body;
  }
  
  // Find all table elements - look for dynamic-table class or any table
  // Also look inside iframes (react-live might render in iframe)
  let tableElements: NodeListOf<HTMLTableElement>;
  
  try {
    tableElements = previewContainer.querySelectorAll('table.dynamic-table, table');
    
    // Also check iframes (react-live might use iframe)
    const iframes = previewContainer.querySelectorAll('iframe');
    iframes.forEach((iframe) => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          const iframeTables = iframeDoc.querySelectorAll('table.dynamic-table, table');
          iframeTables.forEach((table) => {
            // Add to our collection (convert NodeList to array and merge)
            const tempDiv = document.createElement('div');
            tempDiv.appendChild(table.cloneNode(true));
            const clonedTable = tempDiv.querySelector('table');
            if (clonedTable) {
              const allTables = Array.from(tableElements);
              allTables.push(clonedTable as HTMLTableElement);
              tableElements = allTables as any;
            }
          });
        }
      } catch (e) {
        // Cross-origin iframe, skip
        console.debug('Cannot access iframe content:', e);
      }
    });
  } catch (error) {
    console.error('Error querying tables:', error);
    return tables;
  }
  
  if (tableElements.length === 0) {
    console.warn('No tables found in DOM');
    return tables;
  }
  
  console.log(`Found ${tableElements.length} tables in DOM`);
  
  let skippedCount = 0;
  let extractedCount = 0;
  
  tableElements.forEach((tableEl, index) => {
    const table = tableEl as HTMLTableElement;
    
    // CRITICAL: Skip tables inside AirplaneSection components
    if (isInsideAirplaneSection(table)) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[TABLE EXTRACTION] Skipping table ${index} - inside AirplaneSection component`);
      }
      skippedCount++;
      return;
    }
    
    // Only extract tables that belong to DynamicTable components
    if (!isDynamicTable(table)) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[TABLE EXTRACTION] Skipping table ${index} - not a DynamicTable component`);
      }
      skippedCount++;
      return;
    }
    
    const extracted = extractTableFromElement(table, extractedCount);
    if (extracted) {
      tables.push(extracted);
      extractedCount++;
      if (process.env.NODE_ENV === 'development') {
        console.log(`[TABLE EXTRACTION] Extracted DynamicTable ${extractedCount - 1}: ${extracted.headers.length} headers, ${extracted.rows.length} rows`);
      } else {
        console.log(`Extracted table ${extractedCount - 1}: ${extracted.headers.length} headers, ${extracted.rows.length} rows`);
      }
    }
  });
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[TABLE EXTRACTION] Summary: ${extractedCount} DynamicTable(s) extracted, ${skippedCount} table(s) skipped (AirplaneSection or non-DynamicTable)`);
  }
  
  return tables;
}

/**
 * Extract data from a single table element
 */
function extractTableFromElement(tableEl: HTMLTableElement, index: number): ExtractedTableData | null {
  try {
    // CRITICAL: Early validation - skip if inside AirplaneSection
    if (isInsideAirplaneSection(tableEl)) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[TABLE EXTRACTION] Attempted to extract table inside AirplaneSection - skipping`);
      }
      return null;
    }
    
    // CRITICAL: Only extract DynamicTable components
    if (!isDynamicTable(tableEl)) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[TABLE EXTRACTION] Attempted to extract non-DynamicTable - skipping`);
      }
      return null;
    }
    
    // Extract headers - look in thead or first row
    let headerRow = tableEl.querySelector('thead tr');
    if (!headerRow) {
      // Try first row as header
      headerRow = tableEl.querySelector('tbody tr:first-child');
    }
    
    if (!headerRow) return null;
    
    const headers: string[] = [];
    headerRow.querySelectorAll('th, td').forEach((th) => {
      // Get text from contentEditable div if it exists
      const editableDiv = th.querySelector('div[contenteditable="true"]');
      const headerText = editableDiv?.textContent?.trim() || th.textContent?.trim() || '';
      headers.push(headerText);
    });
    
    if (headers.length === 0) return null;
    
    // Extract rows from tbody (skip first row if it was used as header)
    const rows: string[][] = [];
    const bodyRows = tableEl.querySelectorAll('tbody tr');
    const startRowIndex = tableEl.querySelector('thead tr') ? 0 : 1; // Skip first row if no thead
    
    bodyRows.forEach((row, rowIdx) => {
      // Skip if this row was used as header (no thead and first row)
      if (!tableEl.querySelector('thead tr') && rowIdx === 0) return;
      
      const cells: string[] = [];
      const cellElements = row.querySelectorAll('td, th');
      
      cellElements.forEach((cell) => {
        // Get text from contentEditable div if it exists, otherwise from cell directly
        let cellText = '';
        
        // Try multiple methods to get cell content
        const editableDiv = cell.querySelector('div[contenteditable="true"]');
        if (editableDiv) {
          cellText = editableDiv.textContent?.trim() || '';
        } else {
          // Check if cell itself is contentEditable
          if (cell.hasAttribute('contenteditable')) {
            cellText = cell.textContent?.trim() || '';
          } else {
            // Get from inner div or directly from cell
            const innerDiv = cell.querySelector('div');
            cellText = innerDiv?.textContent?.trim() || cell.textContent?.trim() || '';
          }
        }
        
        // Replace "—" placeholder with empty string
        const cleanedText = cellText === '—' || cellText === '−' ? '' : cellText;
        cells.push(cleanedText);
      });
      
      // Ensure row has same length as headers
      while (cells.length < headers.length) {
        cells.push('');
      }
      
      // Only add row if it has at least one non-empty cell or matches header count
      if (cells.length === headers.length) {
        rows.push(cells.slice(0, headers.length));
      }
    });
    
    // Extract title if it exists (look for h3 before the table)
    let title: string | undefined;
    const tableWrapper = tableEl.closest('.dynamic-table-wrapper');
    if (tableWrapper) {
      const titleEl = tableWrapper.querySelector('h3');
      if (titleEl) {
        title = titleEl.textContent?.trim();
      }
    }
    
    return {
      headers,
      rows,
      title,
      tableIndex: index,
    };
  } catch (error) {
    console.error('Error extracting table data:', error);
    return null;
  }
}

/**
 * Extract table data from a specific table by its data attribute
 */
export function extractTableById(tableId: string): ExtractedTableData | null {
  const tableEl = document.querySelector(`[data-table-id="${tableId}"] table`);
  if (!tableEl) return null;
  
  return extractTableFromElement(tableEl as HTMLTableElement);
}

/**
 * Update JSX code with extracted table data using codeManipulator functions
 * This properly updates table rows in the code structure
 */
export function updateCodeWithTableData(
  code: string,
  extractedTables: ExtractedTableData[],
  updateTableCellFn: (code: string, tableIndex: number, rowIndex: number, columnIndex: number, newValue: string) => string,
  updateTableColumnHeaderFn?: (code: string, tableIndex: number, columnIndex: number, newHeader: string) => string
): string {
  if (extractedTables.length === 0) return code;
  
  let updatedCode = code;
  
  // Import parseJSXCode to find table indices
  try {
    // Parse code to get table structure
    const { parseJSXCode } = require('./jsxParser');
    const parsed = parseJSXCode(code);
    
    // Update each table
    extractedTables.forEach((extractedTable, domIndex) => {
      // Match DOM table index to code table index
      // Tables should be in the same order
      const codeTableIndex = extractedTable.tableIndex !== undefined 
        ? extractedTable.tableIndex 
        : domIndex;
      
      if (codeTableIndex >= 0 && codeTableIndex < parsed.tables.length) {
        const codeTable = parsed.tables[codeTableIndex];
        
        // Update headers first if they changed
        if (extractedTable.headers && extractedTable.headers.length > 0 && updateTableColumnHeaderFn) {
          const currentHeaders = codeTable.headers || codeTable.columns || [];
          extractedTable.headers.forEach((newHeader, colIndex) => {
            const currentHeader = currentHeaders[colIndex] || '';
            if (String(newHeader) !== String(currentHeader)) {
              updatedCode = updateTableColumnHeaderFn(
                updatedCode,
                codeTableIndex,
                colIndex,
                String(newHeader)
              );
              // Re-parse after header update
              const reParsed = parseJSXCode(updatedCode);
              if (codeTableIndex < reParsed.tables.length) {
                Object.assign(codeTable, reParsed.tables[codeTableIndex]);
              }
            }
          });
        }
        
        // Update each cell in the table
        extractedTable.rows.forEach((row, rowIndex) => {
          row.forEach((cellValue, columnIndex) => {
            // Only update if the value is different
            const currentValue = codeTable.rows?.[rowIndex]?.[columnIndex] || '';
            if (String(cellValue) !== String(currentValue)) {
              updatedCode = updateTableCellFn(
                updatedCode,
                codeTableIndex,
                rowIndex,
                columnIndex,
                String(cellValue)
              );
              // Re-parse after cell update to get accurate indices
              const reParsed = parseJSXCode(updatedCode);
              if (codeTableIndex < reParsed.tables.length) {
                Object.assign(codeTable, reParsed.tables[codeTableIndex]);
              }
            }
          });
        });
      }
    });
  } catch (error) {
    console.error('Error updating code with table data:', error);
    // Fallback: try simple string replacement
    return updateCodeWithTableDataFallback(code, extractedTables);
  }
  
  return updatedCode;
}

/**
 * Fallback method using string replacement (less reliable but works as backup)
 */
function updateCodeWithTableDataFallback(
  code: string,
  extractedTables: ExtractedTableData[]
): string {
  if (extractedTables.length === 0) return code;
  
  let updatedCode = code;
  
  // Handle array-based tables pattern
  const tablesArrayMatch = code.match(/(const\s+tables\s*=\s*\[)([\s\S]*?)(\];)/);
  if (tablesArrayMatch) {
    const arrayContent = tablesArrayMatch[2];
    let updatedArrayContent = arrayContent;
    
    // Find each table object and update its rows
    extractedTables.forEach((extractedTable, index) => {
      // Find table object by matching structure
      const tablePattern = new RegExp(
        `(\\{[^}]*rows:\\s*\\[)([^\\]]*)(\\][^}]*\\})`,
        'g'
      );
      
      let matchCount = 0;
      updatedArrayContent = updatedArrayContent.replace(
        tablePattern,
        (match, prefix, oldRows, suffix) => {
          if (matchCount === index) {
            const rowsArray = JSON.stringify(extractedTable.rows);
            matchCount++;
            return `${prefix}${rowsArray}${suffix}`;
          }
          matchCount++;
          return match;
        }
      );
    });
    
    updatedCode = code.replace(
      tablesArrayMatch[0],
      tablesArrayMatch[1] + updatedArrayContent + tablesArrayMatch[3]
    );
  }
  
  return updatedCode;
}

