/**
 * TypeScript type definitions for PDF Converter Backend API
 */

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface Token {
  access_token: string;
  token_type: string;
  user: User;
}

export interface UserResponse {
  user: User;
  message: string;
}

export interface UserListResponse {
  users: User[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface Section {
  type: 'section';
  title: string;
  content: string;
  extraction_method?: string;
  confidence?: number;
  page?: number;
}

export interface Table {
  type: 'table';
  columns: string[];
  rows: string[][];
  extraction_method?: string;
  page?: number;
}

export interface Image {
  page: number;
  index: number;
  width: number;
  height: number;
  format: string;
}

export interface ExtractionMeta {
  extraction_status: 'success' | 'warning' | 'partial' | 'error';
  raw_sections_count: number;
  raw_tables_count: number;
  images_count: number;
  validation: {
    valid: boolean;
    file_size: number;
    page_count: number | string;
  };
  warning?: string;
  error?: string;
}

export interface ExtractionResult {
  sections: Section[];
  tables: Table[];
  images: Image[];
  meta: ExtractionMeta;
}

export interface RawExtractionResult {
  raw_sections: Section[];
  raw_tables: Table[];
  raw_images: Image[];
  extraction_methods: {
    text: string;
    tables: string;
    images: string;
  };
  page_breakdown: Array<{
    page: number;
    text_length: number;
    has_text: boolean;
    tables_on_page: Table[];
  }>;
  meta: ExtractionMeta;
  raw_output_path?: string;
}

export interface UploadResponse {
  message: string;
  file_path: string;
  filename: string;
  original_filename: string;
}

export interface CleanStructureRequest {
  structure: {
    sections: Section[];
    tables: Table[];
  };
  model?: string;
  max_retries?: number;
  timeout?: number;
  temperature?: number;
}

export interface CleanStructureResponse {
  sections: Section[];
  tables: Table[];
  meta: {
    improvements?: string[];
    cleaning_stats?: {
      original_sections: number;
      cleaned_sections: number;
      original_tables: number;
      cleaned_tables: number;
    };
    cleaning_failed?: boolean;
    cleaning_error?: string;
    warning?: string;
  };
}

export interface GenerateJSXRequest {
  structure: {
    sections: Section[];
    tables: Table[];
  };
  model?: string;
  max_retries?: number;
  timeout?: number;
  temperature?: number;
}

export interface GenerateJSXResponse {
  jsxCode: string;
  componentsUsed: string[];
  warnings: string[];
  metadata: {
    sections_count: number;
    tables_count: number;
    generation_time?: number;
  };
}

export interface FixJSXRequest {
  jsx_code: string;
  error_message?: string;
  model?: string;
  max_retries?: number;
  timeout?: number;
  temperature?: number;
}

export interface FixJSXResponse {
  fixedCode: string;
  explanation: string;
  errors: string[];
  warnings: string[];
  changes: string[];
}

export interface ProcessToJSXRequest {
  structure: {
    sections: Section[];
    tables: Table[];
  };
  auto_fix?: boolean;
}

export interface ProcessToJSXResponse {
  jsxCode: string;
  cleanedStructure: CleanStructureResponse;
  generationResult: GenerateJSXResponse;
  fixResult: FixJSXResponse | null;
  pipelineStatus: 'success' | 'fixed' | 'error';
  metadata: {
    steps_completed: string[];
    errors: string[];
    warnings: string[];
  };
}

export interface Document {
  id: string;
  user_id: string;
  title: string;
  original_filename: string;
  file_path: string;
  extracted_data: {
    sections: Section[];
    tables: Table[];
    images?: Image[];
  };
  jsx_code?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  shared_with: string[];
  is_public: boolean;
}

export interface DocumentResponse {
  document: Document;
  message: string;
}

export interface DocumentListResponse {
  documents: Document[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface DocumentCreate {
  title: string;
  original_filename: string;
  file_path: string;
  extracted_data: {
    sections: Section[];
    tables: Table[];
    images?: Image[];
  };
  jsx_code?: string;
  metadata?: Record<string, any>;
}

export interface DocumentUpdate {
  title?: string;
  extracted_data?: {
    sections: Section[];
    tables: Table[];
    images?: Image[];
  };
  jsx_code?: string;
  metadata?: Record<string, any>;
}

export interface ShareDocumentRequest {
  user_ids?: string[];
  is_public?: boolean;
}

export interface ShareDocumentResponse {
  message: string;
  shared_with: string[];
  is_public: boolean;
}

export interface ApiError {
  error: boolean;
  status_code: number;
  message: string;
  path?: string;
  method?: string;
  request_id?: string;
  details?: Array<{
    type: string;
    loc: (string | number)[];
    msg: string;
    input?: any;
  }>;
}

export interface HealthCheck {
  status: 'healthy' | 'unhealthy';
  service: string;
  version: string;
  timestamp: number;
}

export interface ReadinessCheck {
  status: 'ready' | 'not_ready';
  service: string;
  version: string;
  checks: {
    upload_directory: boolean;
    api_keys: {
      anthropic: boolean;
      openai: boolean;
    };
  };
  timestamp: number;
}

