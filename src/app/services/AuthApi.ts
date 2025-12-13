// Authentication API client - Migrated to use SDK
import { apiClient } from '@/app/lib/api';
import type {
  User,
  UserResponse,
  UserListResponse,
  Token,
} from '@/app/lib/api';

// Re-export types for backward compatibility
export type { User } from '@/app/lib/api';

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

// Token management - using SDK's cookie-based token management
export const getToken = (): string | null => {
  return apiClient.getToken();
};

export const setToken = (token: string): void => {
  apiClient.setToken(token);
};

export const removeToken = (): void => {
  apiClient.setToken(null);
};

/**
 * Register a new user (Admin only)
 * Note: This endpoint requires admin authentication
 */
export async function register(data: RegisterRequest): Promise<UserResponse> {
  // Note: Admin token should be passed via the SDK's register method
  // For now, we'll use the current token (assuming admin is logged in)
  const response = await apiClient.register(data);
  return response;
}

/**
 * Get all users (Admin only)
 */
export async function getAllUsers(): Promise<UserListResponse> {
  const response = await apiClient.listUsers();
  return {
    ...response,
    message: undefined, // SDK doesn't return message, but interface expects it
  };
}

/**
 * Delete a user (Admin only)
 */
export async function deleteUser(userId: string): Promise<{ message: string }> {
  return await apiClient.deleteUser(userId);
}

/**
 * Login user
 */
export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response: Token = await apiClient.login(data.email, data.password);
  
  // SDK already stores token in cookies, but we return the response
  return {
    access_token: response.access_token,
    token_type: response.token_type,
    user: response.user,
  };
}

/**
 * Get current user info
 */
export async function getCurrentUser(): Promise<User> {
  const response: UserResponse = await apiClient.getCurrentUser();
  return response.user;
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  try {
    await apiClient.logout();
  } catch (error) {
    console.error("Logout error:", error);
    // Still remove token even if API call fails
    apiClient.setToken(null);
  }
}

/**
 * Update user profile
 */
export async function updateProfile(name: string): Promise<User> {
  const response: UserResponse = await apiClient.updateProfile(name);
  return response.user;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return apiClient.isAuthenticated();
}
