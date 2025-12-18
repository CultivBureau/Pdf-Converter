/**
 * Static JSX Generator Utility
 * Converts structured JSON data (sections and tables) to JSX template code
 * 
 * This replaces the AI-based code generation with a deterministic, client-side generator
 */

import type { ExtractResponse, Section, Table } from '../types/ExtractTypes';

/**
 * Generate JSX string for a section component
 */
function generateSectionJSX(section: Section | { title?: string; content: string; type?: string }): string {
  const props: string[] = [];
  
  if (section.title) {
    // Use template literal for JSX attributes - escape backticks and ${} to prevent issues
    const title = section.title.replace(/`/g, '\\`').replace(/\${/g, '\\${');
    props.push(`title={\`${title}\`}`);
  }
  
  // Use template literal for JSX content attribute - escape backticks and ${} to prevent issues
  const content = section.content.replace(/`/g, '\\`').replace(/\${/g, '\\${');
  props.push(`content={\`${content}\`}`);
  
  if (section.type && section.type !== 'section') {
    props.push(`type="${section.type}"`);
  }
  
  return `<SectionTemplate ${props.join(' ')} />`;
}

/**
 * Generate JSX string for a table component
 */
function generateTableJSX(table: Table | { 
  headers?: string[]; 
  columns?: string[]; 
  rows: (string | number)[][]; 
  title?: string;
}): string {
  const props: string[] = [];
  
  if (table.title) {
    const escapedTitle = table.title
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n');
    props.push(`title="${escapedTitle}"`);
  }
  
  // Use columns if available, otherwise headers
  const columns = (table as Table).columns || (table as any).columns || (table as any).headers || [];
  
  if (columns.length > 0) {
    const columnsStr = columns.map(c => {
      const escaped = String(c)
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n');
      return `"${escaped}"`;
    }).join(', ');
    props.push(`columns={[${columnsStr}]}`);
  }
  
  // Use rows from table
  const rows = (table as Table).rows || (table as any).rows || [];
  
  if (rows.length > 0) {
    const rowsStr = rows.map(row => {
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
 * Sort sections by order, then by natural order
 */
function sortSections(sections: Section[]): Section[] {
  return [...sections].sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    if (a.order !== undefined) return -1;
    if (b.order !== undefined) return 1;
    return 0;
  });
}

/**
 * Sort tables by order, then by natural order
 */
function sortTables(tables: Table[]): Table[] {
  return [...tables].sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    if (a.order !== undefined) return -1;
    if (b.order !== undefined) return 1;
    return 0;
  });
}

/**
 * Convert structured data to JSX template code
 * 
 * @param structure - Structured data with sections and tables
 * @returns Complete JSX template string
 */
export function structureToJsx(structure: ExtractResponse | { sections: Section[]; tables: Table[]; meta?: any }): string {
  const sections = structure.sections || [];
  const tables = structure.tables || [];
  
  // Sort sections and tables by order
  const sortedSections = sortSections(sections);
  const sortedTables = sortTables(tables);
  
  // Generate JSX for each section
  const sectionJSX = sortedSections.map(section => {
    return `        ${generateSectionJSX(section)}`;
  }).join('\n');
  
  // Generate JSX for each table
  const tableJSX = sortedTables.map(table => {
    return `        ${generateTableJSX(table)}`;
  }).join('\n');
  
  // Combine sections and tables, interleaving them based on order if needed
  // For now, we'll put all sections first, then all tables
  // This can be enhanced later to respect a layout order if provided
  const contentJSX = [];
  
  if (sectionJSX) {
    contentJSX.push(sectionJSX);
  }
  
  if (tableJSX) {
    contentJSX.push(tableJSX);
  }
  
  const allContent = contentJSX.join('\n\n');
  
  // Generate the complete template
  const template = `export default function Template() {
  return (
    <BaseTemplate>
${allContent || '      {/* No content extracted */}'}
    </BaseTemplate>
  );
}`;
  
  return template;
}

/**
 * Convert structured data to JSX template code with custom wrapper
 * 
 * @param structure - Structured data with sections and tables
 * @param options - Optional configuration
 * @returns Complete JSX template string
 */
export function structureToJsxWithOptions(
  structure: ExtractResponse | { sections: Section[]; tables: Table[]; meta?: any },
  options?: {
    wrapper?: 'BaseTemplate' | 'div';
    wrapperProps?: string;
  }
): string {
  const sections = structure.sections || [];
  const tables = structure.tables || [];
  
  // Sort sections and tables by order
  const sortedSections = sortSections(sections);
  const sortedTables = sortTables(tables);
  
  // Generate JSX for each section
  const sectionJSX = sortedSections.map(section => {
    return `        ${generateSectionJSX(section)}`;
  }).join('\n');
  
  // Generate JSX for each table
  const tableJSX = sortedTables.map(table => {
    return `        ${generateTableJSX(table)}`;
  }).join('\n');
  
  // Combine sections and tables
  const contentJSX = [];
  
  if (sectionJSX) {
    contentJSX.push(sectionJSX);
  }
  
  if (tableJSX) {
    contentJSX.push(tableJSX);
  }
  
  const allContent = contentJSX.join('\n\n');
  
  // Use custom wrapper if provided
  const wrapper = options?.wrapper || 'BaseTemplate';
  const wrapperProps = options?.wrapperProps || '';
  const wrapperOpen = wrapperProps ? `<${wrapper} ${wrapperProps}>` : `<${wrapper}>`;
  const wrapperClose = `</${wrapper}>`;
  
  // Generate the complete template
  const template = `export default function Template() {
  return (
    ${wrapperOpen}
${allContent || '      {/* No content extracted */}'}
    ${wrapperClose}
  );
}`;
  
  return template;
}

