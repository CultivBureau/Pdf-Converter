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

// Extract user-friendly error message
function extractErrorMessage(error: unknown, path: string): string {
  if (error instanceof Error) {
    const message = error.message;
    
    // If it's already a clean error message from handleResponse, return it
    if (!message.includes("[AuthApi]") && !message.includes("Network request failed")) {
      return message;
    }
    
    // Extract the actual error from the wrapped message
    const match = message.match(/\[AuthApi\] Network request failed for [^:]+: (.+)/);
    if (match && match[1]) {
      return match[1];
    }
    
    // Check for common error patterns
    if (message.includes("Incorrect email or password") || message.includes("Invalid credentials")) {
      return "Incorrect email or password. Please check your credentials and try again.";
    }
    
    if (message.includes("User not found")) {
      return "No account found with this email address.";
    }
    
    if (message.includes("Account is inactive") || message.includes("inactive")) {
      return "Your account has been deactivated. Please contact your administrator.";
    }
    
    if (message.includes("NetworkError") || message.includes("Failed to fetch") || message.includes("network")) {
      return "Unable to connect to the server. Please check your internet connection and try again.";
    }
    
    // Return the original message if we can't parse it
    return message;
  }
  
  return "An unexpected error occurred. Please try again.";
}

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
    return await handleResponse(response);
  } catch (error) {
    const friendlyMessage = extractErrorMessage(error, path);
    throw new Error(friendlyMessage);
  }
}

// User types
export type UserRole = "superadmin" | "company_admin" | "user" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  company_id: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface RegisterRequest {
  email: string;
  name: string;
  password: string;
  role?: UserRole;
  company_id?: string | null; // Optional, for Super Admin to assign users to companies
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

