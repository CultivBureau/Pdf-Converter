// Templates API client
import { getToken } from "./AuthApi";
import { AirplaneSectionData } from "../types/ExtractTypes";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:8000";

// Make authenticated request
async function authRequest(path: string, init: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> || {}),
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

    const contentType = response.headers.get("content-type");
    const isJson = contentType && contentType.includes("application/json");
    
    // Handle 204 No Content (empty response) - common for DELETE operations
    if (response.status === 204) {
      return;
    }
    
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
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`[TemplatesApi] Network request failed for ${path}: ${message}`);
  }
}

// Template types
export interface Template {
  id: string;
  user_id: string;
  company_id: string;
  template_type: "airplane" | "hotel" | "transport";
  name: string;
  data: AirplaneSectionData;
  created_at: string;
  updated_at: string;
}

export interface TemplateListResponse {
  templates: Template[];
  total: number;
  message?: string;
}

export interface ExportTemplateData {
  name: string;
  template_type: "airplane" | "hotel" | "transport";
  data: AirplaneSectionData;
  exported_at: string;
}

/**
 * Get all airplane templates for the current user
 */
export async function getAirplaneTemplates(): Promise<TemplateListResponse> {
  return authRequest("/templates/airplane", {
    method: "GET",
  });
}

/**
 * Save a new airplane template
 */
export async function saveAirplaneTemplate(
  name: string,
  data: AirplaneSectionData
): Promise<Template> {
  return authRequest("/templates/airplane", {
    method: "POST",
    body: JSON.stringify({
      template_type: "airplane",
      name,
      data,
    }),
  });
}

/**
 * Get a specific airplane template
 */
export async function getAirplaneTemplate(templateId: string): Promise<Template> {
  return authRequest(`/templates/airplane/${templateId}`, {
    method: "GET",
  });
}

/**
 * Delete an airplane template
 */
export async function deleteAirplaneTemplate(templateId: string): Promise<void> {
  return authRequest(`/templates/airplane/${templateId}`, {
    method: "DELETE",
  });
}

/**
 * Update an airplane template
 */
export async function updateAirplaneTemplate(
  templateId: string,
  name?: string,
  data?: AirplaneSectionData
): Promise<Template> {
  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (data !== undefined) updateData.data = data;

  return authRequest(`/templates/airplane/${templateId}`, {
    method: "PUT",
    body: JSON.stringify(updateData),
  });
}

/**
 * Export an airplane template as JSON
 */
export async function exportAirplaneTemplate(templateId: string): Promise<ExportTemplateData> {
  return authRequest(`/templates/airplane/${templateId}/export`, {
    method: "GET",
  });
}

/**
 * Import an airplane template from JSON
 */
export async function importAirplaneTemplate(
  name: string,
  data: AirplaneSectionData
): Promise<Template> {
  return authRequest("/templates/airplane/import", {
    method: "POST",
    body: JSON.stringify({
      name,
      data,
    }),
  });
}
