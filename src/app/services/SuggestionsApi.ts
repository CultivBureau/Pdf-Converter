// API functions for managing AI component suggestions
import type { ComponentSuggestion } from '../types/ExtractTypes';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:8000';

/**
 * Save AI component suggestions for a document
 */
export async function saveSuggestions(
  documentId: string,
  suggestions: ComponentSuggestion[]
): Promise<{ message: string; document_id: string; suggestions_count: number }> {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_BASE_URL}/api/suggestions/${documentId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    body: JSON.stringify({
      suggestions,
      total: suggestions.length,
      meta: {
        saved_at: new Date().toISOString()
      }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to save suggestions');
  }

  return response.json();
}

/**
 * Get AI component suggestions for a document
 */
export async function getSuggestions(documentId: string): Promise<{
  suggestions: ComponentSuggestion[];
  total: number;
  meta: any;
}> {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_BASE_URL}/api/suggestions/${documentId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get suggestions');
  }

  return response.json();
}

/**
 * Clear all pending suggestions for a document
 */
export async function clearSuggestions(documentId: string): Promise<{ message: string; document_id: string }> {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_BASE_URL}/api/suggestions/${documentId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to clear suggestions');
  }

  return response.json();
}
