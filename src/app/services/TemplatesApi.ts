// Templates API client
import { getToken } from "./AuthApi";
import { AirplaneSectionData, HotelsSectionData, TransportSectionData } from "../types/ExtractTypes";

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
  data: AirplaneSectionData | HotelsSectionData | TransportSectionData;
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
  data: AirplaneSectionData | HotelsSectionData | TransportSectionData;
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

// Hotel Template Functions

/**
 * Get all hotel templates for the current user
 */
export async function getHotelTemplates(): Promise<TemplateListResponse> {
  return authRequest("/templates/hotel", {
    method: "GET",
  });
}

/**
 * Save a new hotel template
 */
export async function saveHotelTemplate(
  name: string,
  data: HotelsSectionData
): Promise<Template> {
  return authRequest("/templates/hotel", {
    method: "POST",
    body: JSON.stringify({
      template_type: "hotel",
      name,
      data,
    }),
  });
}

/**
 * Get a specific hotel template
 */
export async function getHotelTemplate(templateId: string): Promise<Template> {
  return authRequest(`/templates/hotel/${templateId}`, {
    method: "GET",
  });
}

/**
 * Delete a hotel template
 */
export async function deleteHotelTemplate(templateId: string): Promise<void> {
  return authRequest(`/templates/hotel/${templateId}`, {
    method: "DELETE",
  });
}

/**
 * Update a hotel template
 */
export async function updateHotelTemplate(
  templateId: string,
  name?: string,
  data?: HotelsSectionData
): Promise<Template> {
  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (data !== undefined) updateData.data = data;

  return authRequest(`/templates/hotel/${templateId}`, {
    method: "PUT",
    body: JSON.stringify(updateData),
  });
}

/**
 * Export a hotel template as JSON
 */
export async function exportHotelTemplate(templateId: string): Promise<ExportTemplateData> {
  return authRequest(`/templates/hotel/${templateId}/export`, {
    method: "GET",
  });
}

/**
 * Import a hotel template from JSON
 */
export async function importHotelTemplate(
  name: string,
  data: HotelsSectionData
): Promise<Template> {
  return authRequest("/templates/hotel/import", {
    method: "POST",
    body: JSON.stringify({
      name,
      data,
    }),
  });
}

// Transport Template Functions

/**
 * Get all transport templates for the current user
 */
export async function getTransportTemplates(): Promise<TemplateListResponse> {
  return authRequest("/templates/transport", {
    method: "GET",
  });
}

/**
 * Save a new transport template
 */
export async function saveTransportTemplate(
  name: string,
  data: TransportSectionData
): Promise<Template> {
  return authRequest("/templates/transport", {
    method: "POST",
    body: JSON.stringify({
      template_type: "transport",
      name,
      data,
    }),
  });
}

/**
 * Get a specific transport template
 */
export async function getTransportTemplate(templateId: string): Promise<Template> {
  return authRequest(`/templates/transport/${templateId}`, {
    method: "GET",
  });
}

/**
 * Delete a transport template
 */
export async function deleteTransportTemplate(templateId: string): Promise<void> {
  return authRequest(`/templates/transport/${templateId}`, {
    method: "DELETE",
  });
}

/**
 * Update a transport template
 */
export async function updateTransportTemplate(
  templateId: string,
  name?: string,
  data?: TransportSectionData
): Promise<Template> {
  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (data !== undefined) updateData.data = data;

  return authRequest(`/templates/transport/${templateId}`, {
    method: "PUT",
    body: JSON.stringify(updateData),
  });
}

/**
 * Export a transport template as JSON
 */
export async function exportTransportTemplate(templateId: string): Promise<ExportTemplateData> {
  return authRequest(`/templates/transport/${templateId}/export`, {
    method: "GET",
  });
}

/**
 * Import a transport template from JSON
 */
export async function importTransportTemplate(
  name: string,
  data: TransportSectionData
): Promise<Template> {
  return authRequest("/templates/transport/import", {
    method: "POST",
    body: JSON.stringify({
      name,
      data,
    }),
  });
}
