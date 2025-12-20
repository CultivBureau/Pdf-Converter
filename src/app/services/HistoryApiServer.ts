"use server";

/**
 * Server-side History API functions
 * 
 * These functions are designed to work in Next.js server components
 * and do NOT use any client-side functions like getToken() or localStorage.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:8000";

export interface Document {
  id: string;
  user_id: string;
  title: string;
  original_filename: string;
  file_path: string;
  extracted_data: {
    generated: {
      sections: any[];
      tables: any[];
    };
    user: {
      elements: any[];
    };
    layout: string[];
    meta: Record<string, any>;
  };
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  shared_with: string[];
  is_public: boolean;
  current_version?: number;
  original_version_id?: string | null;
  total_versions?: number;
}

export interface DocumentResponse {
  document: Document;
  message?: string;
}

/**
 * Get a specific document (server-side only)
 * Use this in server components where getToken() is not available
 * 
 * @param docId - Document ID
 * @param token - Optional authentication token (from query params or backend)
 * @returns Document response
 */
export async function getDocumentServer(
  docId: string,
  token?: string
): Promise<DocumentResponse> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const url = `${API_BASE_URL}/history/${docId}`;
    const response = await fetch(url, {
      method: "GET",
      mode: "cors",
      headers,
      cache: "no-store", // Don't cache for server components
    });

    // Handle response inline to avoid calling any client functions
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

    return payload as DocumentResponse;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `[HistoryApiServer] Failed to fetch document ${docId}: ${message}`
    );
  }
}

