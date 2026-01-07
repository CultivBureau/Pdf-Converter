// Company Settings API client
import { getToken } from "./AuthApi";

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
    throw new Error(`[CompanySettingsApi] Network request failed for ${path}: ${message}`);
  }
}

// Company Settings types
export interface CompanySettings {
  company_id: string;
  name: string;
  header_image: string | null;
  footer_image: string | null;
  plan_id: string | null;
  is_active: boolean;
  plan_started_at: string | null;
  plan_expires_at: string | null;
  airline_companies: string[];
  includes_all_options: string[];
}

export interface UsageSummary {
  total_uploads: number;
  total_ocr_pages: number;
  total_pdf_exports: number;
  total_cost: number;
  period_start: string;
  period_end: string;
}

export interface CompanyPlan {
  plan: {
    id: string;
    name: string;
    price_monthly: number;
    is_trial: boolean;
    duration_days: number | null;
    is_active: boolean;
    limits: {
      uploads_per_month: number;
      users_limit: number;
      pages_per_month: number;
      pdf_exports: number;
    };
  } | null;
  plan_started_at: string | null;
  plan_expires_at: string | null;
}

/**
 * Get company settings (Company Admin only)
 */
export async function getCompanySettings(): Promise<CompanySettings> {
  return authRequest("/company/settings", {
    method: "GET",
  });
}

/**
 * Update company settings (Company Admin only)
 */
export async function updateCompanySettings(
  name?: string
): Promise<CompanySettings & { message?: string }> {
  const params = new URLSearchParams();
  if (name) {
    params.append("name", name);
  }

  return authRequest(`/company/settings?${params.toString()}`, {
    method: "PUT",
  });
}

/**
 * Get company usage statistics (Company Admin only)
 */
export async function getCompanyUsage(
  month?: number,
  year?: number
): Promise<UsageSummary> {
  const params = new URLSearchParams();
  if (month !== undefined) {
    params.append("month", month.toString());
  }
  if (year !== undefined) {
    params.append("year", year.toString());
  }

  return authRequest(`/company/usage?${params.toString()}`, {
    method: "GET",
  });
}

/**
 * Get company users (Company Admin only)
 */
export async function getCompanyUsers(
  skip: number = 0,
  limit: number = 100
): Promise<{ users: any[]; total: number; message?: string }> {
  const params = new URLSearchParams();
  params.append("skip", skip.toString());
  params.append("limit", limit.toString());

  return authRequest(`/company/users?${params.toString()}`, {
    method: "GET",
  });
}

/**
 * Get company plan (all users in company)
 */
export async function getCompanyPlan(): Promise<CompanyPlan> {
  return authRequest("/company/plan", {
    method: "GET",
  });
}

/**
 * Upload header image for company (Company Admin only)
 */
export async function uploadCompanyHeaderImage(file: File): Promise<CompanySettings & { message?: string }> {
  const token = getToken();
  const formData = new FormData();
  formData.append("file", file);

  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/company/settings/branding/header`, {
    method: "POST",
    headers,
    body: formData,
  });

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

/**
 * Upload footer image for company (Company Admin only)
 */
export async function uploadCompanyFooterImage(file: File): Promise<CompanySettings & { message?: string }> {
  const token = getToken();
  const formData = new FormData();
  formData.append("file", file);

  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/company/settings/branding/footer`, {
    method: "POST",
    headers,
    body: formData,
  });

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

/**
 * Delete header image for company (Company Admin only)
 */
export async function deleteCompanyHeaderImage(): Promise<CompanySettings & { message?: string }> {
  return authRequest("/company/settings/branding/header", {
    method: "DELETE",
  });
}

/**
 * Delete footer image for company (Company Admin only)
 */
export async function deleteCompanyFooterImage(): Promise<CompanySettings & { message?: string }> {
  return authRequest("/company/settings/branding/footer", {
    method: "DELETE",
  });
}

/**
 * Add airline company to company settings (Company Admin only)
 */
export async function addAirlineCompany(name: string): Promise<{ message: string; airline_companies: string[] }> {
  return authRequest("/company/settings/airline-companies", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

/**
 * Remove airline company from company settings by index (Company Admin only)
 */
export async function removeAirlineCompany(index: number): Promise<{ message: string; airline_companies: string[] }> {
  return authRequest(`/company/settings/airline-companies/${index}`, {
    method: "DELETE",
  });
}

/**
 * Add includes all option to company settings (Company Admin only)
 */
export async function addIncludesAllOption(option: string): Promise<{ message: string; includes_all_options: string[] }> {
  return authRequest("/company/settings/includes-all-options", {
    method: "POST",
    body: JSON.stringify({ option }),
  });
}

/**
 * Remove includes all option from company settings by index (Company Admin only)
 */
export async function removeIncludesAllOption(index: number): Promise<{ message: string; includes_all_options: string[] }> {
  return authRequest(`/company/settings/includes-all-options/${index}`, {
    method: "DELETE",
  });
}

