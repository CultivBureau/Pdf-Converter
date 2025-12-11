/**
 * Type definitions for PDF extraction and processing
 */

export interface Section {
  type: "section";
  id: string;
  title: string;
  content: string;
  order: number;
  parent_id: string | null;
}

export interface Table {
  type: "table";
  id: string;
  columns: string[];
  rows: string[][];
  order: number;
  section_id: string | null;
}

export interface Structure {
  sections: Section[];
  tables: Table[];
  meta: {
    generated_at?: string;
    sections_count?: number;
    tables_count?: number;
    [key: string]: any;
  };
}

export interface UploadResponse {
  message: string;
  file_path: string;
  filename: string;
  original_filename: string;
}

export interface Image {
  page: number;
  path: string;
  width: number;
  height: number;
  format: string;
  size_bytes: number;
}

// Enterprise Pipeline: Unified Element interface
export interface Element {
  id: string;
  type: "section" | "table" | "image";
  page: number;
  // Section fields
  title?: string;
  content?: string;
  // Table fields
  columns?: string[];
  rows?: string[][];
  // Image fields
  src?: string;
  caption?: string;
  width?: number;
  height?: number;
}

export interface ExtractResponse {
  // New enterprise format (ordered elements array)
  elements?: Element[];
  // Legacy format (for backward compatibility)
  sections?: Section[];
  tables?: Table[];
  images?: Image[];
  meta: Record<string, any>;
}

export interface CleanStructureResponse extends ExtractResponse {
  meta: {
    improvements?: string[];
    original_sections_count?: number;
    cleaned_sections_count?: number;
    claude_processed_at?: string;
    claude_model?: string;
    [key: string]: any;
  };
}

export interface GenerateJSXResponse {
  jsxCode: string;
  componentsUsed: string[];
  warnings: string[];
  metadata: Record<string, any>;
}

export interface FixJSXResponse {
  fixedCode: string;
  explanation: string;
  errors: string[];
  warnings: string[];
  changes: Array<{
    type: string;
    description: string;
    line: number;
  }>;
  metadata: Record<string, any>;
}

