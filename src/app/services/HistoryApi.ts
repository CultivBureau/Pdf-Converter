// History/Document API client
import { getToken } from "./AuthApi";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:8000";

// Handle response
async function handleResponse(response: Response) {
  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const errorMessage =
      isJson && payload?.message
        ? payload.message
        : isJson && payload?.detail
        ? typeof payload.detail === "string"
          ? payload.detail
          : JSON.stringify(payload.detail)
        : payload || response.statusText;
    throw new Error(errorMessage || "Request failed");
  }

  return payload;
}

// Make authenticated request
async function historyRequest(path: string, init: RequestInit = {}) {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(init.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const url = `${API_BASE_URL}${path}`;
    const response = await fetch(url, {
      ...init,
      mode: init.mode ?? "cors",
      headers,
    });
    return await handleResponse(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `[HistoryApi] Network request failed for ${path}: ${message}`
    );
  }
}

// Document types
export interface Document {
  id: string;
  user_id: string;
  title: string;
  original_filename: string;
  file_path: string;
  extracted_data: {
    sections?: any[];
    tables?: any[];
    meta?: Record<string, any>;
  };
  jsx_code?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  shared_with: string[];
  is_public: boolean;
}

export interface DocumentListResponse {
  documents: Document[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface DocumentResponse {
  document: Document;
  message?: string;
}

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

export interface ShareDocumentRequest {
  emails?: string[];
  is_public?: boolean;
}

export interface ShareDocumentResponse {
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
  let url = `/history/?page=${page}&page_size=${pageSize}`;
  if (search) {
    url += `&search=${encodeURIComponent(search)}`;
  }

  return historyRequest(url, { method: "GET" });
}

/**
 * Create/save a new document
 */
export async function saveDocument(
  data: CreateDocumentRequest
): Promise<DocumentResponse> {
  return historyRequest("/history/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Get a specific document
 */
export async function getDocument(docId: string): Promise<DocumentResponse> {
  return historyRequest(`/history/${docId}`, { method: "GET" });
}

/**
 * Update a document
 */
export async function updateDocument(
  docId: string,
  data: UpdateDocumentRequest
): Promise<DocumentResponse> {
  return historyRequest(`/history/${docId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * Delete a document
 */
export async function deleteDocument(docId: string): Promise<{ message: string }> {
  return historyRequest(`/history/${docId}`, { method: "DELETE" });
}

/**
 * Share a document
 */
export async function shareDocument(
  docId: string,
  data: ShareDocumentRequest
): Promise<ShareDocumentResponse> {
  return historyRequest(`/history/${docId}/share`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Export a document
 */
export async function exportDocument(
  docId: string,
  format: "json" | "pdf" = "json"
): Promise<any> {
  const token = getToken();
  const headers: HeadersInit = {};

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}/history/${docId}/export?format=${format}`;
  const response = await fetch(url, {
    method: "GET",
    mode: "cors",
    headers,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Export failed");
  }

  if (format === "json") {
    return response.json();
  } else {
    // For PDF, return blob
    return response.blob();
  }
}

