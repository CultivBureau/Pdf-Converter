// Authentication API client
import { getAuthToken, setAuthToken, removeAuthToken } from "../utils/Cookis";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:8000";

// Get stored token from cookies
export const getToken = (): string | null => {
  return getAuthToken();
};

// Set token in cookies
export const setToken = (token: string): void => {
  setAuthToken(token);
};

// Remove token from cookies
export const removeToken = (): void => {
  removeAuthToken();
};

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
async function authRequest(path: string, init: RequestInit = {}) {
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
    throw new Error(`[AuthApi] Network request failed for ${path}: ${message}`);
  }
}

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface RegisterRequest {
  email: string;
  name: string;
  password: string;
  role?: "user" | "admin";
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface UserResponse {
  user: User;
  message?: string;
}

export interface UserListResponse {
  users: User[];
  total: number;
  message?: string;
}

/**
 * Register a new user (Admin only)
 * Note: This endpoint requires admin authentication
 */
export async function register(data: RegisterRequest): Promise<UserResponse> {
  const response: UserResponse = await authRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });

  return response;
}

/**
 * Get all users (Admin only)
 */
export async function getAllUsers(): Promise<UserListResponse> {
  return authRequest("/auth/users", {
    method: "GET",
  });
}

/**
 * Delete a user (Admin only)
 */
export async function deleteUser(userId: string): Promise<{ message: string }> {
  return authRequest(`/auth/users/${userId}`, {
    method: "DELETE",
  });
}

/**
 * Login user
 */
export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await authRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });

  // Store token
  if (response.access_token) {
    setToken(response.access_token);
  }

  return response;
}

/**
 * Get current user info
 */
export async function getCurrentUser(): Promise<User> {
  const response: UserResponse = await authRequest("/auth/me", {
    method: "GET",
  });

  return response.user;
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  try {
    await authRequest("/auth/logout", {
      method: "POST",
    });
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    // Always remove token on logout
    removeToken();
  }
}

/**
 * Update user profile
 */
export async function updateProfile(name: string): Promise<User> {
  const response: UserResponse = await authRequest(
    `/auth/profile?name=${encodeURIComponent(name)}`,
    {
      method: "PUT",
    }
  );

  return response.user;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getToken() !== null;
}

