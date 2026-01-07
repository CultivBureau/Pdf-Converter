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
  company_id?: string | null;
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

  try {
    // If token is provided, pass it as query parameter (for public token access)
    // Otherwise, the backend will require authentication
    const url = token 
      ? `${API_BASE_URL}/history/${docId}?token=${encodeURIComponent(token)}`
      : `${API_BASE_URL}/history/${docId}`;
    
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

/**
 * Get company branding (header/footer images) from company_id (server-side only)
 * 
 * @param companyId - Company ID
 * @param token - Optional authentication token
 * @returns Company branding with header_image and footer_image URLs
 */
export async function getCompanyBrandingServer(
  companyId: string,
  token?: string,
  documentId?: string
): Promise<{ header_image: string | null; footer_image: string | null }> {
  if (!companyId) {
    return { header_image: null, footer_image: null };
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  try {
    // Build URL with query parameters for public token access
    let url = `${API_BASE_URL}/companies/${companyId}`;
    const queryParams: string[] = [];
    
    // If we have both token and documentId, use query parameters (public token)
    if (token && documentId) {
      queryParams.push(`token=${encodeURIComponent(token)}`);
      queryParams.push(`document_id=${encodeURIComponent(documentId)}`);
    } else if (token) {
      // If only token, try as Bearer token (for PDF token)
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    if (queryParams.length > 0) {
      url += `?${queryParams.join("&")}`;
    }
    
    const response = await fetch(url, {
      method: "GET",
      mode: "cors",
      headers,
      cache: "no-store",
    });

    const contentType = response.headers.get("content-type");
    const isJson = contentType && contentType.includes("application/json");
    const payload = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      // If company not found or access denied, return null images
      return { header_image: null, footer_image: null };
    }

    const company = payload as { header_image?: string | null; footer_image?: string | null };
    
    // Convert relative paths to absolute URLs if needed
    const headerImage = company.header_image
      ? company.header_image.startsWith("http")
        ? company.header_image
        : `${API_BASE_URL}${company.header_image}`
      : null;
    
    const footerImage = company.footer_image
      ? company.footer_image.startsWith("http")
        ? company.footer_image
        : `${API_BASE_URL}${company.footer_image}`
      : null;

    return {
      header_image: headerImage,
      footer_image: footerImage,
    };
  } catch (error) {
    // If error, return null images (fallback to defaults)
    console.error(`[HistoryApiServer] Failed to fetch company branding: ${error}`);
    return { header_image: null, footer_image: null };
  }
}

