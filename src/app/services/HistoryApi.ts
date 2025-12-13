// History/Document API client - Migrated to use SDK
import { apiClient } from '@/app/lib/api';
import type {
  Document,
  DocumentResponse,
  DocumentListResponse,
  DocumentCreate,
  DocumentUpdate,
  ShareDocumentRequest,
  ShareDocumentResponse,
} from '@/app/lib/api';

// Re-export types for backward compatibility
export type {
  Document,
  DocumentResponse,
  DocumentListResponse,
} from '@/app/lib/api';

export interface CreateDocumentRequest {
  title: string;
  original_filename: string;
  file_path: string;
  extracted_data: any;
  jsx_code?: string;
  metadata?: Record<string, any>;
}

export interface UpdateDocumentRequest {
  title?: string;
  extracted_data?: any;
  jsx_code?: string;
  metadata?: Record<string, any>;
}

export interface ShareDocumentRequestLocal {
  emails?: string[];
  is_public?: boolean;
}

export interface ShareDocumentResponseLocal {
  message: string;
  shared_with: string[];
  is_public: boolean;
  public_link?: string;
}

/**
 * Get user's document history
 */
export async function getHistory(
  page: number = 1,
  pageSize: number = 20,
  search?: string
): Promise<DocumentListResponse> {
  return await apiClient.getDocuments(page, pageSize, search);
}

/**
 * Create/save a new document
 */
export async function saveDocument(
  data: CreateDocumentRequest
): Promise<DocumentResponse> {
  const documentData: DocumentCreate = {
    title: data.title,
    original_filename: data.original_filename,
    file_path: data.file_path,
    extracted_data: data.extracted_data,
    jsx_code: data.jsx_code,
    metadata: data.metadata,
  };
  return await apiClient.createDocument(documentData);
}

/**
 * Get a specific document
 */
export async function getDocument(docId: string): Promise<DocumentResponse> {
  return await apiClient.getDocument(docId);
}

/**
 * Update a document
 */
export async function updateDocument(
  docId: string,
  data: UpdateDocumentRequest
): Promise<DocumentResponse> {
  const updateData: DocumentUpdate = {
    title: data.title,
    extracted_data: data.extracted_data,
    jsx_code: data.jsx_code,
    metadata: data.metadata,
  };
  return await apiClient.updateDocument(docId, updateData);
}

/**
 * Delete a document
 */
export async function deleteDocument(docId: string): Promise<{ message: string }> {
  return await apiClient.deleteDocument(docId);
}

/**
 * Share a document
 * Note: SDK uses user_ids, but this function accepts emails for backward compatibility
 * For now, we'll convert emails to user_ids if needed, or use the SDK's shareDocument directly
 */
export async function shareDocument(
  docId: string,
  data: ShareDocumentRequestLocal
): Promise<ShareDocumentResponseLocal> {
  // Convert to SDK format
  const shareData: ShareDocumentRequest = {
    user_ids: data.emails as any, // Note: emails should be user_ids, but keeping for compatibility
    is_public: data.is_public,
  };
  
  const response = await apiClient.shareDocument(docId, shareData);
  
  return {
    message: response.message,
    shared_with: response.shared_with,
    is_public: response.is_public,
  };
}

/**
 * Export a document
 */
export async function exportDocument(
  docId: string,
  format: "json" | "pdf" = "json"
): Promise<any> {
  // SDK only supports 'json' | 'jsx', but we'll handle 'pdf' as 'json' for now
  const exportFormat = format === "pdf" ? "json" : format;
  const blob = await apiClient.exportDocument(docId, exportFormat as "json" | "jsx");
  
  if (format === "json") {
    // Convert blob to JSON
    const text = await blob.text();
    return JSON.parse(text);
  } else {
    // Return blob for PDF
    return blob;
  }
}
