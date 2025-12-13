/**
 * Unified API Client Wrapper
 * 
 * Exports the singleton API client instance for use throughout the application
 */

import { apiClient } from '@/app/lib/api';

// Export the singleton client
export { apiClient };

// Re-export types for convenience
export type {
  User,
  Token,
  UserResponse,
  ExtractionResult,
  UploadResponse,
  Document,
  DocumentResponse,
  DocumentListResponse,
  DocumentCreate,
  DocumentUpdate,
} from '@/app/lib/api';

