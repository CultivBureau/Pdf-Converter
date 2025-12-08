"use client";
import Cookies from "js-cookie";

// Set token in cookies (expires in 7 days to match backend JWT expiration)
export const setAuthToken = (token: string): void => {
  Cookies.set("auth_token", token, { expires: 7 });
};

// Retrieve token from cookies
export const getAuthToken = (): string | null => {
  const token = Cookies.get("auth_token");
  return token || null;
};

// Remove token from cookies
export const removeAuthToken = (): void => {
  Cookies.remove("auth_token");
};