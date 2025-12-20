/**
 * PDF API Service
 * 
 * Provides functions for uploading PDFs, extracting structured data, and generating PDFs using Playwright.
 */

import { getToken } from "./AuthApi";
import type { SeparatedStructure } from "../types/ExtractTypes";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:8000";

if (process.env.NODE_ENV !== "production" && !process.env.NEXT_PUBLIC_API_BASE_URL) {
  console.warn(
    "[PdfApi] NEXT_PUBLIC_API_BASE_URL is not set. Falling back to http://localhost:8000. " +
      "Set this in .env.local to avoid CORS mistakes when the backend runs on a different host."
  );
}

// Get auth token
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
}

async function handleResponse(response: Response) {
  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const errorMessage =
      isJson && payload?.message
        ? payload.message
        : isJson && payload?.detail
        ? typeof payload.detail === 'string' ? payload.detail : JSON.stringify(payload.detail)
        : payload || response.statusText;
    throw new Error(errorMessage || "Request failed");
  }

  return payload;
}

async function request(path: string, init: RequestInit = {}) {
  try {
    const url = `${API_BASE_URL}${path}`;
    
    const token = getAuthToken();
    
    let headers: HeadersInit = init.headers || {};
    
    if (token) {
      headers = { ...headers, "Authorization": `Bearer ${token}` };
    }
    
    if (!(init.body instanceof FormData)) {
      headers = { ...headers, "Content-Type": "application/json" };
    }
    
    const response = await fetch(url, {
      ...init,
      mode: init.mode ?? "cors",
      headers,
    });
    return await handleResponse(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`[PdfApi] Network request failed for ${path}: ${message}`);
  }
}

/**
 * Upload PDF file to backend
 */
export async function uploadFile(file: File): Promise<{
  file_path: string;
  filename: string;
  original_filename: string;
  message: string;
}> {
  const formData = new FormData();
  formData.append("file", file);

  return request("/upload/", {
    method: "POST",
    body: formData,
    headers: {},
  }) as Promise<{
    file_path: string;
    filename: string;
    original_filename: string;
    message: string;
  }>;
}

/**
 * Extract structured data from uploaded PDF
 * Returns v2 format: { generated: { sections, tables }, user: { elements }, layout, meta }
 */
export async function extractStructured(filePath: string): Promise<SeparatedStructure> {
  return request("/extract/structured", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ file_path: filePath }),
  }) as Promise<SeparatedStructure>;
}

export interface PDFGenerateRequest {
  document_id: string;
  format?: "A4" | "Letter";
  token?: string;
}

/**
 * Generate PDF using Playwright backend
 * 
 * @param documentId - Document ID to generate PDF for
 * @param format - PDF format (default: "A4")
 * @param token - Optional short-lived PDF token
 * @returns PDF blob
 */
export async function generatePDFWithPlaywright(
  documentId: string,
  format: "A4" | "Letter" = "A4",
  token?: string
): Promise<Blob> {
  const requestBody: PDFGenerateRequest = {
    document_id: documentId,
    format,
    ...(token && { token }),
  };

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  // Add auth token if available
  const authToken = getToken();
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/pdf/generate`, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `PDF generation failed: ${response.status} ${errorText}`
      );
    }

    // Return PDF blob
    return await response.blob();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    throw new Error(`[PdfApi] PDF generation failed: ${message}`);
  }
}

/**
 * Download PDF blob as file
 * 
 * @param blob - PDF blob
 * @param filename - Filename for download
 */
export function downloadPDFBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Cleanup
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

