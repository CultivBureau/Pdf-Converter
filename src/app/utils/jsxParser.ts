/**
 * JSX Parser Utility
 * Parses JSX code to extract SectionTemplate and DynamicTableTemplate components
 * Handles both direct component usage and array-based patterns
 */

export interface ParsedSection {
  index: number;
  title?: string;
  content: string;
  type?: string;
  startIndex: number;
  endIndex: number;
  fullMatch: string;
  isArrayBased?: boolean;
  arrayIndex?: number;
}

export interface ParsedTable {
  index: number;
  headers?: string[];
  columns?: string[];
  rows: (string | number)[][];
  title?: string;
  startIndex: number;
  endIndex: number;
  fullMatch: string;
  isArrayBased?: boolean;
  arrayIndex?: number;
}

export interface ParsedStructure {
  sections: ParsedSection[];
  tables: ParsedTable[];
  isArrayBased: boolean;
}

/**
 * Extract array values from JSX props or array literals
 */
function extractArrayFromProp(propValue: string): string[] {
  // Handle array literals like ["val1", "val2"] or {['val1', 'val2']}
  const arrayMatch = propValue.match(/\[(.*?)\]/s);
  if (!arrayMatch) return [];
  
  const content = arrayMatch[1];
  // Extract string values (handles both " and ' quotes)
  const values: string[] = [];
  const stringRegex = /['"]([^'"]*)['"]/g;
  let match;
  
  while ((match = stringRegex.exec(content)) !== null) {
    values.push(match[1]);
  }
  
  return values;
}

/**
 * Extract balanced brackets from a string starting at a given position
 */
function extractBalancedBrackets(str: string, startPos: number): string {
  if (str[startPos] !== '[') return '[]';
  
  let depth = 0;
  let endPos = startPos;
  let inString = false;
  let stringChar = '';
  
  for (let i = startPos; i < str.length; i++) {
    const char = str[i];
    const prevChar = i > 0 ? str[i - 1] : '';
    
    // Handle strings
    if ((char === '"' || char === "'") && prevChar !== '\\') {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
      }
    }
    
    // Only count brackets outside strings
    if (!inString) {
      if (char === '[') {
        depth++;
      } else if (char === ']') {
        depth--;
        if (depth === 0) {
          endPos = i;
          break;
        }
      }
    }
  }
  
  return str.substring(startPos, endPos + 1);
}

/**
 * Extract 2D array (rows) from JSX props or array literals
 */
function extract2DArrayFromProp(propValue: string): (string | number)[][] {
  // propValue should be the full array string like: [["a", "b"], ["c", "d"]]
  if (!propValue || propValue.trim().length === 0) return [];
  
  // Remove leading/trailing whitespace and check if it starts with [
  const trimmed = propValue.trim();
  if (!trimmed.startsWith('[')) return [];
  
  const rows: (string | number)[][] = [];
  
  // Find all inner arrays by tracking bracket depth
  let depth = 0;
  let currentRow = '';
  let currentRowStart = -1;
  let inString = false;
  let stringChar = '';
  
  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i];
    const prevChar = i > 0 ? trimmed[i - 1] : '';
    
    // Track string boundaries
    if ((char === '"' || char === "'") && prevChar !== '\\') {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
      }
    }
    
    // Only count brackets outside strings
    if (!inString) {
      if (char === '[') {
        if (depth === 1) {
          // Start of a row array
          currentRowStart = i;
          currentRow = '';
        }
        depth++;
      } else if (char === ']') {
        depth--;
        if (depth === 1 && currentRowStart !== -1) {
          // Complete row found
          const rowValues: (string | number)[] = [];
          const stringRegex = /['"]([^'"]*)['"]/g;
          let match;
          
          while ((match = stringRegex.exec(currentRow)) !== null) {
            rowValues.push(match[1]);
          }
          
          if (rowValues.length > 0) {
            rows.push(rowValues);
          }
          currentRow = '';
          currentRowStart = -1;
        }
      }
    }
    
    // Collect content for current row
    if (depth > 1 && currentRowStart !== -1) {
      currentRow += char;
    }
  }
  
  return rows;
}

/**
 * Extract prop value from JSX component
 */
function extractPropValue(componentCode: string, propName: string): string | undefined {
  // Match prop with various formats: prop="value", prop={'value'}, prop={value}
  const patterns = [
    new RegExp(`${propName}\\s*=\\s*["']([^"']*)["']`, 's'),
    new RegExp(`${propName}\\s*=\\s*\\{["']([^"']*)["']\\}`, 's'),
    new RegExp(`${propName}\\s*=\\s*\\{([^}]+)\\}`, 's'),
  ];
  
  for (const pattern of patterns) {
    const match = componentCode.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return undefined;
}

/**
 * Parse array-based sections pattern: const sections = [{...}, {...}]
 */
function parseArrayBasedSections(code: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  
  // Find const sections = [...] pattern
  const sectionsArrayMatch = code.match(/const\s+sections\s*=\s*\[([\s\S]*?)\];/);
  if (!sectionsArrayMatch) return sections;
  
  const arrayStart = sectionsArrayMatch.index! + sectionsArrayMatch[0].indexOf('[') + 1;
  const arrayContent = sectionsArrayMatch[1];
  
  // Find all objects in the array (handle nested braces)
  let depth = 0;
  let currentObject = '';
  let objectStart = -1;
  let index = 0;
  
  for (let i = 0; i < arrayContent.length; i++) {
    const char = arrayContent[i];
    const prevChar = i > 0 ? arrayContent[i - 1] : '';
    
    // Skip escaped characters
    if (prevChar === '\\') {
      if (objectStart !== -1) currentObject += char;
      continue;
    }
    
    if (char === '{') {
      if (depth === 0) {
        objectStart = i;
        currentObject = '{';
      } else {
        currentObject += char;
      }
      depth++;
    } else if (char === '}') {
      depth--;
      if (depth > 0) {
        currentObject += char;
      } else if (depth === 0 && objectStart !== -1) {
        // Complete object found
        currentObject += '}';
        const objectContent = currentObject;
        
        // Extract title (handle escaped quotes)
        const titleMatch = objectContent.match(/"title"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        const title = titleMatch ? titleMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\') : undefined;
        
        // Extract content
        const contentMatch = objectContent.match(/"content"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        const content = contentMatch ? contentMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\') : '';
        
        // Extract type
        const typeMatch = objectContent.match(/"type"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        const type = typeMatch ? typeMatch[1] : 'section';
        
        const startIndex = arrayStart + objectStart;
        const endIndex = arrayStart + i + 1;
        
        sections.push({
          index,
          title,
          content,
          type,
          startIndex,
          endIndex,
          fullMatch: currentObject,
          isArrayBased: true,
          arrayIndex: index,
        });
        
        currentObject = '';
        objectStart = -1;
        index++;
      }
    } else if (objectStart !== -1) {
      currentObject += char;
    }
  }
  
  return sections;
}

/**
 * Parse array-based tables pattern: const tables = [{...}, {...}]
 */
function parseArrayBasedTables(code: string): ParsedTable[] {
  const tables: ParsedTable[] = [];
  
  // Find const tables = [...] pattern
  const tablesArrayMatch = code.match(/const\s+tables\s*=\s*\[([\s\S]*?)\];/);
  if (!tablesArrayMatch) return tables;
  
  const arrayStart = tablesArrayMatch.index! + tablesArrayMatch[0].indexOf('[') + 1;
  const arrayContent = tablesArrayMatch[1];
  
  // Find all objects in the array (handle nested braces)
  let depth = 0;
  let currentObject = '';
  let objectStart = -1;
  let index = 0;
  
  for (let i = 0; i < arrayContent.length; i++) {
    const char = arrayContent[i];
    const prevChar = i > 0 ? arrayContent[i - 1] : '';
    
    // Skip escaped characters
    if (prevChar === '\\') {
      if (objectStart !== -1) currentObject += char;
      continue;
    }
    
    if (char === '{') {
      if (depth === 0) {
        objectStart = i;
        currentObject = '{';
      } else {
        currentObject += char;
      }
      depth++;
    } else if (char === '}') {
      depth--;
      if (depth > 0) {
        currentObject += char;
      } else if (depth === 0 && objectStart !== -1) {
        // Complete object found
        currentObject += '}';
        const objectContent = currentObject;
        
        // Extract columns with proper bracket matching
        const columnsMatch = objectContent.match(/"columns"\s*:\s*\[/);
        let columns: string[] = [];
        if (columnsMatch) {
          const startPos = columnsMatch.index! + columnsMatch[0].length;
          const columnsStr = extractBalancedBrackets(objectContent, startPos - 1);
          console.log('Columns string extracted:', columnsStr.substring(0, 100));
          columns = extractArrayFromProp(columnsStr);
          console.log('Parsed columns count:', columns.length);
        }
        
        // Extract rows with proper bracket matching
        const rowsMatch = objectContent.match(/"rows"\s*:\s*\[/);
        let rows: (string | number)[][] = [];
        if (rowsMatch) {
          const startPos = rowsMatch.index! + rowsMatch[0].length;
          const rowsStr = extractBalancedBrackets(objectContent, startPos - 1);
          console.log('Rows string extracted length:', rowsStr.length);
          console.log('Rows string preview:', rowsStr.substring(0, 200));
          rows = extract2DArrayFromProp(rowsStr);
          console.log('Parsed rows count:', rows.length);
        }
        
        // Extract title
        const titleMatch = objectContent.match(/"title"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        const title = titleMatch ? titleMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\') : undefined;
        
        const startIndex = arrayStart + objectStart;
        const endIndex = arrayStart + i + 1;
        
        tables.push({
          index,
          columns: columns.length > 0 ? columns : undefined,
          rows,
          title,
          startIndex,
          endIndex,
          fullMatch: currentObject,
          isArrayBased: true,
          arrayIndex: index,
        });
        
        currentObject = '';
        objectStart = -1;
        index++;
      }
    } else if (objectStart !== -1) {
      currentObject += char;
    }
  }
  
  return tables;
}

/**
 * Parse JSX code to extract sections and tables
 * Handles both direct component usage and array-based patterns
 */
export function parseJSXCode(code: string): ParsedStructure {
  const sections: ParsedSection[] = [];
  const tables: ParsedTable[] = [];
  
  // Check if code uses array-based pattern
  const hasSectionsArray = /const\s+sections\s*=\s*\[/.test(code);
  const hasTablesArray = /const\s+tables\s*=\s*\[/.test(code);
  const isArrayBased = hasSectionsArray || hasTablesArray;
  
  if (isArrayBased) {
    // Parse array-based pattern
    if (hasSectionsArray) {
      sections.push(...parseArrayBasedSections(code));
    }
    if (hasTablesArray) {
      tables.push(...parseArrayBasedTables(code));
    }
  } else {
    // Parse direct component usage pattern
    // Find all SectionTemplate components
    const sectionRegex = /<SectionTemplate\s+([^>]*?)\s*\/>|<SectionTemplate\s+([^>]*?)>[\s\S]*?<\/SectionTemplate>/gi;
    let sectionMatch;
    let sectionIndex = 0;
    
    while ((sectionMatch = sectionRegex.exec(code)) !== null) {
      const fullMatch = sectionMatch[0];
      const propsString = sectionMatch[1] || sectionMatch[2] || '';
      const startIndex = sectionMatch.index;
      const endIndex = startIndex + fullMatch.length;
      
      const title = extractPropValue(propsString, 'title');
      const content = extractPropValue(propsString, 'content') || '';
      const type = extractPropValue(propsString, 'type') || 'section';
      
      // If content is in children, extract it
      let actualContent = content;
      if (!content && fullMatch.includes('</SectionTemplate>')) {
        const childrenMatch = fullMatch.match(/<SectionTemplate[^>]*>([\s\S]*?)<\/SectionTemplate>/);
        if (childrenMatch) {
          actualContent = childrenMatch[1].trim();
        }
      }
      
      sections.push({
        index: sectionIndex++,
        title: title || undefined,
        content: actualContent,
        type: type || 'section',
        startIndex,
        endIndex,
        fullMatch,
        isArrayBased: false,
      });
    }
    
    // Find all DynamicTableTemplate components
    const tableRegex = /<DynamicTableTemplate\s+([^>]*?)\s*\/>|<DynamicTableTemplate\s+([^>]*?)>[\s\S]*?<\/DynamicTableTemplate>/gi;
    let tableMatch;
    let tableIndex = 0;
    
    while ((tableMatch = tableRegex.exec(code)) !== null) {
      const fullMatch = tableMatch[0];
      const propsString = tableMatch[1] || tableMatch[2] || '';
      const startIndex = tableMatch.index;
      const endIndex = startIndex + fullMatch.length;
      
      const headers = extractPropValue(propsString, 'headers');
      const columns = extractPropValue(propsString, 'columns');
      const rows = extractPropValue(propsString, 'rows');
      const title = extractPropValue(propsString, 'title');
      
      let headersArray: string[] = [];
      let columnsArray: string[] = [];
      let rowsArray: (string | number)[][] = [];
      
      if (headers) {
        headersArray = extractArrayFromProp(headers);
      }
      if (columns) {
        columnsArray = extractArrayFromProp(columns);
      }
      if (rows) {
        rowsArray = extract2DArrayFromProp(rows);
      }
      
      tables.push({
        index: tableIndex++,
        headers: headersArray.length > 0 ? headersArray : undefined,
        columns: columnsArray.length > 0 ? columnsArray : undefined,
        rows: rowsArray,
        title: title || undefined,
        startIndex,
        endIndex,
        fullMatch,
        isArrayBased: false,
      });
    }
  }
  
  return { sections, tables, isArrayBased };
}

/**
 * Get element type and index from data attributes
 */
export function getElementInfo(element: HTMLElement): {
  type: 'section' | 'table' | 'column' | 'row' | null;
  sectionIndex?: number;
  tableIndex?: number;
  columnIndex?: number;
  rowIndex?: number;
} {
  if (element.hasAttribute('data-section-index')) {
    return {
      type: 'section',
      sectionIndex: parseInt(element.getAttribute('data-section-index') || '0', 10),
    };
  }
  
  if (element.hasAttribute('data-table-index')) {
    return {
      type: 'table',
      tableIndex: parseInt(element.getAttribute('data-table-index') || '0', 10),
    };
  }
  
  if (element.hasAttribute('data-column-index')) {
    return {
      type: 'column',
      tableIndex: parseInt(element.getAttribute('data-table-index') || '0', 10),
      columnIndex: parseInt(element.getAttribute('data-column-index') || '0', 10),
    };
  }
  
  if (element.hasAttribute('data-row-index')) {
    return {
      type: 'row',
      tableIndex: parseInt(element.getAttribute('data-table-index') || '0', 10),
      rowIndex: parseInt(element.getAttribute('data-row-index') || '0', 10),
    };
  }
  
  // Check parent elements
  let parent = element.parentElement;
  let depth = 0;
  while (parent && depth < 5) {
    if (parent.hasAttribute('data-section-index')) {
      return {
        type: 'section',
        sectionIndex: parseInt(parent.getAttribute('data-section-index') || '0', 10),
      };
    }
    if (parent.hasAttribute('data-table-index')) {
      const info: any = {
        type: 'table',
        tableIndex: parseInt(parent.getAttribute('data-table-index') || '0', 10),
      };
      
      // Check if it's a column or row
      if (element.tagName === 'TH' || element.closest('th')) {
        const th = element.tagName === 'TH' ? element : element.closest('th');
        if (th && th.hasAttribute('data-column-index')) {
          info.type = 'column';
          info.columnIndex = parseInt(th.getAttribute('data-column-index') || '0', 10);
        }
      } else if (element.tagName === 'TR' || element.closest('tr')) {
        const tr = element.tagName === 'TR' ? element : element.closest('tr');
        if (tr && tr.hasAttribute('data-row-index')) {
          info.type = 'row';
          info.rowIndex = parseInt(tr.getAttribute('data-row-index') || '0', 10);
        }
      }
      
      return info;
    }
    parent = parent.parentElement;
    depth++;
  }
  
  return { type: null };
}
