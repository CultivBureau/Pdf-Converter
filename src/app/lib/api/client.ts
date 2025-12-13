/**
 * TypeScript API Client for PDF Converter Backend
 * 
 * Adapted for Next.js with cookie-based token management
 * 
 * Usage:
 *   import { apiClient } from '@/app/lib/api';
 *   await apiClient.login('email@example.com', 'password');
 *   const result = await apiClient.extractPDF(filePath);
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import Cookies from 'js-cookie';
import type {
  User,
  Token,
  UserResponse,
  UserListResponse,
  UploadResponse,
  ExtractionResult,
  RawExtractionResult,
  CleanStructureRequest,
  CleanStructureResponse,
  GenerateJSXRequest,
  GenerateJSXResponse,
  FixJSXRequest,
  FixJSXResponse,
  ProcessToJSXRequest,
  ProcessToJSXResponse,
  Document,
  DocumentResponse,
  DocumentListResponse,
  DocumentCreate,
  DocumentUpdate,
  ShareDocumentRequest,
  ShareDocumentResponse,
  HealthCheck,
  ReadinessCheck,
  ApiError,
} from './types';

export class PDFConverterClient {
  private client: AxiosInstance;
  private token: string | null = null;
  private baseURL: string;

  constructor(baseURL?: string) {
    // Use NEXT_PUBLIC_API_BASE_URL if provided, otherwise default
    this.baseURL = baseURL || 
      (typeof window !== 'undefined' 
        ? (process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:8000')
        : 'http://localhost:8000');

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 300000, // 5 minutes for long operations
    });

    // Load token from cookies if available
    if (typeof window !== 'undefined') {
      const savedToken = Cookies.get('auth_token');
      if (savedToken) {
        this.setToken(savedToken);
      }
    }

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiError>) => {
        if (error.response?.status === 401) {
          this.setToken(null);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('auth:logout'));
          }
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Set authentication token (stores in cookies)
   */
  setToken(token: string | null): void {
    this.token = token;
    if (token && typeof window !== 'undefined') {
      Cookies.set('auth_token', token, { expires: 7 }); // 7 days to match backend JWT expiration
    } else if (typeof window !== 'undefined') {
      Cookies.remove('auth_token');
    }
  }

  /**
   * Get current authentication token
   */
  getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = Cookies.get('auth_token') || null;
    }
    return this.token;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // ==================== AUTHENTICATION ====================

  /**
   * Register a new user (Admin only)
   */
  async register(
    userData: { email: string; name: string; password: string; role?: string },
    adminToken?: string
  ): Promise<UserResponse> {
    const response = await this.client.post<UserResponse>('/auth/register', userData, {
      headers: adminToken ? { Authorization: `Bearer ${adminToken}` } : {},
    });
    return response.data;
  }

  /**
   * Login and get JWT token
   */
  async login(email: string, password: string): Promise<Token> {
    const response = await this.client.post<Token>('/auth/login', { email, password });
    const { access_token } = response.data;
    this.setToken(access_token);
    return response.data;
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<UserResponse> {
    const response = await this.client.get<UserResponse>('/auth/me');
    return response.data;
  }

  /**
   * Update user profile
   */
  async updateProfile(name: string): Promise<UserResponse> {
    const response = await this.client.put<UserResponse>('/auth/profile', { name });
    return response.data;
  }

  /**
   * Logout (removes token)
   */
  async logout(): Promise<{ message: string }> {
    try {
      await this.client.post('/auth/logout');
    } finally {
      this.setToken(null);
    }
    return { message: 'Logged out successfully' };
  }

  /**
   * List all users (Admin only)
   */
  async listUsers(
    page: number = 1,
    pageSize: number = 20,
    search?: string
  ): Promise<UserListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });
    if (search) params.append('search', search);

    const response = await this.client.get<UserListResponse>(`/auth/users?${params}`);
    return response.data;
  }

  /**
   * Delete user (Admin only)
   */
  async deleteUser(userId: string): Promise<{ message: string }> {
    const response = await this.client.delete<{ message: string }>(`/auth/users/${userId}`);
    return response.data;
  }

  // ==================== FILE UPLOAD ====================

  /**
   * Upload PDF file
   */
  async uploadFile(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post<UploadResponse>('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          // Dispatch progress event
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('upload:progress', { detail: { percent: percentCompleted } })
            );
          }
        }
      },
    });

    return response.data;
  }

  // ==================== PDF EXTRACTION ====================

  /**
   * Extract PDF content (normalized)
   */
  async extractPDF(filePath: string): Promise<ExtractionResult> {
    const response = await this.client.post<ExtractionResult>('/extract', {
      file_path: filePath,
    });
    return response.data;
  }

  /**
   * Extract PDF content (raw, for debugging)
   */
  async extractPDFRaw(filePath: string): Promise<RawExtractionResult> {
    const response = await this.client.post<RawExtractionResult>('/extract/raw', {
      file_path: filePath,
    });
    return response.data;
  }

  // ==================== AI PROCESSING ====================

  /**
   * Clean and enhance document structure
   */
  async cleanStructure(
    structure: CleanStructureRequest['structure'],
    options?: Omit<CleanStructureRequest, 'structure'>
  ): Promise<CleanStructureResponse> {
    const response = await this.client.post<CleanStructureResponse>('/ai/clean-structure', {
      structure,
      ...options,
    });
    return response.data;
  }

  /**
   * Generate JSX code from structure
   */
  async generateJSX(
    structure: GenerateJSXRequest['structure'],
    options?: Omit<GenerateJSXRequest, 'structure'>
  ): Promise<GenerateJSXResponse> {
    const response = await this.client.post<GenerateJSXResponse>('/ai/generate-jsx', {
      structure,
      ...options,
    });
    return response.data;
  }

  /**
   * Fix JSX syntax errors
   */
  async fixJSX(
    jsxCode: string,
    errorMessage?: string,
    options?: Omit<FixJSXRequest, 'jsx_code' | 'error_message'>
  ): Promise<FixJSXResponse> {
    const response = await this.client.post<FixJSXResponse>('/ai/fix-jsx', {
      jsx_code: jsxCode,
      error_message: errorMessage,
      ...options,
    });
    return response.data;
  }

  /**
   * Complete pipeline: Clean → Generate JSX → Auto-fix
   */
  async processToJSX(
    structure: ProcessToJSXRequest['structure'],
    autoFix: boolean = true
  ): Promise<ProcessToJSXResponse> {
    const response = await this.client.post<ProcessToJSXResponse>('/ai/process-to-jsx', {
      structure,
      auto_fix: autoFix,
    });
    return response.data;
  }

  // ==================== DOCUMENT HISTORY ====================

  /**
   * Get user's documents with pagination
   */
  async getDocuments(
    page: number = 1,
    pageSize: number = 20,
    search?: string
  ): Promise<DocumentListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });
    if (search) params.append('search', search);

    const response = await this.client.get<DocumentListResponse>(`/history?${params}`);
    return response.data;
  }

  /**
   * Get specific document by ID
   */
  async getDocument(docId: string): Promise<DocumentResponse> {
    const response = await this.client.get<DocumentResponse>(`/history/${docId}`);
    return response.data;
  }

  /**
   * Create new document
   */
  async createDocument(documentData: DocumentCreate): Promise<DocumentResponse> {
    const response = await this.client.post<DocumentResponse>('/history', documentData);
    return response.data;
  }

  /**
   * Update document
   */
  async updateDocument(docId: string, documentData: DocumentUpdate): Promise<DocumentResponse> {
    const response = await this.client.put<DocumentResponse>(`/history/${docId}`, documentData);
    return response.data;
  }

  /**
   * Delete document
   */
  async deleteDocument(docId: string): Promise<{ message: string }> {
    const response = await this.client.delete<{ message: string }>(`/history/${docId}`);
    return response.data;
  }

  /**
   * Share document
   */
  async shareDocument(
    docId: string,
    shareData: ShareDocumentRequest
  ): Promise<ShareDocumentResponse> {
    const response = await this.client.post<ShareDocumentResponse>(
      `/history/${docId}/share`,
      shareData
    );
    return response.data;
  }

  /**
   * Export document
   */
  async exportDocument(docId: string, format: 'json' | 'jsx' = 'json'): Promise<Blob> {
    const response = await this.client.get(`/history/${docId}/export?format=${format}`, {
      responseType: 'blob',
    });
    return response.data;
  }

  // ==================== HEALTH CHECKS ====================

  /**
   * Health check
   */
  async healthCheck(): Promise<HealthCheck> {
    const response = await this.client.get<HealthCheck>('/health');
    return response.data;
  }

  /**
   * Readiness check
   */
  async readinessCheck(): Promise<ReadinessCheck> {
    const response = await this.client.get<ReadinessCheck>('/ready');
    return response.data;
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Complete workflow: Upload → Extract → Process → Save
   */
  async processPDFComplete(
    file: File,
    options?: {
      saveToHistory?: boolean;
      documentTitle?: string;
      autoFix?: boolean;
    }
  ): Promise<{
    upload: UploadResponse;
    extraction: ExtractionResult;
    processing: ProcessToJSXResponse;
    document?: DocumentResponse;
  }> {
    const {
      saveToHistory = true,
      documentTitle,
      autoFix = true,
    } = options || {};

    // Step 1: Upload
    const upload = await this.uploadFile(file);

    // Step 2: Extract
    const extraction = await this.extractPDF(upload.file_path);

    // Step 3: Process to JSX
    const processing = await this.processToJSX(
      {
        sections: extraction.sections,
        tables: extraction.tables,
      },
      autoFix
    );

    // Step 4: Save to history (optional)
    let document: DocumentResponse | undefined;
    if (saveToHistory) {
      document = await this.createDocument({
        title: documentTitle || file.name,
        original_filename: file.name,
        file_path: upload.file_path,
        extracted_data: {
          sections: extraction.sections,
          tables: extraction.tables,
          images: extraction.images,
        },
        jsx_code: processing.jsxCode,
        metadata: {
          extraction_status: extraction.meta.extraction_status,
          processing_time: Date.now(),
        },
      });
    }

    return {
      upload,
      extraction,
      processing,
      document,
    };
  }
}

// Get base URL from environment
const getBaseURL = (): string => {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:8000';
  }
  return 'http://localhost:8000';
};

// Export singleton instance
export const apiClient = new PDFConverterClient(getBaseURL());

// Also export the class for custom instances
export { PDFConverterClient };

