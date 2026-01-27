// Tickets API client - Bureau issue tracking system
import { getToken } from "./AuthApi";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:8000";

// ============== Types ==============

export type TicketCategory =
  | "upload_parsing"
  | "ocr_quality"
  | "table_extraction"
  | "word_level_errors"
  | "layout_sections"
  | "pdf_output"
  | "performance"
  | "other";

export type TicketStatus =
  | "open"
  | "in_progress"
  | "resolved"
  | "closed"
  | "added_to_ai";

export type TicketPriority = "low" | "medium" | "high" | "critical";

export interface TicketAttachment {
  filename: string;
  original_filename: string;
  file_type: "input_pdf" | "output_pdf" | "screenshot";
  mime_type: string;
  size_bytes: number;
  uploaded_at: string;
}

export interface TicketComment {
  id: string;
  user_id: string;
  user_email: string;
  user_role: string;
  content: string;
  created_at: string;
}

export interface Ticket {
  id: string;
  user_id: string;
  user_email: string;
  company_id: string;
  category: TicketCategory;
  other_category_text?: string | null;
  description: string;
  attachments: TicketAttachment[];
  document_id?: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  admin_notes?: string | null;
  solution_summary?: string | null;
  assigned_to?: string | null;
  comments: TicketComment[];
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
}

export interface TicketListItem {
  id: string;
  user_email: string;
  company_id: string;
  category: TicketCategory;
  other_category_text?: string | null;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  attachments_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
}

export interface TicketListResponse {
  tickets: TicketListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface TicketStats {
  total: number;
  by_status: Record<TicketStatus, number>;
  by_category: Record<TicketCategory, number>;
  by_priority: Record<TicketPriority, number>;
  avg_resolution_time_hours?: number | null;
}

export interface CreateTicketRequest {
  category: TicketCategory;
  priority: TicketPriority;
  description: string;
  other_category_text?: string;
  document_id?: string;
  input_pdf: File;
  output_pdf: File;
  screenshots?: File[];
}

export interface UpdateTicketRequest {
  status?: TicketStatus;
  priority?: TicketPriority;
  admin_notes?: string;
  solution_summary?: string;
}

export interface AddCommentRequest {
  content: string;
}

export interface TicketListParams {
  page?: number;
  page_size?: number;
  status?: TicketStatus;
  category?: TicketCategory;
  priority?: TicketPriority;
  company_id?: string; // Super Admin only
  user_email?: string; // Super Admin only
}

// ============== Category labels (for UI) ==============

export const TICKET_CATEGORY_LABELS: Record<TicketCategory, { en: string; ar: string }> = {
  upload_parsing: { en: "Upload/Parsing Issues", ar: "مشاكل رفع الملف أو تحليله" },
  ocr_quality: { en: "OCR Quality", ar: "جودة التعرف على النص" },
  table_extraction: { en: "Table Extraction", ar: "استخراج الجداول" },
  word_level_errors: { en: "Word-Level Errors", ar: "أخطاء على مستوى الكلمات" },
  layout_sections: { en: "Layout/Sections", ar: "التخطيط والأقسام" },
  pdf_output: { en: "PDF Output Formatting", ar: "تنسيق ملف PDF الناتج" },
  performance: { en: "Performance", ar: "الأداء والسرعة" },
  other: { en: "Other", ar: "أخرى" },
};

export const TICKET_STATUS_LABELS: Record<TicketStatus, { en: string; ar: string }> = {
  open: { en: "Open", ar: "مفتوح" },
  in_progress: { en: "In Progress", ar: "جاري العمل" },
  resolved: { en: "Resolved", ar: "تم الحل" },
  closed: { en: "Closed", ar: "مغلق" },
  added_to_ai: { en: "Added to AI", ar: "تم إضافته للـ AI" },
};

export const TICKET_PRIORITY_LABELS: Record<TicketPriority, { en: string; ar: string }> = {
  low: { en: "Low", ar: "منخفضة" },
  medium: { en: "Medium", ar: "متوسطة" },
  high: { en: "High", ar: "عالية" },
  critical: { en: "Critical", ar: "حرجة" },
};

// ============== Helper functions ==============

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

async function ticketsRequest(path: string, init: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> || {}),
  };

  // Only add Content-Type if not FormData (browser sets it automatically with boundary)
  if (!(init.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

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
    throw new Error(`[TicketsApi] Request failed for ${path}: ${message}`);
  }
}

function buildQueryString(params: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, String(value));
    }
  }
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

// ============== API Functions ==============

/**
 * Create a new support ticket with file uploads.
 */
export async function createTicket(data: CreateTicketRequest): Promise<Ticket> {
  const formData = new FormData();
  formData.append("category", data.category);
  formData.append("priority", data.priority);
  formData.append("description", data.description);
  
  if (data.other_category_text) {
    formData.append("other_category_text", data.other_category_text);
  }
  if (data.document_id) {
    formData.append("document_id", data.document_id);
  }
  
  // Required files
  formData.append("input_pdf", data.input_pdf);
  formData.append("output_pdf", data.output_pdf);
  
  // Optional screenshots
  if (data.screenshots && data.screenshots.length > 0) {
    for (const screenshot of data.screenshots) {
      formData.append("screenshots", screenshot);
    }
  }

  return ticketsRequest("/tickets/", {
    method: "POST",
    body: formData,
  });
}

/**
 * List tickets with pagination and filters.
 * - Users see their own tickets
 * - Company admins see all company tickets
 * - Super admin sees all tickets
 */
export async function listTickets(params: TicketListParams = {}): Promise<TicketListResponse> {
  const query = buildQueryString({
    page: params.page,
    page_size: params.page_size,
    status: params.status,
    category: params.category,
    priority: params.priority,
  });
  return ticketsRequest(`/tickets/${query}`);
}

/**
 * List all tickets (Super Admin only) with extended filters.
 */
export async function listAllTicketsAdmin(params: TicketListParams = {}): Promise<TicketListResponse> {
  const query = buildQueryString({
    page: params.page,
    page_size: params.page_size,
    status: params.status,
    category: params.category,
    priority: params.priority,
    company_id: params.company_id,
    user_email: params.user_email,
  });
  return ticketsRequest(`/tickets/admin/all${query}`);
}

/**
 * Get a single ticket by ID.
 */
export async function getTicket(ticketId: string): Promise<Ticket> {
  return ticketsRequest(`/tickets/${ticketId}`);
}

/**
 * Update ticket (admin only - status, priority, notes).
 */
export async function updateTicket(ticketId: string, data: UpdateTicketRequest): Promise<Ticket> {
  return ticketsRequest(`/tickets/${ticketId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/**
 * Add a comment to a ticket.
 */
export async function addComment(ticketId: string, data: AddCommentRequest): Promise<Ticket> {
  return ticketsRequest(`/tickets/${ticketId}/comments`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Get ticket statistics for dashboard.
 */
export async function getTicketStats(companyId?: string): Promise<TicketStats> {
  const query = companyId ? `?company_id=${companyId}` : "";
  return ticketsRequest(`/tickets/stats${query}`);
}

/**
 * Download a ticket attachment.
 */
export function getAttachmentUrl(ticketId: string, filename: string): string {
  const token = getToken();
  // Note: For secure download, we'd need to handle auth differently
  // For now, use the authenticated endpoint directly
  return `${API_BASE_URL}/tickets/${ticketId}/attachments/${filename}`;
}

/**
 * Download attachment with authentication.
 */
export async function downloadAttachment(ticketId: string, filename: string): Promise<Blob> {
  const token = getToken();
  const url = `${API_BASE_URL}/tickets/${ticketId}/attachments/${filename}`;
  
  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  
  if (!response.ok) {
    throw new Error("Failed to download attachment");
  }
  
  return response.blob();
}

/**
 * Export resolved tickets for AI improvement (Super Admin only).
 */
export async function exportResolvedTickets(includeAiAdded = false): Promise<{
  total: number;
  tickets: Array<{
    id: string;
    category: TicketCategory;
    other_category_text?: string | null;
    problem_description: string;
    solution_summary: string;
    admin_notes?: string | null;
    created_at: string;
    resolved_at?: string | null;
  }>;
  exported_at: string;
}> {
  const query = includeAiAdded ? "?include_ai_added=true" : "";
  return ticketsRequest(`/tickets/admin/export${query}`);
}

/**
 * Mark a ticket as "added to AI instructions" (Super Admin only).
 */
export async function markTicketAddedToAi(ticketId: string): Promise<{ message: string }> {
  return ticketsRequest(`/tickets/admin/${ticketId}/mark-ai-added`, {
    method: "POST",
  });
}
